<script setup>
/**
 * Modal para crear/editar medición de composición corporal (trainer).
 * No incluye input de IMC (lo calcula el backend).
 * Al abrir en modo create, pre-llena height_cm desde lastHeightCm.
 */
import { computed, reactive, shallowRef, watch } from 'vue';

const props = defineProps({
  modelValue: {
    type: Boolean,
    default: false,
  },
  /** Registro a editar, o null para crear. */
  editingLog: {
    type: Object,
    default: null,
  },
  /** Última altura conocida del alumno (solo create). */
  lastHeightCm: {
    type: [Number, String],
    default: null,
  },
  saving: {
    type: Boolean,
    default: false,
  },
});

const emit = defineEmits(['update:modelValue', 'submit']);

const formRef = shallowRef(null);
const localError = shallowRef('');

const requiredRule = (label) => (v) => {
  if (v === null || v === undefined || v === '') {
    return `${label} es obligatorio`;
  }
  return true;
};

const positiveNumberRule = (label) => (v) => {
  if (v === null || v === undefined || v === '') return true;
  const num = Number(v);
  if (!Number.isFinite(num) || num <= 0) {
    return `${label} debe ser un número positivo`;
  }
  return true;
};

const form = reactive({
  measured_at: '',
  weight_kg: null,
  height_cm: null,
  body_fat_pct: null,
  chest_cm: null,
  waist_cm: null,
  triceps_cm: null,
  biceps_cm: null,
  glutes_cm: null,
  quads_cm: null,
  calves_cm: null,
  back_cm: null,
  notes: '',
});

const isEdit = computed(() => Boolean(props.editingLog?.id));
const dialogTitle = computed(() => (
  isEdit.value ? 'Editar medición' : 'Nueva medición'
));

const open = computed({
  get: () => props.modelValue,
  set: (value) => emit('update:modelValue', value),
});

