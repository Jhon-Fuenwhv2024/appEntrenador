<script setup>
/**
 * Banner soft-lock / aviso de vencimiento (Feature 040).
 */
import { computed } from 'vue';
import {
  isMembershipAccessBlocked,
  isMembershipExpiringSoon,
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

const expiringSoon = computed(() => (
  !blocked.value && isMembershipExpiringSoon(props.membership)
));

const visible = computed(() => blocked.value || expiringSoon.value);

const daysLabel = computed(() => {
  const days = props.membership?.days_remaining;
  if (days == null) return '';
  const n = Number(days);
  if (!Number.isFinite(n)) return '';
  if (n <= 0) return 'hoy';
  if (n === 1) return '1 día';
  return `${n} días`;
});
</script>

<template>
  <v-alert
    v-if="visible"
    :type="blocked ? 'error' : 'warning'"
    variant="tonal"
    density="compact"
    class="membership-banner"
    border="start"
  >
    <template v-if="blocked">
      Tu membresía venció — habla con tu entrenador.
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
}
</style>
