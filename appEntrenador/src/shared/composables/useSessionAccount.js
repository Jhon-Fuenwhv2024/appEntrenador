import { computed, onMounted, shallowRef } from 'vue';
import { useRouter } from 'vue-router';
import { getMyAccount } from '../api/accountApi.js';
import { clearSession, getSessionUser } from '../auth/session.js';
import { resolveAvatarSrc } from '../utils/avatar.js';

const ACCOUNT_PLAN_KEY = 'sessionSaasPlan';
const ACCOUNT_FOTO_KEY = 'sessionFotoUrl';
const ACCOUNT_EMAIL_KEY = 'sessionEmail';

/** Shared across views so remounts don't flash FREE / empty avatar. */
const displayName = shallowRef('');
const email = shallowRef('');
const fotoUrl = shallowRef(null);
const saasPlan = shallowRef('FREE');
const isLoading = shallowRef(false);
const loadedUserId = shallowRef(null);
let loadPromise = null;

// Hydrate synchronously so first paint after navigation already shows PRO/foto
try {
  const plan = localStorage.getItem(ACCOUNT_PLAN_KEY);
  const foto = localStorage.getItem(ACCOUNT_FOTO_KEY);
  const cachedEmail = localStorage.getItem(ACCOUNT_EMAIL_KEY);
  if (plan === 'PRO' || plan === 'FREE') saasPlan.value = plan;
  if (foto) fotoUrl.value = foto;
  if (cachedEmail) email.value = cachedEmail;
} catch {
  /* ignore */
}

function readCachedAccount() {
  try {
    const plan = localStorage.getItem(ACCOUNT_PLAN_KEY);
    const foto = localStorage.getItem(ACCOUNT_FOTO_KEY);
    const cachedEmail = localStorage.getItem(ACCOUNT_EMAIL_KEY);
    if (plan === 'PRO' || plan === 'FREE') saasPlan.value = plan;
    if (foto) fotoUrl.value = foto;
    if (cachedEmail) email.value = cachedEmail;
  } catch {
    /* ignore quota / private mode */
  }
}

function writeCachedAccount({ plan, foto, email: nextEmail }) {
  try {
    if (plan === 'PRO' || plan === 'FREE') {
      localStorage.setItem(ACCOUNT_PLAN_KEY, plan);
    }
    if (foto) localStorage.setItem(ACCOUNT_FOTO_KEY, foto);
    else localStorage.removeItem(ACCOUNT_FOTO_KEY);
    if (nextEmail) localStorage.setItem(ACCOUNT_EMAIL_KEY, nextEmail);
    else localStorage.removeItem(ACCOUNT_EMAIL_KEY);
  } catch {
    /* ignore */
  }
}

/** Clear in-memory + persisted account header cache (call on logout). */
export function clearSessionAccountCache() {
  displayName.value = '';
  email.value = '';
  fotoUrl.value = null;
  saasPlan.value = 'FREE';
  loadedUserId.value = null;
  loadPromise = null;
  try {
    localStorage.removeItem(ACCOUNT_PLAN_KEY);
    localStorage.removeItem(ACCOUNT_FOTO_KEY);
    localStorage.removeItem(ACCOUNT_EMAIL_KEY);
  } catch {
    /* ignore */
  }
}

/**
 * Session identity for header account menu (client + trainer).
 * Module-level cache avoids FREE/avatar flash when switching routes.
 * @param {{ role: 'client' | 'trainer' }} options
 */
export function useSessionAccount(options = {}) {
  const { role } = options;
  const router = useRouter();

  const avatarSrc = computed(() => resolveAvatarSrc(fotoUrl.value));

  const hasCustomFoto = computed(() => {
    const url = typeof fotoUrl.value === 'string' ? fotoUrl.value.trim() : '';
    return Boolean(url) && url !== 'default_avatar.png';
  });

  const initials = computed(() => {
    const parts = (displayName.value || '').trim().split(/\s+/).filter(Boolean);
    if (parts.length === 0) return '?';
    if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
    return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
  });

  const planLabel = computed(() => (saasPlan.value === 'PRO' ? 'PRO' : 'FREE'));

  const isProPlan = computed(() => saasPlan.value === 'PRO');

  const profilePath = computed(() =>
    role === 'trainer' ? '/trainer/settings' : '/client/profile',
  );

  const profileLabel = computed(() =>
    role === 'trainer' ? 'Ajustes' : 'Mi perfil',
  );

  async function loadAccount({ force = false } = {}) {
    const session = getSessionUser();
    if (!session) {
      clearSessionAccountCache();
      return;
    }

    if (session.nombre) {
      displayName.value = session.nombre;
    }

    // Persistido: evita FREE/avatar vacío en el primer paint tras remount
    if (!loadedUserId.value || loadedUserId.value !== session.id) {
      readCachedAccount();
    }

    // Ya tenemos datos en memoria para este usuario → no refetch al cambiar de ruta
    if (loadedUserId.value === session.id && !force) {
      return;
    }

    if (loadPromise && !force) {
      return loadPromise;
    }

    isLoading.value = true;
    loadPromise = (async () => {
      try {
        const response = await getMyAccount();
        const data = response.data?.data;
        if (data?.nombre) displayName.value = data.nombre;
        email.value = data?.email || '';
        fotoUrl.value = data?.foto_url ?? null;

        let nextPlan = saasPlan.value;
        if (role === 'trainer' || session.rol === 'trainer') {
          nextPlan = data?.saas_plan === 'PRO' ? 'PRO' : 'FREE';
          saasPlan.value = nextPlan;
        }

        loadedUserId.value = session.id;
        writeCachedAccount({
          plan: session.rol === 'trainer' ? nextPlan : undefined,
          foto: data?.foto_url || null,
          email: data?.email || '',
        });
      } catch (error) {
        console.error('Error cargando cuenta de sesión:', error);
        // Keep previous plan/foto — never overwrite PRO with FREE on error
      } finally {
        isLoading.value = false;
        loadPromise = null;
      }
    })();

    return loadPromise;
  }

  function logout() {
    clearSessionAccountCache();
    clearSession();
    router.push('/');
  }

  function goToProfile() {
    const path = profilePath.value;
    if (router.currentRoute.value.path === path) return;
    router.push(path);
  }

  onMounted(() => {
    loadAccount();
  });

  return {
    displayName,
    email,
    avatarSrc,
    hasCustomFoto,
    initials,
    saasPlan,
    planLabel,
    isProPlan,
    isLoading,
    profilePath,
    profileLabel,
    loadAccount,
    logout,
    goToProfile,
  };
}
