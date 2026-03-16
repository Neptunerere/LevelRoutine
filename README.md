# ◈ LevelRoutine

> A desktop schedule manager built with SvelteKit + Tauri

![SvelteKit](https://img.shields.io/badge/SvelteKit-FF3E00?style=flat-square&logo=svelte&logoColor=white)
![Tauri](https://img.shields.io/badge/Tauri-24C8D8?style=flat-square&logo=tauri&logoColor=white)
![MySQL](https://img.shields.io/badge/MySQL-4479A1?style=flat-square&logo=mysql&logoColor=white)
![TypeScript](https://img.shields.io/badge/TypeScript-3178C6?style=flat-square&logo=typescript&logoColor=white)

**[한국어](./README.ko.md)** | **English**

---

## ✨ Features

| Feature | Description |
|---------|-------------|
| 📋 **List View** | Manage tasks by priority & category with real-time search |
| 📅 **Calendar View** | Monthly calendar with click-to-add scheduling |
| 🗂 **Board View** | Trello-style kanban board with drag & drop |
| ⚡ **XP System** | Earn XP by completing tasks, level up through 10 tiers |
| 🔥 **Attendance Streak** | Daily check-in with consecutive streak bonuses |
| 🔔 **Notifications** | Native alerts for D-Day, D-1 deadlines & 30min reminders |
| 👥 **Members** | Add members to tasks, visualized as stacked avatars |
| 🔁 **Recurring Tasks** | Set daily, weekly, or monthly repeats |
| 🌐 **Online / Offline** | Manage meeting links for online events |

---

## 🛠 Tech Stack

- **Frontend** — SvelteKit, TypeScript
- **Backend** — SvelteKit API Routes (Node.js)
- **Database** — MySQL 8.0
- **Desktop** — Tauri 2.x (Rust)
- **Styling** — CSS Variables, Clash Display, Pretendard

---

## 🚀 Getting Started

### Prerequisites

- [Node.js](https://nodejs.org) 18+
- [MySQL](https://mysql.com) 8.0+
- [Rust](https://rustup.rs) (for Tauri build)

### Installation

```bash
git clone https://github.com/your-username/schedule-app.git
cd schedule-app
npm install
```

### Environment Variables

```bash
cp .env.example .env
```

Edit `.env`:

```env
DB_HOST=localhost
DB_NAME=levelroutine
DB_USER=root
DB_PASSWORD=your_password

KAKAO_REST_KEY=your_kakao_rest_api_key   # optional, for place search
```

### Database Setup

```sql
CREATE DATABASE levelroutine CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
```

Tables are created automatically on first run.

### Dev Server

```bash
npm run dev
# → http://localhost:5173
```

---

## 📦 Build (Windows Desktop App)

```bash
# 1. Build the server
npm run build

# 2. Build the Tauri app
npx tauri build
```

Output:
```
src-tauri/target/release/LevelRoutine.exe   ← executable
src-tauri/target/release/bundle/msi/        ← installer
```

> First build takes 20–30 min due to Rust compilation.

### Running the App

Just launch `LevelRoutine.exe` — the Node server starts automatically.

> MySQL must be running beforehand.

---

## 📁 Project Structure

```
schedule-app/
├── src/
│   ├── lib/
│   │   ├── components/     # Svelte components
│   │   ├── stores/         # State management (todos, profile, attendance)
│   │   └── server/         # DB connection (server-only)
│   └── routes/
│       ├── api/            # REST API routes
│       └── +page.svelte    # Main page
├── src-tauri/              # Tauri (Rust) config
└── .env.example            # Environment variable template
```

---

## 📄 License

MIT
