<script setup>
import { onMounted, reactive, ref, computed } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { useToast } from 'vue-toastification';
import { useDocumentosStore } from '@/stores/documentos';
import { useEmpleadosStore } from '@/stores/empleados';
import { useAuthorization } from '@/composables/useAuthorization';
import { getDocumento } from '@/api/documentos';
import EstadoDocumentoBadge from '@/components/EstadoDocumentoBadge.vue';
import ArchivoAdjuntoList from '@/components/ArchivoAdjuntoList.vue';

const route = useRoute();
const router = useRouter();
const toast = useToast();
const docStore = useDocumentosStore();
const empStore = useEmpleadosStore();
const { isAdmin, isAuditor, isResponsable } = useAuthorization();

const canEdit = computed(() => isAdmin.value || isAuditor.value || isResponsable.value);

const documento = ref(null);
const archivos = ref([]);
const cargando = ref(true);
const editando = ref(false);
const guardando = ref(false);

const form = reactive({
  descripcion: '',
  fechaDocumento: '',
  fechaVencimiento: '',
  responsableId: '',
});

const nombreDocumentoAsignado = (doc) => {
  if (doc?.empresaRequisito?.requisito) {
    const r = doc.empresaRequisito.requisito;
    return `${r.codigo} - ${r.titulo}`;
  }
  return doc?.titulo || '—';
};

const cargar = async () => {
  cargando.value = true;
  try {
    const { data } = await getDocumento(route.params.id);
    documento.value = data.documento;
    archivos.value = data.documento.archivos || [];
    form.descripcion = data.documento.descripcion || '';
    form.fechaDocumento = data.documento.fechaDocumento || '';
    form.fechaVencimiento = data.documento.fechaVencimiento;
    form.responsableId = data.documento.responsableId || '';
    if (data.documento?.empresaId) {
      await empStore.fetchActivos({ empresaId: data.documento.empresaId });
    }
  } catch {
    toast.error('No se pudo cargar el documento');
    router.push({ name: 'documentos' });
  } finally {
    cargando.value = false;
  }
};

const guardar = async () => {
  if (!form.fechaVencimiento) {
    toast.error('La fecha de vencimiento es obligatoria');
    return;
  }
  guardando.value = true;
  const payload = { ...form, responsableId: form.responsableId || null };
  const result = await docStore.update(route.params.id, payload);
  guardando.value = false;
  if (result.ok) {
    toast.success(result.message);
    editando.value = false;
    await cargar();
  } else {
    toast.error(result.message);
  }
};

const onArchivoSubido = (archivo) => {
  archivos.value.push(archivo);
};

const onArchivoEliminado = (archivoId) => {
  archivos.value = archivos.value.filter((a) => a.id !== archivoId);
};

const fechaCorta = (f) => f ? new Date(f + 'T00:00:00').toLocaleDateString('es-VE') : '-';

onMounted(cargar);
</script>

<template>
  <section>
    <button class="btn-ghost" type="button" @click="router.push({ name: 'documentos' })">← Volver</button>

    <div v-if="cargando" class="muted" style="margin-top:1rem">Cargando...</div>

    <template v-else-if="documento">
      <div class="card" style="margin-top:1rem">
        <div class="doc-header">
          <div>
            <h2>{{ nombreDocumentoAsignado(documento) }}</h2>
            <EstadoDocumentoBadge :estado="documento.estadoEfectivo" />
          </div>
          <button v-if="canEdit && !editando" class="btn-ghost" type="button" @click="editando = true">
            Editar
          </button>
        </div>

        <template v-if="!editando">
          <dl class="doc-meta">
            <dt>Documento</dt>
            <dd>{{ nombreDocumentoAsignado(documento) }}</dd>
            <dt>Responsable</dt>
            <dd>{{ documento.responsable ? `${documento.responsable.apellido}, ${documento.responsable.nombre}` : '—' }}</dd>
            <dt>Fecha del documento</dt>
            <dd>{{ fechaCorta(documento.fechaDocumento) }}</dd>
            <dt>Fecha de vencimiento</dt>
            <dd>{{ fechaCorta(documento.fechaVencimiento) }}</dd>
            <dt>Subido</dt>
            <dd>{{ fechaCorta(documento.createdAt?.slice(0, 10)) }}</dd>
            <dt v-if="documento.descripcion">Descripción</dt>
            <dd v-if="documento.descripcion">{{ documento.descripcion }}</dd>
          </dl>
        </template>

        <template v-else>
          <div class="form-grid" style="margin-top:1rem">
            <label>Documento<input :value="nombreDocumentoAsignado(documento)" type="text" disabled /></label>
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
              {{ guardando ? 'Guardando...' : 'Guardar cambios' }}
            </button>
            <button class="btn-ghost" type="button" @click="editando = false">Cancelar</button>
          </div>
        </template>
      </div>

      <div class="card">
        <ArchivoAdjuntoList
          :documento-id="documento.id"
          :archivos="archivos"
          :can-upload="canEdit"
          :can-delete="canEdit"
          @archivo-subido="onArchivoSubido"
          @archivo-eliminado="onArchivoEliminado"
        />
      </div>
    </template>
  </section>
</template>

<style scoped>
.doc-header { display: flex; align-items: flex-start; justify-content: space-between; margin-bottom: 1rem; }
.doc-meta { display: grid; grid-template-columns: 160px 1fr; gap: 0.4rem 1rem; margin: 0; }
.doc-meta dt { font-weight: 600; color: var(--color-muted, #6b7280); }
.doc-meta dd { margin: 0; }
</style>
