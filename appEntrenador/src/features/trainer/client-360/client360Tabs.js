/** Canonical section keys for Client 360 (`?tab=` deep-link). */
export const CLIENT_360_TABS = [
  { value: 'resumen', label: 'Resumen', icon: 'mdi-view-dashboard-outline' },
  { value: 'programacion', label: 'Programación', icon: 'mdi-dumbbell' },
  { value: 'nutricion', label: 'Nutrición & Hábitos', icon: 'mdi-food-apple-outline' },
  { value: 'medidas', label: 'Medidas', icon: 'mdi-human-male-height' },
  { value: 'checkins', label: 'Check-ins', icon: 'mdi-clipboard-pulse-outline' },
  { value: 'graficas', label: 'Gráficas', icon: 'mdi-chart-line' },
  { value: 'chat', label: 'Chat', icon: 'mdi-message-text-outline' },
];

export const CLIENT_360_TAB_VALUES = new Set(CLIENT_360_TABS.map((t) => t.value));

export function normalizeClient360Tab(raw) {
  const value = typeof raw === 'string' ? raw.trim().toLowerCase() : '';
  return CLIENT_360_TAB_VALUES.has(value) ? value : 'resumen';
}
