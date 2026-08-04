<script setup>
/**
 * Diálogo de confirmación alineado con el de cerrar sesión (UserAccountMenu).
 */
const open = defineModel({
  type: Boolean,
  default: false,
});

defineProps({
  title: {
    type: String,
    required: true,
  },
  description: {
    type: String,
    default: '',
  },
  confirmLabel: {
    type: String,
    default: 'Confirmar',
  },
  cancelLabel: {
    type: String,
    default: 'Cancelar',
  },
  /** Vuetify color del CTA (primary | error | warning). */
  confirmColor: {
    type: String,
    default: 'primary',
  },
  loading: {
    type: Boolean,
    default: false,
  },
});

const emit = defineEmits(['confirm']);

function onCancel() {
  if (open.value) open.value = false;
}

function onConfirm() {
  emit('confirm');
}
</script>

<template>
  <v-dialog
    v-model="open"
    max-width="360"
    content-class="tf-confirm-dialog"
    :persistent="loading"
  >
    <div
      class="tf-confirm"
      role="alertdialog"
      :aria-labelledby="'tf-confirm-title'"
      :aria-describedby="description ? 'tf-confirm-desc' : undefined"
    >
      <h2 id="tf-confirm-title" class="tf-confirm__title">
        {{ title }}
      </h2>
      <p
        v-if="description"
        id="tf-confirm-desc"
        class="tf-confirm__desc"
      >
        {{ description }}
      </p>
      <div class="tf-confirm__actions">
        <v-btn
          variant="outlined"
          color="default"
          class="tf-confirm__cancel"
          :disabled="loading"
          @click="onCancel"
        >
          {{ cancelLabel }}
        </v-btn>
        <v-btn
          :color="confirmColor"
          :loading="loading"
          @click="onConfirm"
        >
          {{ confirmLabel }}
        </v-btn>
      </div>
    </div>
  </v-dialog>
</template>

<style>
.tf-confirm-dialog {
  border-radius: 16px !important;
  overflow: hidden;
}

.tf-confirm {
  background: #13161d;
  border: 1px solid rgba(255, 255, 255, 0.08);
  border-radius: 16px;
  padding: 20px;
}

.tf-confirm__title {
  margin: 0;
  font-size: 17px;
  font-weight: 600;
  color: #ffffff;
  line-height: 1.3;
}

.tf-confirm__desc {
  margin: 8px 0 0;
  font-size: 13px;
  line-height: 1.45;
  color: var(--tf-on-surface-muted, #a8b0bc);
}

.tf-confirm__actions {
  display: flex;
  justify-content: flex-end;
  gap: 8px;
  margin-top: 20px;
}
</style>
