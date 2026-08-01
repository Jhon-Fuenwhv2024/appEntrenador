<script setup>
/**
 * Empty state de soft-lock por membresía vencida.
 * Patrón: icono + título + copy + acciones de recuperación (contacto sutil).
 * No usa v-alert de error (evita sensación de fallo técnico).
 */
import ClientMembershipContactActions from './ClientMembershipContactActions.vue';

defineProps({
  title: {
    type: String,
    default: 'Membresía pausada',
  },
  message: {
    type: String,
    default: 'Tu plan venció. Renueva con tu entrenador para seguir entrenando.',
  },
  contactNote: {
    type: String,
    default: 'Contacta a tu entrenador para renovar',
  },
  showBack: {
    type: Boolean,
    default: true,
  },
  backLabel: {
    type: String,
    default: 'Volver al inicio',
  },
});

const emit = defineEmits(['back']);
</script>

<template>
  <section
    class="mls"
    role="status"
    aria-live="polite"
  >
    <div class="mls__orb" aria-hidden="true">
      <span class="mls__orb-ring" />
      <v-icon icon="mdi-lock-outline" size="28" class="mls__orb-icon" />
    </div>

    <p class="mls__eyebrow">Acceso limitado</p>
    <h2 class="mls__title">{{ title }}</h2>
    <p class="mls__text">{{ message }}</p>

    <ClientMembershipContactActions
      density="subtle"
      tone="danger"
      :enabled="true"
      :note="contactNote"
      prefill-text="Hola, quiero renovar mi membresía en Trainfit."
      class="mls__contact"
    />

    <button
      v-if="showBack"
      type="button"
      class="mls__back"
      @click="emit('back')"
    >
      {{ backLabel }}
    </button>
  </section>
</template>

<style scoped>
.mls {
  display: flex;
  flex-direction: column;
  align-items: center;
  text-align: center;
  flex: 1;
  justify-content: center;
  padding: 2rem 1.25rem 3rem;
  max-width: 360px;
  margin: 0 auto;
  width: 100%;
  box-sizing: border-box;
  animation: mls-in 0.35s ease-out;
}

@keyframes mls-in {
  from {
    opacity: 0;
    transform: translateY(8px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.mls__orb {
  position: relative;
  width: 4.5rem;
  height: 4.5rem;
  display: grid;
  place-items: center;
  margin-bottom: 1.15rem;
}

.mls__orb-ring {
  position: absolute;
  inset: 0;
  border-radius: 50%;
  background:
    radial-gradient(circle at 40% 35%, rgba(255, 138, 128, 0.22), transparent 55%),
    rgba(255, 92, 92, 0.1);
  border: 1px solid rgba(255, 92, 92, 0.28);
  box-shadow: 0 0 32px rgba(255, 92, 92, 0.12);
}

.mls__orb-icon {
  position: relative;
  z-index: 1;
  color: #ff8a80;
}

.mls__eyebrow {
  margin: 0;
  font-size: 0.65rem;
  font-weight: 700;
  letter-spacing: 0.12em;
  text-transform: uppercase;
  color: #ff8a80;
}

.mls__title {
  margin: 0.45rem 0 0;
  font-size: 1.25rem;
  font-weight: 750;
  letter-spacing: -0.02em;
  line-height: 1.25;
  color: var(--tf-on-surface, #ffffff);
}

.mls__text {
  margin: 0.55rem 0 0;
  font-size: 0.8125rem;
  line-height: 1.45;
  color: var(--tf-on-surface-muted, #a8b0bc);
  max-width: 28ch;
}

.mls__contact {
  width: 100%;
  margin-top: 1.15rem;
  text-align: left;
}

.mls__contact :deep(.mca--subtle) {
  margin-top: 0;
}

.mls__back {
  margin-top: 1.25rem;
  min-height: 44px;
  min-width: 44px;
  padding: 0.5rem 1rem;
  border: 1px solid rgba(255, 255, 255, 0.14);
  border-radius: 12px;
  background: transparent;
  color: var(--tf-on-surface, #e8eaed);
  font: inherit;
  font-size: 0.8125rem;
  font-weight: 650;
  cursor: pointer;
  transition: background 0.15s ease, border-color 0.15s ease;
}

.mls__back:hover {
  background: rgba(255, 255, 255, 0.05);
  border-color: rgba(0, 229, 255, 0.35);
}

.mls__back:focus-visible {
  outline: var(--tf-focus-ring, 2px solid #00e5ff);
  outline-offset: var(--tf-focus-offset, 2px);
}
</style>
