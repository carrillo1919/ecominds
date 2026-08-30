<script setup>
import { onMounted, reactive, ref, computed } from 'vue';
import { useToast } from 'vue-toastification';
import { useDocumentosStore } from '@/stores/documentos';
import { useEmpleadosStore } from '@/stores/empleados';
import { useAuthorization } from '@/composables/useAuthorization';
import EstadoDocumentoBadge from '@/components/EstadoDocumentoBadge.vue';

const toast = useToast();
const docStore = useDocumentosStore();
const empStore = useEmpleadosStore();
const { isAdmin, isAuditor, isResponsable } = useAuthorization();

const canEdit = computed(() => isAdmin.value || isAuditor.value || isResponsable.value);

const mostrarForm = ref(false);
const editandoId = ref(null);
const guardando = ref(false);
const filtroEstado = ref('');

const form = reactive({
  titulo: '',
  descripcion: '',
  fechaDocumento: '',
  fechaVencimiento: '',
  responsableId: '',
});

const limpiar = () => {
  editandoId.value = null;
  mostrarForm.value = false;
  Object.keys(form).forEach((k) => { form[k] = ''; });
};

const editar = (doc) => {
  editandoId.value = doc.id;
  mostrarForm.value = true;
  form.titulo = doc.titulo || '';
  form.descripcion = doc.descripcion || '';
  form.fechaDocumento = doc.fechaDocumento || '';
  form.fechaVencimiento = doc.fechaVencimiento || '';
  form.responsableId = doc.responsableId || '';
};

const guardar = async () => {
  if (!form.titulo.trim() || !form.fechaVencimiento) {
    toast.error('Título y fecha de vencimiento son obligatorios');
    return;
  }
  guardando.value = true;
  const payload = { ...form, responsableId: form.responsableId || null };
  let result;
  if (editandoId.value) {
    result = await docStore.update(editandoId.value, payload);
  } else {
    result = await docStore.create(payload);
  }
  guardando.value = false;
  if (result.ok) {
    toast.success(result.message);
    limpiar();
    await docStore.fetchAll();
  } else {
    toast.error(result.message);
  }
};

const archivar = async (doc) => {
  if (!confirm(`¿Archivar el documento "${doc.titulo}"?`)) return;
  const result = await docStore.archivar(doc.id);
  if (result.ok) toast.success(result.message);
  else toast.error(result.message);
};

const documentosFiltrados = computed(() => {
  if (!filtroEstado.value) return docStore.documentos;
  return docStore.documentos.filter((d) => d.estadoEfectivo === filtroEstado.value);
});

const fechaCorta = (f) => f ? new Date(f + 'T00:00:00').toLocaleDateString('es-VE') : '-';

onMounted(async () => {
  await docStore.fetchAll();
  await empStore.fetchActivos();
});
</script>

<template>
  <section>
    <div class="section-header">
      <div>
        <h1>Documentos</h1>
        <p class="muted">Documentos asignados a su empresa.</p>
      </div>
      <button v-if="canEdit && !mostrarForm" class="btn-primary" type="button" @click="mostrarForm = true">
        + Nuevo documento
      </button>
    </div>

    <div v-if="mostrarForm && canEdit" class="card">
      <h2>{{ editandoId ? 'Editar documento' : 'Registrar documento' }}</h2>
      <div class="form-grid">
        <label>Título *<input v-model="form.titulo" type="text" /></label>
        <label>
          Responsable
          <select v-model="form.responsableId">
            <option value="">— Sin responsable —</option>
            <option v-for="emp in empStore.empleadosActivos" :key="emp.id" :value="emp.id">
              {{ emp.apellido }}, {{ emp.nombre }}
            </option>
          </select>
        </label>
        <label>Fecha del documento<input v-model="form.fechaDocumento" type="date" /></label>
        <label>Fecha de vencimiento *<input v-model="form.fechaVencimiento" type="date" /></label>
        <label style="grid-column: 1 / -1">
          Descripción
          <textarea v-model="form.descripcion" rows="3"></textarea>
        </label>
      </div>
      <div class="actions-row">
        <button class="btn-primary" type="button" :disabled="guardando" @click="guardar">
          {{ guardando ? 'Guardando...' : editandoId ? 'Guardar cambios' : 'Registrar' }}
        </button>
        <button class="btn-ghost" type="button" @click="limpiar">Cancelar</button>
      </div>
    </div>

    <div class="card">
      <div class="filter-bar">
        <label>
          Filtrar por estado:
          <select v-model="filtroEstado">
            <option value="">Todos</option>
            <option value="vigente">Vigente</option>
            <option value="vencido">Vencido</option>
            <option value="archivado">Archivado</option>
          </select>
        </label>
      </div>

      <div v-if="docStore.error" class="alert alert-error">{{ docStore.error }}</div>
      <p v-if="docStore.loading" class="muted">Cargando documentos...</p>

      <div v-else class="table-scroll">
        <table class="data">
          <thead>
            <tr>
              <th>Título</th>
              <th>Responsable</th>
              <th>Fecha doc.</th>
              <th>Vencimiento</th>
              <th>Subido</th>
              <th>Estado</th>
              <th v-if="canEdit"></th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="doc in documentosFiltrados" :key="doc.id">
              <td>
                <router-link :to="{ name: 'documento-detalle', params: { id: doc.id } }">
                  <strong>{{ doc.titulo }}</strong>
                </router-link>
                <span v-if="doc.descripcion" class="muted"><br />{{ doc.descripcion.slice(0, 60) }}{{ doc.descripcion.length > 60 ? '…' : '' }}</span>
              </td>
              <td>
                <span v-if="doc.responsable">{{ doc.responsable.apellido }}, {{ doc.responsable.nombre }}</span>
                <span v-else class="muted">-</span>
              </td>
              <td>{{ fechaCorta(doc.fechaDocumento) }}</td>
              <td>{{ fechaCorta(doc.fechaVencimiento) }}</td>
              <td>{{ fechaCorta(doc.createdAt?.slice(0, 10)) }}</td>
              <td><EstadoDocumentoBadge :estado="doc.estadoEfectivo" /></td>
              <td v-if="canEdit" style="white-space:nowrap">
                <button class="btn-ghost btn-sm" type="button" @click="editar(doc)">Editar</button>
                <button
                  v-if="doc.estadoEfectivo !== 'archivado'"
                  class="btn-ghost btn-sm"
                  type="button"
                  @click="archivar(doc)"
                >Archivar</button>
                <router-link
                  class="btn-ghost btn-sm"
                  :to="{ name: 'documento-detalle', params: { id: doc.id } }"
                >Ver</router-link>
              </td>
            </tr>
            <tr v-if="!documentosFiltrados.length">
              <td colspan="7" class="muted">No hay documentos.</td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  </section>
</template>

<style scoped>
.section-header { display: flex; align-items: flex-start; justify-content: space-between; margin-bottom: 1.25rem; }
.filter-bar { margin-bottom: 1rem; }
</style>
