# 046 · Deploy producción (Netlify FE + API + env)

**Estado:** pendiente (SDD)
**Depende de:** 045 recomendada; stack Netlify del proyecto
**Prioridad backlog:** ver `spec/constitution/roadmap.md` (043–052)

## Qué hace

Sin deploy estable no hay go-to-market; checklist env + netlify.toml sólido.

## Criterios de aceptación

### Base de datos / infraestructura

- [ ] Checklist migraciones en prod / ensure-on-boot verificado

### Backend

- [ ] Documentar hosting API (Railway/Render/VPS) + env vars obligatorias
- [ ] CORS y JWT_SECRET de producción
- [ ] Healthcheck GET /api/health si falta

### UI

- [ ] netlify.toml: build, redirects SPA, headers básicos
- [ ] VITE_API_URL / variables Netlify documentadas
- [ ] Checklist deploy en docs/

## Fuera de alcance

- Multi-región
- Blue/green avanzado
