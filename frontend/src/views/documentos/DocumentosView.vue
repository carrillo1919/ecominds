<script setup>
import { onMounted, reactive, ref, computed, watch } from 'vue';
import { useToast } from 'vue-toastification';
import { useDocumentosStore } from '@/stores/documentos';
import { useEmpleadosStore } from '@/stores/empleados';
import { useAuthorization } from '@/composables/useAuthorization';
import EstadoDocumentoBadge from '@/components/EstadoDocumentoBadge.vue';
import PageToolbar from '@/components/ui/PageToolbar.vue';
import DataTable from '@/components/ui/DataTable.vue';
import CrudModal from '@/components/ui/CrudModal.vue';
import * as empresasApi from '@/api/empresas';
import * as empresaRequisitosApi from '@/api/empresaRequisitos';

const toast = useToast();
const docStore = useDocumentosStore();
const empStore = useEmpleadosStore();
const { isAdmin, isAuditor, isResponsable } = useAuthorization();

const canEdit = computed(() => isAdmin.value || isAuditor.value || isResponsable.value);
const canSelectEmpresa = computed(() => isAdmin.value || isAuditor.value);

const mostrarModal = ref(false);
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
  archivo.value = null;
  asignacionesEmpresa.value = [];
  Object.keys(form).forEach((k) => { form[k] = ''; });
};

const abrirCrear = () => {
  limpiar();
  mostrarModal.value = true;
};

const cerrarModal = () => {
  mostrarModal.value = false;
  limpiar();
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
  mostrarModal.value = true;
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
    cerrarModal();
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

const modalTitle = computed(() => editandoId.value ? 'Editar documento' : 'Registrar documento');
const saveLabel = computed(() => editandoId.value ? 'Guardar cambios' : 'Registrar');

const tableHeaders = [
  { key: 'documento', label: 'Documento' },
  { key: 'responsable', label: 'Responsable' },
  { key: 'fechaDocumento', label: 'Fecha doc.' },
  { key: 'fechaVencimiento', label: 'Vencimiento' },
  { key: 'subido', label: 'Subido' },
  { key: 'estado', label: 'Estado' },
];

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
    <PageToolbar title="Documentos" subtitle="Documentos asignados a su empresa.">
      <template #actions>
        <button v-if="canEdit" class="btn-primary" type="button" @click="abrirCrear">
          + Nuevo documento
        </button>
      </template>
    </PageToolbar>

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
      <DataTable
        :headers="tableHeaders"
        :items="documentosFiltrados"
        :loading="docStore.loading"
        empty-text="No hay documentos."
      >
        <template #cell-documento="{ item }">
          <router-link :to="{ name: 'documento-detalle', params: { id: item.id } }">
            <strong>{{ nombreDocumentoAsignado(item) }}</strong>
          </router-link>
          <span v-if="item.descripcion" class="muted"><br />{{ item.descripcion.slice(0, 60) }}{{ item.descripcion.length > 60 ? '…' : '' }}</span>
        </template>
        <template #cell-responsable="{ item }">
          <span v-if="item.responsable">{{ item.responsable.apellido }}, {{ item.responsable.nombre }}</span>
          <span v-else class="muted">—</span>
        </template>
        <template #cell-fechaDocumento="{ item }">
          {{ fechaCorta(item.fechaDocumento) }}
        </template>
        <template #cell-fechaVencimiento="{ item }">
          {{ fechaCorta(item.fechaVencimiento) }}
        </template>
        <template #cell-subido="{ item }">
          {{ fechaCorta(item.createdAt?.slice(0, 10)) }}
        </template>
        <template #cell-estado="{ item }">
          <EstadoDocumentoBadge
            :estado="item.estadoEfectivo"
            :proximo="item.proximoAVencer"
            :dias="item.diasHastaVencimiento"
          />
        </template>
        <template v-if="canEdit" #actions="{ item }">
          <button class="btn-ghost btn-sm" type="button" @click="editar(item)">Editar</button>
          <button class="btn-ghost btn-sm btn-danger" type="button" @click="eliminar(item.id)">Eliminar</button>
          <router-link class="btn-ghost btn-sm" :to="{ name: 'documento-detalle', params: { id: item.id } }">Ver</router-link>
        </template>
      </DataTable>
    </div>

    <CrudModal
      :show="mostrarModal"
      :title="modalTitle"
      :save-label="saveLabel"
      :saving="guardando"
      @close="cerrarModal"
      @save="guardar"
    >
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
    </CrudModal>
  </section>
</template>

<style scoped>
.filter-bar { margin-bottom: 1rem; }
</style>
