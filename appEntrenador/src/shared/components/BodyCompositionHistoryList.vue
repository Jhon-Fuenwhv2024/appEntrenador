<script setup>
/**
 * Vista compacta de composición corporal: snapshot de la última medición + historial denso.
 */
import { computed, shallowRef } from 'vue';

const props = defineProps({
  logs: {
    type: Array,
    default: () => [],
  },
  emptyText: {
    type: String,
    default: 'Aún no hay mediciones registradas.',
  },
  editable: {
    type: Boolean,
    default: false,
  },
});

const emit = defineEmits(['edit']);

const expandedId = shallowRef(null);

const hasLogs = computed(() => props.logs.length > 0);
const latest = computed(() => props.logs[0] || null);

function formatDate(value) {
  if (!value) return '—';
  const raw = String(value).slice(0, 10);
  const [y, m, d] = raw.split('-');
  if (!y || !m || !d) return raw;
  return `${d}/${m}/${y}`;
}

function formatNum(value, digits = 1) {
  if (value === null || value === undefined || value === '') return '—';
  const num = Number(value);
  if (!Number.isFinite(num)) return '—';
  return Number.isInteger(num) ? String(num) : num.toFixed(digits);
}

function weightDelta(current, previous) {
  if (!previous) return null;
  const a = Number(current?.weight_kg);
  const b = Number(previous?.weight_kg);
  if (!Number.isFinite(a) || !Number.isFinite(b)) return null;
  const diff = Math.round((a - b) * 10) / 10;
  if (diff === 0) return { text: '=', className: 'delta--flat' };
  const sign = diff > 0 ? '+' : '';
  return {
    text: `${sign}${diff}`,
    className: diff > 0 ? 'delta--up' : 'delta--down',
  };
}

const CIRC_FIELDS = [
  { key: 'chest_cm', label: 'Pecho' },
  { key: 'waist_cm', label: 'Cintura' },
  { key: 'triceps_cm', label: 'Tríceps' },
  { key: 'biceps_cm', label: 'Bíceps' },
  { key: 'glutes_cm', label: 'Glúteos' },
  { key: 'quads_cm', label: 'Cuádriceps' },
  { key: 'calves_cm', label: 'Pantorrilla' },
  { key: 'back_cm', label: 'Espalda' },
];

function activeCircs(log) {
  return CIRC_FIELDS
    .map((f) => ({ ...f, value: log?.[f.key] }))
    .filter((f) => f.value != null && f.value !== '');
}

function toggleExpand(id) {
  expandedId.value = expandedId.value === id ? null : id;
}

function onEdit(log, event) {
  event?.stopPropagation?.();
  if (props.editable) emit('edit', log);
}
</script>

