<script setup>
defineProps({
  loading: {
    type: Boolean,
    default: false,
  },
  invitationLink: {
    type: String,
    default: '',
  },
});

defineEmits(['generateInvite', 'copyInvite']);
</script>

<template>
  <div class="quick-actions">
    <div class="quick-actions-header">
      <h3 class="section-title">Acciones Rápidas</h3>
      <p class="section-subtitle">Gestiona tus herramientas</p>
    </div>

    <div class="invite-card">
      <div class="invite-card-top">
        <div class="invite-icon invite-icon-cyan">
          <v-icon icon="mdi-link-variant" size="20" color="#00E5FF"></v-icon>
        </div>
        <div>
          <div class="invite-title">Nueva Invitación</div>
          <div class="invite-desc">Genera un link de acceso único para tus clientes</div>
        </div>
      </div>
      <button
        type="button"
        class="generate-link-btn"
        :disabled="loading"
        @click="$emit('generateInvite')"
      >
        <v-progress-circular
          v-if="loading"
          indeterminate
          size="18"
          width="2"
          color="#0B0D12"
          class="mr-2"
        ></v-progress-circular>
        <v-icon v-else icon="mdi-link-variant" size="18" class="mr-2"></v-icon>
        Generar Link
      </button>

      <div v-if="invitationLink" class="invite-generated-link">
        <span class="invite-generated-link-text">{{ invitationLink }}</span>
        <button type="button" class="invite-copy-btn" @click="$emit('copyInvite')">
          Copiar
        </button>
      </div>
    </div>

    <div class="action-link-card">
      <div class="action-link-content">
        <div class="invite-icon invite-icon-green">
          <v-icon icon="mdi-dumbbell" size="20" color="#4CAF50"></v-icon>
        </div>
        <div>
          <div class="invite-title">Asignar Rutinas</div>
          <div class="invite-desc">Gestiona planes de entrenamiento personalizados</div>
        </div>
      </div>
      <v-icon icon="mdi-chevron-right" size="20" color="#6B7280"></v-icon>
    </div>

    <div class="action-link-card">
      <div class="action-link-content">
        <div class="invite-icon invite-icon-orange">
          <v-icon icon="mdi-food-apple" size="20" color="#FF9800"></v-icon>
        </div>
        <div>
          <div class="invite-title">Planes de Dieta</div>
          <div class="invite-desc">Configura planes nutricionales a medida</div>
        </div>
      </div>
      <v-icon icon="mdi-chevron-right" size="20" color="#6B7280"></v-icon>
    </div>
  </div>
</template>

<style src="../../../assets/trainerDashboard.css" scoped></style>
