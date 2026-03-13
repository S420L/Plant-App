# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

# Plant App - Technical Reference

## Project Overview

A React PWA to control ESP32-powered grow lights over a local WiFi network. The frontend communicates with a cloud proxy server, which fans out concurrent GET requests to individual ESP32 devices on the local network.

## Architecture

```
React App (browser)
    ↓ POST (axios)
Proxy Server — https://S420L.club/api/toggle_lights
    ↓ concurrent GET (aiohttp)
ESP32 devices — http://{ip}:80/{endpoint}
```

- **Frontend**: React 18 PWA, React Router v7, Redux Toolkit + Redux-Saga, Styled Components v6, Axios
- **Proxy**: Python Django REST Framework (`proxy_server_api.py`) — accepts a list of URLs and hits them all concurrently using `asyncio` + `aiohttp`, returning all results
- **Hardware**: ESP32 chips running a simple WiFi HTTP server (C++, `hardware_code.cpp`)
- **Deployment**: Docker multi-stage build → nginx serving the static React build

## File Structure

```
src/
  App.js                          # Router setup, dispatches APP/INIT_FETCH_PIN_STATES on mount
  index.js                        # React root, Redux Provider
  App.css                         # Minimal global styles
  data/
    store.js                      # Redux store config with saga middleware
    slice.js                      # All Redux state, actions, and reducers (lightSlice)
    saga.js                       # All async side effects (API calls)
  components/
    Home/
      index.js                    # Homescreen: light tiles, toggle-all, viewing mode, manual release, settings-all nav
      wrappers.js                 # Styled components for Home
    PlantBox/
      index.js                    # PlantBox + master settings view (route: /plantbox/:id or /plantbox/master)
      wrappers.js                 # Styled components for PlantBox
  functions/
    debounce.js                   # Debounce utility
proxy_server_api.py               # Python proxy (Django REST Framework + aiohttp)
hardware_code.cpp                 # ESP32 firmware
Dockerfile                        # node:14 build → nginx:1.16 serve
```

## Redux State Shape (`src/data/slice.js`)

```js
{
  lights: [          // Array of all grow lights (hardcoded)
    { name, ip, isOn, timeOn, timeOff, startTime, endTime }
  ],
  currentLight: {},  // The light currently open in PlantBox view
  masterLightBox: { name, timeOn, timeOff, startTime, endTime },
  toggleIsOn: bool,       // UI state for the all-lights toggle button
  viewingIsOn: bool,      // UI state for the viewing mode toggle
  manualOverride: bool,   // Tracks manual override state (starts true)
}
```

### Hardcoded Lights (defined in `slice.js`)

| Name            | IP              | Notes                            |
|-----------------|-----------------|----------------------------------|
| Bigass one      | 192.168.1.18    |                                  |
| Flatass one     | 192.168.1.107   |                                  |
| Left downstairs | 192.168.1.124   |                                  |
| Right downstairs| 192.168.1.123   |                                  |
| Upstairs        | 192.168.1.125   |                                  |

**Special IPs (referenced in saga logic but not in current lights array):**
- `192.168.0.154` — fan (hardcoded color treatment in `Home/wrappers.js`; filtered out from light ops in sagas)
- `192.168.0.137` — "viewing light" (handled separately in `handleViewingBoxes`)

## Routing (`src/App.js`)

| Route             | Component   | Description                        |
|-------------------|-------------|------------------------------------|
| `/`               | `<Home>`    | Light tile grid, global controls   |
| `/plantbox/:id`   | `<PlantBox>`| Individual light control (id = 1-based index) |
| `/plantbox/master`| `<PlantBox>`| "Settings for all" — sends to all lights |

## Redux Actions & Saga Handlers (`src/data/saga.js`)