<template>
  <div v-if="!hasLogs" class="bcl-empty">
    {{ emptyText }}
  </div>

  <div v-else class="bcl">
    <!-- Snapshot última medición -->
    <div class="bcl-snap">
      <div class="bcl-snap__head">
        <span class="bcl-snap__label">Última toma</span>
        <span class="bcl-snap__date">{{ formatDate(latest.measured_at) }}</span>
      </div>
      <div class="bcl-snap__metrics">
        <div class="bcl-pill">
          <span class="bcl-pill__value">{{ formatNum(latest.weight_kg) }}</span>
          <span class="bcl-pill__unit">kg</span>
          <span class="bcl-pill__label">Peso</span>
        </div>
        <div class="bcl-pill bcl-pill--accent">
          <span class="bcl-pill__value">{{ formatNum(latest.bmi, 2) }}</span>
          <span class="bcl-pill__label">IMC</span>
        </div>
        <div class="bcl-pill">
          <span class="bcl-pill__value">{{ formatNum(latest.height_cm, 0) }}</span>
          <span class="bcl-pill__unit">cm</span>
          <span class="bcl-pill__label">Altura</span>
        </div>
        <div class="bcl-pill">
          <span class="bcl-pill__value">{{ formatNum(latest.body_fat_pct, 1) }}</span>
          <span class="bcl-pill__unit" v-if="latest.body_fat_pct != null">%</span>
          <span class="bcl-pill__label">Grasa</span>
        </div>
      </div>
      <div v-if="activeCircs(latest).length" class="bcl-chips">
        <span
          v-for="c in activeCircs(latest)"
          :key="c.key"
          class="bcl-chip"
        >
          {{ c.label }} {{ formatNum(c.value, 1) }}
        </span>
      </div>
      <div v-if="editable" class="bcl-snap__actions">
        <button type="button" class="bcl-link" @click="onEdit(latest)">
          Editar última
        </button>
      </div>
    </div>

    <!-- Historial denso -->
    <div v-if="logs.length > 0" class="bcl-list">
      <div class="bcl-list__head">
        <span>Historial</span>
        <span class="bcl-list__count">{{ logs.length }}</span>
      </div>

      <button
        v-for="(log, index) in logs"
        :key="log.id"
        type="button"
        class="bcl-row"
        :class="{ 'bcl-row--open': expandedId === log.id }"
        @click="toggleExpand(log.id)"
      >
        <div class="bcl-row__main">
          <span class="bcl-row__date">{{ formatDate(log.measured_at) }}</span>
          <span class="bcl-row__weight">{{ formatNum(log.weight_kg) }} kg</span>
          <span class="bcl-row__bmi">IMC {{ formatNum(log.bmi, 2) }}</span>
          <span
            v-if="weightDelta(log, logs[index + 1])"
            class="bcl-row__delta"
            :class="weightDelta(log, logs[index + 1]).className"
          >
            {{ weightDelta(log, logs[index + 1]).text }}
          </span>
          <v-icon
            :icon="expandedId === log.id ? 'mdi-chevron-up' : 'mdi-chevron-down'"
            size="18"
            class="bcl-row__chevron"
          />
        </div>

        <div v-if="expandedId === log.id" class="bcl-row__detail" @click.stop>
          <div class="bcl-detail-grid">
            <span>Altura <strong>{{ formatNum(log.height_cm, 0) }} cm</strong></span>
            <span>% Grasa <strong>{{ formatNum(log.body_fat_pct, 1) }}</strong></span>
          </div>
          <div v-if="activeCircs(log).length" class="bcl-chips bcl-chips--dense">
            <span
              v-for="c in activeCircs(log)"
              :key="c.key"
              class="bcl-chip"
            >
              {{ c.label }} {{ formatNum(c.value, 1) }}
            </span>
          </div>
          <p v-if="log.notes" class="bcl-notes">{{ log.notes }}</p>
          <button
            v-if="editable"
            type="button"
            class="bcl-link"
            @click="onEdit(log, $event)"
          >
            Editar
          </button>
        </div>
      </button>
    </div>
  </div>
</template>

<style scoped>
.bcl-empty {
  font-size: 0.8rem;
  color: #8b929e;
  padding: 0.25rem 0;
}

.bcl {
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
}

.bcl-snap {
  padding: 0.7rem 0.8rem;
  border-radius: 12px;
  background: rgba(0, 229, 255, 0.05);
  border: 1px solid rgba(0, 229, 255, 0.14);
}

.bcl-snap__head {
  display: flex;
  justify-content: space-between;
  align-items: baseline;
  margin-bottom: 0.55rem;
}

.bcl-snap__label {
  font-size: 0.65rem;
  font-weight: 600;
  letter-spacing: 0.06em;
  text-transform: uppercase;
  color: #8b929e;
}

.bcl-snap__date {
  font-size: 0.75rem;
  color: #c5cad3;
}

.bcl-snap__metrics {
  display: grid;
  grid-template-columns: repeat(4, minmax(0, 1fr));
  gap: 0.35rem;
}

.bcl-pill {
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  gap: 0;
  min-width: 0;
  padding: 0.35rem 0.4rem;
  border-radius: 8px;
  background: rgba(255, 255, 255, 0.03);
}

.bcl-pill--accent {
  background: rgba(0, 229, 255, 0.1);
}

