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

    <v-progress-linear v-if="loading" indeterminate color="primary" class="mx-4" />

    <v-alert v-else-if="loadError" type="error" variant="tonal" class="ma-4">
      {{ loadError }}
      <template #append>
        <v-btn variant="text" @click="goBack">Volver</v-btn>
      </template>
    </v-alert>

    <main v-else-if="phase === 'working' && currentExercise" class="player-main">
      <div class="player-scroll">
        <p class="player-step">{{ exerciseCounter }}</p>
        <h1 class="player-title">{{ currentExercise.nombre }}</h1>
        <p class="player-set">{{ progressLabel }}</p>

        <WorkoutExerciseMedia
          class="player-media"
          :media-type="currentExercise.media_type"
          :media-url="currentExercise.media_url"
          :exercise-name="currentExercise.nombre"
        />

        <p v-if="exerciseHint" class="player-hint">{{ exerciseHint }}</p>

        <div class="player-inputs" role="group" aria-label="Registro de la serie">
          <label class="player-field">
            <span class="player-field__label">Peso</span>
            <span class="player-field__unit">kg</span>
            <input
              v-model.number="actualWeight"
              class="player-field__input"
              type="number"
              min="0"
              step="0.5"
              inputmode="decimal"
              aria-label="Peso en kilogramos"
            >
          </label>
          <label class="player-field">
            <span class="player-field__label">Repeticiones</span>
            <span class="player-field__unit">reps</span>
            <input
              v-model.number="actualReps"
              class="player-field__input"
              type="number"
              min="1"
              step="1"
              inputmode="numeric"
              aria-label="Repeticiones"
            >
          </label>
        </div>

        <p v-if="formError" class="player-error">{{ formError }}</p>
      </div>

      <div class="player-footer">
        <button type="button" class="player-cta" @click="onCompleteSet">
          Completar serie
        </button>
      </div>
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
      <v-icon icon="mdi-check-circle-outline" size="56" color="primary" class="mb-3" />
      <h1 class="player-title">¡Rutina terminada!</h1>
      <p class="player-rest-copy mb-4">
        Registraste {{ logs.length }} serie(s). Tu entrenador podrá ver el peso y las reps.
      </p>
      <v-progress-linear v-if="saving" indeterminate color="primary" class="mb-4" />
      <v-alert v-if="saveError" type="error" variant="tonal" class="mb-4 text-left">
        {{ saveError }}
        <v-btn
          size="small"
          color="primary"
          class="font-weight-bold mt-2"
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
  box-sizing: border-box;
  min-height: 100vh;
  min-height: 100dvh;
  width: 100%;
  max-width: 100vw;
  overflow-x: hidden;
  background: #0B0D12;
  color: #fff;
  display: flex;
  flex-direction: column;
  font-family: 'Inter', system-ui, sans-serif;
  padding-bottom: env(safe-area-inset-bottom, 0px);
  padding-top: env(safe-area-inset-top, 0px);
}

.player-bg *,
.player-bg *::before,
.player-bg *::after {
  box-sizing: border-box;
}

.player-top {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 12px 16px 8px;
  flex-shrink: 0;
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
  flex-shrink: 0;
}

.player-top-text {
  min-width: 0;
  flex: 1;
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
  min-height: 0;
  display: flex;
  flex-direction: column;
  width: 100%;
  max-width: 560px;
  margin: 0 auto;
  padding: 0;
}

.player-scroll {
  flex: 1;
  min-height: 0;
  overflow-y: auto;
  -webkit-overflow-scrolling: touch;
  padding: 4px 16px 12px;
}

.player-main--rest,
.player-main--done {
  align-items: center;
  justify-content: center;
  text-align: center;
  padding: 16px;
}

.player-step {
  margin: 0 0 4px;
  color: #8B929E;
  font-size: 0.85rem;
}

.player-title {
  margin: 0 0 6px;
  font-size: clamp(1.35rem, 6vw, 1.85rem);
  font-weight: 700;
  line-height: 1.2;
  overflow-wrap: anywhere;
  word-break: break-word;
  max-width: 100%;
}

.player-set {
  margin: 0 0 12px;
  color: #00E5FF;
  font-weight: 600;
  font-size: 0.95rem;
}

.player-media {
  margin: 0 -16px 14px;
  width: calc(100% + 32px);
  max-width: none;
  border-radius: 0;
}

.player-hint {
  margin: 0 0 16px;
  color: #8B929E;
  font-size: 0.9rem;
  line-height: 1.45;
  max-width: 100%;
}

.player-inputs {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 10px;
  margin-bottom: 8px;
  width: 100%;
}

.player-field {
  position: relative;
  display: flex;
  flex-direction: column;
  gap: 6px;
  min-width: 0;
  padding: 12px 12px 10px;
  border-radius: 16px;
  border: 1px solid rgba(255, 255, 255, 0.1);
  background: rgba(255, 255, 255, 0.04);
}

.player-field__label {
  font-size: 0.75rem;
  font-weight: 600;
  letter-spacing: 0.02em;
  text-transform: uppercase;
  color: #8B929E;
  line-height: 1.2;
}

.player-field__unit {
  position: absolute;
  right: 14px;
  bottom: 18px;
  font-size: 0.8rem;
  font-weight: 600;
  color: #5E6673;
  pointer-events: none;
}

.player-field__input {
  width: 100%;
  height: 48px;
  border: 0;
  border-radius: 0;
  background: transparent;
  color: #fff;
  font-size: 1.75rem;
  font-weight: 700;
  line-height: 1;
  padding: 0 40px 0 0;
  outline: none;
  appearance: textfield;
  -moz-appearance: textfield;
}

.player-field__input::-webkit-outer-spin-button,
.player-field__input::-webkit-inner-spin-button {
  -webkit-appearance: none;
  margin: 0;
}

.player-field:focus-within {
  border-color: rgba(0, 229, 255, 0.55);
  background: rgba(0, 229, 255, 0.06);
}

.player-error {
  color: #ff8a80;
  font-size: 0.85rem;
  margin: 0 0 8px;
}

.player-footer {
  flex-shrink: 0;
  padding: 12px 16px calc(12px + env(safe-area-inset-bottom, 0px));
  background: linear-gradient(180deg, transparent, #0B0D12 28%);
  border-top: 1px solid rgba(255, 255, 255, 0.04);
}

.player-cta {
  height: 54px;
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
  max-width: 20rem;
  line-height: 1.45;
  width: 100%;
}

.text-muted {
  color: #8B929E;
}

@media (min-width: 480px) {
  .player-scroll {
    padding: 8px 20px 16px;
  }

  .player-media {
    margin: 0 0 16px;
    width: 100%;
    border-radius: 16px;
  }

  .player-footer {
    padding-left: 20px;
    padding-right: 20px;
  }

  .player-field__input {
    font-size: 1.85rem;
    height: 52px;
  }
}

@media (max-width: 360px) {
  .player-inputs {
    gap: 8px;
  }

  .player-field {
    padding: 10px;
  }

  .player-field__input {
    font-size: 1.5rem;
    height: 44px;
    padding-right: 36px;
  }

  .player-field__unit {
    right: 10px;
    bottom: 14px;
    font-size: 0.72rem;
  }
}
</style>
