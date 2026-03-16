import { writable } from 'svelte/store';

const NOTES_KEY = 'sched-notes';

function loadNotes() {
  if (typeof localStorage === 'undefined') return {};
  try {
    const raw = localStorage.getItem(NOTES_KEY);
    return raw ? JSON.parse(raw) : {};
  } catch { return {}; }
}

function saveNotes(notes) {
  if (typeof localStorage === 'undefined') return;
  try { localStorage.setItem(NOTES_KEY, JSON.stringify(notes)); } catch {}
}

function createNotesStore() {
  const { subscribe, update } = writable(loadNotes());

  return {
    subscribe,

    /** 노트 저장 (todoId 기준) */
    save(todoId, content) {
      update(notes => {
        const updated = {
          ...notes,
          [todoId]: {
            content,
            updatedAt: new Date().toISOString(),
            createdAt: notes[todoId]?.createdAt ?? new Date().toISOString(),
          }
        };
        saveNotes(updated);
        return updated;
      });
    },

    /** 노트 삭제 */
    remove(todoId) {
      update(notes => {
        const { [todoId]: _, ...rest } = notes;
        saveNotes(rest);
        return rest;
      });
    },

    /** 특정 todo 노트 가져오기 */
    get(todoId) {
      return loadNotes()[todoId] ?? null;
    }
  };
}

export const notes = createNotesStore();