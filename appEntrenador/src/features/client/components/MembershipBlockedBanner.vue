<script setup>
/**
 * Banner soft-lock / por vencer / periodo de gracia (Feature 040 + 080).
 */
import { computed } from 'vue';
import {
  getMembershipGraceDaysLeft,
  isMembershipAccessBlocked,
  isMembershipExpiringSoon,
  isMembershipInGrace,
} from '../utils/membershipUi.js';

const props = defineProps({
  membership: {
    type: Object,
    default: null,
  },
  /** Si el backend ya marcó bloqueo (GET /me/today). */
  forcedBlocked: {
    type: Boolean,
    default: false,
  },
});

const blocked = computed(() => (
  props.forcedBlocked || isMembershipAccessBlocked(props.membership)
));

const inGrace = computed(() => (
  !blocked.value && isMembershipInGrace(props.membership?.days_remaining)
));

const expiringSoon = computed(() => (
  !blocked.value && !inGrace.value && isMembershipExpiringSoon(props.membership)
));

const visible = computed(() => blocked.value || inGrace.value || expiringSoon.value);

const graceDaysLeft = computed(() => (
  getMembershipGraceDaysLeft(props.membership?.days_remaining)
));

const daysLabel = computed(() => {
  const days = props.membership?.days_remaining;
  if (days == null) return '';
  const n = Number(days);
  if (!Number.isFinite(n)) return '';
  if (n <= 0) return 'hoy';
  if (n === 1) return '1 día';
  return `${n} días`;
});

const alertType = computed(() => {
  if (blocked.value) return 'error';
  return 'warning';
});
</script>

<template>
  <v-alert
    v-if="visible"
    :type="alertType"
    variant="tonal"
    density="compact"
    class="membership-banner"
    border="start"
    role="status"
  >
    <template v-if="blocked">
      Tu membresía venció — habla con tu entrenador.
    </template>
    <template v-else-if="inGrace">
      Tu plan terminó, pero aún tienes
      {{ graceDaysLeft === 1 ? '1 día' : `${graceDaysLeft} días` }}
      de acceso. Renueva con tu entrenador antes de que se corte.
    </template>
    <template v-else>
      Tu membresía vence en {{ daysLabel }}. Renueva con tu entrenador.
    </template>
  </v-alert>
</template>

<style scoped>
.membership-banner {
  font-size: 0.85rem;
  line-height: 1.35;
  color: var(--tf-on-surface, inherit);
}
</style>
