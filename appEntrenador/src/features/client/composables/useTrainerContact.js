/**
 * Contacto del entrenador (chat in-app + WhatsApp) para CTAs de membresía.
 */
import { computed, shallowRef } from 'vue';
import { useRouter } from 'vue-router';
import { getChatPartner } from '../../messaging/api/messagesApi.js';
import { buildWhatsAppUrl } from '../utils/whatsapp.js';

const DEFAULT_PREFILL = 'Hola, quiero renovar mi membresía en Trainfit.';

/**
 * @param {object} [options]
 * @param {import('vue').MaybeRefOrGetter<string>} [options.prefillText]
 */
export function useTrainerContact(options = {}) {
  const router = useRouter();
  const trainerPhone = shallowRef(null);
  const trainerName = shallowRef('');
  const contactLoading = shallowRef(false);
  const contactLoaded = shallowRef(false);

  const prefill = computed(() => {
    const raw = options.prefillText;
    if (typeof raw === 'function') return raw() || DEFAULT_PREFILL;
    if (raw && typeof raw === 'object' && 'value' in raw) {
      return raw.value || DEFAULT_PREFILL;
    }
    return raw || DEFAULT_PREFILL;
  });

  const whatsappUrl = computed(() => (
    buildWhatsAppUrl(trainerPhone.value, prefill.value)
  ));

  async function loadTrainerContact() {
    if (contactLoading.value) return;
    contactLoading.value = true;
    try {
      const response = await getChatPartner();
      const partner = response.data?.data ?? null;
      trainerPhone.value = partner?.telefono ?? null;
      trainerName.value = partner?.nombre || 'tu entrenador';
    } catch (error) {
      console.warn('No se pudo cargar contacto del entrenador:', error);
      trainerPhone.value = null;
      trainerName.value = 'tu entrenador';
    } finally {
      contactLoading.value = false;
      contactLoaded.value = true;
    }
  }

  function goToChat() {
    router.push({ name: 'ClientMessages' });
  }

  return {
    trainerPhone,
    trainerName,
    contactLoading,
    contactLoaded,
    whatsappUrl,
    loadTrainerContact,
    goToChat,
  };
}
