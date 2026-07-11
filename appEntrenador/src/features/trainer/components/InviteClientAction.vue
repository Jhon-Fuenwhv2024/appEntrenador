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

      <div v-if="invitationLink" class="invite-generated-link" role="status" aria-live="polite">
        <div class="invite-generated-link-label">Link listo para compartir</div>
        <div class="invite-generated-link-row">
          <span class="invite-generated-link-text" :title="invitationLink">{{ invitationLink }}</span>
          <button type="button" class="invite-copy-btn" @click="$emit('copyInvite')">
            <v-icon icon="mdi-content-copy" size="14" class="mr-1"></v-icon>
            Copiar
          </button>
        </div>
        <p class="invite-generated-link-hint">
          Se copió automáticamente. Se oculta en 1 minuto o al recargar la página.
        </p>
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

<style scoped>
.invite-generated-link {
  display: flex;
  flex-direction: column;
  gap: 8px;
  margin-top: 14px;
  padding: 12px;
  border: 1px solid rgba(0, 229, 255, 0.28);
  border-radius: 10px;
  background: rgba(0, 229, 255, 0.1);
}

.invite-generated-link-label {
  color: #00E5FF;
  font-size: 11px;
  font-weight: 700;
  letter-spacing: 0.02em;
  text-transform: uppercase;
}

.invite-generated-link-row {
  display: flex;
  align-items: flex-start;
  gap: 8px;
}

.invite-generated-link-text {
  min-width: 0;
  flex: 1;
  color: #F3F7FD;
  font-size: 12px;
  line-height: 1.4;
  word-break: break-all;
  white-space: normal;
}

.invite-copy-btn {
  display: inline-flex;
  align-items: center;
  flex-shrink: 0;
  border: none;
  border-radius: 8px;
  background: rgba(0, 229, 255, 0.18);
  color: #00E5FF;
  cursor: pointer;
  font-size: 11px;
  font-weight: 700;
  padding: 6px 10px;
}

.invite-generated-link-hint {
  margin: 0;
  color: #8B929E;
  font-size: 11px;
  line-height: 1.35;
}
</style>
