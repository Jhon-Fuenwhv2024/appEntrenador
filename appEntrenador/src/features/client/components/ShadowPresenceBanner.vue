<script setup>
/**
 * Feature 076 — icono de modo sombra en el header del player
 * (mismo tamaño/estilo que Atrás; detalle en popover).
 */
import { nextTick, onUnmounted, shallowRef } from 'vue';
import { useRouter } from 'vue-router';

const router = useRouter();
const open = shallowRef(false);
const btnEl = shallowRef(null);
const popStyle = shallowRef({});

function placePop() {
  const el = btnEl.value;
  if (!(el instanceof HTMLElement)) return;
  const rect = el.getBoundingClientRect();
  const width = Math.min(272, window.innerWidth - 24);
  let left = rect.right - width;
  left = Math.max(12, Math.min(left, window.innerWidth - width - 12));
  popStyle.value = {
    top: `${Math.round(rect.bottom + 8)}px`,
    left: `${Math.round(left)}px`,
    width: `${width}px`,
    right: 'auto',
  };
}

function toggle() {
  open.value = !open.value;
  if (open.value) {
    placePop();
    nextTick(() => {
      document.addEventListener('pointerdown', onDocPointer, true);
      document.addEventListener('keydown', onKeydown, true);
      window.addEventListener('resize', placePop);
      window.addEventListener('scroll', placePop, true);
    });
  } else {
    detachDocListeners();
  }
}

function close() {
  open.value = false;
  detachDocListeners();
}

function detachDocListeners() {
  document.removeEventListener('pointerdown', onDocPointer, true);
  document.removeEventListener('keydown', onKeydown, true);
  window.removeEventListener('resize', placePop);
  window.removeEventListener('scroll', placePop, true);
}

function onDocPointer(event) {
  const target = event.target;
  if (!(target instanceof Node)) return;
  if (btnEl.value?.contains(target)) return;
  const panel = document.getElementById('tf-shadow-presence-pop');
  if (panel?.contains(target)) return;
  close();
}

function onKeydown(event) {
  if (event.key === 'Escape') close();
}

function goPrivacy() {
  close();
  router.push('/client/profile');
}

onUnmounted(() => {
  detachDocListeners();
});
</script>

<template>
  <div class="shadow-presence-wrap">
    <button
      ref="btnEl"
      type="button"
      class="shadow-presence-btn"
      :aria-expanded="open"
      aria-haspopup="dialog"
      aria-controls="tf-shadow-presence-pop"
      aria-label="Coach en vivo. Abrir detalles de privacidad"
      @click="toggle"
    >
      <v-icon icon="mdi-account-eye-outline" size="22" aria-hidden="true" />
      <span class="shadow-presence-btn__live" aria-hidden="true" />
    </button>

    <Teleport to="body">
      <div
        v-if="open"
        id="tf-shadow-presence-pop"
        class="shadow-presence-pop"
        role="dialog"
        aria-label="Modo sombra"
        :style="popStyle"
      >
        <p class="shadow-presence-pop__kicker">
          <span class="shadow-presence-pop__dot" aria-hidden="true" />
          Coach en vivo
        </p>
        <p class="shadow-presence-pop__text">
          Tu entrenador puede ver el ejercicio y la fase de esta sesión.
        </p>
        <button
          type="button"
          class="shadow-presence-pop__cta"
          @click="goPrivacy"
        >
          Ajustar privacidad
        </button>
      </div>
    </Teleport>
  </div>
</template>

<style scoped>
.shadow-presence-wrap {
  position: relative;
  flex-shrink: 0;
}

.shadow-presence-btn {
  position: relative;
  width: 44px;
  height: 44px;
  border-radius: 14px;
  border: 1px solid rgba(255, 255, 255, 0.08);
  background: rgba(255, 255, 255, 0.04);
  color: #fff;
  display: grid;
  place-items: center;
  cursor: pointer;
  padding: 0;
}

.shadow-presence-btn:hover {
  background: rgba(255, 255, 255, 0.07);
}

.shadow-presence-btn:focus-visible {
  outline: 2px solid #00e5ff;
  outline-offset: 2px;
}

.shadow-presence-btn__live {
  position: absolute;
  top: 9px;
  right: 9px;
  width: 7px;
  height: 7px;
  border-radius: 50%;
  background: #00e5ff;
  border: 1.5px solid #0b0d12;
}

.shadow-presence-pop {
  position: fixed;
  z-index: 80;
  padding: 0.9rem 0.95rem;
  border-radius: 0.85rem;
  border: 1px solid rgba(255, 255, 255, 0.1);
  background: #13161d;
  box-shadow: 0 14px 40px rgba(0, 0, 0, 0.5);
  box-sizing: border-box;
}

.shadow-presence-pop__kicker {
  display: flex;
  align-items: center;
  gap: 0.45rem;
  margin: 0 0 0.35rem;
  font-size: 0.8125rem;
  font-weight: 700;
  color: #e8eaed;
}

.shadow-presence-pop__dot {
  width: 0.45rem;
  height: 0.45rem;
  border-radius: 50%;
  background: #00e5ff;
  flex-shrink: 0;
}

.shadow-presence-pop__text {
  margin: 0 0 0.85rem;
  font-size: 0.8125rem;
  line-height: 1.4;
  color: var(--tf-on-surface-muted, #a8b0bc);
}

.shadow-presence-pop__cta {
  width: 100%;
  min-height: 2.5rem;
  border-radius: 0.65rem;
  border: none;
  background: #00e5ff;
  color: #0b0d12;
  font-size: 0.8125rem;
  font-weight: 700;
  cursor: pointer;
}

.shadow-presence-pop__cta:focus-visible {
  outline: 2px solid #00e5ff;
  outline-offset: 2px;
}
</style>