function todayIso() {
  const d = new Date();
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

function toNullableNumber(value) {
  if (value === null || value === undefined || value === '') return null;
  const num = Number(value);
  return Number.isFinite(num) ? num : null;
}

function resetForm() {
  localError.value = '';
  const log = props.editingLog;

  if (log) {
    form.measured_at = String(log.measured_at || '').slice(0, 10) || todayIso();
    form.weight_kg = toNullableNumber(log.weight_kg);
    form.height_cm = toNullableNumber(log.height_cm);
    form.body_fat_pct = toNullableNumber(log.body_fat_pct);
    form.chest_cm = toNullableNumber(log.chest_cm);
    form.waist_cm = toNullableNumber(log.waist_cm);
    form.triceps_cm = toNullableNumber(log.triceps_cm);
    form.biceps_cm = toNullableNumber(log.biceps_cm);
    form.glutes_cm = toNullableNumber(log.glutes_cm);
    form.quads_cm = toNullableNumber(log.quads_cm);
    form.calves_cm = toNullableNumber(log.calves_cm);
    form.back_cm = toNullableNumber(log.back_cm);
    form.notes = log.notes || '';
    return;
  }

  form.measured_at = todayIso();
  form.weight_kg = null;
  form.height_cm = toNullableNumber(props.lastHeightCm);
  form.body_fat_pct = null;
  form.chest_cm = null;
  form.waist_cm = null;
  form.triceps_cm = null;
  form.biceps_cm = null;
  form.glutes_cm = null;
  form.quads_cm = null;
  form.calves_cm = null;
  form.back_cm = null;
  form.notes = '';
}

watch(
  () => props.modelValue,
  (isOpen) => {
    if (isOpen) resetForm();
  },
);

function close() {
  open.value = false;
}

async function handleSubmit() {
  localError.value = '';
  const { valid } = await formRef.value?.validate?.() ?? { valid: false };
  if (!valid) {
    localError.value = 'Revisa peso y altura: son obligatorios.';
    return;
  }

  emit('submit', {
    measured_at: form.measured_at,
    weight_kg: Number(form.weight_kg),
    height_cm: Number(form.height_cm),
    body_fat_pct: toNullableNumber(form.body_fat_pct),
    chest_cm: toNullableNumber(form.chest_cm),
    waist_cm: toNullableNumber(form.waist_cm),
    triceps_cm: toNullableNumber(form.triceps_cm),
    biceps_cm: toNullableNumber(form.biceps_cm),
    glutes_cm: toNullableNumber(form.glutes_cm),
    quads_cm: toNullableNumber(form.quads_cm),
    calves_cm: toNullableNumber(form.calves_cm),
    back_cm: toNullableNumber(form.back_cm),
    notes: form.notes?.trim() || null,
  });
}
</script>

<template>
  <v-dialog v-model="open" max-width="560" scrollable>
    <v-card class="bcl-dialog">
      <v-card-title class="text-h6">{{ dialogTitle }}</v-card-title>
      <v-card-subtitle class="pb-2">
        El IMC se calcula automáticamente a partir del peso y la altura.
      </v-card-subtitle>

      <v-card-text>
        <v-alert v-if="localError" type="error" variant="tonal" density="compact" class="mb-3">
          {{ localError }}
        </v-alert>

        <v-form ref="formRef" @submit.prevent="handleSubmit">
          <v-text-field
            v-model="form.measured_at"
            type="date"
            label="Fecha de medición"
            density="compact"
            class="mb-2"
            color="primary"
            bg-color="surface"
            hide-details="auto"
          />

          <v-row dense>
            <v-col cols="12" sm="6">
              <v-text-field
                v-model.number="form.weight_kg"
                type="number"
                label="Peso (kg) *"
                density="compact"
                step="0.1"
                min="20"
                max="400"
                color="primary"
                bg-color="surface"
                :rules="[requiredRule('Peso'), positiveNumberRule('Peso')]"
                hide-details="auto"
              />
            </v-col>
            <v-col cols="12" sm="6">
              <v-text-field
                v-model.number="form.height_cm"
                type="number"
                label="Altura (cm) *"
                density="compact"
                step="0.1"
                min="50"
                max="280"
                color="primary"
                bg-color="surface"
                :rules="[requiredRule('Altura'), positiveNumberRule('Altura')]"
                hide-details="auto"
              />
            </v-col>
          </v-row>

          <v-text-field
            v-model.number="form.body_fat_pct"
            type="number"
            label="% Grasa corporal"
            density="compact"
            class="mt-2"
            step="0.1"
            min="0"
            max="80"
            color="primary"
            bg-color="surface"
            hide-details="auto"
          />

          <p class="text-caption text-medium-emphasis mt-4 mb-2">
            Circunferencias (cm) — opcionales
          </p>

          <v-row dense>
            <v-col
              v-for="field in [
                { key: 'chest_cm', label: 'Pecho' },
                { key: 'waist_cm', label: 'Cintura' },
                { key: 'triceps_cm', label: 'Tríceps' },
                { key: 'biceps_cm', label: 'Bíceps' },
                { key: 'glutes_cm', label: 'Glúteos' },
                { key: 'quads_cm', label: 'Cuádriceps' },
                { key: 'calves_cm', label: 'Pantorrilla' },
                { key: 'back_cm', label: 'Espalda' },
              ]"
              :key="field.key"
              cols="6"
              sm="4"
            >
              <v-text-field
                v-model.number="form[field.key]"
                type="number"
                :label="field.label"
                density="compact"
                step="0.1"
                min="0"
                color="primary"
                bg-color="surface"
                hide-details="auto"
              />
            </v-col>
          </v-row>

          <v-textarea
            v-model="form.notes"
            label="Notas"
            density="compact"
            class="mt-3"
            rows="2"
            auto-grow
            color="primary"
            bg-color="surface"
            hide-details="auto"
          />
        </v-form>
      </v-card-text>

      <v-card-actions class="px-4 pb-4">
        <v-spacer />
        <v-btn variant="text" :disabled="saving" @click="close">Cancelar</v-btn>
        <v-btn
          color="primary"
          class="font-weight-bold"
          :loading="saving"
          @click="handleSubmit"
        >
          {{ isEdit ? 'Guardar cambios' : 'Registrar' }}
        </v-btn>
      </v-card-actions>
    </v-card>
  </v-dialog>
</template>
