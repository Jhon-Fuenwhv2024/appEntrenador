<script setup>
/**
 * Feature 083 — acciones rápidas del día (check-in / chat).
 * El agua se marca solo en Hábitos (evitar chip duplicado confuso).
 */
import { computed } from 'vue';

const props = defineProps({
  checkinDue: { type: Boolean, default: false },
  chatPreview: { type: Object, default: null },
  weekInsight: { type: String, default: '' },
});

const emit = defineEmits(['open-checkin', 'open-chat']);

const chatCount = computed(() => Number(props.chatPreview?.total) || 0);

/** Insight sin repetir macros/kcal (eso vive en Alimentación de hoy). */
const insightClean = computed(() => {
  const raw = String(props.weekInsight || '').trim();
  if (!raw) return '';
  return raw
    .split('·')
    .map((part) => part.trim())
    .filter((part) => {
      const lower = part.toLowerCase();
      if (lower.includes('proteína') || lower.includes('proteina')) return false;
      if (lower.includes('kcal')) return false;
      if (/\b[pcg]\s*\d/i.test(part)) return false;
      return Boolean(part);
    })
    .join(' · ');
});

const hasActions = computed(() => props.checkinDue || chatCount.value > 0);
</script>

<template>
  <section
    v-if="insightClean || hasActions"
    class="hda"
    aria-label="Resumen y acciones del día"
  >
    <p v-if="insightClean" class="hda__insight">{{ insightClean }}</p>

    <div v-if="hasActions" class="hda__row" role="list">
      <button
        v-if="checkinDue"
        type="button"
        class="hda__chip hda__chip--accent"
        role="listitem"
        aria-label="Abrir check-in semanal"
        @click="emit('open-checkin')"
      >
        <v-icon icon="mdi-clipboard-pulse-outline" size="18" />
        <span>Check-in</span>
      </button>

      <button
        v-if="chatCount > 0"
        type="button"
        class="hda__chip hda__chip--accent"
        role="listitem"
        :aria-label="`Coach te escribió, ${chatCount} sin leer`"
        @click="emit('open-chat')"
      >
        <v-icon icon="mdi-message-text-outline" size="18" />
        <span>Coach · {{ chatCount > 9 ? '9+' : chatCount }}</span>
      </button>
    </div>
  </section>
</template>

<style scoped>
.hda {
  display: flex;
  flex-direction: column;
  gap: 8px;
  margin-bottom: 12px;
}

.hda__insight {
  margin: 0;
  font-size: 0.78rem;
  font-weight: 600;
  color: var(--tf-on-surface-muted, #a8b0bc);
  line-height: 1.35;
}

.hda__row {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}

.hda__chip {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  min-height: 44px;
  padding: 6px 14px;
  border-radius: 999px;
  border: 1px solid rgba(255, 255, 255, 0.1);
  background: rgba(255, 255, 255, 0.04);
  color: var(--tf-on-surface, #e8eaed);
  font-size: 0.78rem;
  font-weight: 700;
  cursor: pointer;
  transition: background 0.15s ease, border-color 0.15s ease;
}

.hda__chip:hover {
  background: rgba(0, 229, 255, 0.08);
}

.hda__chip:focus-visible {
  outline: 2px solid rgb(var(--v-theme-primary));
  outline-offset: 2px;
}

.hda__chip--accent {
  border-color: rgba(0, 229, 255, 0.35);
}
</style>
