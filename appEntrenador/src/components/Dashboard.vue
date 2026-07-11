<script setup>
import { onMounted, shallowRef } from 'vue';
import { useRouter } from 'vue-router';
import TrainerDashboardView from '../features/trainer/TrainerDashboardView.vue';
import ClientDashboard from './ClientDashboard.vue';

const router = useRouter();
const userRole = shallowRef('');

onMounted(() => {
  const storedRole = localStorage.getItem('userRole');

  if (!storedRole) {
    router.push('/'); 
    return;
  }

  userRole.value = storedRole;
});
</script>

<template>
  <TrainerDashboardView v-if="userRole === 'trainer'" />
  <ClientDashboard v-else-if="userRole === 'client'" />
</template>
