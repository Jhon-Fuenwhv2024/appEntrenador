<script setup>
/**
 * Panel de gestión de invitaciones del trainer (Feature 023).
 * Orquesta create/list/revoke/copy; notifica al padre vía emit('notify').
 */
import { computed, onMounted, ref, shallowRef } from 'vue';
import { useDisplay } from 'vuetify';
import { getApiErrorMessage, isPaymentRequiredError } from '../../../shared/api/http.js';
import { createInvite, listInvites, revokeInvite } from '../api/invitationsApi.js';

const PAYWALL_MESSAGE =
  'Has alcanzado el límite de 3 alumnos de tu plan gratuito. Contacta al soporte para actualizar a PRO y seguir creciendo.';

const emit = defineEmits(['notify']);

const { smAndUp } = useDisplay();

const loading = shallowRef(true);
const creating = shallowRef(false);
const revokingId = shallowRef(null);
const invites = ref([]);
const lastCreatedLink = shallowRef('');
const paywallOpen = shallowRef(false);
const paywallMessage = shallowRef(PAYWALL_MESSAGE);

const STATUS_META = {
  pending: { label: 'Pendiente', color: 'warning' },
  used: { label: 'Usada', color: 'grey' },
  revoked: { label: 'Revocada', color: 'error' },
};

const hasInvites = computed(() => invites.value.length > 0);

