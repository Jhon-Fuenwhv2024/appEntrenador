<script setup>
/**
 * Feature 071 — Lista de compra del plan nutricional (vista dedicada).
 */
import { computed, onMounted } from 'vue';
import { useRouter } from 'vue-router';
import { getSessionUser } from '../../shared/auth/session.js';
import AppShell from '../../shared/layout/AppShell.vue';
import {
  SHOPPING_CATEGORY_META,
  formatShoppingQty,
  shoppingItemKey,
  useShoppingList,
} from './composables/useShoppingList.js';

const MEMBERSHIP_BLOCKED_MSG = 'Membresía vencida — habla con tu entrenador';

const router = useRouter();

const {
  loading,
  loadError,
  membershipBlocked,
  plan,
  groups,
  filteredGroups,
  filterCategory,
  totalItems,
  checkedCount,
  progressPct,
  empty,
  emptyItems,
  isChecked,
  toggleChecked,
  clearChecked,
  setFilter,
  loadList,
} = useShoppingList();

const subtitle = computed(() => {
  if (membershipBlocked.value) return 'Acceso pausado';
  const weeks = plan.value?.cycle_length_weeks;
  if (weeks) return `Todo el plan · ${weeks} semanas`;
  return 'Alimentos consolidados del ciclo';
});

const filterChips = computed(() => {
  const chips = [{ key: 'all', label: 'Todo', count: totalItems.value }];
  for (const g of groups.value) {
    chips.push({
      key: g.category,
      label: g.label,
      count: g.items.length,
      color: SHOPPING_CATEGORY_META[g.category]?.color,
    });
  }
  return chips;
});

function categoryMeta(category) {
  return SHOPPING_CATEGORY_META[category] || SHOPPING_CATEGORY_META.other;
}

function goBack() {
  router.push('/dashboard');
}

onMounted(() => {
  const user = getSessionUser();
  if (!user || user.rol !== 'client') {
    router.push('/');
    return;
  }
  loadList();
});
</script>

