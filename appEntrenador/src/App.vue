<template>
  <div id="app">
    <router-view />
  </div>
</template>

<style>
html,
body,
#app {
  height: 100%;
  margin: 0;
  padding: 0;
}

html,
body {
  /* El scroll vive en `.main-content` / paneles del shell, no en document. */
  overflow: hidden;
}

body {
  font-family: sans-serif;
}
</style>

