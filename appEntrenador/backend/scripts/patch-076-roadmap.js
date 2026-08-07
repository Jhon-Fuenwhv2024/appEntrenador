const fs = require('fs');
const p = 'c:/Users/jhonf/OneDrive/Documentos/appEntrenador/appEntrenador/spec/constitution/roadmap.md';
let c = fs.readFileSync(p, 'utf8');
if (!c.includes('076 · Modo sombra')) {
  c = c.replace(
    '51. **086 · Resiliencia en segundo plano** — Wake Lock + aviso descanso, hardening push/PWA, cola offline de sesión. Spec: `086-background-resilience`.\n',
    '51. **086 · Resiliencia en segundo plano** — Wake Lock + aviso descanso, hardening push/PWA, cola offline de sesión. Spec: `086-background-resilience`.\n52. **076 · Modo sombra** — Presencia live Redis + cues efímeros (sin historial); panel trainer + player. Spec: `076-shadow-mode-live-coach-cues`. ADR-0009.\n',
  );
  fs.writeFileSync(p, c, 'utf8');
  console.log('roadmap updated');
} else {
  console.log('roadmap already has 076');
}
