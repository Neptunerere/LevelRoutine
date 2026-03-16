# ◈ LevelRoutine

> 일정 관리를 게임처럼 — 할일을 완료하면 XP를 얻고 레벨업하는 데스크톱 스케줄러

**한국어** | **[English](./README.md)**

![SvelteKit](https://img.shields.io/badge/SvelteKit-FF3E00?style=flat-square&logo=svelte&logoColor=white)
![Tauri](https://img.shields.io/badge/Tauri-24C8D8?style=flat-square&logo=tauri&logoColor=white)
![MySQL](https://img.shields.io/badge/MySQL-4479A1?style=flat-square&logo=mysql&logoColor=white)
![TypeScript](https://img.shields.io/badge/TypeScript-3178C6?style=flat-square&logo=typescript&logoColor=white)

---

## ✨ 주요 기능

| 기능 | 설명 |
|------|------|
| 📋 **리스트 뷰** | 우선순위·카테고리별 일정 관리, 실시간 검색 |
| 📅 **캘린더 뷰** | 월간 캘린더, 날짜 클릭으로 일정 확인 및 추가 |
| 🗂 **보드 뷰** | 트렐로 스타일 칸반 보드, 드래그 앤 드롭 |
| ⚡ **XP 시스템** | 일정 완료 시 XP 획득, 10단계 레벨업 |
| 🔥 **출석 스트릭** | 매일 접속 체크인, 연속 출석 보너스 |
| 🔔 **알림** | 마감 D-Day·D-1, 시작 30분 전 네이티브 알림 |
| 👥 **참여자** | 일정에 멤버 추가, 아바타로 시각화 |
| 🔁 **반복 일정** | 매일·매주·매월 반복 설정 |
| 🌐 **온/오프라인** | 온라인 미팅 링크 관리 |

---

## 🖥 스크린샷

```
리스트 뷰          캘린더 뷰         보드 뷰
┌──────────┐     ┌──────────┐     ┌──────────┐
│ ◈ Level  │     │  3월 2026│     │ 할일 │진행│
│ Routine  │     │          │     │      │중  │
│          │     │ 1  2  3  │     │ 카드 │카드│
│ [프로필] │     │ 8  9  10 │     │      │    │
│          │     │15 16 17  │     │ 카드 │카드│
│ 출석스트 │     │          │     │      │    │
│ 릭 🔥4일 │     │ [일정목록│     └──────────┘
│          │     │  패널]   │
│ 카테고리 │     └──────────┘
└──────────┘
```

---

## 🛠 기술 스택

- **Frontend** — SvelteKit, TypeScript
- **Backend** — SvelteKit API Routes (Node.js)
- **Database** — MySQL 8.0
- **Desktop** — Tauri 2.x (Rust)
- **Styling** — CSS Variables, Clash Display, Pretendard

---

## 🚀 시작하기

### 사전 준비

- [Node.js](https://nodejs.org) 18+
- [MySQL](https://mysql.com) 8.0+
- [Rust](https://rustup.rs) (Tauri 빌드 시)

### 설치

```bash
git clone https://github.com/your-username/schedule-app.git
cd schedule-app
npm install
```

### 환경 변수 설정

```bash
cp .env.example .env
```

`.env` 파일 수정:

```env
DB_HOST=localhost
DB_NAME=levelroutine
DB_USER=root
DB_PASSWORD=your_password

KAKAO_REST_KEY=your_kakao_rest_api_key   # 장소 검색 (선택)
```

### DB 생성

```sql
CREATE DATABASE levelroutine CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
```

테이블은 앱 첫 실행 시 자동 생성됩니다.

### 개발 서버 실행

```bash
npm run dev
# → http://localhost:5173
```

---

## 📦 빌드 (Windows 데스크톱 앱)

```bash
# 1. 서버 빌드
npm run build

# 2. Tauri 앱 빌드
npx tauri build
```

빌드 완료 후:
```
src-tauri/target/release/LevelRoutine.exe   ← 실행 파일
src-tauri/target/release/bundle/msi/        ← 설치 파일
```

> 첫 빌드는 Rust 컴파일로 20~30분 소요됩니다.

### 실행 방법

`LevelRoutine.exe` 실행 → Node 서버 자동 시작 → 앱 로드

> MySQL이 실행 중이어야 합니다.

---

## 📁 프로젝트 구조

```
schedule-app/
├── src/
│   ├── lib/
│   │   ├── components/     # Svelte 컴포넌트
│   │   ├── stores/         # 상태 관리 (todos, profile, attendance)
│   │   └── server/         # DB 연결 (서버 전용)
│   └── routes/
│       ├── api/            # REST API 라우트
│       └── +page.svelte    # 메인 페이지
├── src-tauri/              # Tauri (Rust) 설정
└── .env.example            # 환경 변수 템플릿
```

---

## 📄 License

MIT
