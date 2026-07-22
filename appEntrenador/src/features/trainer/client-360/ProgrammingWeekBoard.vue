<script setup>
/**
 * Weekly strip L–D for trainer Programación (Feature 061).
 * Props: routines[]. Emits create/edit/assign/duplicate/delete/save-template actions.
 */
import { computed } from 'vue';

const DAYS = ['Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado', 'Domingo'];
const DAY_SHORT = {
  Lunes: 'Lun',
  Martes: 'Mar',
  Miércoles: 'Mié',
  Jueves: 'Jue',
  Viernes: 'Vie',
  Sábado: 'Sáb',
  Domingo: 'Dom',
};

const props = defineProps({
  routines: {
    type: Array,
    default: () => [],
  },
  savingTemplateId: {
    type: [Number, null],
    default: null,
  },
  duplicatingId: {
    type: [Number, null],
    default: null,
  },
});

const emit = defineEmits([
  'create',
  'edit',
  'assign',
  'duplicate',
  'delete',
  'save-template',
]);

/** First routine per day (model allows multiple, board shows primary). */
const byDay = computed(() => {
  const map = new Map();
  for (const day of DAYS) map.set(day, []);
  for (const routine of props.routines) {
    const day = routine.dia_semana;
    if (!map.has(day)) map.set(day, []);
    map.get(day).push(routine);
  }
  return DAYS.map((day) => ({
    day,
    short: DAY_SHORT[day] || day.slice(0, 3),
    routines: map.get(day) || [],
  }));
});

const exerciseCount = (routine) => (routine.ejercicios || []).length;
</script>

<template>
  <section class="week-board" aria-label="Plan semanal">
    <div
      v-for="slot in byDay"
      :key="slot.day"
      class="week-board__day"
      :class="{ 'week-board__day--filled': slot.routines.length > 0 }"
    >
      <div class="week-board__day-label">{{ slot.short }}</div>

      <template v-if="slot.routines.length === 0">
        <p class="week-board__empty">Descanso</p>
        <div class="week-board__empty-actions">
          <v-btn
            size="x-small"
            color="primary"
            variant="tonal"
            @click="emit('create', slot.day)"
          >
            Crear
          </v-btn>
          <v-btn
            size="x-small"
            variant="text"
            color="primary"
            @click="emit('assign', slot.day)"
          >
            Plantilla
          </v-btn>
        </div>
      </template>

      <div
        v-for="routine in slot.routines"
        :key="routine.id"
        class="week-board__card"
      >
        <button
          type="button"
          class="week-board__card-main"
          :title="`Editar ${routine.nombre_rutina}`"
          @click="emit('edit', routine)"
        >
          <span class="week-board__card-name">{{ routine.nombre_rutina }}</span>
          <span class="week-board__card-meta">
            {{ exerciseCount(routine) }} ej.
          </span>
        </button>
        <div class="week-board__card-actions">
          <v-btn
            icon="mdi-content-copy"
            size="x-small"
            variant="text"
            color="primary"
            :loading="duplicatingId === routine.id"
            title="Duplicar a otro día"
            aria-label="Duplicar a otro día"
            @click="emit('duplicate', routine)"
          />
          <v-btn
            icon="mdi-bookshelf"
            size="x-small"
            variant="text"
            color="primary"
            :loading="savingTemplateId === routine.id"
            title="Guardar en Biblioteca"
            aria-label="Guardar en Biblioteca"
            @click="emit('save-template', routine)"
          />
          <v-btn
            icon="mdi-delete-outline"
            size="x-small"
            variant="text"
            color="error"
            title="Eliminar"
            aria-label="Eliminar rutina"
            @click="emit('delete', routine.id)"
          />
        </div>
      </div>
    </div>
  </section>
</template>

<style scoped>
.week-board {
  display: grid;
  grid-template-columns: repeat(7, minmax(0, 1fr));
  gap: 0.4rem;
}

.week-board__day {
  display: flex;
  flex-direction: column;
  gap: 0.35rem;
  min-height: 5.5rem;
  padding: 0.45rem 0.4rem;
  border-radius: 10px;
  border: 1px dashed rgba(255, 255, 255, 0.1);
  background: rgba(0, 0, 0, 0.12);
}

.week-board__day--filled {
  border-style: solid;
  border-color: rgba(255, 255, 255, 0.08);
  background: rgba(255, 255, 255, 0.03);
}

.week-board__day-label {
  font-size: 0.65rem;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.04em;
  color: #8b929e;
}

.week-board__day--filled .week-board__day-label {
  color: rgb(var(--v-theme-primary));
}

.week-board__empty {
  margin: 0;
  font-size: 0.68rem;
  color: #6b7280;
  flex: 1;
}

.week-board__empty-actions {
  display: flex;
  flex-direction: column;
  gap: 0.15rem;
  align-items: stretch;
}

.week-board__card {
  display: flex;
  flex-direction: column;
  gap: 0.15rem;
  padding: 0.35rem 0.4rem;
  border-radius: 8px;
  background: rgba(0, 0, 0, 0.28);
  border: 1px solid rgba(255, 255, 255, 0.06);
}

.week-board__card-main {
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  gap: 0.1rem;
  width: 100%;
  padding: 0;
  border: 0;
  background: transparent;
  color: inherit;
  text-align: left;
  cursor: pointer;
}

.week-board__card-main:hover .week-board__card-name {
  color: rgb(var(--v-theme-primary));
}

.week-board__card-name {
  font-size: 0.75rem;
  font-weight: 700;
  line-height: 1.2;
  word-break: break-word;
}

.week-board__card-meta {
  font-size: 0.65rem;
  color: #8b929e;
}

.week-board__card-actions {
  display: flex;
  flex-wrap: wrap;
  margin: 0 -0.2rem;
}

@media (max-width: 960px) {
  .week-board {
    grid-template-columns: 1fr;
    gap: 0.5rem;
  }

  .week-board__day {
    min-height: 0;
    flex-direction: row;
    flex-wrap: wrap;
    align-items: center;
    gap: 0.5rem;
  }

  .week-board__day-label {
    width: 2.5rem;
    flex-shrink: 0;
  }

  .week-board__empty {
    flex: 1;
    min-width: 4rem;
  }

  .week-board__empty-actions {
    flex-direction: row;
    margin-left: auto;
  }

  .week-board__card {
    flex: 1;
    min-width: 0;
    flex-direction: row;
    align-items: center;
    justify-content: space-between;
  }

  .week-board__card-actions {
    flex-shrink: 0;
  }
}
</style>