<template>
  <AppShell role="client" active="dashboard">
    <main class="main-content shop-page flex-grow-1 overflow-y-auto">
      <header class="shop-hero">
        <div class="shop-hero__top">
          <button
            type="button"
            class="shop-back"
            aria-label="Volver al inicio"
            @click="goBack"
          >
            <v-icon icon="mdi-arrow-left" size="22" />
          </button>
          <div class="shop-hero__titles">
            <p class="shop-hero__eyebrow">Supermercado</p>
            <h1 class="shop-hero__title">Lista de compra</h1>
          </div>
        </div>

        <template v-if="plan && !membershipBlocked && !loading">
          <p class="shop-hero__plan">{{ plan.title }}</p>
          <p class="shop-hero__sub">{{ subtitle }}</p>

          <div
            v-if="totalItems > 0"
            class="shop-progress"
            role="status"
            aria-live="polite"
          >
            <div class="shop-progress__meta">
              <span class="shop-progress__label">Progreso</span>
              <span class="shop-progress__count">
                {{ checkedCount }}/{{ totalItems }}
              </span>
            </div>
            <div
              class="shop-progress__track"
              role="progressbar"
              :aria-valuenow="progressPct"
              aria-valuemin="0"
              aria-valuemax="100"
              :aria-label="`${progressPct}% de la lista marcada`"
            >
              <div
                class="shop-progress__fill"
                :style="{ width: `${progressPct}%` }"
              />
            </div>
          </div>
        </template>
      </header>

      <v-progress-linear
        v-if="loading"
        indeterminate
        color="primary"
        class="mb-3"
        height="2"
      />

      <div
        v-else-if="membershipBlocked"
        class="shop-state shop-state--locked"
        role="status"
      >
        <v-icon icon="mdi-lock" size="28" color="error" />
        <p class="shop-state__title">Acceso pausado</p>
        <p class="shop-state__msg">{{ MEMBERSHIP_BLOCKED_MSG }}</p>
        <v-btn
          color="primary"
          variant="outlined"
          rounded="lg"
          class="font-weight-bold mt-2"
          @click="goBack"
        >
          Volver
        </v-btn>
      </div>

      <v-alert
        v-else-if="loadError"
        type="error"
        variant="tonal"
        density="comfortable"
        class="mb-3"
      >
        {{ loadError }}
        <template #append>
          <v-btn variant="text" size="small" @click="loadList">Reintentar</v-btn>
        </template>
      </v-alert>

      <div v-else-if="empty" class="shop-state">
        <div class="shop-state__icon" aria-hidden="true">
          <v-icon icon="mdi-cart-off" size="32" color="primary" />
        </div>
        <p class="shop-state__title">Sin plan activo</p>
        <p class="shop-state__msg">
          Cuando tu entrenador active un plan de dieta, aquí verás qué comprar.
        </p>
        <v-btn
          color="primary"
          rounded="lg"
          class="font-weight-bold mt-2"
          @click="goBack"
        >
          Volver al inicio
        </v-btn>
      </div>

      <div v-else-if="emptyItems" class="shop-state">
        <div class="shop-state__icon" aria-hidden="true">
          <v-icon icon="mdi-food-off" size="32" color="primary" />
        </div>
        <p class="shop-state__title">Plan sin alimentos</p>
        <p class="shop-state__msg">
          Tu plan aún no tiene ítems para generar la lista de compra.
        </p>
      </div>

      <template v-else-if="groups.length">
        <nav class="shop-filters" aria-label="Filtrar por categoría">
          <button
            v-for="chip in filterChips"
            :key="chip.key"
            type="button"
            class="shop-chip"
            :class="{ 'shop-chip--active': filterCategory === chip.key }"
            :style="chip.color ? { '--chip-accent': chip.color } : undefined"
            :aria-pressed="filterCategory === chip.key"
            @click="setFilter(chip.key)"
          >
            <span class="shop-chip__label">{{ chip.label }}</span>
            <span class="shop-chip__count">{{ chip.count }}</span>
          </button>
        </nav>

        <div class="shop-toolbar">
          <p class="shop-toolbar__hint">
            Marca lo que ya llevas en el carrito
          </p>
          <button
            v-if="checkedCount > 0"
            type="button"
            class="shop-toolbar__clear"
            @click="clearChecked"
          >
            Limpiar
          </button>
        </div>

        <div class="shop-groups">
          <section
            v-for="group in filteredGroups"
            :key="group.category"
            class="shop-group"
            :style="{ '--cat-color': categoryMeta(group.category).color }"
          >
            <header class="shop-group__head">
              <span class="shop-group__badge" aria-hidden="true">
                <v-icon
                  :icon="categoryMeta(group.category).icon"
                  size="16"
                />
              </span>
              <h2 class="shop-group__title">{{ group.label }}</h2>
              <span class="shop-group__count">{{ group.items.length }}</span>
            </header>

            <ul class="shop-list" role="list">
              <li
                v-for="item in group.items"
                :key="shoppingItemKey(item)"
                class="shop-row"
                :class="{ 'shop-row--checked': isChecked(item) }"
              >
                <button
                  type="button"
                  class="shop-row__btn"
                  :aria-pressed="isChecked(item)"
                  :aria-label="`${isChecked(item) ? 'Desmarcar' : 'Marcar'} ${item.food_name}`"
                  @click="toggleChecked(item)"
                >
                  <span class="shop-row__check" aria-hidden="true">
                    <v-icon
                      v-if="isChecked(item)"
                      icon="mdi-check"
                      size="16"
                    />
                  </span>
                  <span class="shop-row__body">
                    <span class="shop-row__name">{{ item.food_name }}</span>
                    <span class="shop-row__meta">
                      {{ item.occurrences }}
                      {{ item.occurrences === 1 ? 'vez' : 'veces' }} en el plan
                    </span>
                  </span>
                  <span class="shop-row__qty">
                    {{ formatShoppingQty(item.quantity) }}
                    <span class="shop-row__unit">{{ item.unit }}</span>
                  </span>
                </button>
              </li>
            </ul>
          </section>

          <p v-if="!filteredGroups.length" class="shop-empty-filter">
            No hay productos en esta categoría.
          </p>
        </div>
      </template>
    </main>
  </AppShell>
</template>

<style scoped>
.shop-page {
  padding: 12px 16px 8px;
  max-width: 560px;
  margin: 0 auto;
}

.shop-hero {
  position: relative;
  margin-bottom: 14px;
  padding: 14px 14px 16px;
  border-radius: 16px;
  background:
    radial-gradient(120% 80% at 100% 0%, rgba(0, 229, 255, 0.12), transparent 55%),
    rgba(255, 255, 255, 0.04);
  border: 1px solid rgba(255, 255, 255, 0.08);
  overflow: hidden;
}

.shop-hero__top {
  display: flex;
  align-items: flex-start;
  gap: 10px;
}

