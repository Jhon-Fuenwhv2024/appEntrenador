<script setup>
defineProps({
  templates: {
    type: Array,
    default: () => [],
  },
  loading: {
    type: Boolean,
    default: false,
  },
});

defineEmits(['edit', 'assign', 'delete']);
</script>

<template>
  <div class="template-list">
    <div v-if="loading" class="template-list__skeleton" aria-busy="true">
      <v-skeleton-loader
        v-for="n in 4"
        :key="n"
        type="list-item-two-line"
        color="#171B23"
        class="mb-2"
      />
    </div>

    <div v-else-if="templates.length === 0" class="template-list__empty">
      <p class="mb-0">Aún no tienes plantillas. Crea una desde cero o guárdala desde la ficha de un alumno.</p>
    </div>

    <div v-else class="template-list__items">
      <article
        v-for="template in templates"
        :key="template.id"
        class="template-card"
      >
        <div class="template-card__body">
          <h3 class="template-card__title">{{ template.name }}</h3>
          <p class="template-card__meta">
            {{ template.exercises?.length || 0 }}
            {{ (template.exercises?.length || 0) === 1 ? 'ejercicio' : 'ejercicios' }}
          </p>
          <p v-if="template.notes" class="template-card__notes">{{ template.notes }}</p>
        </div>

        <div class="template-card__actions">
          <v-btn
            color="primary"
            size="small"
            prepend-icon="mdi-account-arrow-right"
            @click="$emit('assign', template)"
          >
            Asignar
          </v-btn>
          <v-btn
            variant="outlined"
            color="primary"
            size="small"
            prepend-icon="mdi-pencil-outline"
            @click="$emit('edit', template)"
          >
            Editar
          </v-btn>
          <v-btn
            variant="text"
            color="error"
            size="small"
            icon="mdi-delete-outline"
            :aria-label="`Eliminar ${template.name}`"
            @click="$emit('delete', template)"
          />
        </div>
      </article>
    </div>
  </div>
</template>

<style scoped>
.template-list__empty {
  padding: 28px 20px;
  border-radius: 16px;
  background: #11141B;
  border: 1px solid rgba(255, 255, 255, 0.05);
  color: var(--tf-on-surface-muted, #a8b0bc);
  font-size: 14px;
  line-height: 1.45;
}

.template-list__items {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.template-card {
  display: flex;
  flex-wrap: wrap;
  align-items: flex-start;
  justify-content: space-between;
  gap: 14px;
  padding: 16px 18px;
  border-radius: 16px;
  background: #11141B;
  border: 1px solid rgba(255, 255, 255, 0.05);
}

.template-card__title {
  margin: 0 0 4px;
  font-size: 16px;
  font-weight: 700;
  color: #fff;
}

.template-card__meta {
  margin: 0;
  font-size: 12px;
  color: var(--tf-on-surface-muted, #a8b0bc);
}

.template-card__notes {
  margin: 8px 0 0;
  font-size: 13px;
  color: #B0B7C3;
  line-height: 1.4;
}

.template-card__actions {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 8px;
}
</style>
