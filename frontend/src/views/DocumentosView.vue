<script setup>
import { onMounted, reactive, ref, computed, watch } from 'vue';
import { useToast } from 'vue-toastification';
import { useDocumentosStore } from '@/stores/documentos';
import { useEmpleadosStore } from '@/stores/empleados';
import { useAuthorization } from '@/composables/useAuthorization';
import EstadoDocumentoBadge from '@/components/EstadoDocumentoBadge.vue';
import * as empresasApi from '@/api/empresas';

const toast = useToast();
const docStore = useDocumentosStore();
const empStore = useEmpleadosStore();
const { isAdmin, isAuditor, isResponsable } = useAuthorization();

const canEdit = computed(() => isAdmin.value || isAuditor.value || isResponsable.value);
const canSelectEmpresa = computed(() => isAdmin.value || isAuditor.value);

const mostrarForm = ref(false);
const editandoId = ref(null);
const guardando = ref(false);
const filtroEstado = ref('');
const empresas = ref([]);
const empresaFiltro = ref('');
const archivo = ref(null);

const form = reactive({
  titulo: '',
  descripcion: '',
  fechaDocumento: '',
  fechaVencimiento: '',
  responsableId: '',
  empresaId: '',
});

const limpiar = () => {
  editandoId.value = null;
  mostrarForm.value = false;
  archivo.value = null;
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
  form.empresaId = doc.empresaId || '';
  archivo.value = null;
};

const guardar = async () => {
  if (!form.titulo.trim() || !form.fechaVencimiento) {
    toast.error('Título y fecha de vencimiento son obligatorios');
    return;
  }
  if (canSelectEmpresa.value && !editandoId.value && !form.empresaId.trim()) {
    toast.error('Seleccione la empresa');
    return;
  }
  guardando.value = true;
  const payload = {
    ...form,
    responsableId: form.responsableId || null,
    empresaId: canSelectEmpresa.value ? form.empresaId || null : undefined,
  };

  let result;
  if (editandoId.value) {
    result = await docStore.update(editandoId.value, payload);
  } else {
    result = await docStore.create(payload);
    if (result.ok && archivo.value && result.documento?.id) {
      const uploadResult = await docStore.uploadArchivo(result.documento.id, archivo.value);
      if (!uploadResult.ok) {
        toast.warning(`Documento creado, pero no se pudo adjuntar el archivo: ${uploadResult.message}`);
      } else {
        result.documento.archivos = [uploadResult.archivo];
      }
    }
  }
  guardando.value = false;
  if (result.ok) {
    toast.success(result.message);
    limpiar();
    await recargar();
  } else {
    toast.error(result.message);
  }
};

const onFileChange = (event) => {
  const file = event.target.files[0];
  if (file && !['application/pdf', 'image/jpeg', 'image/png', 'image/gif', 'image/webp'].includes(file.type)) {
    toast.error('Solo se permiten PDF e imágenes');
    event.target.value = '';
    archivo.value = null;
    return;
  }
  archivo.value = file || null;
};

const archivar = async (doc) => {
  if (!confirm(`¿Archivar el documento "${doc.titulo}"?`)) return;
  const result = await docStore.archivar(doc.id);
  if (result.ok) toast.success(result.message);
  else toast.error(result.message);
};

const documentosFiltrados = computed(() => {
  let docs = docStore.documentos;
  if (empresaFiltro.value) {
    docs = docs.filter((d) => d.empresaId === empresaFiltro.value);
  }
  if (filtroEstado.value) {
    docs = docs.filter((d) => d.estadoEfectivo === filtroEstado.value);
  }
  return docs;
});

const empleadosFiltrados = computed(() => {
  if (!form.empresaId) return [];
  return empStore.empleadosActivos.filter((e) => e.empresaId === form.empresaId);
});

const recargar = async () => {
  const params = {};
  if (empresaFiltro.value) params.empresaId = empresaFiltro.value;
  await docStore.fetchAll(params);
};

const cargarEmpresas = async () => {
  if (!canSelectEmpresa.value) return;
  try {
    const { data } = await empresasApi.getEmpresas({ activo: true });
    empresas.value = data.empresas || [];
  } catch {
    empresas.value = [];
  }
};

watch(empresaFiltro, recargar);

watch(
  () => form.empresaId,
  async (nuevaEmpresa) => {
    form.responsableId = '';
    if (nuevaEmpresa) {
      await empStore.fetchActivos({ empresaId: nuevaEmpresa });
    }
  }
);

const fechaCorta = (f) => f ? new Date(f + 'T00:00:00').toLocaleDateString('es-VE') : '-';

onMounted(async () => {
  await cargarEmpresas();
  await recargar();
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
        <label v-if="canSelectEmpresa && !editandoId">
          Empresa *
          <select v-model="form.empresaId">
            <option value="">Seleccione...</option>
            <option v-for="e in empresas" :key="e.id" :value="e.id">{{ e.nombre }}</option>
          </select>
        </label>
        <label>Título *<input v-model="form.titulo" type="text" /></label>
        <label>
          Responsable
          <select v-model="form.responsableId">
            <option value="">— Sin responsable —</option>
            <option v-for="emp in empleadosFiltrados" :key="emp.id" :value="emp.id">
              {{ emp.apellido }}, {{ emp.nombre }}
            </option>
          </select>
        </label>
        <label>Fecha del documento<input v-model="form.fechaDocumento" type="date" /></label>
        <label>Fecha de vencimiento *<input v-model="form.fechaVencimiento" type="date" /></label>
        <label v-if="!editandoId" style="grid-column: 1 / -1">
          Adjuntar archivo (PDF o imagen)
          <input type="file" accept=".pdf,.jpg,.jpeg,.png,.gif,.webp" @change="onFileChange" />
          <span v-if="archivo" class="muted">Archivo seleccionado: {{ archivo.name }}</span>
        </label>
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
        <label v-if="canSelectEmpresa">
          Empresa:
          <select v-model="empresaFiltro">
            <option value="">Todas</option>
            <option v-for="e in empresas" :key="e.id" :value="e.id">{{ e.nombre }}</option>
          </select>
        </label>
        <label>
          Estado:
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
