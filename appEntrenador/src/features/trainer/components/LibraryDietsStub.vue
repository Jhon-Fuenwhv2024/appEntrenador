<script setup>
/**
 * Stub Dietas en hub Recursos (Feature 079). CRUD alimentos = Feature 070.
 */
</script>

<template>
  <section class="lds" role="status">
    <div class="lds__orb" aria-hidden="true">
      <v-icon icon="mdi-food-apple-outline" size="28" class="lds__icon" />
    </div>
    <p class="lds__eyebrow">Próximamente</p>
    <h2 class="lds__title">Planes y alimentos</h2>
    <p class="lds__text">
      Aquí gestionarás tu catálogo de alimentos y recursos de dieta.
      Mientras tanto, los planes de dieta se editan en la ficha de cada alumno.
    </p>
  </section>
</template>

<style scoped>
.lds {
  display: flex;
  flex-direction: column;
  align-items: center;
  text-align: center;
  padding: 2.5rem 1.25rem;
  max-width: 360px;
  margin: 0 auto;
}

.lds__orb {
  width: 4.25rem;
  height: 4.25rem;
  border-radius: 50%;
  display: grid;
  place-items: center;
  margin-bottom: 1rem;
  background: rgba(0, 229, 255, 0.08);
  border: 1px solid rgba(0, 229, 255, 0.22);
}

.lds__icon {
  color: var(--tf-primary, #00e5ff);
}

.lds__eyebrow {
  margin: 0;
  font-size: 0.65rem;
  font-weight: 700;
  letter-spacing: 0.1em;
  text-transform: uppercase;
  color: var(--tf-primary, #00e5ff);
}

.lds__title {
  margin: 0.4rem 0 0;
  font-size: 1.15rem;
  font-weight: 750;
  color: var(--tf-on-surface, #fff);
}

.lds__text {
  margin: 0.55rem 0 0;
  font-size: 0.8125rem;
  line-height: 1.45;
  color: var(--tf-on-surface-muted, #a8b0bc);
}
</style>
