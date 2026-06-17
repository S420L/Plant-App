# CLAUDE.md

Guidance for Claude Code (claude.ai/code) working in this repo.

# Plant App — Technical Reference

A React PWA controlling ESP32 grow lights. The architecture is a **real-time pub/sub system with auth and a cloud device registry**. It began life as an HTTP-relay proxy (one LAN, hardcoded `192.168.1.x` lights, concurrent GET fan-out); that model is **fully retired**. Do not reintroduce IP-based payloads, HTTP state polling, or the proxy fan-out unless explicitly asked.

**Devices are identified by MAC** (uppercase hex, no colons, e.g. `704BCA6FA274`) everywhere — every slice action, reducer, and saga keys on `mac`. The `ip` field on a light is an empty string for registry devices and is legacy-only.

## Architecture

```
PlantApp (React PWA, plantapp.store)
  ├── HTTPS → server67.site (FastAPI, "Box B")     registry CRUD + auth
  │     ├── plantapp_users         (id UUID, username UNIQUE, password_hash bcrypt, display_name)
  │     ├── plantapp_devices       (mac CHAR(12), first_seen, last_seen)
  │     └── plantapp_user_devices  (user_id, mac, nickname — composite PK, FK cascade both sides)
  └── WSS → s420l.club/mqtt → Mosquitto 2.0.x ("Box A", also 8883 TLS for ESP32s)

ESP32 firmware (hardware_code.cpp, single Arduino sketch)
  ├── WiFiManager captive portal — SoftAP "PlantLight-<MAC>-<bootCount>"
  ├── HTTPClient POST /api/devices/register on every boot
  ├── PubSubClient — subscribes cmd/#, publishes retained status/#
  └── HTTP server :80 for legacy endpoints (/logs, /wifi/reset, /led/on|off, etc.)
```

**Hosts**: Box A `s420l.club` (nginx + Mosquitto). Box B `192.168.1.174` (FastAPI :8000 + PWA :3000, public name `server67.site`). Box C `192.168.1.245` (old Django, defunct). DB: MySQL at `32.220.164.22:3306`.

- **Frontend**: React 18 PWA, React Router v7, Redux Toolkit + Redux-Saga, Styled Components v6, Axios, `mqtt` (npm). API base hardcoded as `API_BASE = 'https://server67.site'` in `saga.js` and Login.
- **Backend**: `api.py` — FastAPI, SQLModel + asyncmy. Renamed from `proxy_server_api.py`. Env in `.env`: `DB_HOST/PORT/USER/PASS/NAME/JWT_SECRET` (service throws `KeyError` at import if `JWT_SECRET` is unset). MySQL password contains `?` — handled by SQLAlchemy `URL.create()` encoding; don't switch to raw connection strings.
- **Deploy**: Docker → nginx serving the static build. systemd units run `User=root` by design — don't propose least-privilege without a specific reason.

## Auth model (POC — no OAuth, no email verification)

- Username + password → JWT stored in `localStorage` as `plantapp-token`; user object cached as `plantapp-user` (`{id, username, display_name}`).
- `Authorization: Bearer <jwt>` on every authenticated request. Username comparison is **case-sensitive**.
- `src/data/auth.js`: `setAuth(token, user)`, `getUser()`, `logout()`, `forceRefresh()`.
- `src/App.js` is the auth gate — renders `<Login>` if no token, otherwise the routed app.
- `store.js` restores the bearer header on load and installs a **401 interceptor** that nukes the token and reloads — but **exempts `/api/auth/*`** so Login can surface bad-credential errors.

## File Structure

```
src/
  App.js                       Auth gate + router
  index.js                     React root; clears SW registrations + CacheStorage on every load
  data/
    store.js                   Redux store, axios bootstrap (Bearer, _t cache-buster, 401 interceptor)
    slice.js                   All Redux state/actions/reducers (lightSlice). No hardcoded lights
    saga.js                    All side effects. MQTT-only control; HTTP only for registry CRUD
    auth.js                    setAuth / getUser / logout / forceRefresh
  components/
    Login/                     Combined login + signup screen
    Home/                      Light-tile grid, Add Light flow, header w/ username + ↻ refresh
    PlantBox/                  Per-light: brightness slider, ON/OFF, timer/timerange pickers, rename, unclaim
  functions/debounce.js
api.py                         FastAPI: registry CRUD, auth, + legacy /api/toggle_lights proxy (unused, kept)
hardware_code.cpp              ESP32 firmware
serve.json                     no-cache headers on *.html
Dockerfile
```

Each component dir has a co-located `wrappers.js` exporting all its Styled Components (see Styling).

## Redux State (`src/data/slice.js`)

```js
{
  lights: [],          // { name, ip:'', mac, isOn, brightness, timeOn, timeOff, startTime, endTime }
  currentLight: {},    // light open in PlantBox
  masterLightBox: {},  // "settings for all" working values
  unclaimedDevices: [],
  toggleIsOn, viewingIsOn, manualOverride,
}
```

