<script setup>
import { onMounted, reactive, ref, computed, watch } from 'vue';
import { useToast } from 'vue-toastification';
import { useDocumentosStore } from '@/stores/documentos';
import { useEmpleadosStore } from '@/stores/empleados';
import { useAuthorization } from '@/composables/useAuthorization';
import EstadoDocumentoBadge from '@/components/EstadoDocumentoBadge.vue';
import * as empresasApi from '@/api/empresas';
import * as empresaRequisitosApi from '@/api/empresaRequisitos';

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
const asignacionesEmpresa = ref([]);

const form = reactive({
  empresaRequisitoId: '',
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
  asignacionesEmpresa.value = [];
  Object.keys(form).forEach((k) => { form[k] = ''; });
};

const documentoAsignadoLabel = computed(() => {
  const asignacion = asignacionesEmpresa.value.find((a) => a.id === form.empresaRequisitoId);
  if (asignacion?.requisito) {
    return `${asignacion.requisito.codigo} - ${asignacion.requisito.titulo}`;
  }
  return '—';
});

const editar = async (doc) => {
  editandoId.value = doc.id;
  mostrarForm.value = true;
  form.empresaRequisitoId = doc.empresaRequisitoId || '';
  form.descripcion = doc.descripcion || '';
  form.fechaDocumento = doc.fechaDocumento || '';
  form.fechaVencimiento = doc.fechaVencimiento || '';
  form.responsableId = doc.responsableId || '';
  form.empresaId = doc.empresaId || '';
  archivo.value = null;
  if (form.empresaId) {
    await cargarAsignacionesEmpresa(form.empresaId);
    if (!form.empresaRequisitoId && doc.empresaRequisito?.requisito) {
      asignacionesEmpresa.value = [
        ...asignacionesEmpresa.value,
        doc.empresaRequisito,
      ];
    }
  }
};

const nombreDocumentoAsignado = (doc) => {
  if (doc.empresaRequisito?.requisito) {
    const r = doc.empresaRequisito.requisito;
    return `${r.codigo} - ${r.titulo}`;
  }
  return doc.titulo || '—';
};

const guardar = async () => {
  if (!form.fechaVencimiento) {
    toast.error('La fecha de vencimiento es obligatoria');
    return;
  }
  if (canSelectEmpresa.value && !editandoId.value && !form.empresaId.trim()) {
    toast.error('Seleccione la empresa');
    return;
  }
  if (!editandoId.value && !form.empresaRequisitoId) {
    toast.error('Seleccione el documento asignado');
    return;
  }
  guardando.value = true;
  const payload = {
    ...form,
    responsableId: form.responsableId || null,
    empresaId: canSelectEmpresa.value ? form.empresaId || null : undefined,
  };
  // No enviar empresaRequisitoId al editar; el backend lo rechaza
  if (editandoId.value) {
    delete payload.empresaRequisitoId;
  }

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

const eliminar = async (id) => {
  if (!confirm('¿Eliminar permanentemente este documento?')) return;
  const result = await docStore.eliminar(id);
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
  if (!canSelectEmpresa.value) return empStore.empleadosActivos;
  if (!form.empresaId) return [];
  return empStore.empleadosActivos.filter((e) => e.empresaId === form.empresaId);
});

const puedeMostrarResponsable = computed(() => {
  if (!canSelectEmpresa.value) return true;
  return !!form.empresaId;
});

const cargarAsignacionesEmpresa = async (empresaId) => {
  asignacionesEmpresa.value = [];
  if (!empresaId) return;
  try {
    const { data } = await empresaRequisitosApi.getByEmpresa(empresaId);
    asignacionesEmpresa.value = data.asignaciones || [];
  } catch {
    asignacionesEmpresa.value = [];
  }
};

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
  async (nuevaEmpresa, viejaEmpresa) => {
    form.responsableId = '';
    if (!editandoId.value || nuevaEmpresa !== viejaEmpresa) {
      form.empresaRequisitoId = '';
    }
    if (nuevaEmpresa) {
      await recargar(); // Asegura que docStore.documentos esté actualizado
      await empStore.fetchActivos({ empresaId: nuevaEmpresa });
      await cargarAsignacionesEmpresa(nuevaEmpresa);
    }
  }
);

const fechaCorta = (f) => f ? new Date(f + 'T00:00:00').toLocaleDateString('es-VE') : '-';

const asignacionesDisponibles = computed(() => {
  const asignados = new Set(
    docStore.documentos
      .filter((d) => d.empresaId === form.empresaId)
      .map((d) => d.empresaRequisitoId)
      .filter(Boolean),
  );
  return asignacionesEmpresa.value.filter((a) => !asignados.has(a.id));
});

onMounted(async () => {
  await cargarEmpresas();
  if (!canSelectEmpresa.value) {
    await empStore.fetchActivos();
  }
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
        <label v-if="!editandoId">
          Documento *
          <select v-model="form.empresaRequisitoId" :disabled="!form.empresaId">
            <option value="">Seleccione...</option>
            <option v-for="a in asignacionesDisponibles" :key="a.id" :value="a.id">
              {{ a.requisito?.codigo }} - {{ a.requisito?.titulo }}
            </option>
          </select>
        </label>
        <label v-else>
          Documento
          <input :value="documentoAsignadoLabel" type="text" disabled />
        </label>
        <label v-if="puedeMostrarResponsable">
          Responsable
          <select v-model="form.responsableId">
            <option value="">— Sin responsable —</option>
            <option v-for="emp in empleadosFiltrados" :key="emp.id" :value="emp.id">
              {{ emp.apellido }}, {{ emp.nombre }}
            </option>
          </select>
        </label>
        <label v-else>
          Responsable
          <select disabled>
            <option>Seleccione una empresa primero</option>
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
          </select>
        </label>
      </div>

      <div v-if="docStore.error" class="alert alert-error">{{ docStore.error }}</div>
      <p v-if="docStore.loading" class="muted">Cargando documentos...</p>

      <div v-else class="table-scroll">
        <table class="data">
          <thead>
            <tr>
              <th>Documento</th>
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
              <td data-label="Documento">
                <router-link :to="{ name: 'documento-detalle', params: { id: doc.id } }">
                  <strong>{{ nombreDocumentoAsignado(doc) }}</strong>
                </router-link>
                <span v-if="doc.descripcion" class="muted"><br />{{ doc.descripcion.slice(0, 60) }}{{ doc.descripcion.length > 60 ? '…' : '' }}</span>
              </td>
              <td data-label="Responsable">
                <span v-if="doc.responsable">{{ doc.responsable.apellido }}, {{ doc.responsable.nombre }}</span>
                <span v-else class="muted">-</span>
              </td>
              <td data-label="Fecha doc.">{{ fechaCorta(doc.fechaDocumento) }}</td>
              <td data-label="Vencimiento">{{ fechaCorta(doc.fechaVencimiento) }}</td>
              <td data-label="Subido">{{ fechaCorta(doc.createdAt?.slice(0, 10)) }}</td>
              <td data-label="Estado">
                <EstadoDocumentoBadge
                  :estado="doc.estadoEfectivo"
                  :proximo="doc.proximoAVencer"
                  :dias="doc.diasHastaVencimiento"
                />
              </td>
              <td v-if="canEdit" data-label="Acciones" style="white-space:nowrap">
                <button class="btn-ghost btn-sm" type="button" @click="editar(doc)">Editar</button>
                <button
                  class="btn-ghost btn-sm btn-danger"
                  type="button"
                  @click="eliminar(doc.id)"
                >Eliminar</button>
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
