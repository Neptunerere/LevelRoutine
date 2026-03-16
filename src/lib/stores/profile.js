import { writable, derived, get } from 'svelte/store';
import { locale } from '$lib/i18n/index.js';

const LEVEL_TABLE_KO = [
  { level: 1,  title: '루키',       xpNeeded: 175 },
  { level: 2,  title: '아마추어',   xpNeeded: 300 },
  { level: 3,  title: '어시스턴트', xpNeeded: 450 },
  { level: 4,  title: '주니어',     xpNeeded: 650 },
  { level: 5,  title: '레귤러',     xpNeeded: 900 },
  { level: 6,  title: '시니어',     xpNeeded: 1200 },
  { level: 7,  title: '전문가',     xpNeeded: 1600 },
  { level: 8,  title: '마스터',     xpNeeded: 2100 },
  { level: 9,  title: '챔피언',     xpNeeded: 2700 },
  { level: 10, title: '레전드',     xpNeeded: 9999 },
];

const LEVEL_TABLE_EN = [
  { level: 1,  title: 'Rookie',      xpNeeded: 175 },
  { level: 2,  title: 'Amateur',     xpNeeded: 300 },
  { level: 3,  title: 'Assistant',   xpNeeded: 450 },
  { level: 4,  title: 'Junior',      xpNeeded: 650 },
  { level: 5,  title: 'Regular',     xpNeeded: 900 },
  { level: 6,  title: 'Senior',      xpNeeded: 1200 },
  { level: 7,  title: 'Expert',      xpNeeded: 1600 },
  { level: 8,  title: 'Master',      xpNeeded: 2100 },
  { level: 9,  title: 'Champion',    xpNeeded: 2700 },
  { level: 10, title: 'Legend',      xpNeeded: 9999 },
];

function calcLevel(totalXp) {
  const lang = (typeof localStorage !== 'undefined' && localStorage.getItem('sched-lang')) || 'ko';
  const LEVEL_TABLE = lang === 'en' ? LEVEL_TABLE_EN : LEVEL_TABLE_KO;
  let accumulated = 0;
  for (const row of LEVEL_TABLE) {
    if (totalXp < accumulated + row.xpNeeded) {
      const current = totalXp - accumulated;
      return {
        level: row.level,
        title: row.title,
        progress: {
          current,
          required: row.xpNeeded,
          percent: Math.round((current / row.xpNeeded) * 100)
        }
      };
    }
    accumulated += row.xpNeeded;
  }
  const last = LEVEL_TABLE[LEVEL_TABLE.length - 1];
  return { level: last.level, title: last.title, progress: { current: last.xpNeeded, required: last.xpNeeded, percent: 100 } };
}

// ── 내부 상태 ──────────────────────────────────────────────
const _profile = writable({ nickname: '...', avatarUrl: null, totalXp: 0, xpLog: [] });
export const profileLoading = writable(true);
let _loaded = false; // 로드 완료 플래그

// ── levelInfo 파생 ─────────────────────────────────────────
export const levelInfo = derived(_profile, $p => calcLevel($p?.totalXp ?? 0));

// ── API 로드 ───────────────────────────────────────────────
export async function loadProfile() {
  profileLoading.set(true);
  try {
    const res = await fetch('/api/profile');
    if (!res.ok) return;
    const data = await res.json();
    if (data && data.nickname) {
      _profile.set({
        nickname:  data.nickname,
        avatarUrl: data.avatarUrl ?? null,
        totalXp:   data.totalXp  ?? data.xp ?? 0,
        xpLog:     data.xpLog    ?? [],
      });
    } else {
      // DB에 데이터 없으면 기본값
      _profile.set({ nickname: 'User', avatarUrl: null, totalXp: 0, xpLog: [] });
    }
    _loaded = true;
  } catch (e) {
    console.error('loadProfile:', e);
    _profile.set({ nickname: 'User', avatarUrl: null, totalXp: 0, xpLog: [] });
  } finally {
    profileLoading.set(false);
  }
}

// ── profile 스토어 ─────────────────────────────────────────
export const profile = {
  subscribe: _profile.subscribe,

  setNickname(nickname) {
    if (!_loaded) return;
    _profile.update(p => ({ ...p, nickname }));
    _save();
  },

  setAvatar(avatarUrl) {
    if (!_loaded) return;
    _profile.update(p => ({ ...p, avatarUrl }));
    _save();
  },

  // addXp: 로드 완료 전에는 무시
  addXp(amount, reason = '') {
    if (!_loaded) {
      console.warn('addXp 무시 — 아직 프로필 로드 전');
      return;
    }
    _profile.update(p => {
      const newLog = [
        { xp: amount, reason, ts: Date.now() },
        ...(p.xpLog ?? [])
      ].slice(0, 50); // 최대 50개
      return { ...p, totalXp: (p.totalXp ?? 0) + amount, xpLog: newLog };
    });
    _save();
  },

  isLoaded() { return _loaded; },
};

async function _save() {
  const p = get(_profile);
  if (!p || !p.nickname) return; // 빈 데이터 저장 방지
  const li = calcLevel(p.totalXp ?? 0);
  try {
    await fetch('/api/profile', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        nickname:  p.nickname,
        avatarUrl: p.avatarUrl,
        xp:        p.totalXp,
        totalXp:   p.totalXp,
        xpLog:     p.xpLog ?? [],
        level:     li.level,
        maxXp:     li.progress.required,
        title:     li.title,
      })
    });
  } catch (e) {
    console.error('saveProfile:', e);
  }
}
