<script setup>
/**
 * Legacy route `/trainer/exercises` redirects into Biblioteca hub.
 * Catalog UI lives under LibraryView → ExercisesCatalogPanel.
 */
import { onMounted } from 'vue';
import { useRouter } from 'vue-router';

const router = useRouter();

onMounted(() => {
  router.replace('/trainer/library/exercises');
});
</script>

<template>
  <div class="catalog-redirect text-medium-emphasis pa-8 text-center">
    Redirigiendo al catálogo en Biblioteca…
  </div>
</template>
