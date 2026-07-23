<script setup>
/**
 * Sección Ajustes: estado del plan SaaS del trainer (Feature 065).
 * Detalle de vencimiento, plan efectivo y cupo de 3 alumnos editables.
 */
import { computed } from 'vue';
import {
  resolveEffectiveSaasPlan,
  toDateOnlyString,
} from '../../../shared/saas/effectivePlan.js';

const props = defineProps({
  account: {
    type: Object,
    default: null,
  },
});

const resolved = computed(() => resolveEffectiveSaasPlan(
  props.account?.saas_plan,
  props.account?.saas_expiration_date,
));

const planLabel = computed(() => resolved.value.saas_plan || 'FREE');
const effectiveLabel = computed(() => resolved.value.effective_plan || 'FREE');
const isExpired = computed(() => (
  props.account?.is_expired === true || resolved.value.is_expired === true
));

const expirationLabel = computed(() => {
  const raw = toDateOnlyString(
    props.account?.saas_expiration_date ?? resolved.value.saas_expiration_date,
  );
  if (!raw) return 'Sin fecha de vencimiento';
  const [y, m, d] = raw.split('-').map(Number);
  if (!y || !m || !d) return raw;
  try {
    return new Date(y, m - 1, d).toLocaleDateString('es-ES', {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    });
  } catch {
    return raw;
  }
});

const statusTone = computed(() => {
  if (isExpired.value) return 'danger';
  if (effectiveLabel.value === 'PRO') return 'ok';
  return 'muted';
});

const statusText = computed(() => {
  if (isExpired.value) return 'Vencido';
  if (effectiveLabel.value === 'PRO') return 'Activo';
  return 'Plan gratuito';
});

const bodyText = computed(() => {
  if (isExpired.value) {
    return 'Tu PRO ya no está activo. Puedes seguir entrando y chateando con todos tus alumnos, pero solo editas los 3 primeros (por orden de alta). Renueva con soporte para recuperar acceso completo.';
  }
  if (effectiveLabel.value === 'PRO') {
    return 'Tienes beneficios PRO: alumnos ilimitados y edición completa de tu roster.';
  }
  return 'En FREE puedes gestionar hasta 3 alumnos editables. Si tienes más, el resto queda en solo lectura hasta que pases a PRO.';
});
</script>

<template>
  <section
    v-if="account"
    class="saas-plan-card"
    aria-labelledby="saas-plan-title"
  >
    <header class="saas-plan-card__head">
      <div class="saas-plan-card__titles">
        <p class="saas-plan-card__eyebrow">Suscripción</p>
        <h2 id="saas-plan-title" class="saas-plan-card__title">
          Plan Trainfit
        </h2>
      </div>
      <span
        class="saas-plan-card__status"
        :class="`saas-plan-card__status--${statusTone}`"
      >
        <span class="saas-plan-card__status-dot" aria-hidden="true" />
        {{ statusText }}
      </span>
    </header>

    <dl class="saas-plan-card__facts">
      <div class="saas-plan-card__fact">
        <dt>Plan contratado</dt>
        <dd>{{ planLabel }}</dd>
      </div>
      <div class="saas-plan-card__fact">
        <dt>Plan efectivo</dt>
        <dd>{{ effectiveLabel }}</dd>
      </div>
      <div class="saas-plan-card__fact">
        <dt>Vencimiento</dt>
        <dd :class="{ 'saas-plan-card__dd--danger': isExpired }">
          {{ expirationLabel }}
        </dd>
      </div>
      <div class="saas-plan-card__fact">
        <dt>Alumnos editables</dt>
        <dd>{{ effectiveLabel === 'PRO' ? 'Ilimitados' : '3 (cupo FREE)' }}</dd>
      </div>
    </dl>

    <p class="saas-plan-card__body">
      {{ bodyText }}
    </p>

    <p
      v-if="isExpired || effectiveLabel === 'FREE'"
      class="saas-plan-card__support"
    >
      Para renovar o subir a PRO, contacta soporte.
    </p>
  </section>
</template>

<style scoped>
.saas-plan-card {
  background: #13161d;
  border: 1px solid rgba(255, 255, 255, 0.06);
  border-radius: 16px;
  padding: 1rem 1.1rem 1.15rem;
}

.saas-plan-card__head {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 0.75rem;
  margin-bottom: 0.9rem;
}

.saas-plan-card__eyebrow {
  margin: 0 0 0.15rem;
  font-size: 0.68rem;
  font-weight: 600;
  letter-spacing: 0.06em;
  text-transform: uppercase;
  color: var(--tf-on-surface-muted, #a8b0bc);
}

.saas-plan-card__title {
  margin: 0;
  font-size: 1.05rem;
  font-weight: 700;
  color: var(--tf-on-surface, #e8eaed);
}

.saas-plan-card__status {
  display: inline-flex;
  align-items: center;
  gap: 0.35rem;
  flex-shrink: 0;
  margin-top: 0.15rem;
  font-size: 0.72rem;
  font-weight: 700;
  letter-spacing: 0.02em;
}

.saas-plan-card__status-dot {
  width: 6px;
  height: 6px;
  border-radius: 50%;
}

.saas-plan-card__status--ok {
  color: #7dffa8;
}

.saas-plan-card__status--ok .saas-plan-card__status-dot {
  background: #00e5a0;
  box-shadow: 0 0 8px rgba(0, 229, 160, 0.45);
}

.saas-plan-card__status--danger {
  color: #ff8a80;
}

.saas-plan-card__status--danger .saas-plan-card__status-dot {
  background: #ff5c5c;
  box-shadow: 0 0 8px rgba(255, 92, 92, 0.45);
}

.saas-plan-card__status--muted {
  color: var(--tf-on-surface-muted, #a8b0bc);
}

.saas-plan-card__status--muted .saas-plan-card__status-dot {
  background: #a8b0bc;
}

.saas-plan-card__facts {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 0.65rem 0.85rem;
  margin: 0 0 0.85rem;
}

.saas-plan-card__fact {
  min-width: 0;
}

.saas-plan-card__fact dt {
  margin: 0 0 0.12rem;
  font-size: 0.68rem;
  font-weight: 600;
  letter-spacing: 0.03em;
  text-transform: uppercase;
  color: var(--tf-on-surface-muted, #a8b0bc);
}

.saas-plan-card__fact dd {
  margin: 0;
  font-size: 0.88rem;
  font-weight: 600;
  color: var(--tf-on-surface, #e8eaed);
}

.saas-plan-card__dd--danger {
  color: #ff8a80;
}

.saas-plan-card__body,
.saas-plan-card__support {
  margin: 0;
  font-size: 0.8rem;
  line-height: 1.45;
  color: var(--tf-on-surface-muted, #a8b0bc);
}

.saas-plan-card__support {
  margin-top: 0.55rem;
  font-weight: 600;
  color: var(--tf-on-surface, #e8eaed);
}

@media (max-width: 420px) {
  .saas-plan-card__facts {
    grid-template-columns: 1fr;
  }
}
</style>
