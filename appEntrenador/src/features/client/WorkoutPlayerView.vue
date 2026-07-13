<script setup>
import { computed, onMounted, shallowRef, watch } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { getApiErrorMessage } from '../../shared/api/http.js';
import { getSessionUser } from '../../shared/auth/session.js';
import { getMyRoutines } from './api/routinesApi.js';
import { createMyWorkoutSession } from './api/workoutSessionsApi.js';
import { useWorkoutSession } from './composables/useWorkoutSession.js';
import WorkoutExerciseMedia from './components/WorkoutExerciseMedia.vue';

const route = useRoute();
const router = useRouter();

const loading = shallowRef(true);
const loadError = shallowRef('');
const saveError = shallowRef('');
const saving = shallowRef(false);
const saved = shallowRef(false);
const formError = shallowRef('');
const sessionRoutineName = shallowRef('');

const {
  phase,
  restSecondsLeft,
  actualWeight,
  actualReps,
  logs,
  startedAt,
  currentExercise,
  exerciseIndex,
  totalExercises,
  progressLabel,
  restDuration,
  start,
  completeSet,
  skipRest,
} = useWorkoutSession();

const exerciseHint = computed(() => (
  currentExercise.value?.indicaciones?.trim() || ''
));

const exerciseCounter = computed(() => {
  if (!totalExercises.value) return '';
  return `Ejercicio ${exerciseIndex.value + 1} de ${totalExercises.value}`;
});

const restClock = computed(() => {
  const s = restSecondsLeft.value;
  const m = Math.floor(s / 60);
  const sec = s % 60;
  return `${m}:${String(sec).padStart(2, '0')}`;
});

async function persistSession() {
  if (saved.value || saving.value) return;
  try {
    saving.value = true;
    saveError.value = '';
    await createMyWorkoutSession({
      routine_id: Number(route.params.routineId),
      routine_name: sessionRoutineName.value,
      started_at: startedAt.value,
      status: 'completed',
      sets: logs.value.map((entry) => ({
        exercise_id: entry.exerciseId,
        exercise_name: entry.exerciseName,
        set_number: entry.setNumber,
        weight: entry.weight,
        reps: entry.reps,
      })),
    });
    saved.value = true;
  } catch (error) {
    console.error('Error guardando sesión de entrenamiento:', error);
    saveError.value = getApiErrorMessage(error, 'No se pudo guardar el entrenamiento');
  } finally {
    saving.value = false;
  }
}

async function loadAndStart() {
  try {
    loading.value = true;
    loadError.value = '';
    const routineId = Number(route.params.routineId);
    const response = await getMyRoutines();
    const list = response.data.data ?? [];
    const routine = list.find((item) => Number(item.id) === routineId);
    if (!routine) {
      loadError.value = 'No encontramos esa rutina en tu plan.';
      return;
    }
    sessionRoutineName.value = routine.nombre_rutina || '';
    start(routine);
  } catch (error) {
    console.error('Error cargando rutina para el player:', error);
    loadError.value = getApiErrorMessage(error, 'No se pudo cargar la rutina');
  } finally {
    loading.value = false;
  }
}

function onCompleteSet() {
  formError.value = '';
  try {
    completeSet({
      weight: actualWeight.value,
      reps: actualReps.value,
    });
  } catch (error) {
    formError.value = error.message || 'Revisa peso y repeticiones.';
  }
}

function goBack() {
  router.push('/dashboard');
}

watch(phase, async (next) => {
  if (next === 'finished') {
    await persistSession();
  }
});

watch(currentExercise, () => {
  formError.value = '';
});

onMounted(() => {
  const user = getSessionUser();
  if (!user || user.rol !== 'client') {
    router.push('/');
    return;
  }
  loadAndStart();
});
</script>