.shop-back {
  flex-shrink: 0;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 44px;
  height: 44px;
  margin: -4px 0 0 -4px;
  border: none;
  border-radius: 12px;
  background: rgba(255, 255, 255, 0.06);
  color: var(--tf-on-surface, #e8eaed);
  cursor: pointer;
}

.shop-back:hover {
  background: rgba(0, 229, 255, 0.12);
}

.shop-back:focus-visible {
  outline: var(--tf-focus-ring, 2px solid #00e5ff);
  outline-offset: var(--tf-focus-offset, 2px);
}

.shop-hero__titles {
  min-width: 0;
  padding-top: 2px;
}

.shop-hero__eyebrow {
  margin: 0;
  font-size: 0.68rem;
  font-weight: 700;
  letter-spacing: 0.08em;
  text-transform: uppercase;
  color: rgb(var(--v-theme-primary));
}

.shop-hero__title {
  margin: 2px 0 0;
  font-size: 1.35rem;
  font-weight: 800;
  letter-spacing: -0.02em;
  line-height: 1.15;
  color: var(--tf-on-surface, #e8eaed);
}

.shop-hero__plan {
  margin: 12px 0 0;
  font-size: 0.88rem;
  font-weight: 650;
  color: var(--tf-on-surface, #e8eaed);
  line-height: 1.3;
}

.shop-hero__sub {
  margin: 2px 0 0;
  font-size: 0.72rem;
  color: var(--tf-on-surface-muted, #a8b0bc);
}

.shop-progress {
  margin-top: 14px;
}

.shop-progress__meta {
  display: flex;
  justify-content: space-between;
  align-items: baseline;
  margin-bottom: 6px;
}

.shop-progress__label {
  font-size: 0.7rem;
  font-weight: 600;
  color: var(--tf-on-surface-muted, #a8b0bc);
  text-transform: uppercase;
  letter-spacing: 0.04em;
}

.shop-progress__count {
  font-size: 0.85rem;
  font-weight: 800;
  color: rgb(var(--v-theme-primary));
}

.shop-progress__track {
  height: 6px;
  border-radius: 999px;
  background: rgba(255, 255, 255, 0.08);
  overflow: hidden;
}

.shop-progress__fill {
  height: 100%;
  border-radius: inherit;
  background: linear-gradient(90deg, #00bcd4, #00e5ff);
  transition: width 0.25s ease;
}

.shop-filters {
  display: flex;
  gap: 8px;
  overflow-x: auto;
  padding-bottom: 4px;
  margin-bottom: 10px;
  scrollbar-width: none;
  -ms-overflow-style: none;
}

.shop-filters::-webkit-scrollbar {
  display: none;
}

.shop-chip {
  flex-shrink: 0;
  display: inline-flex;
  align-items: center;
  gap: 6px;
  min-height: 36px;
  padding: 6px 12px;
  border-radius: 999px;
  border: 1px solid rgba(255, 255, 255, 0.12);
  background: rgba(255, 255, 255, 0.04);
  color: var(--tf-on-surface, #e8eaed);
  cursor: pointer;
  font: inherit;
}

.shop-chip:focus-visible {
  outline: var(--tf-focus-ring, 2px solid #00e5ff);
  outline-offset: var(--tf-focus-offset, 2px);
}

.shop-chip--active {
  border-color: color-mix(in srgb, var(--chip-accent, #00e5ff) 55%, transparent);
  background: color-mix(in srgb, var(--chip-accent, #00e5ff) 16%, transparent);
}

.shop-chip__label {
  font-size: 0.78rem;
  font-weight: 700;
}

.shop-chip__count {
  font-size: 0.7rem;
  font-weight: 700;
  color: var(--tf-on-surface-muted, #a8b0bc);
}

.shop-chip--active .shop-chip__count {
  color: var(--tf-on-surface, #e8eaed);
}

.shop-toolbar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 10px;
  margin-bottom: 12px;
}

.shop-toolbar__hint {
  margin: 0;
  font-size: 0.72rem;
  color: var(--tf-on-surface-muted, #a8b0bc);
}

.shop-toolbar__clear {
  flex-shrink: 0;
  min-height: 32px;
  padding: 4px 10px;
  border: none;
  border-radius: 8px;
  background: transparent;
  color: rgb(var(--v-theme-primary));
  font-size: 0.75rem;
  font-weight: 700;
  cursor: pointer;
}

.shop-toolbar__clear:focus-visible {
  outline: var(--tf-focus-ring, 2px solid #00e5ff);
  outline-offset: var(--tf-focus-offset, 2px);
}

.shop-groups {
  display: flex;
  flex-direction: column;
  gap: 14px;
}

.shop-group {
  border-radius: 14px;
  border: 1px solid rgba(255, 255, 255, 0.07);
  background: rgba(255, 255, 255, 0.03);
  overflow: hidden;
}

.shop-group__head {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 10px 12px;
  border-bottom: 1px solid rgba(255, 255, 255, 0.06);
  background: color-mix(in srgb, var(--cat-color) 8%, transparent);
}

.shop-group__badge {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 28px;
  height: 28px;
  border-radius: 8px;
  background: color-mix(in srgb, var(--cat-color) 22%, transparent);
  color: var(--cat-color);
}

.shop-group__title {
  margin: 0;
  flex: 1;
  font-size: 0.82rem;
  font-weight: 800;
  letter-spacing: 0.02em;
  text-transform: uppercase;
  color: var(--tf-on-surface, #e8eaed);
}

.shop-group__count {
  font-size: 0.72rem;
  font-weight: 700;
  color: var(--tf-on-surface-muted, #a8b0bc);
}

.shop-list {
  list-style: none;
  margin: 0;
  padding: 4px 0;
}

.shop-row {
  border-bottom: 1px solid rgba(255, 255, 255, 0.04);
}

.shop-row:last-child {
  border-bottom: none;
}

.shop-row__btn {
  display: flex;
  align-items: center;
  gap: 12px;
  width: 100%;
  min-height: 56px;
  padding: 10px 12px;
  border: none;
  background: transparent;
  text-align: left;
  cursor: pointer;
  color: inherit;
  font: inherit;
}

.shop-row__btn:hover {
  background: rgba(0, 229, 255, 0.05);
}

.shop-row__btn:focus-visible {
  outline: var(--tf-focus-ring, 2px solid #00e5ff);
  outline-offset: -2px;
}

.shop-row__check {
  flex-shrink: 0;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 24px;
  height: 24px;
  border-radius: 8px;
  border: 2px solid rgba(255, 255, 255, 0.28);
  color: #0b0d12;
  transition: background 0.15s ease, border-color 0.15s ease;
}

.shop-row--checked .shop-row__check {
  background: rgb(var(--v-theme-primary));
  border-color: rgb(var(--v-theme-primary));
}

.shop-row__body {
  flex: 1;
  min-width: 0;
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.shop-row__name {
  font-size: 0.92rem;
  font-weight: 650;
  color: var(--tf-on-surface, #e8eaed);
  line-height: 1.25;
  overflow-wrap: anywhere;
}

.shop-row__meta {
  font-size: 0.68rem;
  color: var(--tf-on-surface-muted, #a8b0bc);
}

.shop-row__qty {
  flex-shrink: 0;
  display: flex;
  flex-direction: column;
  align-items: flex-end;
  font-size: 0.95rem;
  font-weight: 800;
  color: var(--cat-color);
  line-height: 1.1;
}

.shop-row__unit {
  font-size: 0.65rem;
  font-weight: 700;
  color: var(--tf-on-surface-muted, #a8b0bc);
  text-transform: uppercase;
}

.shop-row--checked .shop-row__name {
  text-decoration: line-through;
  color: var(--tf-on-surface-muted, #a8b0bc);
}

.shop-row--checked .shop-row__qty {
  opacity: 0.55;
}

.shop-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  text-align: center;
  gap: 6px;
  padding: 36px 20px;
  border-radius: 16px;
  border: 1px solid rgba(255, 255, 255, 0.07);
  background: rgba(255, 255, 255, 0.03);
}

.shop-state--locked {
  border-color: rgba(239, 83, 80, 0.28);
  background: rgba(239, 83, 80, 0.06);
}

.shop-state__icon {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 56px;
  height: 56px;
  margin-bottom: 4px;
  border-radius: 16px;
  background: rgba(0, 229, 255, 0.1);
}

.shop-state__title {
  margin: 0;
  font-size: 1rem;
  font-weight: 800;
  color: var(--tf-on-surface, #e8eaed);
}

.shop-state__msg {
  margin: 0;
  max-width: 28ch;
  font-size: 0.82rem;
  line-height: 1.4;
  color: var(--tf-on-surface-muted, #a8b0bc);
}

.shop-empty-filter {
  margin: 8px 0 0;
  text-align: center;
  font-size: 0.8rem;
  color: var(--tf-on-surface-muted, #a8b0bc);
}

@media (max-width: 390px) {
  .shop-page {
    padding-left: 12px;
    padding-right: 12px;
  }

  .shop-hero__title {
    font-size: 1.2rem;
  }

  .shop-row__name {
    font-size: 0.86rem;
  }
}
</style>
