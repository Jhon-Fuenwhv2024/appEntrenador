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
  return 'Gratis';
});

const headline = computed(() => {
  if (isExpired.value) return 'PRO vencido';
  if (effectiveLabel.value === 'PRO') return 'Plan PRO';
  return 'Plan FREE';
});

const bodyText = computed(() => {
  if (isExpired.value) {
    return 'Puedes seguir entrando y chateando con todos tus alumnos, pero solo editas los 3 primeros. Renueva con soporte para recuperar acceso completo.';
  }
  if (effectiveLabel.value === 'PRO') {
    return 'Alumnos ilimitados y edición completa de tu roster.';
  }
  return 'Hasta 3 alumnos editables. Si tienes más, el resto queda en solo lectura hasta pasar a PRO.';
});
</script>

<template>
  <section
    v-if="account"
    class="saas-plan"
    :class="`saas-plan--${statusTone}`"
    aria-labelledby="saas-plan-title"
  >
    <div class="saas-plan__top">
      <div>
        <p class="saas-plan__eyebrow">Suscripción Trainfit</p>
        <p id="saas-plan-title" class="saas-plan__headline">
          <strong>{{ headline }}</strong>
        </p>
      </div>
      <span
        class="saas-plan__badge"
        :class="`saas-plan__badge--${statusTone}`"
      >
        {{ statusText }}
      </span>
    </div>

    <dl class="saas-plan__meta">
      <div>
        <dt>Contratado</dt>
        <dd>{{ planLabel }}</dd>
      </div>
      <div>
        <dt>Efectivo</dt>
        <dd>{{ effectiveLabel }}</dd>
      </div>
      <div>
        <dt>Vence</dt>
        <dd :class="{ 'saas-plan__dd--danger': isExpired }">
          {{ expirationLabel }}
        </dd>
      </div>
      <div>
        <dt>Alumnos</dt>
        <dd>{{ effectiveLabel === 'PRO' ? 'Ilimitados' : '3 editables' }}</dd>
      </div>
    </dl>

    <p class="saas-plan__body">
      {{ bodyText }}
    </p>

    <p
      v-if="isExpired || effectiveLabel === 'FREE'"
      class="saas-plan__note"
    >
      Para renovar o subir a PRO, contacta soporte.
    </p>
  </section>
</template>

<style scoped>
.saas-plan {
  padding: 1.05rem 1.1rem 1rem;
  border-radius: 16px;
  border: 1px solid rgba(255, 255, 255, 0.08);
  background:
    linear-gradient(180deg, rgba(255, 255, 255, 0.03) 0%, rgba(255, 255, 255, 0.01) 100%),
    #151820;
}

.saas-plan--warn,
.saas-plan--danger {
  border-color: rgba(255, 92, 92, 0.28);
}

.saas-plan__top {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 0.75rem;
}

.saas-plan__eyebrow {
  margin: 0;
  font-size: 0.6875rem;
  font-weight: 700;
  letter-spacing: 0.08em;
  text-transform: uppercase;
  color: var(--tf-on-surface-muted, #a8b0bc);
}

.saas-plan__headline {
  margin: 0.35rem 0 0;
  font-size: 0.95rem;
  color: var(--tf-on-surface-muted, #a8b0bc);
  line-height: 1.25;
}

.saas-plan__headline strong {
  color: var(--tf-on-surface, #ffffff);
  font-weight: 700;
  font-size: 1.35rem;
  letter-spacing: -0.02em;
}

.saas-plan__badge {
  flex-shrink: 0;
  padding: 0.28rem 0.6rem;
  border-radius: 999px;
  font-size: 0.625rem;
  font-weight: 700;
  letter-spacing: 0.04em;
  text-transform: uppercase;
}

.saas-plan__badge--ok {
  color: var(--tf-on-primary, #0b0d12);
  background: var(--tf-primary, #00e5ff);
}

.saas-plan__badge--danger {
  color: #fff;
  background: #e53935;
}

.saas-plan__badge--muted {
  color: #c5cad3;
  background: rgba(255, 255, 255, 0.08);
}

.saas-plan__meta {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 0.75rem 1rem;
  margin: 0.9rem 0 0;
  padding: 0.85rem 0 0;
  border-top: 1px solid rgba(255, 255, 255, 0.06);
}

.saas-plan__meta dt {
  margin: 0;
  font-size: 0.625rem;
  font-weight: 700;
  letter-spacing: 0.06em;
  text-transform: uppercase;
  color: var(--tf-on-surface-muted, #a8b0bc);
}

.saas-plan__meta dd {
  margin: 0.2rem 0 0;
  font-size: 0.875rem;
  font-weight: 600;
  color: var(--tf-on-surface, #e8eaed);
  line-height: 1.25;
}

.saas-plan__dd--danger {
  color: #ff8a80 !important;
}

.saas-plan__body {
  margin: 0.85rem 0 0;
  font-size: 0.8125rem;
  line-height: 1.45;
  color: var(--tf-on-surface-muted, #a8b0bc);
}

.saas-plan__note {
  margin: 0.75rem 0 0;
  padding: 0.65rem 0.75rem;
  border-radius: 10px;
  font-size: 0.75rem;
  line-height: 1.4;
  font-weight: 600;
  color: var(--tf-on-surface, #e8ecf1);
  background: rgba(255, 176, 32, 0.08);
  border: 1px solid rgba(255, 176, 32, 0.18);
}

@media (max-width: 420px) {
  .saas-plan__meta {
    grid-template-columns: 1fr;
  }
}
</style>
