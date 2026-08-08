<script setup>
/**
 * Feature 091 — Periodización activa del alumno (Client 360 → Programación).
 */
import { computed, onMounted, shallowRef, watch } from 'vue';
import { getApiErrorMessage } from '../../../shared/api/http.js';
import {
  advanceProgramWeek,
  getClientProgramAssignments,
} from '../api/programsApi.js';

const MODE_LABEL = {
  last_plus: 'Último peso + incremento',
  same_as_last: 'Mismo peso que la última vez',
  template: 'Peso del programa',
};

const props = defineProps({
  clientId: { type: Number, required: true },
});

const emit = defineEmits(['notify', 'routines-changed', 'loaded']);

const assignments = shallowRef([]);
const loading = shallowRef(false);
const advancing = shallowRef(false);

const active = computed(() => (
  assignments.value.find((item) => item.status === 'active') || null
));

const totalWeeks = computed(() => Number(active.value?.duration_weeks) || 0);

const weekProgress = computed(() => {
  if (!active.value || !totalWeeks.value) return 0;
  return Math.round((active.value.current_week_index / totalWeeks.value) * 100);
});

const isLastWeek = computed(() => (
  Boolean(active.value) && totalWeeks.value > 0
  && active.value.current_week_index >= totalWeeks.value
));

async function load() {
  if (!props.clientId) return;
  try {
    loading.value = true;
    const response = await getClientProgramAssignments(props.clientId);
    assignments.value = response.data?.success ? (response.data.data ?? []) : [];
  } catch (error) {
    assignments.value = [];
    emit('notify', {
      text: getApiErrorMessage(error, 'No se pudo cargar la periodización'),
      color: 'error',
    });
  } finally {
    loading.value = false;
    emit('loaded', active.value);
  }
}

async function handleAdvance() {
  if (!active.value) return;
  try {
    advancing.value = true;
    const response = await advanceProgramWeek(active.value.id);
    emit('notify', {
      text: response.data?.message || 'Microciclo avanzado',
      color: 'success',
    });
    await load();
    emit('routines-changed');
  } catch (error) {
    emit('notify', {
      text: getApiErrorMessage(error, 'No se pudo avanzar el microciclo'),
      color: 'error',
    });
  } finally {
    advancing.value = false;
  }
}

watch(() => props.clientId, load);
onMounted(load);

defineExpose({ reload: load });
</script>

<template>
  <section class="cpa" aria-label="Periodización activa">
    <div class="cpa__head">
      <div class="cpa__icon" aria-hidden="true">
        <v-icon icon="mdi-chart-timeline-variant" size="20" color="primary" />
      </div>
      <div class="cpa__head-text">
        <p class="cpa__title">Periodización</p>
        <p class="cpa__subtitle">
          <template v-if="active">{{ active.program_name }}</template>
          <template v-else>Sin programa activo</template>
        </p>
      </div>
      <v-progress-circular
        v-if="loading"
        indeterminate
        color="primary"
        size="20"
        width="2"
      />
    </div>

    <template v-if="active">
      <div class="cpa__body">
        <div class="cpa__week">
          <span class="cpa__week-index">
            Microciclo {{ active.current_week_index }}<template v-if="totalWeeks"> / {{ totalWeeks }}</template>
          </span>
          <span v-if="active.phase_name" class="cpa__tag">{{ active.phase_name }}</span>
        </div>

        <div
          v-if="totalWeeks"
          class="cpa__bar"
          role="progressbar"
          :aria-valuenow="active.current_week_index"
          aria-valuemin="1"
          :aria-valuemax="totalWeeks"
          :aria-label="`Microciclo ${active.current_week_index} de ${totalWeeks}`"
        >
          <span class="cpa__bar-fill" :style="{ width: `${weekProgress}%` }" />
        </div>

        <p class="cpa__mode">
          <v-icon icon="mdi-trending-up" size="16" aria-hidden="true" />
          {{ MODE_LABEL[active.progression_mode] || active.progression_mode }}
          <template v-if="active.progression_mode === 'last_plus'">
            · +{{ active.progression_increment_kg }} kg
          </template>
        </p>
      </div>

      <v-btn
        color="primary"
        variant="flat"
        class="cpa__cta font-weight-bold"
        :prepend-icon="isLastWeek ? 'mdi-flag-checkered' : 'mdi-page-next-outline'"
        :loading="advancing"
        @click="handleAdvance"
      >
        {{ isLastWeek ? 'Cerrar mesociclo' : 'Avanzar al siguiente microciclo' }}
      </v-btn>
    </template>

    <p v-else-if="!loading" class="cpa__empty">
      Asigna un programa desde <strong>Recursos → Programas</strong> para trabajar por
      mesociclos con progresión automática de cargas.
    </p>
  </section>
</template>

<style scoped>
.cpa {
  margin-bottom: 1rem;
  padding: 1rem;
  border-radius: 16px;
  border: 1px solid rgba(255, 255, 255, 0.08);
  background:
    linear-gradient(135deg, rgba(0, 229, 255, 0.06), transparent 45%),
    rgba(255, 255, 255, 0.03);
}

.cpa__head {
  display: flex;
  align-items: center;
  gap: 0.7rem;
}

.cpa__icon {
  width: 40px;
  height: 40px;
  border-radius: 12px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  background: rgba(0, 229, 255, 0.1);
  border: 1px solid rgba(0, 229, 255, 0.22);
}

.cpa__head-text {
  min-width: 0;
  flex: 1;
}

.cpa__title {
  margin: 0;
  font-size: 0.72rem;
  font-weight: 700;
  letter-spacing: 0.05em;
  text-transform: uppercase;
  color: var(--tf-on-surface-muted, #a8b0bc);
}

.cpa__subtitle {
  margin: 0.15rem 0 0;
  font-size: 0.95rem;
  font-weight: 700;
  color: var(--tf-on-surface, #fff);
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.cpa__body {
  margin-top: 0.85rem;
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.cpa__week {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 0.45rem;
}

.cpa__week-index {
  font-size: 0.8125rem;
  font-weight: 700;
  color: var(--tf-on-surface, #e8eaed);
}

.cpa__tag {
  padding: 0.1rem 0.5rem;
  border-radius: 999px;
  font-size: 0.65rem;
  font-weight: 700;
  letter-spacing: 0.04em;
  text-transform: uppercase;
  background: rgba(0, 229, 255, 0.14);
  color: #00e5ff;
}

.cpa__bar {
  height: 6px;
  border-radius: 999px;
  background: rgba(255, 255, 255, 0.08);
  overflow: hidden;
}

.cpa__bar-fill {
  display: block;
  height: 100%;
  border-radius: 999px;
  background: linear-gradient(90deg, #00e5ff, #00e676);
}

.cpa__mode {
  margin: 0;
  display: flex;
  align-items: center;
  gap: 0.35rem;
  font-size: 0.78rem;
  color: var(--tf-on-surface-muted, #a8b0bc);
}

.cpa__cta {
  margin-top: 0.9rem;
  min-height: 44px;
  width: 100%;
}

.cpa__empty {
  margin: 0.85rem 0 0;
  font-size: 0.8125rem;
  line-height: 1.5;
  color: var(--tf-on-surface-muted, #a8b0bc);
}

.cpa__empty strong {
  color: var(--tf-on-surface, #fff);
}

@media (min-width: 600px) {
  .cpa__cta {
    width: auto;
  }
}
</style>
