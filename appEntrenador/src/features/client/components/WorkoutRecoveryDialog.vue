<script setup>
/**
 * Modal: orphan in-progress workout (Feature 088).
 */
import { computed } from 'vue';

const open = defineModel({
  type: Boolean,
  default: false,
});

const props = defineProps({
  routineName: {
    type: String,
    default: '',
  },
  startedAt: {
    type: String,
    default: '',
  },
  discarding: {
    type: Boolean,
    default: false,
  },
});

const emit = defineEmits(['resume', 'discard']);

const subtitle = computed(() => {
  const name = (props.routineName || '').trim();
  if (name) return name;
  return 'Puedes continuar exactamente donde lo dejaste.';
});

const startedLabel = computed(() => {
  if (!props.startedAt) return '';
  const ms = new Date(props.startedAt).getTime();
  if (!Number.isFinite(ms)) return '';
  try {
    return new Date(ms).toLocaleString('es-ES', {
      day: 'numeric',
      month: 'short',
      hour: '2-digit',
      minute: '2-digit',
    });
  } catch {
    return '';
  }
});

function onResume() {
  emit('resume');
}

function onDiscard() {
  emit('discard');
}
</script>

<template>
  <v-dialog
    v-model="open"
    max-width="380"
    content-class="tf-workout-recovery-dialog"
    :persistent="discarding"
  >
    <div
      class="tf-recovery"
      role="alertdialog"
      aria-labelledby="tf-recovery-title"
      aria-describedby="tf-recovery-desc"
    >
      <p class="tf-recovery__eyebrow">Entrenamiento</p>
      <h2 id="tf-recovery-title" class="tf-recovery__title">
        Tienes un entrenamiento en curso.
      </h2>
      <p id="tf-recovery-desc" class="tf-recovery__desc">
        {{ subtitle }}
      </p>
      <p v-if="startedLabel" class="tf-recovery__meta">
        Iniciado: {{ startedLabel }}
      </p>
      <div class="tf-recovery__actions">
        <v-btn
          variant="outlined"
          color="default"
          class="tf-recovery__discard"
          :disabled="discarding"
          :loading="discarding"
          @click="onDiscard"
        >
          Descartar
        </v-btn>
        <v-btn
          color="primary"
          class="tf-recovery__resume"
          :disabled="discarding"
          @click="onResume"
        >
          Reanudar
        </v-btn>
      </div>
    </div>
  </v-dialog>
</template>

<style>
.tf-workout-recovery-dialog {
  border-radius: 16px !important;
  overflow: hidden;
}

.tf-recovery {
  background: #13161d;
  border: 1px solid rgba(255, 255, 255, 0.08);
  border-radius: 16px;
  padding: 20px;
}

.tf-recovery__eyebrow {
  margin: 0;
  font-size: 0.75rem;
  font-weight: 600;
  letter-spacing: 0.04em;
  text-transform: uppercase;
  color: var(--tf-on-surface-muted, #a8b0bc);
}

.tf-recovery__title {
  margin: 8px 0 0;
  font-size: 1.125rem;
  font-weight: 600;
  color: var(--tf-on-surface, #ffffff);
  line-height: 1.3;
}

.tf-recovery__desc {
  margin: 8px 0 0;
  font-size: 0.875rem;
  line-height: 1.45;
  color: var(--tf-on-surface-muted, #a8b0bc);
}

.tf-recovery__meta {
  margin: 6px 0 0;
  font-size: 0.75rem;
  color: var(--tf-on-surface-muted, #a8b0bc);
}

.tf-recovery__actions {
  display: flex;
  justify-content: flex-end;
  flex-wrap: wrap;
  gap: 8px;
  margin-top: 20px;
}

.tf-recovery__discard,
.tf-recovery__resume {
  min-height: 44px;
}
</style>
