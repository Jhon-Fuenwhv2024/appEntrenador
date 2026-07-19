import { computed, onMounted, reactive, ref, shallowRef } from 'vue';
import { getApiErrorMessage } from '../../../shared/api/http.js';
import { getUntaggedExercise, tagExercise } from '../api/adminExercisesApi.js';
import { MUSCLE_OPTIONS } from '../constants/muscles.js';

/**
 * Orquesta el flujo HITL: cargar untagged → etiquetar → siguiente.
 */
export function useExerciseTagger() {
  const loading = shallowRef(true);
  const saving = shallowRef(false);
  const errorMessage = shallowRef('');
  const exercise = ref(null);
  const catalogComplete = shallowRef(false);

  const selectedPrimary = shallowRef(null);
  const selectedSecondary = ref([]);
  /** @type {import('vue').ShallowRef<boolean|null>} */
  const isWarmup = shallowRef(null);

  const progress = reactive({
    total: 0,
    tagged: 0,
    remaining: 0,
    percent: 0,
  });

  const secondaryOptions = computed(() => (
    MUSCLE_OPTIONS.filter((muscle) => muscle !== selectedPrimary.value)
  ));

  const canSave = computed(() => (
    Boolean(selectedPrimary.value)
    && isWarmup.value !== null
    && !saving.value
    && !loading.value
  ));

  function resetSelection() {
    selectedPrimary.value = null;
    selectedSecondary.value = [];
    isWarmup.value = null;
  }

  function applyProgress(meta) {
    if (!meta || typeof meta !== 'object') return;
    progress.total = Number(meta.total) || 0;
    progress.tagged = Number(meta.tagged) || 0;
    progress.remaining = Number(meta.remaining) || 0;
    progress.percent = Number(meta.percent) || 0;
  }

  async function loadNext() {
    loading.value = true;
    errorMessage.value = '';
    try {
      const response = await getUntaggedExercise();
      applyProgress(response.data?.meta);
      const data = response.data?.data ?? null;
      if (!data) {
        exercise.value = null;
        catalogComplete.value = true;
        resetSelection();
        return;
      }
      catalogComplete.value = false;
      exercise.value = data;
      resetSelection();
    } catch (error) {
      console.error('Error al cargar ejercicio sin etiquetar:', error);
      errorMessage.value = getApiErrorMessage(
        error,
        'No se pudo cargar el siguiente ejercicio',
      );
      exercise.value = null;
    } finally {
      loading.value = false;
    }
  }

  async function saveAndNext() {
    if (!canSave.value || !exercise.value?.id) return;

    saving.value = true;
    errorMessage.value = '';
    try {
      await tagExercise(exercise.value.id, {
        primary_muscle: selectedPrimary.value,
        secondary_muscles: selectedSecondary.value,
        is_warmup: isWarmup.value === true,
      });
      resetSelection();
      await loadNext();
    } catch (error) {
      console.error('Error al guardar etiquetas:', error);
      errorMessage.value = getApiErrorMessage(
        error,
        'No se pudieron guardar las etiquetas',
      );
    } finally {
      saving.value = false;
    }
  }

  function selectPrimary(muscle) {
    selectedPrimary.value = muscle;
    selectedSecondary.value = selectedSecondary.value.filter((m) => m !== muscle);
  }

  function setIsWarmup(value) {
    isWarmup.value = value === true;
  }

  onMounted(() => {
    loadNext();
  });

  return {
    MUSCLE_OPTIONS,
    loading,
    saving,
    errorMessage,
    exercise,
    catalogComplete,
    progress,
    selectedPrimary,
    selectedSecondary,
    isWarmup,
    secondaryOptions,
    canSave,
    selectPrimary,
    setIsWarmup,
    saveAndNext,
    loadNext,
  };
}