.bcl-pill__value {
  font-size: 1.05rem;
  font-weight: 700;
  line-height: 1.15;
  color: #f2f4f7;
}

.bcl-pill--accent .bcl-pill__value {
  color: #00e5ff;
}

.bcl-pill__unit {
  font-size: 0.65rem;
  color: #8b929e;
  margin-top: -0.05rem;
}

.bcl-pill__label {
  font-size: 0.6rem;
  color: #8b929e;
  text-transform: uppercase;
  letter-spacing: 0.04em;
  margin-top: 0.15rem;
}

.bcl-chips {
  display: flex;
  flex-wrap: wrap;
  gap: 0.3rem;
  margin-top: 0.55rem;
}

.bcl-chips--dense {
  margin-top: 0.4rem;
}

.bcl-chip {
  font-size: 0.65rem;
  line-height: 1.2;
  padding: 0.15rem 0.4rem;
  border-radius: 999px;
  background: rgba(255, 255, 255, 0.05);
  color: #a8afba;
  white-space: nowrap;
}

.bcl-snap__actions {
  margin-top: 0.45rem;
}

.bcl-link {
  border: 0;
  background: transparent;
  color: #00e5ff;
  font-size: 0.75rem;
  font-weight: 600;
  padding: 0;
  cursor: pointer;
}

.bcl-list__head {
  display: flex;
  align-items: center;
  gap: 0.4rem;
  font-size: 0.7rem;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  color: #8b929e;
  margin-bottom: 0.35rem;
}

.bcl-list__count {
  font-size: 0.65rem;
  padding: 0.05rem 0.35rem;
  border-radius: 999px;
  background: rgba(255, 255, 255, 0.06);
  color: #c5cad3;
}

.bcl-row {
  display: block;
  width: 100%;
  text-align: left;
  border: 1px solid rgba(255, 255, 255, 0.06);
  border-radius: 10px;
  background: rgba(255, 255, 255, 0.02);
  color: inherit;
  padding: 0;
  margin-bottom: 0.35rem;
  cursor: pointer;
}

.bcl-row:last-child {
  margin-bottom: 0;
}

.bcl-row--open {
  border-color: rgba(0, 229, 255, 0.2);
}

.bcl-row__main {
  display: grid;
  grid-template-columns: 4.5rem minmax(0, 1fr) minmax(0, 1fr) 2.4rem 1.2rem;
  align-items: center;
  gap: 0.25rem;
  padding: 0.45rem 0.55rem;
  font-size: 0.78rem;
}

.bcl-row__date {
  font-weight: 600;
  color: #e8eaed;
}

.bcl-row__weight {
  color: #c5cad3;
}

.bcl-row__bmi {
  color: #8b929e;
  font-variant-numeric: tabular-nums;
}

.bcl-row__delta {
  font-size: 0.7rem;
  font-weight: 600;
  text-align: right;
  font-variant-numeric: tabular-nums;
}

.delta--up { color: #ff8a80; }
.delta--down { color: #69f0ae; }
.delta--flat { color: #8b929e; }

.bcl-row__chevron {
  color: #8b929e;
  justify-self: end;
}

.bcl-row__detail {
  padding: 0 0.55rem 0.55rem;
  border-top: 1px solid rgba(255, 255, 255, 0.05);
}

.bcl-detail-grid {
  display: flex;
  flex-wrap: wrap;
  gap: 0.75rem;
  padding-top: 0.4rem;
  font-size: 0.72rem;
  color: #8b929e;
}

.bcl-detail-grid strong {
  color: #e8eaed;
  font-weight: 600;
}

.bcl-notes {
  margin: 0.35rem 0 0;
  font-size: 0.72rem;
  color: #8b929e;
}

@media (max-width: 420px) {
  .bcl-snap__metrics {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }

  .bcl-row__main {
    grid-template-columns: 4.2rem minmax(0, 1fr) 2.2rem 1rem;
  }

  .bcl-row__bmi {
    display: none;
  }
}
</style>
