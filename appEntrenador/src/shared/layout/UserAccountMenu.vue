<script setup>
import { ref } from 'vue';
import { useSessionAccount } from '../composables/useSessionAccount.js';

const props = defineProps({
  role: {
    type: String,
    required: true,
    validator: (value) => ['trainer', 'client'].includes(value),
  },
});

const menuOpen = ref(false);
const confirmOpen = ref(false);

const {
  displayName,
  email,
  avatarSrc,
  hasCustomFoto,
  initials,
  planLabel,
  isProPlan,
  profileLabel,
  goToProfile,
  logout,
} = useSessionAccount({ role: props.role });

const showPlanBadge = props.role === 'trainer';

function openProfile() {
  menuOpen.value = false;
  goToProfile();
}

function requestLogout() {
  menuOpen.value = false;
  confirmOpen.value = true;
}

function confirmLogout() {
  confirmOpen.value = false;
  logout();
}
</script>

<template>
  <v-menu
    v-model="menuOpen"
    location="bottom end"
    offset="8"
    :close-on-content-click="false"
    content-class="tf-overlay-menu tf-account-menu"
  >
    <template #activator="{ props: menuProps }">
      <button
        type="button"
        class="tf-account-trigger"
        :class="{ 'tf-account-trigger--with-plan': showPlanBadge }"
        v-bind="menuProps"
        :aria-label="showPlanBadge ? `Cuenta, plan ${planLabel}` : 'Cuenta'"
        :aria-expanded="menuOpen ? 'true' : 'false'"
        aria-haspopup="menu"
      >
        <span class="tf-account-trigger__avatar" aria-hidden="true">
          <img
            v-if="hasCustomFoto"
            :src="avatarSrc"
            alt=""
            class="tf-account-trigger__img"
          >
          <span v-else class="tf-account-trigger__initials">{{ initials }}</span>
        </span>
        <span
          v-if="showPlanBadge"
          class="tf-account-trigger__plan"
          :class="isProPlan ? 'tf-account-trigger__plan--pro' : 'tf-account-trigger__plan--free'"
          aria-hidden="true"
        >
          {{ planLabel }}
        </span>
      </button>
    </template>

    <div class="tf-account-panel" role="menu">
      <div class="tf-account-panel__identity">
        <span class="tf-account-panel__avatar" aria-hidden="true">
          <img
            v-if="hasCustomFoto"
            :src="avatarSrc"
            alt=""
            class="tf-account-panel__img"
          >
          <span v-else class="tf-account-panel__initials">{{ initials }}</span>
        </span>
        <div class="tf-account-panel__meta">
          <div class="tf-account-panel__name-row">
            <p class="tf-account-panel__name">{{ displayName || 'Usuario' }}</p>
            <span
              v-if="showPlanBadge"
              class="tf-account-panel__plan"
              :class="isProPlan ? 'tf-account-panel__plan--pro' : 'tf-account-panel__plan--free'"
            >
              {{ planLabel }}
            </span>
          </div>
          <p v-if="email" class="tf-account-panel__email">{{ email }}</p>
        </div>
      </div>

      <div class="tf-account-panel__divider" role="separator" />

      <button
        type="button"
        class="tf-account-panel__item"
        role="menuitem"
        @click="openProfile"
      >
        <v-icon
          :icon="role === 'trainer' ? 'mdi-cog-outline' : 'mdi-account-circle-outline'"
          size="20"
        />
        <span>{{ profileLabel }}</span>
      </button>

      <div class="tf-account-panel__divider" role="separator" />

      <button
        type="button"
        class="tf-account-panel__item tf-account-panel__item--danger"
        role="menuitem"
        @click="requestLogout"
      >
        <v-icon icon="mdi-logout-variant" size="20" />
        <span>Cerrar sesión</span>
      </button>
    </div>
  </v-menu>

  <v-dialog
    v-model="confirmOpen"
    max-width="360"
    content-class="tf-logout-dialog"
  >
    <div class="tf-logout-confirm">
      <h2 id="tf-logout-title" class="tf-logout-confirm__title">
        ¿Cerrar sesión?
      </h2>
      <p class="tf-logout-confirm__desc">
        Tendrás que volver a iniciar sesión para acceder a tu cuenta.
      </p>
      <div class="tf-logout-confirm__actions">
        <v-btn
          variant="outlined"
          color="default"
          class="tf-logout-confirm__cancel"
          @click="confirmOpen = false"
        >
          Cancelar
        </v-btn>
        <v-btn
          color="primary"
          @click="confirmLogout"
        >
          Cerrar sesión
        </v-btn>
      </div>
    </div>
  </v-dialog>
</template>

<style scoped>
.tf-account-trigger {
  min-width: 42px;
  height: 42px;
  padding: 0;
  border-radius: 12px;
  border: 1px solid rgba(255, 255, 255, 0.08);
  background: #13161d;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  cursor: pointer;
  flex-shrink: 0;
  transition: background 0.2s ease, border-color 0.2s ease;
}

