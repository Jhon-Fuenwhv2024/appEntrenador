<script setup>
/**
 * Chip compacto de membresía en Inicio del cliente (Feature 040).
 */
import { computed } from 'vue';
import { getMembershipChip } from '../utils/membershipUi.js';

const props = defineProps({
  membership: {
    type: Object,
    default: null,
  },
});

const chip = computed(() => getMembershipChip(props.membership));
</script>

<template>
  <v-chip
    v-if="chip"
    size="small"
    label
    variant="tonal"
    :color="chip.color"
    class="membership-chip"
  >
    <v-icon :icon="chip.icon" size="14" start />
    {{ chip.label }}
  </v-chip>
</template>

<style scoped>
.membership-chip {
  font-weight: 600;
  letter-spacing: 0.01em;
}
</style>
