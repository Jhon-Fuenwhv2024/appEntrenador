import { computed, ref, shallowRef } from 'vue';
import { getApiErrorMessage } from '../../../shared/api/http.js';
import { getSessionUser } from '../../../shared/auth/session.js';
import { formatLocalDate, todayLocalDate } from '../../../shared/utils/localDate.js';
import { getTodayHabits } from '../api/habitsApi.js';
import { getClientNutrition } from '../api/nutritionApi.js';
import { getMyRoutines } from '../api/routinesApi.js';
import { getMyToday } from '../api/todayApi.js';
import { getMyWorkoutSessions } from '../api/workoutSessionsApi.js';

const DAY_ORDER = ['Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado', 'Domingo'];

function todayWeekdayLabel() {
  const raw = new Date().toLocaleDateString('es-ES', { weekday: 'long' });
  const normalized = raw.charAt(0).toUpperCase() + raw.slice(1);
  return DAY_ORDER.find((d) => d.toLowerCase() === normalized.toLowerCase()) || normalized;
}

function sessionMatchesLocalDate(session, localDate) {
  const raw = session?.finished_at || session?.created_at || session?.started_at;
  if (!raw) return false;
  try {
    return formatLocalDate(new Date(raw)) === localDate;
  } catch {
    return false;
  }
}

async function resolveCompletedToday(routineId, localDate) {
  if (!routineId) return false;
  try {
    const response = await getMyWorkoutSessions();
    const sessions = response.data.data ?? [];
    return sessions.some((session) => (
      session.status === 'completed'
      && Number(session.routine_id) === Number(routineId)
      && sessionMatchesLocalDate(session, localDate)
    ));
  } catch (error) {
    console.warn('No se pudo verificar si la rutina de hoy está completada:', error);
    return false;
  }
}

/**
 * Fallback si GET /me/today no está disponible (backend sin reiniciar).
 */
async function loadTodayFallback(localDate) {
  const user = getSessionUser();
  const weekday = todayWeekdayLabel();

  const [routinesRes, habitsRes, macrosResult] = await Promise.all([
    getMyRoutines(),
    getTodayHabits(localDate).catch(() => ({ data: { data: [] } })),
    user?.id
      ? getClientNutrition(user.id).catch((error) => {
        const code = error?.normalized?.code || error?.response?.status;
        if (code === 404) return { data: { data: null } };
        throw error;
      })
      : Promise.resolve({ data: { data: null } }),
  ]);

  const routines = routinesRes.data.data ?? [];
  const todayRoutine = routines.find((r) => r.dia_semana === weekday) || null;
  const todayCompleted = await resolveCompletedToday(todayRoutine?.id, localDate);

  return {
    todayRoutine,
    todayCompleted,
    habits: habitsRes.data.data ?? [],
    macros: macrosResult.data.data ?? null,
    weekday,
    date: localDate,
  };
}

/**
 * Feature 038 — carga el agregador GET /me/today para el dashboard immersivo.
 */
export function useClientToday() {
  const loading = shallowRef(true);
  const loadError = shallowRef('');
  const todayRoutine = shallowRef(null);
  const todayCompleted = shallowRef(false);
  const habits = ref([]);
  const macros = shallowRef(null);
  const weekday = shallowRef('');
  const date = shallowRef('');

  const exerciseCount = computed(() => (
    todayRoutine.value?.ejercicios?.length || 0
  ));

  /** Estimación simple: ~2.5 min por serie prescrita (solo UI). */
  const estimatedMinutes = computed(() => {
    const exercises = todayRoutine.value?.ejercicios;
    if (!Array.isArray(exercises) || exercises.length === 0) return null;
    const sets = exercises.reduce((sum, ex) => sum + (Number(ex.series) || 0), 0);
    return Math.max(20, Math.round(sets * 2.5));
  });

  const heroMeta = computed(() => {
    if (!todayRoutine.value) return '';
    const parts = [];
    if (estimatedMinutes.value) parts.push(`${estimatedMinutes.value} min`);
    const n = exerciseCount.value;
    if (n) parts.push(n === 1 ? '1 ejercicio' : `${n} ejercicios`);
    parts.push('Fuerza');
    return parts.join(' · ');
  });

  function applyBundle(data, localDate) {
    todayRoutine.value = data.todayRoutine ?? null;
    todayCompleted.value = Boolean(data.todayCompleted);
    habits.value = Array.isArray(data.habits) ? data.habits : [];
    macros.value = data.macros ?? null;
    weekday.value = data.weekday || '';
    date.value = data.date || localDate;
  }

  async function loadToday() {
    try {
      loading.value = true;
      loadError.value = '';
      const localDate = todayLocalDate();

      try {
        const response = await getMyToday(localDate);
        const data = response.data.data ?? {};
        applyBundle(data, localDate);

        // Si el backend aún no envía todayCompleted, resolverlo con sesiones.
        if (data.todayCompleted == null && data.todayRoutine?.id) {
          todayCompleted.value = await resolveCompletedToday(
            data.todayRoutine.id,
            localDate,
          );
        }
      } catch (error) {
        const code = error?.normalized?.code || error?.response?.status;
        if (code === 404) {
          console.warn('GET /me/today no disponible; usando fallback multi-request.');
          const fallback = await loadTodayFallback(localDate);
          applyBundle(fallback, localDate);
        } else {
          throw error;
        }
      }
    } catch (error) {
      console.error('Error cargando resumen de hoy:', error);
      loadError.value = getApiErrorMessage(error, 'No se pudo cargar tu día');
      todayRoutine.value = null;
      todayCompleted.value = false;
      habits.value = [];
      macros.value = null;
    } finally {
      loading.value = false;
    }
  }

  return {
    loading,
    loadError,
    todayRoutine,
    todayCompleted,
    habits,
    macros,
    weekday,
    date,
    exerciseCount,
    estimatedMinutes,
    heroMeta,
    loadToday,
  };
}