const formatDate = (value) => {
  if (!value) return '—';
  try {
    return new Date(value).toLocaleString('es-ES', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  } catch {
    return String(value);
  }
};

const buildLink = (invite) => {
  if (!invite?.token) return invite?.link_invitacion || '';
  return `${window.location.origin}/registro?token=${invite.token}`;
};

const statusMeta = (status) => STATUS_META[status] || { label: status || '—', color: 'grey' };

const notify = (text, color = 'success') => {
  emit('notify', { text, color });
};

const copyText = async (text) => {
  if (!text) return false;
  try {
    await navigator.clipboard.writeText(text);
    return true;
  } catch (error) {
    console.error('No se pudo copiar el enlace:', error);
    return false;
  }
};

const loadInvites = async () => {
  try {
    loading.value = true;
    const response = await listInvites();
    const data = response.data?.data;
    invites.value = Array.isArray(data) ? data : [];
  } catch (error) {
    console.error('Error al listar invitaciones:', error);
    invites.value = [];
    notify(getApiErrorMessage(error, 'No se pudieron cargar las invitaciones'), 'error');
  } finally {
    loading.value = false;
  }
};

const handleCreate = async () => {
  try {
    creating.value = true;
    const response = await createInvite();
    const payload = response.data?.data || response.data || {};
    const link = buildLink(payload) || payload.link_invitacion || '';
    lastCreatedLink.value = link;

    await loadInvites();

    const copied = await copyText(link);
    notify(
      copied
        ? 'Enlace generado y copiado al portapapeles'
        : 'Enlace generado. Usa Copiar si hace falta',
      copied ? 'success' : 'info',
    );
  } catch (error) {
    console.error('Error al generar invitación:', error);
    if (isPaymentRequiredError(error)) {
      paywallMessage.value = error?.response?.data?.message || PAYWALL_MESSAGE;
      paywallOpen.value = true;
      return;
    }
    notify(getApiErrorMessage(error, 'Error al generar invitación'), 'error');
  } finally {
    creating.value = false;
  }
};

const handleCopy = async (invite) => {
  const link = buildLink(invite);
  const copied = await copyText(link);
  notify(
    copied ? 'Enlace copiado' : 'No se pudo copiar el enlace',
    copied ? 'success' : 'error',
  );
};

const handleRevoke = async (invite) => {
  if (!invite?.id || invite.status !== 'pending') return;

  const ok = window.confirm(
    '¿Revocar esta invitación? El enlace dejará de funcionar.',
  );
  if (!ok) return;

  try {
    revokingId.value = invite.id;
    await revokeInvite(invite.id);
    await loadInvites();
    notify('Invitación revocada', 'success');
  } catch (error) {
    console.error('Error al revocar invitación:', error);
    notify(getApiErrorMessage(error, 'Error al revocar'), 'error');
  } finally {
    revokingId.value = null;
  }
};

onMounted(() => {
  loadInvites();
});
</script>

<template>
  <div class="invites-manager">
    <header class="invites-manager__header">
      <div>
        <h2 class="invites-manager__title">Invitaciones</h2>
        <p class="invites-manager__subtitle text-medium-emphasis">
          Genera enlaces y gestiona su estado. Compártelos copiándolos.
        </p>
      </div>

      <v-btn
        color="primary"
        :loading="creating"
        :disabled="loading"
        prepend-icon="mdi-link-variant"
        class="invites-manager__cta"
        @click="handleCreate"
      >
        Generar nuevo enlace de invitación
      </v-btn>
    </header>

    <div
      v-if="lastCreatedLink"
      class="invites-manager__latest"
      role="status"
      aria-live="polite"
    >
      <div class="invites-manager__latest-label">Último enlace generado</div>
      <div class="invites-manager__latest-row">
        <span class="invites-manager__latest-text" :title="lastCreatedLink">
          {{ lastCreatedLink }}
        </span>
        <v-btn
          size="small"
          variant="outlined"
          color="primary"
          prepend-icon="mdi-content-copy"
          @click="copyText(lastCreatedLink).then((ok) => notify(ok ? 'Enlace copiado' : 'No se pudo copiar', ok ? 'success' : 'error'))"
        >
          Copiar
        </v-btn>
      </div>
    </div>

    <div v-if="loading" class="invites-manager__loading d-flex justify-center py-8">
      <v-progress-circular indeterminate color="primary" size="36" />
    </div>

    <p
      v-else-if="!hasInvites"
      class="invites-manager__empty text-medium-emphasis"
    >
      Aún no hay invitaciones. Genera un enlace para invitar a un alumno.
    </p>

    <!-- Mobile: cards -->
    <div v-else-if="!smAndUp" class="invites-manager__cards">
      <v-card
        v-for="invite in invites"
        :key="invite.id"
        variant="outlined"
        class="invites-manager__card"
      >
        <v-card-text class="pa-3">
          <div class="d-flex align-center justify-space-between mb-2">
            <v-chip
              size="small"
              :color="statusMeta(invite.status).color"
              variant="tonal"
            >
              {{ statusMeta(invite.status).label }}
            </v-chip>
            <span class="text-caption text-medium-emphasis">
              {{ formatDate(invite.fecha_creacion) }}
            </span>
          </div>
          <div class="invites-manager__token text-caption mb-3" :title="invite.token">
            {{ invite.token }}
          </div>
          <div v-if="invite.status === 'pending'" class="d-flex flex-wrap ga-2">
            <v-btn
              size="small"
              variant="outlined"
              color="primary"
              prepend-icon="mdi-content-copy"
              @click="handleCopy(invite)"
            >
              Copiar enlace
            </v-btn>
            <v-btn
              size="small"
              variant="text"
              color="error"
              prepend-icon="mdi-cancel"
              :loading="revokingId === invite.id"
              @click="handleRevoke(invite)"
            >
              Revocar
            </v-btn>
          </div>
        </v-card-text>
      </v-card>
    </div>

    <!-- Desktop: compact table -->
    <div v-else class="invites-manager__table-wrap">
      <v-table density="compact" class="invites-manager__table">
        <thead>
          <tr>
            <th>Estado</th>
            <th>Fecha</th>
            <th>Token</th>
            <th class="text-end">Acciones</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="invite in invites" :key="invite.id">
            <td>
              <v-chip
                size="small"
                :color="statusMeta(invite.status).color"
                variant="tonal"
              >
                {{ statusMeta(invite.status).label }}
              </v-chip>
            </td>
            <td class="text-no-wrap">{{ formatDate(invite.fecha_creacion) }}</td>
            <td>
              <span class="invites-manager__token" :title="invite.token">
                {{ invite.token }}
              </span>
            </td>
            <td class="text-end">
              <template v-if="invite.status === 'pending'">
                <v-btn
                  size="small"
                  variant="text"
                  color="primary"
                  icon="mdi-content-copy"
                  title="Copiar enlace"
                  aria-label="Copiar enlace"
                  @click="handleCopy(invite)"
                />
                <v-btn
                  size="small"
                  variant="text"
                  color="error"
                  icon="mdi-cancel"
                  title="Revocar"
                  aria-label="Revocar"
                  :loading="revokingId === invite.id"
                  @click="handleRevoke(invite)"
                />
              </template>
              <span v-else class="text-caption text-medium-emphasis">—</span>
            </td>
          </tr>
        </tbody>
      </v-table>
    </div>

    <v-dialog v-model="paywallOpen" max-width="440">
      <v-card color="surface">
        <v-card-title class="text-h6 d-flex align-center ga-2">
          <v-icon icon="mdi-lock-outline" color="warning" />
          Límite del plan
        </v-card-title>
        <v-card-text>
          {{ paywallMessage }}
        </v-card-text>
        <v-card-actions class="pa-4 pt-0">
          <v-spacer />
          <v-btn color="primary" @click="paywallOpen = false">
            Entendido
          </v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>
  </div>
</template>

<style scoped>
.invites-manager {
  display: flex;
  flex-direction: column;
  gap: 16px;
  min-height: 0;
}

.invites-manager__header {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.invites-manager__title {
  margin: 0;
  font-size: 1.25rem;
  font-weight: 600;
  line-height: 1.3;
}

.invites-manager__subtitle {
  margin: 4px 0 0;
  font-size: 0.875rem;
}

.invites-manager__cta {
  align-self: stretch;
}

.invites-manager__latest {
  padding: 12px;
  border-radius: 8px;
  background: rgba(0, 229, 255, 0.08);
  border: 1px solid rgba(0, 229, 255, 0.25);
}

.invites-manager__latest-label {
  font-size: 0.75rem;
  font-weight: 600;
  margin-bottom: 6px;
  color: rgba(255, 255, 255, 0.7);
}

.invites-manager__latest-row {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.invites-manager__latest-text {
  font-size: 0.8rem;
  word-break: break-all;
  line-height: 1.4;
}

.invites-manager__empty {
  margin: 0;
  padding: 24px 8px;
  text-align: center;
}

.invites-manager__cards {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.invites-manager__card {
  background: transparent;
}

.invites-manager__token {
  font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace;
  font-size: 0.75rem;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  max-width: 100%;
  display: inline-block;
}

.invites-manager__table-wrap {
  overflow-x: auto;
  -webkit-overflow-scrolling: touch;
}

.invites-manager__table {
  width: 100%;
}

@media (min-width: 600px) {
  .invites-manager__header {
    flex-direction: row;
    align-items: flex-start;
    justify-content: space-between;
  }

  .invites-manager__cta {
    align-self: flex-start;
    flex-shrink: 0;
  }

  .invites-manager__latest-row {
    flex-direction: row;
    align-items: center;
    justify-content: space-between;
  }

  .invites-manager__latest-text {
    flex: 1;
    min-width: 0;
    margin-right: 12px;
  }
}
</style>