| Dispatched Action           | Saga Handler          | Description |
|-----------------------------|-----------------------|-------------|
| `APP/INIT_FETCH_PIN_STATES` | `fetchPinStates()`    | On app mount, polls `/pin/status` for each light and updates Redux state |
| `updateCurrentLightState`   | `handleToggleBox()`   | Toggles the currently viewed light ON or OFF |
| `toggleLightState`          | `handleToggleBoxes()` | Toggles ALL lights; uses majority-state logic to pick target (if >50% on → turn all off, else turn all on) |
| `toggleViewingState`        | `handleViewingBoxes()`| Turns on the "viewing light" (192.168.0.137), turns all others off (or reverses) |
| `toggleManualRelease`       | `handleManualRelease()`| Calls `/manual/release` on all lights (excluding fan), then re-fetches pin states |
| `updateLightTimers`         | `handleTimerChange()` + `handleTimeRangeChange()` | Sets timer cycle and/or time range; no `ip` in payload = apply to all lights |

All saga handlers use `takeLatest` (cancels in-flight duplicates).

## REST API

### Proxy Endpoint (called by the React app)

**`POST https://S420L.club/api/toggle_lights`**

- **Body**: `{ "ip": ["http://192.168.1.18/led/on", "http://192.168.1.107/led/on", ...] }`
- **Response**: Array of result objects `[{ ip, status, response }]`
- The proxy makes concurrent GET requests to each URL in the list using `aiohttp` with a 3-second timeout per request
- Despite the field name `ip`, it actually receives full URLs

### ESP32 Endpoints (accessed via proxy, direct GET requests)

Each ESP32 runs an HTTP server on **port 80** and handles these routes:

#### `GET /pin/status`
- Returns current GPIO pin state: `"Pin 16 State: LOW (ON)"` or `"Pin 16 State: HIGH (OFF)"`
- Used on app init to sync frontend state with actual hardware state
- Response includes `Access-Control-Allow-Origin: *`

#### `GET /led/on`
- Manually turns the light **ON** (sets `manualOverride = true` on device, clears timer)
- Response: `"GPIO 19 is ON"`

#### `GET /led/off`
- Manually turns the light **OFF** (sets `manualOverride = true` on device, clears timer)
- Response: `"GPIO 19 is OFF"`

#### `GET /timer?time_on={hours}&time_off={hours}`
- Sets a repeating ON/OFF cycle timer (values in **hours**, stored as milliseconds on device)
- Disables time range control (`timeControlActive = false`)
- Clears manual override
- Response: `"Timer set."`
- Example: `/timer?time_on=18&time_off=6`

#### `GET /timerange?start={utc_hour}&end={utc_hour}`
- Sets a daily active time window (values in **UTC hours**)
- **Note**: ESP32 firmware adds 5 hours to the provided values (`fmod(value + 5.0, 24.0)`) to convert from EST to UTC
- Persists to EEPROM (survives power loss)
- Disables cycle timer, enables time range control, clears manual override
- Response: `"Time range set."`
- Example: `/timerange?start=4&end=22`

#### `GET /reset_timerange`
- Resets time range to zero, disables time range control, turns pin OFF
- Clears EEPROM values
- Response: `"Time range reset."`

#### `GET /manual/release`
- Releases manual override (`manualOverride = false`)
- Re-enables time range control if a valid range exists in EEPROM
- Immediately evaluates current time and sets pin state accordingly
- Response: `"Manual override released."`
- **This is the "Manual Release" button on the homescreen** — lets lights return to their scheduled timerange after being manually overridden

#### `GET /logs`
- Returns the in-memory log buffer from the ESP32 (up to 5000 chars, oldest trimmed)
- Useful for debugging device state

### How the Proxy Call Is Made (from `saga.js`)

```js
// Single light toggle
yield call(axios.post, 'https://S420L.club/api/toggle_lights', {
  ip: [`http://${light.ip}/led/on`]
});

