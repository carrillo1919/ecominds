<template>
  <section class="card card-narrow">
    <h1>Pagina no encontrada</h1>
    <p class="muted">La direccion solicitada no existe en el sistema.</p>
    <router-link :to="{ name: 'dashboard' }">Volver al inicio</router-link>
  </section>
</template>
