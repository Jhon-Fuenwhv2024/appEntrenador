/**
 * Detect orphan in-progress workout draft (Feature 088).
 */
import { onMounted, readonly, shallowRef } from 'vue';
import { getSessionUser } from '../../../shared/auth/session.js';
import {
  clearActiveWorkoutDraft,
  getActiveWorkoutDraft,
} from '../utils/activeWorkoutDraft.js';

/**
 * @param {{ checkOnMount?: boolean, autoOpen?: boolean }} [options]
 */
export function useActiveWorkoutRecovery(options = {}) {
  const checkOnMount = options.checkOnMount !== false;
  const autoOpen = options.autoOpen !== false;

  const draft = shallowRef(null);
  const dialogOpen = shallowRef(false);
  const checking = shallowRef(false);

  async function refresh() {
    checking.value = true;
    try {
      const user = getSessionUser();
      if (!user || user.rol !== 'client') {
        draft.value = null;
        dialogOpen.value = false;
        return null;
      }

      const row = await getActiveWorkoutDraft(user.id);
      draft.value = row;
      if (row && autoOpen) {
        dialogOpen.value = true;
      } else if (!row) {
        dialogOpen.value = false;
      }
      return row;
    } finally {
      checking.value = false;
    }
  }

  async function discard() {
    const user = getSessionUser();
    if (user?.id) {
      await clearActiveWorkoutDraft(user.id);
    }
    draft.value = null;
    dialogOpen.value = false;
  }

  /**
   * @param {import('vue-router').Router} router
   */
  function resume(router) {
    const row = draft.value;
    if (!row || !router) return;
    dialogOpen.value = false;
    router.push({
      name: 'WorkoutPlayer',
      params: { routineId: row.routineId },
      query: { resume: '1' },
    });
  }

  function closeDialog() {
    dialogOpen.value = false;
  }

  onMounted(() => {
    if (checkOnMount) {
      refresh().catch((error) => {
        console.warn('[workoutRecovery] refresh failed:', error);
      });
    }
  });

  return {
    draft: readonly(draft),
    dialogOpen,
    checking: readonly(checking),
    refresh,
    discard,
    resume,
    closeDialog,
  };
}
