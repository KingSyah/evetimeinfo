# 💀 EVE Time Info — Galactic Time Buddy for Capsuleers

**https://kingsyah.github.io/evetimeinfo/**

⏱️ **EVE Online runs on UTC time**, and if you've ever missed a fleet op, PI cycle, or structure timer because your Earth-bound brain runs on local time — you're not alone, pilot!

**EVE Time Info** is your slick, no-nonsense web tool built with a Matrix-terminal aesthetic, keeping every capsuleer synced across New Eden and Earth.

---

## 🚀 Features

### ⏰ EVE Time & Server Status
- Live **EVE Time (UTC)** — always in sync
- **Countdown to daily downtime** (11:00 UTC) with blinking alert when < 10 minutes away
- Real-time **Tranquility server status** — online/offline + current player count, with manual refresh button

### 🌏 Timezone Clocks
- **Indonesian Timezones** — WIB (UTC+7), WITA (UTC+8), WIT (UTC+9) displayed simultaneously
- Toggle to show **your device's local time** instead
- **World Clocks** — 4 fully customizable timezone slots, saved between sessions

### 🔀 UTC Time Converter *(new!)*
- Paste any UTC time (e.g. `14:30` or `14:30:00`) and instantly see it in any timezone
- **Live relative info** — tells you if the time is in the future, past, or happening now:
  - `⏳ 2 jam 15 menit lagi` — coming up
  - `⏪ 30 menit lalu` — already passed
  - `⚡ Sekarang` — happening right now
- Detects **day shifts** (+1 day / -1 day) automatically
- Updates every second so the countdown stays accurate
- Target timezone preference is saved between sessions

### 🎨 UI & Theming
- **Light / Dark Mode** toggle — defaults to light, dark mode activates full **Matrix rain effect** 🟩
- **12h / 24h format** toggle
- Fully **mobile-friendly** and responsive
- No frameworks — pure vanilla HTML + CSS + JS

---

## 🛠️ Tech Stack

- Vanilla HTML + CSS + JS (no React bloat here!)
- `Intl.DateTimeFormat` API for accurate multi-timezone display
- EVE ESI API (`/latest/status/`) for live server status
- Canvas-based Matrix rain animation (dark mode only)
- Google Fonts: **Orbitron** + **Share Tech Mono**
- All preferences saved via `localStorage`

---

## 🧠 Fun Fact

The EVE server has never reset its clock — it's all in **UTC**, all the time. Which makes it one of the few things in New Eden you can actually *rely on*.

---

## ✅ No Nonsense

- No ads, no login, no corp drama
- Works on any browser (even on Jita 4-4 undock)
- Super lightweight, loads faster than a Garmur
- Mobile-friendly (for when you're doing market stuff on the toilet 🚽)

---

*Forged in New Eden by kingsyah*
