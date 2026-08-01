<script setup>
/**
 * Acciones para contactar al entrenador (Chat + WhatsApp).
 * - prominent: CTA de renovación (por vencer)
 * - subtle: text/ghost buttons en estados vencido / pago pendiente
 *   (patrón inline-alert accionable: acciones terciarias, no filled primary)
 */
import { computed, toRef, watch } from 'vue';
import { useTrainerContact } from '../composables/useTrainerContact.js';

const props = defineProps({
  /** @type {'subtle' | 'prominent'} */
  density: {
    type: String,
    default: 'subtle',
    validator: (v) => v === 'subtle' || v === 'prominent',
  },
  prefillText: {
    type: String,
    default: 'Hola, quiero renovar mi membresía en Trainfit.',
  },
  /** Si false, no carga contacto (p. ej. hasta que el padre lo active). */
  enabled: {
    type: Boolean,
    default: true,
  },
  /** Texto corto encima de las acciones (solo subtle). */
  note: {
    type: String,
    default: '',
  },
  /** Tono del bloque sutil (vencida vs pago pendiente). */
  tone: {
    type: String,
    default: 'danger',
    validator: (v) => v === 'danger' || v === 'warn',
  },
});

const prefillRef = toRef(props, 'prefillText');
const {
  trainerName,
  contactLoading,
  contactLoaded,
  whatsappUrl,
  loadTrainerContact,
  goToChat,
} = useTrainerContact({ prefillText: prefillRef });

const isSubtle = computed(() => props.density === 'subtle');

watch(
  () => props.enabled,
  (on) => {
    if (on) loadTrainerContact();
  },
  { immediate: true },
);
</script>

<template>
  <div
    class="mca"
    :class="[
      isSubtle ? 'mca--subtle' : 'mca--prominent',
      isSubtle && tone === 'warn' ? 'mca--tone-warn' : '',
      isSubtle && tone === 'danger' ? 'mca--tone-danger' : '',
    ]"
    role="group"
    :aria-label="isSubtle ? 'Contactar entrenador' : 'Renovar membresía'"
  >
    <template v-if="isSubtle">
      <p v-if="note" class="mca__note">{{ note }}</p>
      <div class="mca__row">
        <button
          type="button"
          class="mca__link"
          aria-label="Abrir chat con tu entrenador"
          @click="goToChat"
        >
          <v-icon icon="mdi-message-text-outline" size="16" aria-hidden="true" />
          <span>Chat</span>
        </button>
        <span class="mca__sep" aria-hidden="true" />
        <a
          v-if="whatsappUrl"
          :href="whatsappUrl"
          class="mca__link mca__link--wa"
          target="_blank"
          rel="noopener noreferrer"
          aria-label="Abrir WhatsApp con el número de tu entrenador"
        >
          <v-icon icon="mdi-whatsapp" size="16" aria-hidden="true" />
          <span>WhatsApp</span>
        </a>
        <span
          v-else-if="contactLoaded && !contactLoading"
          class="mca__hint"
        >
          WhatsApp no disponible
        </span>
      </div>
    </template>

    <template v-else>
      <div class="mca__copy">
        <p class="mca__kicker">Por vencer</p>
        <p class="mca__title">Habla con {{ trainerName || 'tu entrenador' }}</p>
        <p v-if="note" class="mca__sub">{{ note }}</p>
      </div>
      <div class="mca__actions">
        <button
          type="button"
          class="mca__pill mca__pill--chat"
          aria-label="Abrir chat con tu entrenador"
          @click="goToChat"
        >
          <v-icon icon="mdi-message-text-outline" size="18" aria-hidden="true" />
          <span>Chat</span>
        </button>
        <a
          v-if="whatsappUrl"
          :href="whatsappUrl"
          class="mca__pill mca__pill--wa"
          target="_blank"
          rel="noopener noreferrer"
          aria-label="Abrir WhatsApp con el número de tu entrenador"
        >
          <v-icon icon="mdi-whatsapp" size="18" aria-hidden="true" />
          <span>WhatsApp</span>
        </a>
        <p
          v-else-if="contactLoaded && !contactLoading"
          class="mca__wa-missing"
        >
          WhatsApp no disponible: tu entrenador aún no agregó teléfono en su perfil.
        </p>
      </div>
    </template>
  </div>
</template>

<style scoped>
/* —— Subtle: text actions (tertiary), estilo inline-alert —— */
.mca--subtle {
  margin-top: 0.7rem;
  padding: 0.55rem 0.7rem;
  border-radius: 10px;
}

