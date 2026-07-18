<script setup>
/**
 * Sticky decision header for Client 360: avatar, name, objective, last session,
 * plus null-safe slots for membership (040) and consistency (042).
 */
import { computed } from 'vue';
import { resolveAvatarSrc } from '../../../shared/utils/avatar.js';

const props = defineProps({
  client: {
    type: Object,
    default: null,
  },
  profile: {
    type: Object,
    default: null,
  },
  lastSession: {
    type: Object,
    default: null,
  },
  membership: {
    type: Object,
    default: null,
  },
  consistencyScore: {
    type: [Number, Object],
    default: null,
  },
  routinesCount: {
    type: Number,
    default: 0,
  },
  sessionsCount: {
    type: Number,
    default: 0,
  },
});

defineEmits(['back']);

const displayName = computed(() => props.client?.nombre || 'Alumno');
const username = computed(() => props.client?.username || '');
const objective = computed(() => props.profile?.objetivo?.trim() || 'Sin objetivo');
const avatarSrc = computed(() => resolveAvatarSrc(props.profile?.foto_url));

const lastSessionLabel = computed(() => {
  const session = props.lastSession;
  if (!session) return 'Sin entrenamientos';
  const name = session.routine_name || 'Sesión';
  const raw = session.finished_at || session.started_at || session.created_at;
  if (!raw) return name;
  const date = new Date(raw);
  if (Number.isNaN(date.getTime())) return name;
  const formatted = date.toLocaleDateString('es-ES', {
    day: 'numeric',
    month: 'short',
  });
  return `${name} · ${formatted}`;
});

const consistencyLabel = computed(() => {
  const score = props.consistencyScore;
  if (score == null) return null;
  if (typeof score === 'number') return `Score ${score}`;
  if (typeof score === 'object') {
    const value = score.value ?? score.score;
    const streak = score.current_streak;
    if (value == null && streak == null) return null;
    if (streak != null && value != null) return `${streak}d · ${value}`;
    if (value != null) return `Score ${value}`;
    return `${streak}d`;
  }
  return null;
});

const membershipBadge = computed(() => {
  const m = props.membership;
  if (!m || !m.status) return null;

  const days = m.days_remaining == null ? null : Number(m.days_remaining);
  const status = String(m.status).toLowerCase();

  if (status === 'owing') {
    return { label: 'Pendiente', color: 'warning' };
  }
  if (status === 'expired' || (days != null && days < 0)) {
    return { label: 'Vencida', color: 'error' };
  }
  if (status === 'active') {
    if (days == null) {
      return { label: 'Al día', color: 'success' };
    }
    const n = Math.max(0, days);
    return {
      label: n === 1 ? '1 día restante' : `${n} días restantes`,
      color: 'success',
    };
  }

  return { label: m.label || m.plan_name || status, color: 'default' };
});
</script>

<template>
  <header class="c360-header">
    <div class="c360-header__row">
      <v-btn
        variant="text"
        color="#8B929E"
        class="c360-header__back px-0"
        size="small"
        prepend-icon="mdi-arrow-left"
        @click="$emit('back')"
      >
        Alumnos
      </v-btn>
    </div>

    <div class="c360-header__main">
      <v-avatar size="52" class="c360-header__avatar">
        <v-img :src="avatarSrc" alt="" cover />
      </v-avatar>

      <div class="c360-header__identity min-w-0">
        <h1 class="c360-header__name">{{ displayName }}</h1>
        <p v-if="username" class="c360-header__user">@{{ username }}</p>
        <p class="c360-header__objective">{{ objective }}</p>
      </div>

      <div class="c360-header__meta">
        <div class="c360-chip c360-chip--muted">
          <v-icon icon="mdi-history" size="14" start />
          {{ lastSessionLabel }}
        </div>
        <div class="c360-chip c360-chip--muted">
          <strong>{{ routinesCount }}</strong> rutinas
          <span class="c360-dot" aria-hidden="true">·</span>
          <strong>{{ sessionsCount }}</strong> sesiones
        </div>
        <v-chip
          v-if="membershipBadge"
          size="small"
          label
          variant="tonal"
          :color="membershipBadge.color"
          class="c360-membership-chip"
          title="Membresía"
        >
          <v-icon icon="mdi-card-account-details-outline" size="14" start />
          {{ membershipBadge.label }}
        </v-chip>
        <div
          v-else
          class="c360-chip c360-chip--slot c360-chip--empty"
          title="Sin membresía configurada"
        >
          <v-icon icon="mdi-card-account-details-outline" size="14" start />
          Membresía
        </div>
        <div
          v-if="consistencyLabel != null"
          class="c360-chip c360-chip--slot"
          title="Consistencia"
        >
          <v-icon icon="mdi-fire" size="14" start />
          {{ consistencyLabel }}
        </div>
        <div
          v-else
          class="c360-chip c360-chip--slot c360-chip--empty"
          title="Consistencia (próximamente)"
        >
          <v-icon icon="mdi-fire" size="14" start />
          Consistencia
        </div>
      </div>
    </div>
  </header>
</template>

<style scoped>
.c360-header {
  position: sticky;
  top: 0;
  z-index: 8;
  padding: 0.45rem 0 0.65rem;
  margin-bottom: 0.15rem;
  background: linear-gradient(
    180deg,
    rgba(11, 13, 18, 0.98) 0%,
    rgba(11, 13, 18, 0.92) 70%,
    rgba(11, 13, 18, 0.75) 100%
  );
  backdrop-filter: blur(8px);
  border-bottom: 1px solid rgba(255, 255, 255, 0.06);
}

.c360-header__back {
  min-height: 28px !important;
}

.c360-header__main {
  display: flex;
  flex-wrap: wrap;
  align-items: flex-start;
  gap: 0.75rem;
  margin-top: 0.2rem;
}

.c360-header__avatar {
  flex-shrink: 0;
  border: 2px solid rgba(0, 229, 255, 0.35);
}

.c360-header__identity {
  flex: 1 1 10rem;
}

.c360-header__name {
  margin: 0;
  font-size: 1.15rem;
  font-weight: 800;
  line-height: 1.2;
  letter-spacing: -0.02em;
}

.c360-header__user {
  margin: 0.1rem 0 0;
  font-size: 0.75rem;
  color: #c5cad3;
}

.c360-header__objective {
  margin: 0.25rem 0 0;
  font-size: 0.78rem;
  color: #8b929e;
  line-height: 1.35;
}

.c360-header__meta {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 0.35rem;
  flex: 1 1 100%;
}

@media (min-width: 720px) {
  .c360-header__meta {
    flex: 1 1 14rem;
    justify-content: flex-end;
  }
}

.c360-chip {
  display: inline-flex;
  align-items: center;
  gap: 0.2rem;
  padding: 0.2rem 0.5rem;
  border-radius: 999px;
  font-size: 0.7rem;
  line-height: 1.2;
  border: 1px solid rgba(255, 255, 255, 0.08);
  background: rgba(255, 255, 255, 0.04);
  color: #c5cad3;
}

.c360-chip strong {
  color: rgb(var(--v-theme-primary));
  font-weight: 700;
}

.c360-chip--empty {
  opacity: 0.55;
}

.c360-membership-chip {
  font-weight: 600;
}

.c360-dot {
  opacity: 0.45;
  margin: 0 0.1rem;
}

.min-w-0 {
  min-width: 0;
}
</style>
