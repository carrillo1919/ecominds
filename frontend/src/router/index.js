import { createRouter, createWebHistory } from 'vue-router';
import EmpresasView from '../views/EmpresasView.vue';
import EntesReguladoresView from '../views/EntesReguladoresView.vue';
import RequisitosLegalesView from '../views/RequisitosLegalesView.vue';
import AsignacionesView from '../views/AsignacionesView.vue';

const routes = [
  { path: '/', redirect: '/empresas' },
  { path: '/empresas', component: EmpresasView },
  { path: '/entes-reguladores', component: EntesReguladoresView },
  { path: '/requisitos-legales', component: RequisitosLegalesView },
  { path: '/asignaciones', component: AsignacionesView }
];

export default createRouter({
  history: createWebHistory(),
  routes
});
