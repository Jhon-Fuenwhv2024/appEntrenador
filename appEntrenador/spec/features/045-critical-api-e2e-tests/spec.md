# 045 · Suite tests API/E2E críticos

**Estado:** pendiente (SDD)
**Depende de:** 003, 004, 012, 040
**Prioridad backlog:** ver `spec/constitution/roadmap.md` (043–052)

## Qué hace

Tech-stack admite ausencia de tests; bloquear regresiones en login, ownership, sesión y soft-lock.

## Criterios de aceptación

### Base de datos / infraestructura

- [ ] DB de test o contenedor MySQL efímero documentado

### Backend

- [ ] Suite API (Jest/Vitest/supertest): login, register invite, ownership 404/403, POST workout-sessions, MEMBERSHIP_BLOCKED
- [ ] Scripts npm test / test:api
- [ ] CI opcional (GitHub Actions) si el repo ya tiene pipeline

### UI

- [ ] E2E mínimo (Playwright/Cypress): login trainer + login client + guardar sesión (smoke)

## Fuera de alcance

- Cobertura 100%
- Visual regression completa
