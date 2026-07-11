<script setup>
const searchQuery = defineModel('searchQuery', {
  type: String,
  default: '',
});

defineProps({
  clients: {
    type: Array,
    default: () => [],
  },
  loading: {
    type: Boolean,
    default: false,
  },
});

const getInitials = (name) => {
  if (!name) return '??';

  const parts = name.trim().split(/\s+/);

  if (parts.length >= 2) {
    return (parts[0][0] + parts[1][0]).toUpperCase();
  }

  return name.substring(0, 2).toUpperCase();
};
</script>

<template>
  <aside class="right-panel">
    <div class="students-panel-top">
      <div class="students-panel-header">
        <div>
          <h3 class="students-panel-title">Mis Alumnos</h3>
          <p class="text-caption-alumnos">{{ clients.length }} alumnos</p>
        </div>
        <v-icon icon="mdi-dots-horizontal" color="#6B7280" size="18" class="students-menu-icon"></v-icon>
      </div>

      <div class="search-bar">
        <v-icon icon="mdi-magnify" size="18" color="#6B7280" class="search-bar-icon"></v-icon>
        <input
          v-model="searchQuery"
          type="text"
          class="search-bar-input"
          placeholder="Buscar alumno..."
        />
      </div>
    </div>

    <v-progress-linear v-if="loading" indeterminate color="#00E5FF" class="students-loader"></v-progress-linear>

    <div v-else-if="clients.length === 0" class="students-empty">
      <p>No hay alumnos registrados.</p>
    </div>

    <div v-else class="students-list-scroll">
      <div
        v-for="client in clients"
        :key="client.id"
        class="student-item"
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
              :class="'chip-' + (client.status ? client.status.toLowerCase() : 'activo')"
            >
              {{ client.status || 'Activo' }}
            </span>
          </div>
        </div>
      </div>
    </div>
  </aside>
</template>

<style src="../../../assets/trainerDashboard.css" scoped></style>
