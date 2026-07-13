import { computed, ref, shallowRef } from 'vue';
import { getApiErrorMessage } from '../../../shared/api/http.js';
import {
  createExercise,
  deleteExercise,
  getExercises,
  updateExercise,
} from '../api/exercisesApi.js';

/**
 * Loads and mutates the trainer exercise catalog.
 */
export function useExercisesCatalog() {
  const exercises = ref([]);
  const loading = shallowRef(false);
  const saving = shallowRef(false);
  const searchQuery = shallowRef('');
  const errorMessage = shallowRef('');

  const filteredExercises = computed(() => {
    const q = searchQuery.value.trim().toLowerCase();
    if (!q) return exercises.value;

    return exercises.value.filter((item) => {
      const haystack = [
        item.name,
        item.target_muscle,
        item.description || '',
      ].join(' ').toLowerCase();
      return haystack.includes(q);
    });
  });

  const globalCount = computed(() => (
    exercises.value.filter((item) => item.is_global).length
  ));

  const privateCount = computed(() => (
    exercises.value.filter((item) => !item.is_global).length
  ));

  const loadExercises = async (q) => {
    try {
      loading.value = true;
      errorMessage.value = '';
      const res = await getExercises(q);
      exercises.value = res.data.data ?? [];
    } catch (error) {
      console.error('Error cargando catálogo:', error);
      errorMessage.value = getApiErrorMessage(error, 'No se pudo cargar el catálogo');
      throw error;
    } finally {
      loading.value = false;
    }
  };

  const addExercise = async (payload) => {
    try {
      saving.value = true;
      errorMessage.value = '';
      const res = await createExercise(payload);
      const created = res.data.data;
      if (created) {
        exercises.value = [created, ...exercises.value.filter((e) => e.id !== created.id)];
      } else {
        await loadExercises();
      }
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
      if (updated) {
        exercises.value = exercises.value.map((item) => (
          item.id === updated.id ? updated : item
        ));
      } else {
        await loadExercises();
      }
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
      exercises.value = exercises.value.filter((item) => item.id !== id);
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
    filteredExercises,
    loading,
    saving,
    searchQuery,
    errorMessage,
    globalCount,
    privateCount,
    loadExercises,
    addExercise,
    saveExercise,
    removeExercise,
  };
}
