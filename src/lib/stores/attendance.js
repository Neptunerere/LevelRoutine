import { writable, derived, get } from 'svelte/store';
import { profile } from './profile.js';

const _attendance = writable(null);

export const attendanceInfo = derived(_attendance, $a => {
  const todayStr = new Date().toISOString().split('T')[0];
  return {
    streak:    $a?.streak    ?? 0,
    totalDays: $a?.totalDays ?? 0,
    history:   $a?.history   ?? [],
    isToday:   $a?.lastCheckedDate === todayStr,
  };
});

export async function loadAttendance() {
  try {
    const res = await fetch('/api/attendance');
    if (!res.ok) return;
    const data = await res.json();
    _attendance.set(data ? {
      lastCheckedDate: data.lastCheckedDate ?? null,
      streak:          data.streak          ?? 0,
      totalDays:       data.totalDays       ?? 0,
      history:         data.history         ?? [],
    } : { lastCheckedDate: null, streak: 0, totalDays: 0, history: [] });
  } catch (e) {
    console.error('loadAttendance:', e);
  }
}

export const attendance = {
  subscribe: _attendance.subscribe,

  checkIn() {
    // profile 로드 완료 확인
    if (!profile.isLoaded()) {
      console.warn('checkIn 무시 — 프로필 아직 로드 전');
      return;
    }

    const todayStr = new Date().toISOString().split('T')[0];
    const cur = get(_attendance);
    if (!cur || cur.lastCheckedDate === todayStr) return; // 이미 체크인

    const yesterday = new Date(Date.now() - 86400000).toISOString().split('T')[0];
    const newStreak = cur.lastCheckedDate === yesterday ? cur.streak + 1 : 1;
    const newHistory = [...(cur.history ?? [])];
    if (!newHistory.includes(todayStr)) newHistory.push(todayStr);

    const next = {
      lastCheckedDate: todayStr,
      streak:    newStreak,
      totalDays: (cur.totalDays ?? 0) + 1,
      history:   newHistory,
    };
    _attendance.set(next);
    _save(next);

    // XP 지급 — 프로필 로드 후에만 실행됨
    const reason = newStreak >= 3
      ? `출석 체크 (${newStreak}일 연속) ✨ ${newStreak}일 보너스!`
      : `출석 체크 (${newStreak}일 연속)`;
    profile.addXp(20, reason);
  },
};

async function _save(data) {
  try {
    await fetch('/api/attendance', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    });
  } catch (e) {
    console.error('saveAttendance:', e);
  }
}
