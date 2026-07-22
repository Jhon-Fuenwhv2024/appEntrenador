<script setup>
/**
 * Historial inteligente: últimas 5 + resto agrupado por mes (expansion panels).
 */
import { shallowRef } from 'vue';
import WorkoutSessionHistoryList from '../../../shared/components/WorkoutSessionHistoryList.vue';

defineProps({
  recentSessions: {
    type: Array,
    default: () => [],
  },
  sessionsByMonth: {
    type: Array,
    default: () => [],
  },
  emptyText: {
    type: String,
    default: 'Sin entrenamientos aún. Completa una rutina desde Inicio.',
  },
});

const openPanels = shallowRef([]);
</script>

<template>
  <section class="smart-history" aria-label="Historial de entrenamientos">
    <div class="smart-history__head">
      <h2 class="smart-history__title">Historial</h2>
      <span class="smart-history__hint">Últimas 5 · resto por mes</span>
    </div>

    <div v-if="!recentSessions.length" class="smart-history__empty">
      {{ emptyText }}
    </div>

    <template v-else>
      <p class="smart-history__section-label">Recientes</p>
      <WorkoutSessionHistoryList
        :sessions="recentSessions"
        compact
        empty-text=""
      />

      <template v-if="sessionsByMonth.length">
        <p class="smart-history__section-label smart-history__section-label--spaced">
          Anteriores
        </p>
        <v-expansion-panels
          v-model="openPanels"
          multiple
          variant="accordion"
          bg-color="transparent"
          class="smart-history__panels"
        >
          <v-expansion-panel
            v-for="month in sessionsByMonth"
            :key="month.key"
            :value="month.key"
            class="smart-history__panel"
            elevation="0"
            bg-color="#13161D"
          >
            <v-expansion-panel-title class="smart-history__panel-title">
              <span class="smart-history__month">{{ month.label }}</span>
              <v-spacer />
              <span class="smart-history__count">
                {{ month.count }} {{ month.count === 1 ? 'sesión' : 'sesiones' }}
              </span>
            </v-expansion-panel-title>
            <v-expansion-panel-text>
              <WorkoutSessionHistoryList
                :sessions="month.sessions"
                compact
              />
            </v-expansion-panel-text>
          </v-expansion-panel>
        </v-expansion-panels>
      </template>
    </template>
  </section>
</template>

<style scoped>
.smart-history {
  padding: 12px;
  border-radius: 14px;
  background: rgba(255, 255, 255, 0.03);
  border: 1px solid rgba(255, 255, 255, 0.06);
}

.smart-history__head {
  display: flex;
  align-items: baseline;
  justify-content: space-between;
  gap: 8px;
  margin-bottom: 10px;
}

.smart-history__title {
  margin: 0;
  font-size: 0.88rem;
  font-weight: 700;
  color: #fff;
}

.smart-history__hint {
  font-size: 0.68rem;
  color: var(--tf-on-surface-muted, #a8b0bc);
}

.smart-history__empty {
  font-size: 0.8rem;
  color: var(--tf-on-surface-muted, #a8b0bc);
}

.smart-history__section-label {
  margin: 0 0 6px;
  font-size: 0.65rem;
  font-weight: 700;
  letter-spacing: 0.06em;
  text-transform: uppercase;
  color: #5e6673;
}

.smart-history__section-label--spaced {
  margin-top: 14px;
}

.smart-history__panels {
  background: transparent;
}

.smart-history__panel {
  background: #13161d !important;
  border: 1px solid rgba(255, 255, 255, 0.06);
  border-radius: 10px !important;
  margin-bottom: 6px;
  overflow: hidden;
  color: #fff;
}

.smart-history__panel-title {
  font-size: 0.85rem;
  min-height: 44px !important;
  padding-inline: 12px !important;
  color: #fff !important;
  background: #13161d !important;
}

.smart-history__month {
  font-weight: 700;
  color: #fff;
}

.smart-history__count {
  font-size: 0.72rem;
  font-weight: 600;
  color: rgb(var(--v-theme-primary));
  margin-right: 4px;
}

/* ADR-0001: overlay Vuetify (currentColor blanco) tapa el texto */
.smart-history__panels :deep(.v-expansion-panel),
.smart-history__panels :deep(.v-expansion-panel__shadow) {
  background: #13161d !important;
  box-shadow: none !important;
}

.smart-history__panels :deep(.v-expansion-panel-title__overlay) {
  opacity: 0 !important;
  background: transparent !important;
}

.smart-history__panels :deep(.v-expansion-panel-title:hover) {
  background: rgba(0, 229, 255, 0.06) !important;
}

.smart-history__panels :deep(.v-expansion-panel-title--active) {
  background: rgba(0, 229, 255, 0.08) !important;
}

.smart-history__panels :deep(.v-expansion-panel-text) {
  background: #13161d !important;
  color: #fff;
}

.smart-history__panels :deep(.v-expansion-panel-text__wrapper) {
  padding: 0 10px 10px;
}
</style>
