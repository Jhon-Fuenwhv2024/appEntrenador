import { computed, onMounted, shallowRef } from 'vue';
import { useRouter } from 'vue-router';
import { getMyAccount } from '../api/accountApi.js';
import { clearSession, getSessionUser } from '../auth/session.js';
import { resolveAvatarSrc } from '../utils/avatar.js';

/**
 * Session identity for header account menu (client + trainer).
 * @param {{ role: 'client' | 'trainer' }} options
 */
export function useSessionAccount(options = {}) {
  const { role } = options;
  const router = useRouter();

  const displayName = shallowRef('');
  const email = shallowRef('');
  const fotoUrl = shallowRef(null);
  const saasPlan = shallowRef('FREE');
  const isLoading = shallowRef(false);

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

  async function loadAccount() {
    const session = getSessionUser();
    if (session?.nombre) {
      displayName.value = session.nombre;
    }

    isLoading.value = true;
    try {
      const response = await getMyAccount();
      const data = response.data?.data;
      if (data?.nombre) displayName.value = data.nombre;
      email.value = data?.email || '';
      fotoUrl.value = data?.foto_url ?? null;
      if (role === 'trainer') {
        saasPlan.value = data?.saas_plan === 'PRO' ? 'PRO' : 'FREE';
      }
    } catch (error) {
      console.error('Error cargando cuenta de sesión:', error);
      fotoUrl.value = null;
      if (role === 'trainer') saasPlan.value = 'FREE';
    } finally {
      isLoading.value = false;
    }
  }

  function logout() {
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
