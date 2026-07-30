<script setup>
/**
 * Authenticated app shell: desktop sidebar rail + mobile bottom nav.
 * Unread badge on Chat (Feature 073) via shared useUnreadMessages.
 * Soft prompt Web Push (Feature 051).
 */
import { computed, reactive } from 'vue';
import { useRouter } from 'vue-router';
import AppLogo from '../../components/AppLogo.vue';
import { useUnreadMessages } from '../../features/messaging/composables/useUnreadMessages.js';
import { clearSession, getSessionUser } from '../auth/session.js';
import { clearSessionAccountCache } from '../composables/useSessionAccount.js';
import PushSoftPrompt from '../components/PushSoftPrompt.vue';
import AppBottomNav from './AppBottomNav.vue';

const props = defineProps({
  role: {
    type: String,
    required: true,
    validator: (value) => ['trainer', 'client'].includes(value),
  },
  /** Active nav key: dashboard | clients | messages | library | settings | progress | profile | saas */
  active: {
    type: String,
    default: 'dashboard',
  },
  /** Adds class for trainer dashboard mobile stack (alumnos arriba) */
  withAside: {
    type: Boolean,
    default: false,
  },
});

const router = useRouter();

/** Shell owns poll lifecycle; bottom nav + inbox share the same module state */
const { total, badgeLabel } = useUnreadMessages({ autoStart: true });

const isSuperAdmin = computed(() => getSessionUser()?.is_superadmin === true);

const snackbar = reactive({
  show: false,
  text: '',
  color: 'success',
});

function onPushNotify(text, color = 'success') {
  snackbar.show = true;
  snackbar.text = text;
  snackbar.color = color;
}

const messagesAriaLabel = computed(() => {
  const count = Number(total.value) || 0;
  if (count <= 0) return 'Mensajes';
  if (count === 1) return 'Mensajes, 1 sin leer';
  return `Mensajes, ${count > 99 ? 'más de 99' : count} sin leer`;
});

const handleLogout = () => {
  clearSessionAccountCache();
  clearSession();
  router.push('/');
};

const go = (path) => {
  if (router.currentRoute.value.path === path) return;
  router.push(path);
};
</script>

<template>
  <div
    class="dashboard-bg"
    :class="{ 'dashboard-bg--with-aside': props.withAside }"
  >
    <nav class="sidebar-pill" aria-label="Navegación lateral">
      <div class="logo-wrap">
        <AppLogo size="md" />
      </div>

      <div class="sidebar-pill__nav">
        <template v-if="role === 'trainer'">
          <button
            type="button"
            class="nav-item"
            :class="{ active: active === 'dashboard' }"
            title="Inicio"
            aria-label="Inicio"
            @click="go('/dashboard')"
          >
            <v-icon icon="mdi-view-dashboard-outline" size="22" />
          </button>
          <button
            type="button"
            class="nav-item"
            :class="{ active: active === 'clients' }"
            title="Alumnos"
            aria-label="Alumnos"
            @click="go('/trainer/clients')"
          >
            <v-icon icon="mdi-account-group-outline" size="22" />
          </button>
          <button
            type="button"
            class="nav-item"
            :class="{ active: active === 'messages' }"
            :title="messagesAriaLabel"
            :aria-label="messagesAriaLabel"
            @click="go('/trainer/messages')"
          >
            <span class="nav-item__icon-wrap">
              <v-icon icon="mdi-message-text-outline" size="22" />
              <span
                v-if="total > 0"
                class="nav-item__badge"
                aria-hidden="true"
              >
                {{ badgeLabel }}
              </span>
            </span>
          </button>
          <button
            type="button"
            class="nav-item"
            :class="{ active: active === 'library' }"
            title="Biblioteca"
            aria-label="Biblioteca"
            @click="go('/trainer/library')"
          >
            <v-icon icon="mdi-bookshelf" size="22" />
          </button>
          <button
            type="button"
            class="nav-item"
            :class="{ active: active === 'settings' }"
            title="Ajustes"
            aria-label="Ajustes"
            @click="go('/trainer/settings')"
          >
            <v-icon icon="mdi-cog-outline" size="22" />
          </button>
          <button
            v-if="isSuperAdmin"
            type="button"
            class="nav-item"
            :class="{ active: active === 'saas' }"
            title="Panel SaaS"
            aria-label="Panel SaaS"
            @click="go('/backoffice')"
          >
            <v-icon icon="mdi-shield-crown" size="22" />
          </button>
          <button
            v-if="isSuperAdmin"
            type="button"
            class="nav-item"
            :class="{ active: active === 'tagger' }"
            title="Etiquetar ejercicios"
            aria-label="Etiquetar ejercicios"
            @click="go('/admin/exercises/tagger')"
          >
            <v-icon icon="mdi-tag-multiple-outline" size="22" />
          </button>
        </template>

        <template v-else>
          <button
            type="button"
            class="nav-item"
            :class="{ active: active === 'dashboard' }"
            title="Inicio"
            aria-label="Inicio"
            @click="go('/dashboard')"
          >
            <v-icon icon="mdi-view-dashboard-outline" size="22" />
          </button>
          <button
            type="button"
            class="nav-item"
            :class="{ active: active === 'progress' }"
            title="Mi progreso"
            aria-label="Mi progreso"
            @click="go('/client/progress')"
          >
            <v-icon icon="mdi-chart-timeline-variant" size="22" />
          </button>
          <button
            type="button"
            class="nav-item"
            :class="{ active: active === 'messages' }"
            :title="messagesAriaLabel"
            :aria-label="messagesAriaLabel"
            @click="go('/client/messages')"
          >
            <span class="nav-item__icon-wrap">
              <v-icon icon="mdi-message-text-outline" size="22" />
              <span
                v-if="total > 0"
                class="nav-item__badge"
                aria-hidden="true"
              >
                {{ badgeLabel }}
              </span>
            </span>
          </button>
          <button
            type="button"
            class="nav-item"
            :class="{ active: active === 'profile' }"
            title="Mi Perfil"
            aria-label="Mi Perfil"
            @click="go('/client/profile')"
          >
            <v-icon icon="mdi-account-circle-outline" size="22" />
          </button>
        </template>
      </div>

      <button
        type="button"
        class="nav-item nav-bottom"
        title="Cerrar sesión"
        aria-label="Cerrar sesión"
        @click="handleLogout"
      >
        <v-icon icon="mdi-logout-variant" size="22" />
      </button>
    </nav>

    <div class="shell-body">
      <PushSoftPrompt @notify="onPushNotify" />
      <slot />
    </div>

    <slot name="aside" />

    <AppBottomNav :role="role" :active="active" />

    <v-snackbar v-model="snackbar.show" :color="snackbar.color" timeout="3200">
      {{ snackbar.text }}
    </v-snackbar>
  </div>
</template>

<style src="../../assets/appShell.css"></style>
