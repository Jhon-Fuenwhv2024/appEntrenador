<script setup>
defineProps({
  clientsCount: {
    type: Number,
    required: true,
  },
});
</script>

<template>
  <div class="stats-grid">
    <div class="stat-card">
      <div class="stat-icon stat-icon-cyan">
        <v-icon icon="mdi-account-group-outline" size="20" color="#00E5FF"></v-icon>
      </div>
      <div class="stat-value">{{ clientsCount }}</div>
      <div class="stat-label">Total Alumnos</div>
    </div>

    <div class="stat-card">
      <div class="stat-icon stat-icon-green">
        <v-icon icon="mdi-clipboard-text-outline" size="20" color="#4CAF50"></v-icon>
      </div>
      <div class="stat-value">24</div>
      <div class="stat-label">Rutinas Activas</div>
    </div>

    <div class="stat-card">
      <div class="stat-icon stat-icon-orange">
        <v-icon icon="mdi-food-apple-outline" size="20" color="#FF9800"></v-icon>
      </div>
      <div class="stat-value">18</div>
      <div class="stat-label">Dietas Activas</div>
    </div>

    <div class="stat-card">
      <div class="stat-card-top">
        <div class="stat-icon stat-icon-purple">
          <v-icon icon="mdi-trending-up" size="20" color="#A855F7"></v-icon>
        </div>
        <span class="growth-badge">+12%</span>
      </div>
      <div class="stat-value">12%</div>
      <div class="stat-label">Crecimiento</div>
    </div>
  </div>
</template>

<style src="../../../assets/trainerDashboard.css" scoped></style>
