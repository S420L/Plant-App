# MEMORY.md - Long-Term Memory

## Plant-App Infrastructure

- **Repo:** `/home/mikehawk/Plant-App`
- **Frontend:** React app, static build served via `serve -s build` on **port 3000**
  - Systemd service: `plantapp-frontend.service` (enabled, autorestart)
  - Domain: `plantapp.store`
  - ⚠️ For testing: use `npm run start` on port 3000 — only do `npm run build` + systemd when explicitly asked to deploy for production
- **Backend:** FastAPI (`api.py`), served via uvicorn on **port 8000**
  - Systemd service: `plantapp-api.service` (enabled, autorestart)
  - Domain: `server67.site`
- **Proxy:** A separate server (no SSH access) handles HTTPS + certbot and proxies:
  - `plantapp.store` → this machine port 3000
  - `server67.site` → this machine port 8000
- **API URL in app:** `https://server67.site` (set in `.env` as `REACT_APP_API_URL`)
- **No local nginx config needed for these** — proxy handles it externally

## Claude Code Hard Rules (DO NOT BREAK)

1. **Never read or inspect code files** to summarize what Claude Code did — just relay what Claude reported
2. **Never read or inspect code files** to inform what to ask Claude Code — pass requests straight through
3. **Never edit code yourself** unless explicitly told to by Master

## Claude Code Workflow

- **Script:** `/usr/local/bin/claude-ask`
- **Usage:** `claude-ask [--dir /path] [--continue] "prompt"`
- **Flags:** `--dir` (working dir, default `/home/mikehawk/Plant-App`), `--continue` (resume last session in dir), `--data` (override JSON path)
- **Live page:** https://192.168.1.174/static/claude-chat.html
- **JSON:** `/var/www/static/claude-chat-data.json` — format: `{"prompt":"...","response":"..."}`
- Writes `⏳ in progress...` immediately on start, full response on completion
- Uses **atomic writes** (tmp → mv) so SIGKILL can't leave an empty file
- **Auto-kills stale claude processes** on every run
- ⚠️ ALWAYS use `claude-ask` — never call `claude --print` directly. No exceptions.
- ⚠️ NEVER solve coding logic yourself — delegate everything to `claude-ask`.

## Claude Test — Screenshot Page

- **Page:** https://192.168.1.174/static/claude-test.html
- **Data file:** /var/www/static/claude-test-data.json
- **Script:** `claude-screenshot <TabName> <url>` — takes headless screenshot, updates JSON
- After Claude Code visual changes, run `claude-screenshot` and analyze the result for correctness
- Chrome binary: /root/.cache/puppeteer/chrome/linux-146.0.7680.76/chrome-linux64/chrome

## Me

- Name: AI Youngboy Never Broke Again
- Human: Michael Wicks (Master)
- First contact: Thu 2026-03-12