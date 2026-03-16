import { writable, derived } from 'svelte/store';

const STORAGE_KEY = 'sched-lang';

function detectLang() {
  if (typeof localStorage !== 'undefined') {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved === 'ko' || saved === 'en') return saved;
  }
  if (typeof navigator !== 'undefined') {
    return navigator.language.startsWith('ko') ? 'ko' : 'en';
  }
  return 'ko';
}

export const locale = writable(detectLang());
locale.subscribe(v => {
  if (typeof localStorage !== 'undefined') localStorage.setItem(STORAGE_KEY, v);
});
export function setLocale(l) { locale.set(l); }

const messages = {
  ko: {
    common:   { search: '검색...', loading: '불러오는 중...', cancel: '취소', save: '저장', add: '추가' },
    dbError:  'DB 연결 오류',
    sidebar:  { brand: 'LevelRoutine', noTodaySchedule: '오늘 일정 없음', addSchedule: '새 일정 추가', category: '카테고리', active: '진행중', completed: '완료', urgent: '긴급' },
    categories: { all: '전체', personal: '개인', work: '업무', health: '건강', study: '학습', other: '기타' },
    views:    { list: '리스트', calendar: '캘린더', board: '보드', dragHint: '카드를 드래그해서 이동하세요' },
    filter:   { all: '전체', active: '진행중', completed: '완료' },
    list:     { empty: '일정이 없어요', emptyCompleted: '완료된 일정이 없어요', emptyHint: '새 일정을 추가해보세요', count: (n) => `${n}개` },
    board:    { todo: '할 일', inprogress: '진행 중', done: '완료', hold: '보류' },
    card: {
      joinLink: '참여 링크', today: '오늘', tomorrow: '내일',
      daysAgo: (n) => `${n}일 전`, daysLater: (n) => `${n}일 후`,
      online: '온라인', offline: '오프라인',
      priorities:   { high: '긴급', medium: '보통', low: '여유' },
      categories:   { work: '업무', personal: '개인', health: '건강', study: '학습', other: '기타' },
      typeLabels:   { single: '당일', timed: '시간', range: '기간' },
      repeatLabels: { daily: '↻ 매일', weekly: '↻ 매주', monthly: '↻ 매월' },
    },
    modal: {
      newTodo: '새 일정', editTodo: '일정 수정',
      title: '제목', titlePlaceholder: '어떤 일정인가요?',
      memo: '메모', memoPlaceholder: '추가 설명 (선택)',
      date: '날짜', startDate: '시작일', endDate: '종료일', startTime: '시작', endTime: '종료',
      meetingType: '진행 방식', offline: '오프라인', online: '온라인',
      meetingUrl: '미팅 링크', meetingPlaceholder: 'https://zoom.us/j/...',
      repeat: '반복', repeatNone: '반복 없음', repeatDaily: '매일', repeatWeekly: '매주', repeatMonthly: '매월', repeatUntil: '반복 종료일',
      members: '참여자', memberPlaceholder: '이름 입력 후 Enter', memberAdd: '추가',
      priority: '우선순위', prioHigh: '긴급', prioMedium: '보통', prioLow: '여유',
      category: '카테고리',
      typeSingle: '당일', typeTimed: '시간', typeRange: '기간',
      typeDescSingle: '특정 날 하루', typeDescTimed: '시작·종료 시간', typeDescRange: '여러 날 걸침',
    },
    attendance: {
      streak: '출석 스트릭', days: '일', total: '누적', checkedIn: '✓ 오늘 출석',
      toastTitle: '출석 완료!', toastSub: (n) => `${n}일 연속 출석 · +20 XP`,
    },
    levelUp: { title: '레벨 업!', sub: (lv, title) => `Lv.${lv} ${title} 달성!` },
  },
  en: {
    common:   { search: 'Search...', loading: 'Loading...', cancel: 'Cancel', save: 'Save', add: 'Add' },
    dbError:  'DB connection error',
    sidebar:  { brand: 'LevelRoutine', noTodaySchedule: 'No tasks today', addSchedule: 'Add Task', category: 'Categories', active: 'Active', completed: 'Done', urgent: 'Urgent' },
    categories: { all: 'All', personal: 'Personal', work: 'Work', health: 'Health', study: 'Study', other: 'Other' },
    views:    { list: 'List', calendar: 'Calendar', board: 'Board', dragHint: 'Drag cards to move between columns' },
    filter:   { all: 'All', active: 'Active', completed: 'Completed' },
    list:     { empty: 'No tasks yet', emptyCompleted: 'No completed tasks', emptyHint: 'Add a new task to get started', count: (n) => `${n} task${n !== 1 ? 's' : ''}` },
    board:    { todo: 'To Do', inprogress: 'In Progress', done: 'Done', hold: 'On Hold' },
    card: {
      joinLink: 'Join', today: 'Today', tomorrow: 'Tomorrow',
      daysAgo: (n) => `${n}d ago`, daysLater: (n) => `${n}d later`,
      online: 'Online', offline: 'Offline',
      priorities:   { high: 'Urgent', medium: 'Normal', low: 'Low' },
      categories:   { work: 'Work', personal: 'Personal', health: 'Health', study: 'Study', other: 'Other' },
      typeLabels:   { single: 'Single', timed: 'Timed', range: 'Range' },
      repeatLabels: { daily: '↻ Daily', weekly: '↻ Weekly', monthly: '↻ Monthly' },
    },
    modal: {
      newTodo: 'New Task', editTodo: 'Edit Task',
      title: 'Title', titlePlaceholder: "What's the task?",
      memo: 'Notes', memoPlaceholder: 'Additional notes (optional)',
      date: 'Date', startDate: 'Start Date', endDate: 'End Date', startTime: 'Start', endTime: 'End',
      meetingType: 'Meeting Type', offline: 'Offline', online: 'Online',
      meetingUrl: 'Meeting Link', meetingPlaceholder: 'https://zoom.us/j/...',
      repeat: 'Repeat', repeatNone: 'No Repeat', repeatDaily: 'Daily', repeatWeekly: 'Weekly', repeatMonthly: 'Monthly', repeatUntil: 'Repeat Until',
      members: 'Members', memberPlaceholder: 'Type name & press Enter', memberAdd: 'Add',
      priority: 'Priority', prioHigh: 'Urgent', prioMedium: 'Normal', prioLow: 'Low',
      category: 'Category',
      typeSingle: 'Single', typeTimed: 'Timed', typeRange: 'Range',
      typeDescSingle: 'A specific day', typeDescTimed: 'With start & end time', typeDescRange: 'Spans multiple days',
    },
    attendance: {
      streak: 'Attendance Streak', days: 'd', total: 'Total', checkedIn: '✓ Checked in',
      toastTitle: 'Checked In!', toastSub: (n) => `${n} day streak · +20 XP`,
    },
    levelUp: { title: 'Level Up!', sub: (lv, title) => `Lv.${lv} ${title} achieved!` },
  }
};

export const t = derived(locale, $l => messages[$l] ?? messages.ko);
