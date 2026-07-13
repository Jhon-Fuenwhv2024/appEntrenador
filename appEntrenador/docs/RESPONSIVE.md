- [ ] `[FEAT-009]` **Optimización Responsive (Mobile-Friendly)**
  **Descripción:** Garantizar que todas las vistas actuales (Login, Dashboards) se visualicen correctamente en dispositivos móviles (celulares y tablets) sin alterar ni romper la experiencia actual de escritorio.
  **Requisitos Técnicos (Agente):**
  - **Framework:** Utilizar estrictamente el sistema de Grid de Vuetify.
  - **Restricción:** Cero refactorización lógica. No modificar el `<script setup>` ni borrar componentes existentes. Solo ajustar el `<template>` y los estilos para que la UI se adapte al ancho de la pantalla.