<template>
  <TrainerDashboard v-if="userRole === 'trainer'" />
  <ClientDashboard v-else-if="userRole === 'client'" />
</template>

<script setup>
import { ref, onMounted } from 'vue';
import { useRouter } from 'vue-router';
import TrainerDashboard from './TrainerDashboard.vue';
import ClientDashboard from './ClientDashboard.vue';

const router = useRouter();
const userRole = ref('');

onMounted(() => {
  const storedRole = localStorage.getItem('userRole');

  if (!storedRole) {
    router.push('/'); 
    return;
  }

  userRole.value = storedRole;
});
</script>
