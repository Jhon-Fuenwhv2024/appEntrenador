<script setup>
/**
 * Dumb list UI for trainer clients.
 * Props down / events up — filtering and fetching live in the parent view.
 */
import { computed } from 'vue';

const searchQuery = defineModel('searchQuery', {
  type: String,
  default: '',
});

const props = defineProps({
  clients: {
    type: Array,
    default: () => [],
  },
  /** Unfiltered total (for empty vs no-results and caption). */
  totalCount: {
    type: Number,
    default: 0,
  },
  loading: {
    type: Boolean,
    default: false,
  },
  /** `page` = destino Alumnos; `panel` = legacy sidebar layout. */
  variant: {
    type: String,
    default: 'page',
    validator: (value) => ['page', 'panel'].includes(value),
  },
});

const emit = defineEmits(['selectClient', 'invite']);

const caption = computed(() => {
  if (props.loading) return 'Cargando…';
  const q = searchQuery.value.trim();
  if (q && props.totalCount > 0) {
    return `${props.clients.length} de ${props.totalCount} alumnos`;
  }
  return `${props.totalCount} alumnos`;
});

const getInitials = (name) => {
  if (!name) return '??';

  const parts = name.trim().split(/\s+/);

  if (parts.length >= 2) {
    return (parts[0][0] + parts[1][0]).toUpperCase();
  }

  return name.substring(0, 2).toUpperCase();
};

const statusClass = (status) => {
  const normalized = String(status || 'Activo').toLowerCase().trim();
  if (normalized === 'sin plan') return 'sin-plan';
  if (normalized === 'inactivo') return 'inactivo';
  if (normalized === 'pendiente') return 'pendiente';
  return 'activo';
};
</script>

<template>
  <section
    class="clients-list"
    :class="variant === 'page' ? 'clients-list--page' : 'clients-list--panel right-panel'"
  >
    <div class="students-panel-top">
      <div class="students-panel-header">
        <div>
          <h3 class="students-panel-title">
            {{ variant === 'page' ? 'Alumnos' : 'Mis Alumnos' }}
          </h3>
          <p class="text-caption-alumnos">{{ caption }}</p>
        </div>
      </div>

      <div class="search-bar">
        <v-icon icon="mdi-magnify" size="18" color="#6B7280" class="search-bar-icon" />
        <input
          v-model="searchQuery"
          type="search"
          class="search-bar-input"
          placeholder="Buscar por nombre o usuario…"
          autocomplete="off"
          :disabled="loading"
        />
      </div>
    </div>

    <div v-if="loading" class="students-skeleton" aria-busy="true" aria-label="Cargando alumnos">
      <v-skeleton-loader
        v-for="n in 6"
        :key="n"
        type="list-item-avatar-two-line"
        color="#171B23"
        class="students-skeleton__item"
      />
    </div>

    <div v-else-if="totalCount === 0" class="students-empty students-empty--cta">
      <p>Aún no tienes alumnos registrados.</p>
      <v-btn
        color="primary"
        prepend-icon="mdi-account-plus-outline"
        class="mt-4"
        @click="emit('invite')"
      >
        Invitar alumno
      </v-btn>
    </div>

    <div v-else-if="clients.length === 0" class="students-empty">
      <p>Ningún alumno coincide con “{{ searchQuery.trim() }}”.</p>
    </div>

    <div v-else class="students-list-scroll">
      <div
        v-for="client in clients"
        :key="client.id"
        class="student-item student-item--clickable"
        role="button"
        tabindex="0"
        @click="emit('selectClient', client)"
        @keydown.enter="emit('selectClient', client)"
      >
        <div class="student-avatar">
          {{ getInitials(client.nombre) }}
        </div>

        <div class="student-info">
          <div class="student-name">{{ client.nombre }}</div>
          <div class="student-meta">
            <span class="student-username">@{{ client.username }}</span>
            <span
              class="status-chip"
              :class="'chip-' + statusClass(client.status)"
            >
              {{ client.status || 'Activo' }}
            </span>
          </div>
        </div>

        <v-icon
          v-if="variant === 'page'"
          icon="mdi-chevron-right"
          size="20"
          color="#5E6673"
          class="student-chevron"
        />
      </div>
    </div>
  </section>
</template>

<style src="../../../assets/trainerDashboard.css" scoped></style>

<style scoped>
.clients-list--page {
  display: flex;
  flex-direction: column;
  min-height: 0;
  flex: 1;
  width: 100%;
  max-width: 720px;
  margin: 0 auto;
  border-radius: 20px;
  background: #11141B;
  border: 1px solid rgba(255, 255, 255, 0.05);
  overflow: hidden;
}

.clients-list--page .students-list-scroll {
  max-height: none;
}

.student-item--clickable {
  cursor: pointer;
}

.student-item--clickable:hover {
  background: rgba(0, 229, 255, 0.06);
}

.student-chevron {
  margin-left: auto;
  flex-shrink: 0;
}

.students-skeleton {
  padding: 0 12px 16px;
}

.students-skeleton__item {
  background: transparent !important;
}

.students-empty--cta {
  flex-direction: column;
  text-align: center;
  gap: 4px;
}

@media (max-width: 600px) {
  .clients-list--page {
    border-radius: 16px;
    max-width: none;
  }
}
</style>
