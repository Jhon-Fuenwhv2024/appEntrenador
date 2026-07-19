import { computed, ref, shallowRef, watch } from 'vue';
import { getApiErrorMessage } from '../../../shared/api/http.js';
import { exerciseMatchesMuscleFilter } from '../../../shared/constants/muscles.js';
import {
  createExercise,
  deleteExercise,
  getExercises,
  updateExercise,
} from '../api/exercisesApi.js';

/** Max exercises visible per page in the trainer catalog. */
const CATALOG_PAGE_SIZE = 6;
const SEARCH_DEBOUNCE_MS = 300;

/**
 * Loads and mutates the trainer exercise catalog (paginated list + server search).
 * Falls back to client-side pagination if the API returns an unpaginated payload.
 */
export function useExercisesCatalog() {
  const exercises = ref([]);
  const totalCount = shallowRef(0);
  const currentPage = shallowRef(1);
  const totalPages = shallowRef(1);
  const loading = shallowRef(false);
  const saving = shallowRef(false);
  const searchQuery = shallowRef('');
  /** Feature 044: solo ejercicios con name_es o media local. */
  const onlyEnriched = shallowRef(false);
  /** Filtro HITL por músculo (estilo Hevy). */
  const muscleFilter = shallowRef(null);
  /** Solo ejercicios marcados como calentamiento. */
  const onlyWarmup = shallowRef(false);
  const errorMessage = shallowRef('');
  /** Full list used only when the API does not paginate. */
  const clientCache = ref(null);
  let searchTimer = null;
  let loadSeq = 0;

  const globalCount = computed(() => (
    exercises.value.filter((item) => item.is_global).length
  ));

  const privateCount = computed(() => (
    exercises.value.filter((item) => !item.is_global).length
  ));

  const canGoPrev = computed(() => currentPage.value > 1);
  const canGoNext = computed(() => currentPage.value < totalPages.value);

  function applyClientPage(page) {
    const list = clientCache.value || [];
    const pages = Math.max(1, Math.ceil(list.length / CATALOG_PAGE_SIZE));
    const safePage = Math.min(Math.max(1, Number(page) || 1), pages);
    const start = (safePage - 1) * CATALOG_PAGE_SIZE;

    totalCount.value = list.length;
    totalPages.value = pages;
    currentPage.value = safePage;
    exercises.value = list.slice(start, start + CATALOG_PAGE_SIZE);
  }

  function applyServerPage(raw, meta, fallbackPage) {
    clientCache.value = null;
    const limit = Number(meta.limit) || CATALOG_PAGE_SIZE;
    const total = Number(meta.total) || 0;
    const page = Number(meta.page) || fallbackPage;
    const pages = Number(meta.totalPages) || Math.max(1, Math.ceil(total / limit));

    exercises.value = raw.slice(0, CATALOG_PAGE_SIZE);
    totalCount.value = total;
    currentPage.value = page;
    totalPages.value = pages;
  }

  const loadExercises = async ({
    q = searchQuery.value,
    page = currentPage.value,
    enriched = onlyEnriched.value,
    muscle = muscleFilter.value,
    warmup = onlyWarmup.value,
  } = {}) => {
    const seq = ++loadSeq;
    try {
      loading.value = true;
      errorMessage.value = '';
      const res = await getExercises({
        q: typeof q === 'string' ? q : '',
        limit: CATALOG_PAGE_SIZE,
        page,
        enriched: Boolean(enriched),
        muscle: muscle || null,
        warmup: Boolean(warmup),
      });
      if (seq !== loadSeq) return;

      const raw = Array.isArray(res.data.data) ? res.data.data : [];
      const meta = res.data.meta || null;
      const metaTotal = meta != null ? Number(meta.total) : NaN;
      const serverPaginated = Number.isFinite(metaTotal)
        && raw.length <= CATALOG_PAGE_SIZE;

      if (serverPaginated) {
        applyServerPage(raw, meta, page);
        return;
      }

      // API returned everything (or no meta): paginate on the client.
      let list = raw;
      if (enriched) {
        list = list.filter((item) => (
          Boolean(item.name_es?.trim()) || Boolean(item.local_media_path?.trim())
        ));
      }
      list = list.filter((item) => (
        exerciseMatchesMuscleFilter(item, muscle, Boolean(warmup))
      ));
      const qTrim = typeof q === 'string' ? q.trim().toLowerCase() : '';
      if (qTrim) {
        list = list.filter((item) => {
          const haystack = [
            item.name,
            item.name_es || '',
            item.primary_muscle || '',
            item.target_muscle,
            item.target_muscle_es || '',
            item.description || '',
            item.description_es || '',
          ].join(' ').toLowerCase();
          return haystack.includes(qTrim);
        });
      }
      clientCache.value = list;
      applyClientPage(page);
    } catch (error) {
      if (seq !== loadSeq) return;
      console.error('Error cargando catálogo:', error);
      errorMessage.value = getApiErrorMessage(error, 'No se pudo cargar el catálogo');
      throw error;
    } finally {
      if (seq === loadSeq) {
        loading.value = false;
      }
    }
  };

  watch(searchQuery, (q) => {
    if (searchTimer) clearTimeout(searchTimer);
    searchTimer = setTimeout(() => {
      currentPage.value = 1;
      clientCache.value = null;
      loadExercises({ q, page: 1 }).catch(() => {});
    }, SEARCH_DEBOUNCE_MS);
  });

  watch(onlyEnriched, () => {
    currentPage.value = 1;
    clientCache.value = null;
    loadExercises({ page: 1 }).catch(() => {});
  });

  watch(muscleFilter, () => {
    currentPage.value = 1;
    clientCache.value = null;
    loadExercises({ page: 1 }).catch(() => {});
  });

  watch(onlyWarmup, () => {
    currentPage.value = 1;
    clientCache.value = null;
    loadExercises({ page: 1 }).catch(() => {});
  });

  const goToPage = async (page) => {
    const next = Number(page);
    if (!Number.isFinite(next) || next < 1) return;

    if (clientCache.value) {
      applyClientPage(next);
      return;
    }

    if (next > totalPages.value) return;
    currentPage.value = next;
    await loadExercises({ page: next });
  };

  const goPrevPage = () => {
    if (!canGoPrev.value) return Promise.resolve();
    return goToPage(currentPage.value - 1);
  };

  const goNextPage = () => {
    if (!canGoNext.value) return Promise.resolve();
    return goToPage(currentPage.value + 1);
  };

  const addExercise = async (payload) => {
    try {
      saving.value = true;
      errorMessage.value = '';
      const res = await createExercise(payload);
      const created = res.data.data;
      clientCache.value = null;
      await loadExercises();
      return created;
    } catch (error) {
      console.error('Error creando ejercicio:', error);
      errorMessage.value = getApiErrorMessage(error, 'No se pudo crear el ejercicio');
      throw error;
    } finally {
      saving.value = false;
    }
  };

  const saveExercise = async (id, payload) => {
    try {
      saving.value = true;
      errorMessage.value = '';
      const res = await updateExercise(id, payload);
      const updated = res.data.data;
      clientCache.value = null;
      await loadExercises();
      return updated;
    } catch (error) {
      console.error('Error actualizando ejercicio:', error);
      errorMessage.value = getApiErrorMessage(error, 'No se pudo actualizar el ejercicio');
      throw error;
    } finally {
      saving.value = false;
    }
  };

  const removeExercise = async (id) => {
    try {
      saving.value = true;
      errorMessage.value = '';
      await deleteExercise(id);
      clientCache.value = null;
      await loadExercises();
    } catch (error) {
      console.error('Error eliminando ejercicio:', error);
      errorMessage.value = getApiErrorMessage(error, 'No se pudo eliminar el ejercicio');
      throw error;
    } finally {
      saving.value = false;
    }
  };

  return {
    exercises,
    totalCount,
    currentPage,
    totalPages,
    canGoPrev,
    canGoNext,
    loading,
    saving,
    searchQuery,
    onlyEnriched,
    muscleFilter,
    onlyWarmup,
    errorMessage,
    globalCount,
    privateCount,
    pageSize: CATALOG_PAGE_SIZE,
    loadExercises,
    goToPage,
    goPrevPage,
    goNextPage,
    addExercise,
    saveExercise,
    removeExercise,
  };
}
