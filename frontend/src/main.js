import { createApp } from 'vue';
import { createPinia } from 'pinia';
import Toast from 'vue-toastification';
import 'vue-toastification/dist/index.css';

import App from './App.vue';
import router from './router';
import './assets/main.css';
import { useAuthStore } from './stores/auth';

const app = createApp(App);

app.use(createPinia());
app.use(router);
app.use(Toast, { position: 'top-right', timeout: 4000 });

// Restaura la sesion guardada antes de montar la aplicacion.
useAuthStore().restore();

app.mount('#app');
