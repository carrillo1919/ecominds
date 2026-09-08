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

// La sesion se restaura en AppLayout para intentar refresh si no hay usuario en memoria.

app.mount('#app');