.tf-account-trigger--with-plan {
  padding: 0 10px 0 6px;
  border-radius: 999px;
}

.tf-account-trigger:hover {
  background: #171b23;
  border-color: rgba(0, 229, 255, 0.25);
}

.tf-account-trigger:focus-visible {
  outline: 2px solid #00e5ff;
  outline-offset: 2px;
}

.tf-account-trigger__avatar {
  width: 32px;
  height: 32px;
  border-radius: 50%;
  overflow: hidden;
  display: flex;
  align-items: center;
  justify-content: center;
  background: rgba(0, 229, 255, 0.12);
  flex-shrink: 0;
}

.tf-account-trigger__img {
  width: 100%;
  height: 100%;
  object-fit: cover;
  display: block;
}

.tf-account-trigger__initials {
  font-size: 11px;
  font-weight: 700;
  letter-spacing: 0.02em;
  color: #00e5ff;
  line-height: 1;
}

.tf-account-trigger__plan {
  font-size: 11px;
  font-weight: 700;
  letter-spacing: 0.04em;
  line-height: 1;
  text-transform: uppercase;
}

.tf-account-trigger__plan--pro {
  color: #00e5ff;
}

.tf-account-trigger__plan--free {
  color: var(--tf-on-surface-muted, #a8b0bc);
}
</style>

<style>
.tf-account-menu {
  border-radius: 16px !important;
  overflow: hidden;
  box-shadow: 0 12px 40px rgba(0, 0, 0, 0.45) !important;
}

.tf-account-panel {
  width: min(280px, calc(100vw - 24px));
  background: #13161d;
  border: 1px solid rgba(255, 255, 255, 0.08);
  border-radius: 16px;
  padding: 8px;
}

.tf-account-panel__identity {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 10px 10px 12px;
}

.tf-account-panel__avatar {
  width: 40px;
  height: 40px;
  border-radius: 50%;
  overflow: hidden;
  flex-shrink: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  background: rgba(0, 229, 255, 0.12);
}

.tf-account-panel__img {
  width: 100%;
  height: 100%;
  object-fit: cover;
  display: block;
}

.tf-account-panel__initials {
  font-size: 13px;
  font-weight: 700;
  color: #00e5ff;
}

.tf-account-panel__meta {
  min-width: 0;
  flex: 1;
}

.tf-account-panel__name-row {
  display: flex;
  align-items: center;
  gap: 8px;
  min-width: 0;
}

.tf-account-panel__name {
  margin: 0;
  font-size: 14px;
  font-weight: 600;
  color: #ffffff;
  line-height: 1.3;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  min-width: 0;
}

.tf-account-panel__plan {
  flex-shrink: 0;
  font-size: 10px;
  font-weight: 700;
  letter-spacing: 0.04em;
  padding: 3px 7px;
  border-radius: 999px;
  line-height: 1;
  text-transform: uppercase;
}

.tf-account-panel__plan--pro {
  color: #0b0d12;
  background: #00e5ff;
}

.tf-account-panel__plan--free {
  color: var(--tf-on-surface-muted, #a8b0bc);
  background: rgba(255, 255, 255, 0.08);
  border: 1px solid rgba(255, 255, 255, 0.12);
}

.tf-account-panel__email {
  margin: 2px 0 0;
  font-size: 12px;
  color: var(--tf-on-surface-muted, #a8b0bc);
  line-height: 1.3;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.tf-account-panel__divider {
  height: 1px;
  margin: 4px 6px;
  background: rgba(255, 255, 255, 0.08);
}

.tf-account-panel__item {
  width: 100%;
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 10px 12px;
  border: none;
  border-radius: 10px;
  background: transparent;
  color: var(--tf-on-surface, #e8eaed);
  font-size: 14px;
  font-weight: 500;
  text-align: left;
  cursor: pointer;
  transition: background 0.15s ease;
}

.tf-account-panel__item:hover {
  background: rgba(0, 229, 255, 0.08);
}

.tf-account-panel__item:focus-visible {
  outline: 2px solid #00e5ff;
  outline-offset: -2px;
}

.tf-account-panel__item--danger {
  color: #ef9a9a;
}

.tf-account-panel__item--danger:hover {
  background: rgba(239, 83, 80, 0.1);
}

.tf-logout-dialog {
  border-radius: 16px !important;
  overflow: hidden;
}

.tf-logout-confirm {
  background: #13161d;
  border: 1px solid rgba(255, 255, 255, 0.08);
  border-radius: 16px;
  padding: 20px;
}

.tf-logout-confirm__title {
  margin: 0;
  font-size: 17px;
  font-weight: 600;
  color: #ffffff;
  line-height: 1.3;
}

.tf-logout-confirm__desc {
  margin: 8px 0 0;
  font-size: 13px;
  line-height: 1.45;
  color: var(--tf-on-surface-muted, #a8b0bc);
}

.tf-logout-confirm__actions {
  display: flex;
  justify-content: flex-end;
  gap: 8px;
  margin-top: 20px;
}
</style>