.mca--tone-danger {
  background: rgba(255, 92, 92, 0.06);
  border: 1px solid rgba(255, 92, 92, 0.16);
}

.mca--tone-warn {
  background: rgba(255, 176, 32, 0.07);
  border: 1px solid rgba(255, 176, 32, 0.18);
}

.mca__note {
  margin: 0 0 0.4rem;
  font-size: 0.7rem;
  line-height: 1.35;
  color: var(--tf-on-surface-muted, #a8b0bc);
}

.mca__row {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 0.15rem 0.35rem;
}

.mca__link {
  display: inline-flex;
  align-items: center;
  gap: 0.28rem;
  min-height: 32px;
  min-width: 44px;
  padding: 0.15rem 0.35rem;
  margin: 0;
  border: none;
  border-radius: 6px;
  background: transparent;
  color: var(--tf-primary, #00e5ff);
  font: inherit;
  font-size: 0.75rem;
  font-weight: 650;
  letter-spacing: 0.01em;
  line-height: 1;
  text-decoration: none;
  cursor: pointer;
  transition: background 0.15s ease, color 0.15s ease;
}

.mca__link:hover {
  background: rgba(0, 229, 255, 0.08);
}

.mca__link:focus-visible {
  outline: var(--tf-focus-ring, 2px solid #00e5ff);
  outline-offset: var(--tf-focus-offset, 2px);
}

.mca__link--wa {
  color: #69f0ae;
}

.mca__link--wa:hover {
  background: rgba(37, 211, 102, 0.1);
}

.mca__sep {
  width: 1px;
  height: 12px;
  background: rgba(255, 255, 255, 0.14);
  flex-shrink: 0;
}

.mca__hint {
  font-size: 0.65rem;
  color: var(--tf-on-surface-muted, #a8b0bc);
  line-height: 1.3;
}

/* —— Prominent: panel de renovación (por vencer) —— */
.mca--prominent {
  margin-top: 0.9rem;
  padding: 0.85rem 0.9rem;
  border-radius: 14px;
  background:
    linear-gradient(135deg, rgba(255, 176, 32, 0.1) 0%, rgba(0, 229, 255, 0.04) 100%);
  border: 1px solid rgba(255, 176, 32, 0.22);
}

.mca__copy {
  margin-bottom: 0.75rem;
}

.mca__kicker {
  margin: 0;
  font-size: 0.625rem;
  font-weight: 700;
  letter-spacing: 0.1em;
  text-transform: uppercase;
  color: #ffc857;
}

.mca__title {
  margin: 0.28rem 0 0;
  font-size: 0.9375rem;
  font-weight: 700;
  letter-spacing: -0.01em;
  color: var(--tf-on-surface, #ffffff);
  line-height: 1.25;
}

.mca__sub {
  margin: 0.25rem 0 0;
  font-size: 0.75rem;
  line-height: 1.4;
  color: var(--tf-on-surface-muted, #a8b0bc);
}

.mca__actions {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 0.5rem;
}

.mca__pill {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 0.4rem;
  min-height: 40px;
  min-width: 44px;
  padding: 0 0.95rem;
  border-radius: 999px;
  border: 1px solid transparent;
  font-size: 0.8125rem;
  font-weight: 650;
  letter-spacing: 0.01em;
  line-height: 1;
  text-decoration: none;
  cursor: pointer;
  transition: background 0.18s ease, border-color 0.18s ease, transform 0.12s ease;
}

.mca__pill:focus-visible {
  outline: var(--tf-focus-ring, 2px solid #00e5ff);
  outline-offset: var(--tf-focus-offset, 2px);
}

.mca__pill:active {
  transform: scale(0.98);
}

.mca__pill--chat {
  color: var(--tf-on-primary, #0b0d12);
  background: var(--tf-primary, #00e5ff);
}

.mca__pill--chat:hover {
  background: #33ebff;
}

.mca__pill--wa {
  color: #e8f8ef;
  background: rgba(37, 211, 102, 0.14);
  border-color: rgba(37, 211, 102, 0.42);
}

.mca__pill--wa:hover {
  background: rgba(37, 211, 102, 0.22);
  border-color: rgba(37, 211, 102, 0.55);
}

.mca__wa-missing {
  margin: 0;
  flex: 1 1 100%;
  font-size: 0.6875rem;
  line-height: 1.35;
  color: var(--tf-on-surface-muted, #a8b0bc);
}
</style>
