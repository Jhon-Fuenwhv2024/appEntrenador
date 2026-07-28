/**
 * Lista de compra del plan activo (Feature 071).
 * Checklist comprado en localStorage por planId.
 */
import { computed, ref, shallowRef } from 'vue';
import {
  getApiErrorMessage,
  isMembershipBlockedError,
} from '../../../shared/api/http.js';
import { getMyShoppingList } from '../api/dietPlansApi.js';

export const SHOPPING_STORAGE_PREFIX = 'tf-shopping-checked:';

export const SHOPPING_CATEGORY_META = {
  protein: { color: '#EF5350', icon: 'mdi-food-steak', short: 'P' },
  carbs: { color: '#42A5F5', icon: 'mdi-barley', short: 'C' },
  fats: { color: '#FFCA28', icon: 'mdi-oil', short: 'G' },
  other: { color: '#90A4AE', icon: 'mdi-food-variant', short: 'O' },
};

export function shoppingItemKey(item) {
  const name = String(item?.food_name || '').trim().toLowerCase();
  const unit = String(item?.unit || '').trim().toLowerCase();
  return `${name}|${unit}`;
}

export function formatShoppingQty(value) {
  const n = Number(value);
  if (!Number.isFinite(n)) return '—';
  if (Number.isInteger(n)) return String(n);
  return String(Math.round(n * 100) / 100);
}

function storageKey(planId) {
  return `${SHOPPING_STORAGE_PREFIX}${planId}`;
}

function readChecked(planId) {
  if (!planId) return new Set();
  try {
    const raw = localStorage.getItem(storageKey(planId));
    const list = raw ? JSON.parse(raw) : [];
    return new Set(Array.isArray(list) ? list.map(String) : []);
  } catch {
    return new Set();
  }
}

function writeChecked(planId, keys) {
  if (!planId) return;
  try {
    localStorage.setItem(storageKey(planId), JSON.stringify([...keys]));
  } catch (error) {
    console.error('No se pudo guardar checklist de compra:', error);
  }
}

export function useShoppingList() {
  const loading = shallowRef(false);
  const loadError = shallowRef('');
  const membershipBlocked = shallowRef(false);
  const payload = shallowRef(null);
  const checkedKeys = ref(new Set());
  const filterCategory = shallowRef('all');

  const plan = computed(() => payload.value?.plan || null);

  const groups = computed(() =>
    (Array.isArray(payload.value?.groups) ? payload.value.groups : []).filter(
      (g) => Array.isArray(g.items) && g.items.length > 0,
    ),
  );

  const filteredGroups = computed(() => {
    if (filterCategory.value === 'all') return groups.value;
    return groups.value.filter((g) => g.category === filterCategory.value);
  });

  const totalItems = computed(() =>
    groups.value.reduce((acc, g) => acc + g.items.length, 0),
  );

  const checkedCount = computed(() => {
    let n = 0;
    for (const g of groups.value) {
      for (const item of g.items) {
        if (checkedKeys.value.has(shoppingItemKey(item))) n += 1;
      }
    }
    return n;
  });

  const progressPct = computed(() => {
    if (!totalItems.value) return 0;
    return Math.round((checkedCount.value / totalItems.value) * 100);
  });

  const empty = computed(
    () => !loading.value && !loadError.value && !membershipBlocked.value && !plan.value,
  );

  const emptyItems = computed(
    () =>
      Boolean(plan.value)
      && !loading.value
      && !loadError.value
      && !membershipBlocked.value
      && groups.value.length === 0,
  );

  function isChecked(item) {
    return checkedKeys.value.has(shoppingItemKey(item));
  }

  function toggleChecked(item) {
    const key = shoppingItemKey(item);
    const next = new Set(checkedKeys.value);
    if (next.has(key)) next.delete(key);
    else next.add(key);
    checkedKeys.value = next;
    if (plan.value?.id) writeChecked(plan.value.id, next);
  }

  function clearChecked() {
    checkedKeys.value = new Set();
    if (plan.value?.id) writeChecked(plan.value.id, checkedKeys.value);
  }

  function setFilter(category) {
    filterCategory.value = category || 'all';
  }

  async function loadList() {
    try {
      loading.value = true;
      loadError.value = '';
      membershipBlocked.value = false;
      const response = await getMyShoppingList();
      const data = response.data?.data ?? null;
      payload.value = data;
      checkedKeys.value = readChecked(data?.plan?.id);
    } catch (error) {
      if (isMembershipBlockedError(error)) {
        membershipBlocked.value = true;
        payload.value = null;
        loadError.value = '';
        return;
      }
      console.error('Error cargando lista de compra:', error);
      loadError.value = getApiErrorMessage(
        error,
        'No se pudo cargar la lista de compra',
      );
      payload.value = null;
    } finally {
      loading.value = false;
    }
  }

  return {
    loading,
    loadError,
    membershipBlocked,
    payload,
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
  };
}
