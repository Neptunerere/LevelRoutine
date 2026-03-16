import { get } from 'svelte/store';
import { todos } from './todos.js';
import { t } from '$lib/i18n/index.js';

let notifyFn = null;

export async function initNotifications() {
  try {
    if (typeof window !== 'undefined' && window.__TAURI__?.notification) {
      // window.__TAURI__.notification 직접 사용
      const notif = window.__TAURI__.notification;

      let granted = await notif.isPermissionGranted();
      if (!granted) {
        const perm = await notif.requestPermission();
        granted = perm === 'granted';
      }
      if (granted) {
        notifyFn = ({ title, body }) => notif.sendNotification({ title, body });
        console.log('Tauri 알림 초기화 완료');
        return;
      }
    }

    // 웹 환경 fallback
    if (typeof Notification !== 'undefined') {
      if (Notification.permission === 'default') {
        await Notification.requestPermission();
      }
      if (Notification.permission === 'granted') {
        notifyFn = ({ title, body }) => new Notification(title, { body });
        console.log('웹 알림 초기화 완료');
      }
    }
  } catch (e) {
    console.warn('알림 초기화 실패:', e);
  }
}

export function startNotificationChecker() {
  checkDeadlines();
  setInterval(checkDeadlines, 60 * 1000);
}

function checkDeadlines() {
  if (!notifyFn) return;

  const _t = get(t);
  const now = new Date();
  const todayMidnight = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const pad = n => String(n).padStart(2, '0');
  const todayStr    = `${todayMidnight.getFullYear()}-${pad(todayMidnight.getMonth()+1)}-${pad(todayMidnight.getDate())}`;
  const tomorrowStr = `${todayMidnight.getFullYear()}-${pad(todayMidnight.getMonth()+1)}-${pad(todayMidnight.getDate()+1)}`;

  const allTodos = get(todos);

  allTodos.filter(t => !t.completed).forEach(t => {
    const dueDate = t.dueDate;
    if (!dueDate) return;

    // D-1 알림
    if (dueDate === tomorrowStr) {
      const key = `notified-d1-${t.id}-${tomorrowStr}`;
      if (!sessionStorage.getItem(key)) {
        const _t = get(t); notifyFn({ title: _t.card.notifD1Title ?? '📅 내일 마감', body: `"${t.title}" ${_t.card.notifD1Body ?? '내일까지예요!'}` });
        sessionStorage.setItem(key, '1');
      }
    }

    // D-Day 알림
    if (dueDate === todayStr) {
      const key = `notified-d0-${t.id}-${todayStr}`;
      if (!sessionStorage.getItem(key)) {
        notifyFn({ title: '🔴 ' + (_t.card.today ?? '오늘') + ' 마감!', body: `"${t.title}" ${_t.card.today ?? '오늘'}까지예요!` });
        sessionStorage.setItem(key, '1');
      }
    }

    // 30분 전 알림
    if (t.scheduleType === 'timed' && t.startTime && dueDate === todayStr) {
      const [h, m] = t.startTime.split(':').map(Number);
      const startTime = new Date(now.getFullYear(), now.getMonth(), now.getDate(), h, m, 0);
      const diffMin = Math.floor((startTime - now) / 60000);
      if (diffMin >= 29 && diffMin <= 31) {
        const key = `notified-30m-${t.id}-${todayStr}`;
        if (!sessionStorage.getItem(key)) {
          notifyFn({ title: '⏰ 30min', body: `"${t.title}" ${t.startTime}` });
          sessionStorage.setItem(key, '1');
        }
      }
    }
  });
}