// Multiple lights at once (e.g., toggle all, manual release)
yield call(axios.post, 'https://S420L.club/api/toggle_lights', {
  ip: lights.map(l => `http://${l.ip}/manual/release`)
});
```

## ESP32 Hardware Behavior (`hardware_code.cpp`)

- **Active LOW**: GPIO pin LOW = light ON, GPIO pin HIGH = light OFF
- **Priority order** (highest to lowest):
  1. Manual override (`/led/on` or `/led/off`) — disables timer and time range
  2. Timer cycle (`/timer`) — cycles ON/OFF by duration
  3. Time range (`/timerange`) — turns on/off based on current UTC time
- State persisted to EEPROM: `timeStartUTC` (addr 0) and `timeEndUTC` (addr 4)
- NTP sync via `pool.ntp.org` for time-based control
- Supports OTA (Over-The-Air) firmware updates via ArduinoOTA
- Auto-reconnects to WiFi if connection drops
- Supports overnight time ranges (e.g., 22:00–06:00) via wrap-around logic

## Key Implementation Notes

- **No backend database** — all app state lives in Redux; all device state lives in EEPROM on each ESP32
- **Viewing mode** is partially hardcoded: the viewing light is identified by IP `192.168.0.137`; `viewingState` is hardcoded to `false` in the saga (the commented-out dynamic version is left in the code)
- **Fan** (IP `192.168.0.154`) is given distinct tile colors in `Home/wrappers.js` (blue/yellow instead of green/red) and is excluded from bulk light operations in the sagas
- **Scroll-based pagination** in Home: lights load in batches of 6 via scroll event on `GridContainer`
- **PlantBox submit logic**: only sends API call if values actually changed from current state; validates that numeric values are > 0
- **Master settings** (`/plantbox/master`) uses a `masterLightBox` Redux object; when no `ip` is in the `updateLightTimers` payload, the saga applies the change to all lights
- The proxy's `ToggleLightsView` class name is misleading — it handles any type of ESP32 request, not just toggle operations

## CSS and Styling

All styling uses **Styled Components v6** — no CSS modules, no utility classes. There are two layers:

**Global CSS** (`src/index.css`, `src/App.css`):
- Resets, `box-sizing`, `margin`/`padding` on `html`/`body`
- Base font: `Inter` with system-font fallbacks; base color: `#e6edf3` on `#0d1117` background
- Hides number input spinners globally
- Desktop background switches to a radial gradient at `768px`

**Component styles** (`components/*/wrappers.js`):
- Every component has a co-located `wrappers.js` exporting all its Styled Components
- State is driven by props, not class names — e.g. `isOn`, `toggleIsOn`, `active`, `ip`
- No MUI or any external component library — everything is hand-rolled

**Design language / color tokens** (not in a variables file — values are inline):
| Token | Hex | Usage |
|---|---|---|
| Background | `#0d1117` | Page, input backgrounds |
| Surface | `#161b22` | Cards, control rows, buttons |
| Border | `#21262d` | Default borders |
| Border hover | `#30363d` | Hovered borders |
| Text primary | `#e6edf3` | Headings, values |
| Text muted | `#8b949e` / `#adbac7` | Labels, secondary text |
| ON (green) | `#22c55e` | Active state accents, glows |
| OFF (red) | `#ef4444` | Inactive state accents |
| Fan ON (indigo) | `#6366f1` | Fan tile only |
| Fan OFF (yellow) | `#facc15` | Fan tile only |

**Layout / responsiveness**:
- Mobile-first: full-screen (`100dvh`) on phones
- At `≥ 768px`: `App.js` wraps the app in a `375×812px` phone frame (`PhoneApp`) centered on a dark desktop (`Shell`) — no layout changes are needed inside components
- `100dvh` is used instead of `100vh` throughout to handle mobile browser chrome

## Running Locally

```bash
npm install
npm start       # Dev server on port 3000
npm run build   # Production build (also runs ESLint)
npm test        # Run tests (react-scripts/jest, no test files currently exist)
```

## Docker Deployment

```bash
docker build -t plant-app .
docker run -p 80:80 plant-app
```
Builds with Node 14, serves via nginx. Requires `nginx/nginx.conf` in project root.
