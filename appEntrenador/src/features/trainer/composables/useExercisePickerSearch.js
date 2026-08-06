import { onUnmounted, shallowRef, watch } from 'vue';
import { displayExerciseName } from '../../../shared/utils/exerciseDisplay.js';
import { searchExercisesForPicker } from '../api/exercisesApi.js';

/**
 * Optimización: menú del autocomplete ≤40 filas vía búsqueda server (Feature 089).
 * @param {import('vue').MaybeRefOrGetter<{
 *   muscle?: string|null,
 *   warmup?: boolean,
 *   enriched?: boolean,
 * }>} filtersSource
 */
export function useExercisePickerSearch(filtersSource) {
  const pickerItems = shallowRef([]);
  const searchQuery = shallowRef('');
  const searching = shallowRef(false);
  let debounceTimer = null;
  let requestSeq = 0;

  const resolveFilters = () => {
    const raw = typeof filtersSource === 'function' ? filtersSource() : filtersSource;
    return raw && typeof raw === 'object' ? raw : {};
  };

  const mapItems = (items) => items
    .filter((item) => Boolean(item.local_media_path?.trim()))
    .map((item) => ({
      ...item,
      display_name: displayExerciseName(item),
    }));

  const runSearch = async (q) => {
    const seq = ++requestSeq;
    const filters = resolveFilters();
    searching.value = true;
    try {
      const items = await searchExercisesForPicker({
        q: typeof q === 'string' ? q.trim() : '',
        enriched: filters.enriched !== false,
        muscle: filters.muscle || null,
        warmup: Boolean(filters.warmup),
      });
      if (seq !== requestSeq) return;
      pickerItems.value = mapItems(items);
    } catch (error) {
      if (seq !== requestSeq) return;
      console.error('Error buscando ejercicios para picker:', error);
      pickerItems.value = [];
    } finally {
      if (seq === requestSeq) searching.value = false;
    }
  };

  const scheduleSearch = (q) => {
    searchQuery.value = typeof q === 'string' ? q : '';
    if (debounceTimer) clearTimeout(debounceTimer);
    debounceTimer = setTimeout(() => {
      runSearch(searchQuery.value);
    }, 220);
  };

  const refresh = () => runSearch(searchQuery.value);

  watch(
    () => {
      const f = resolveFilters();
      return [f.muscle || null, Boolean(f.warmup), f.enriched !== false];
    },
    () => {
      refresh();
    },
  );

  onUnmounted(() => {
    if (debounceTimer) clearTimeout(debounceTimer);
  });

  return {
    pickerItems,
    searchQuery,
    searching,
    scheduleSearch,
    refresh,
    runSearch,
  };
}