<template>
  <div class="player-bg">
    <header class="player-top">
      <button type="button" class="player-back" aria-label="Volver" @click="goBack">
        <v-icon icon="mdi-arrow-left" size="22" />
      </button>
      <div class="player-top-text">
        <div class="player-eyebrow">Entrenando</div>
        <div v-if="sessionRoutineName" class="player-routine">{{ sessionRoutineName }}</div>
      </div>
    </header>

    <v-progress-linear v-if="loading" indeterminate color="#00E5FF" class="mx-4" />

    <v-alert v-else-if="loadError" type="error" variant="tonal" class="ma-4">
      {{ loadError }}
      <template #append>
        <v-btn variant="text" @click="goBack">Volver</v-btn>
      </template>
    </v-alert>

    <main v-else-if="phase === 'working' && currentExercise" class="player-main">
      <p class="player-step">{{ exerciseCounter }}</p>
      <h1 class="player-title">{{ currentExercise.nombre }}</h1>
      <p class="player-set">{{ progressLabel }}</p>

      <WorkoutExerciseMedia
        class="mb-4"
        :media-type="currentExercise.media_type"
        :media-url="currentExercise.media_url"
        :exercise-name="currentExercise.nombre"
      />

      <p v-if="exerciseHint" class="player-hint">{{ exerciseHint }}</p>

      <div class="player-inputs">
        <label class="player-field">
          <span>Peso (kg)</span>
          <input
            v-model.number="actualWeight"
            type="number"
            min="0"
            step="0.5"
            inputmode="decimal"
          >
        </label>
        <label class="player-field">
          <span>Repeticiones</span>
          <input
            v-model.number="actualReps"
            type="number"
            min="1"
            step="1"
            inputmode="numeric"
          >
        </label>
      </div>

      <p v-if="formError" class="player-error">{{ formError }}</p>

      <button type="button" class="player-cta" @click="onCompleteSet">
        Completar serie
      </button>
    </main>

    <main v-else-if="phase === 'resting'" class="player-main player-main--rest">
      <p class="player-step">Descanso</p>
      <h1 class="player-rest-clock">{{ restClock }}</h1>
      <p class="player-rest-copy">
        Respira. La siguiente serie empieza en breve
        <span class="text-muted">({{ restDuration }}s)</span>.
      </p>
      <button type="button" class="player-cta player-cta--ghost" @click="skipRest">
        Saltar descanso
      </button>
    </main>

    <main v-else-if="phase === 'finished'" class="player-main player-main--done">
      <v-icon icon="mdi-check-circle-outline" size="56" color="#00E5FF" class="mb-3" />
      <h1 class="player-title">¡Rutina terminada!</h1>
      <p class="player-rest-copy mb-4">
        Registraste {{ logs.length }} serie(s). Tu entrenador podrá ver el peso y las reps.
      </p>
      <v-progress-linear v-if="saving" indeterminate color="#00E5FF" class="mb-4" />
      <v-alert v-if="saveError" type="error" variant="tonal" class="mb-4 text-left">
        {{ saveError }}
        <v-btn
          class="mt-2"
          size="small"
          color="#00E5FF"
          :loading="saving"
          @click="persistSession"
        >
          Reintentar guardar
        </v-btn>
      </v-alert>
      <v-alert v-else-if="saved" type="success" variant="tonal" class="mb-4">
        Entrenamiento guardado.
      </v-alert>
      <button type="button" class="player-cta" @click="goBack">
        Volver al inicio
      </button>
    </main>
  </div>
</template>

<style scoped>
.player-bg {
  min-height: 100vh;
  min-height: 100dvh;
  background: #0B0D12;
  color: #fff;
  display: flex;
  flex-direction: column;
  font-family: 'Inter', system-ui, sans-serif;
}

.player-top {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 16px 16px 8px;
}

.player-back {
  width: 44px;
  height: 44px;
  border-radius: 14px;
  border: 1px solid rgba(255, 255, 255, 0.08);
  background: rgba(255, 255, 255, 0.04);
  color: #fff;
  display: grid;
  place-items: center;
  cursor: pointer;
}

.player-top-text {
  min-width: 0;
}

.player-eyebrow {
  font-size: 0.75rem;
  color: #00E5FF;
  text-transform: uppercase;
  letter-spacing: 0.06em;
}

.player-routine {
  font-size: 0.95rem;
  color: #C5CAD3;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.player-main {
  flex: 1;
  display: flex;
  flex-direction: column;
  padding: 8px 20px 28px;
  max-width: 480px;
  width: 100%;
  margin: 0 auto;
}

.player-main--rest,
.player-main--done {
  align-items: center;
  justify-content: center;
  text-align: center;
}

.player-step {
  margin: 0 0 4px;
  color: #8B929E;
  font-size: 0.85rem;
}

.player-title {
  margin: 0 0 4px;
  font-size: clamp(1.5rem, 5vw, 1.85rem);
  font-weight: 700;
  line-height: 1.2;
}

.player-set {
  margin: 0 0 16px;
  color: #00E5FF;
  font-weight: 600;
}

.player-hint {
  margin: 0 0 16px;
  color: #8B929E;
  font-size: 0.9rem;
  line-height: 1.4;
}

.player-inputs {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 12px;
  margin-bottom: 12px;
}

.player-field {
  display: flex;
  flex-direction: column;
  gap: 6px;
  font-size: 0.8rem;
  color: #8B929E;
}

.player-field input {
  height: 52px;
  border-radius: 14px;
  border: 1px solid rgba(255, 255, 255, 0.1);
  background: rgba(255, 255, 255, 0.04);
  color: #fff;
  font-size: 1.25rem;
  font-weight: 600;
  padding: 0 14px;
  outline: none;
}

.player-field input:focus {
  border-color: rgba(0, 229, 255, 0.55);
}

.player-error {
  color: #ff8a80;
  font-size: 0.85rem;
  margin: 0 0 8px;
}

.player-cta {
  margin-top: auto;
  height: 56px;
  border: 0;
  border-radius: 16px;
  background: #00E5FF;
  color: #0B0D12;
  font-size: 1.05rem;
  font-weight: 700;
  cursor: pointer;
  width: 100%;
}

.player-cta--ghost {
  background: transparent;
  color: #00E5FF;
  border: 1px solid rgba(0, 229, 255, 0.45);
  margin-top: 24px;
}

.player-rest-clock {
  margin: 8px 0 12px;
  font-size: clamp(3.5rem, 18vw, 5rem);
  font-weight: 700;
  letter-spacing: 0.04em;
  color: #00E5FF;
}

.player-rest-copy {
  margin: 0;
  color: #C5CAD3;
  max-width: 18rem;
  line-height: 1.45;
}

.text-muted {
  color: #8B929E;
}
</style>