Lights are populated from `GET /api/me/devices` via `mergeRegistryDevices` (matches on `mac`, updates nickname, appends unknown MACs). Reducers of note: `mqttStatusReceived` (applies retained `led`/`brightness` status), `updateBrightness`, `removeLight`, `renameLight`, `setUnclaimedDevices`. Saga-trigger actions (no-op reducers): `fetchUserDevices`, `fetchUnclaimedDevices`, `claimDevice`, `renameDevice`, `unclaimDevice`.

## Sagas (`src/data/saga.js`)

A **singleton MQTT client** (`wss://s420l.club/mqtt`) feeds an `eventChannel`. `watchMqtt` parses `plantapp/device/{mac}/status/{key}` → `mqttStatusReceived`, and on every (re)connect dispatches `fetchUserDevices` (which also re-subscribes `status/#` per owned MAC). **Initial light state comes from retained MQTT status — there is no HTTP pin polling** (`fetchPinStates` is gone; don't reintroduce it).

| Trigger action | Handler | Effect |
|---|---|---|
| `fetchUserDevices` | `handleFetchUserDevices` | `GET /api/me/devices` → merge + subscribe |
| `fetchUnclaimedDevices` | `handleFetchUnclaimedDevices` | `GET /api/devices/unclaimed` |
| `claimDevice` | `handleClaimDevice` | `POST /api/me/devices {mac, nickname}` → refetch |
| `renameDevice` | `handleRenameDevice` | `PATCH /api/me/devices/{mac} {nickname}` |
| `unclaimDevice` | `handleUnclaimDevice` | publish `cmd/wifi_reset` **then** `DELETE /api/me/devices/{mac}` |
| `updateCurrentLightState` | `handleToggleBox` | publish `cmd/led` = `on`/`off` |
| `toggleLightState` | `handleToggleBoxes` | majority-state logic → publish `cmd/led` to all |
| `toggleManualRelease` | `handleManualRelease` | publish `cmd/manual_release` to all |
| `updateBrightness` | `handleBrightnessChange` | **throttled 150ms** → publish `cmd/brightness` |
| `updateLightTimers` | `handleTimerChange` / `handleTimeRangeChange` | publish `cmd/timer` or `cmd/timerange`; **no `mac`** = fan out to all owned devices |
| `toggleViewingState` | `handleViewingBoxes` | **no-op stub** (see Gotchas) |

Master settings re-dispatch with `meta.selfDispatched` to update local state without re-publishing.

## MQTT Protocol

Topics: `plantapp/device/{MAC}/cmd/{op}` (control) and `.../status/{key}` (retained device state). Broker is anonymous (no ACLs yet); ESP32 connects over TLS on 8883 with `setInsecure()` (cert verification disabled — POC).

| `cmd/{op}` | Payload | Note |
|---|---|---|
| `led` | `on` / `off` | sets manual override |
| `brightness` | `0`–`100` | |
| `brightness/reset` | — | → 100% |
| `fullspectrum` | `true`/`false` (or on/off, 1/0) | |
| `timer` | `<on_hrs>:<off_hrs>` e.g. `18:6` | |
| `timerange` | `<start_est>:<end_est>` e.g. `4:22` | firmware adds 5h EST→UTC |
| `timerange/reset` | — | |
| `manual_release` | — | return to schedule |
| `wifi_reset` | — | wipe NVS + reboot to portal |

`status/{key}`: `online` (`true`/`false`, retained LWT `false` on ungraceful drop), `led`, `brightness`, `fullspectrum`.

## ESP32 Firmware (`hardware_code.cpp`)

Single sketch. **Active-LOW** control pin: GPIO 19 LOW = light ON. Provisioning, registry, MQTT, OTA (ArduinoOTA), and NTP (`pool.ntp.org`) all run here. WiFi creds live in **NVS** (WiFiManager's own partition), separate from EEPROM — don't touch NVS directly.

**Pins**: 19 control (active-low relay), 21 dimmer (LEDC PWM, 5 kHz, 10-bit, IRLZ44N gate), 22 full-spectrum (IRLZ44N grounding the strands' white wires; HIGH = full spectrum, LOW = red/blue base).

**EEPROM map** (`EEPROM_SIZE 512`): `0` timeStartUTC (float), `4` timeEndUTC (float), `8` brightness (int), `12` bootCount (uint16, incremented each boot, appended to portal SSID so iOS sees a fresh network each reset), `14` fullSpectrum (uint8, 1=on; fresh `0xFF` treated as on).

**Control priority** (high→low): manual override (`/led/*`) → timer cycle (`/timer`) → time range (`/timerange`). Both MQTT and HTTP paths drive the same state.

**HTTP server (:80)** — legacy/fallback, parsed by `request.indexOf`: `/pin/status`, `/led/on`, `/led/off`, `/brightness?level=N`, `/brightness/status`, `/brightness/reset`, `/fullspectrum/?<val>`, `/fullspectrum/status`, `/timer?time_on=&time_off=`, `/timerange?start=&end=`, `/reset_timerange`, `/manual/release`, `/logs`, `/wifi/reset`.

> **In progress (uncommitted):** full-spectrum support — `SPECTRUM_PIN`, `applyFullSpectrum()`, EEPROM persistence, the `/fullspectrum*` HTTP routes, and the `cmd/fullspectrum` MQTT handler are all in the firmware. The **front-end control (PlantBox toggle + an `updateFullSpectrum` action/saga publishing `cmd/fullspectrum`) is not built yet** — likely the next task.

## iOS cache-busting (four layers — do not remove any)

1. `api.py` middleware: `Cache-Control: no-store, no-cache, must-revalidate, max-age=0`
2. `store.js` axios interceptor: appends `?_t=<Date.now()>` to every GET
3. `serve.json`: no-cache on `*.html`
4. `index.js`: unregisters service workers + clears CacheStorage on load

Plus the manual **↻** button in Home → `forceRefresh()` (nukes SW/caches, reloads with `?v=`).

## Styling — Styled Components v6 ONLY

No CSS modules, Tailwind, MUI, Bootstrap, className styling, or inline styles (one inherited `<p style>` in PlantBox excepted). Styles live in each component's `wrappers.js`; never inline `styled.div` in JSX. Drive state via **props, not classes**; use the `$` prefix for transient props that shouldn't reach the DOM (`$active`, `$selected`, `$empty`).

**Color tokens** (inline hex, no CSS vars):

| Token | Hex | | Token | Hex |
|---|---|---|---|---|
| Background | `#0d1117` | | Text primary | `#e6edf3` |
| Surface | `#161b22` | | Text muted | `#8b949e` |
| Border default | `#21262d` | | Text dim | `#adbac7` |
| Border subtle | `#282e36` | | Text very dim | `#4d5566` |
| Border hover | `#30363d` | | Green ON | `#22c55e` (dark `#16a34a`) |
| Border input | `#3a4149` | | Red OFF/danger | `#ef4444` (dark `#b91c1c`) |

Legacy fan colors (indigo `#6366f1` / yellow `#facc15`) are IP-based and unused. Gradients are `135deg` — ON `#16a34a→#22c55e`, OFF `#b91c1c→#ef4444`. Accent shadows: green glow `0 4px 16px rgba(34,197,94,0.25)`, focus glow `0 0 0 3px rgba(34,197,94,0.12)`. Transitions `0.15s–0.2s ease`; `transform: scale(0.97–0.99)` on `:active`.

**Typography**: Inter w/ system fallbacks (`src/index.css`). Headings `700–800`, `letter-spacing: -0.02em`. Labels `11px/700`, uppercase, `letter-spacing 0.06–0.1em`, `#8b949e`. Numerics `font-variant-numeric: tabular-nums`. Monospace **only** for MACs.

**Radii**: 6px inline buttons · 8px fields/pickers · 10px action buttons · 12px cards/tiles · 16px login card · 22px pill switches · 44px desktop phone-frame.

**Layout**: mobile-first, **`100dvh` not `100vh`** everywhere. At `min-width: 768px`, `App.js` wraps everything in `<Shell>` → `<PhoneApp>` (375×812 frame, hidden scrollbar) — components need no responsive logic inside. PlantBox: `BackButton`/`ResetButton` absolutely positioned `top/left/right: 20px`, Box has `padding-top: 68px`. Home `LogoutButton` is **inline** in a flex `HeaderRow` (`justify-content: space-between`) — do **not** revert to absolute positioning (it overlapped content).

## Conventions & gotchas

- **MAC is always uppercase** (`body.mac.upper()` in FastAPI; `WiFi.macAddress()` is already uppercase).
- **Unclaim cascades** — deletes both `user_devices` and `devices` rows so a wifi-reset device gets a clean slate. The saga publishes `cmd/wifi_reset` before the DELETE.
- `/api/toggle_lights` still exists in `api.py` (legacy HTTP fan-out), unused by the app, kept for external callers. Don't delete unless asked.
- **Viewing Mode** button is a live no-op (old design tied to hardcoded IP `192.168.0.137`). If reworking it, design around MAC.
- The `mqtt` npm package needs a Buffer polyfill — CRA provides it automatically; switching to Vite makes this a manual config issue.
- Test accounts: `Chef Michel` / `Passw0rd` (the space is fine); curl UUID `11111111-2222-3333-4444-555555555555` may have orphan claims.

## Open work

- **Front-end full-spectrum control** (firmware side already done — see above).
- **Stage 7 — pairing codes** in the captive portal, binding a device claim to a user at provisioning time.
- Real ESP32 cert verification (currently `setInsecure()`).
- MQTT topic ACLs + per-device broker credentials (currently anonymous).
- Redesign or remove Viewing Mode.

## Running

```bash
npm install && npm start      # dev server :3000
npm run build                 # prod build (runs ESLint)
docker build -t plant-app . && docker run -p 80:80 plant-app
```
