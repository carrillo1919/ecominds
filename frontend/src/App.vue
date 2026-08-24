<template>
  <div class="app">
    <h1>SRCD - Etapa 2</h1>
    <nav>
      <RouterLink to="/empresas">Empresas</RouterLink>
      <RouterLink to="/entes-reguladores">Entes</RouterLink>
      <RouterLink to="/requisitos-legales">Requisitos</RouterLink>
      <RouterLink to="/asignaciones">Asignaciones</RouterLink>
    </nav>
    <RouterView />
  </div>
</template>

<style scoped>
.app { max-width: 1100px; margin: 0 auto; padding: 16px; font-family: Arial, sans-serif; }
nav { display: flex; gap: 12px; margin-bottom: 16px; }
a { text-decoration: none; color: #2563eb; }
.router-link-active { font-weight: 700; }
</style>
