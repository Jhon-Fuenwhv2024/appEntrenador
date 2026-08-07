<script setup>
import NotificationBadge from '../../components/notifications/NotificationBadge.vue';
import UserAccountMenu from './UserAccountMenu.vue';
import LiveShadowBadge from '../../features/trainer/components/LiveShadowBadge.vue';

defineProps({
  role: {
    type: String,
    required: true,
    validator: (value) => ['trainer', 'client'].includes(value),
  },
});
</script>

<template>
  <div class="tf-session-actions">
    <LiveShadowBadge v-if="role === 'trainer'" />
    <NotificationBadge />
    <UserAccountMenu :role="role" />
  </div>
</template>

<style scoped>
.tf-session-actions {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  flex-shrink: 0;
}
</style>
