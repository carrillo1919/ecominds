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

const extension = (nombreArchivo) => nombreArchivo?.split('.').pop().toLowerCase() || '';

const fechaCorta = (f) => f ? new Date(f + 'T00:00:00').toLocaleDateString('es-VE') : '-';

onMounted(cargar);
</script>

<template>
  <section>
      <div v-if="cargando" class="muted" style="margin-top:1rem">Cargando...</div>

    <template v-else-if="documento">
      <div class="card" style="margin-top:1rem">
        <div class="doc-header">
          <div>
            <h2>{{ nombreDocumentoAsignado(documento) }}</h2>
            <EstadoDocumentoBadge
              :estado="documento.estadoEfectivo"
              :proximo="documento.proximoAVencer"
              :dias="documento.diasHastaVencimiento"
            />
          </div>
          <div class="doc-header__actions">
            <button class="btn-ghost" type="button" @click="router.push({ name: 'documentos' })">← Volver</button>
            <button v-if="canEdit && !editando" class="btn-ghost" type="button" @click="editando = true">
              Editar
            </button>
          </div>
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
          show-preview
          @archivo-subido="onArchivoSubido"
          @archivo-eliminado="onArchivoEliminado"
        />
      </div>
    </template>
  </section>
</template>

<style scoped>
.doc-header { display: flex; align-items: flex-start; justify-content: space-between; margin-bottom: 1rem; }

.doc-header__actions {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  margin-left: auto;
}

.doc-meta { display: grid; grid-template-columns: 160px 1fr; gap: 0.4rem 1rem; margin: 0; }
.doc-meta dt { font-weight: 600; color: var(--color-muted, #6b7280); }
.doc-meta dd { margin: 0; }

.archivo-selector {
  display: flex;
  flex-wrap: wrap;
  gap: 0.5rem;
}

.archivo-selector__item {
  display: inline-flex;
  align-items: center;
  gap: 0.4rem;
  padding: 0.45rem 0.8rem;
  border: 1px solid var(--outline, #e5e7eb);
  border-radius: 999px;
  background: #fff;
  cursor: pointer;
  font-size: 0.85rem;
  transition: background 0.15s, border-color 0.15s;
}

.archivo-selector__item:hover {
  background: #f1f5f9;
}

.archivo-selector__item.active {
  background: var(--primary-soft, #e8f5e9);
  border-color: var(--primary, #4caf50);
  color: var(--primary, #4caf50);
}

.archivo-selector__nombre {
  max-width: 200px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
</style>
