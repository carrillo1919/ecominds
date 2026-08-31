<script setup>
import { ref, computed, watch } from 'vue';
import { useToast } from 'vue-toastification';
import { useDocumentosStore } from '@/stores/documentos';
import api, { apiMessage } from '@/api/axios.js';
import { previewArchivo } from '@/api/documentos';

const props = defineProps({
  documentoId: { type: String, required: true },
  archivos: { type: Array, default: () => [] },
  canUpload: { type: Boolean, default: false },
  canDelete: { type: Boolean, default: false },
  showPreview: { type: Boolean, default: true },
});

const emit = defineEmits(['archivo-eliminado', 'archivo-subido']);

const toast = useToast();
const store = useDocumentosStore();
const fileInput = ref(null);
const subiendo = ref(false);

const archivoSeleccionado = ref(null);
const objetoUrl = ref(null);
const cargandoPreview = ref(false);
const errorPreview = ref(false);

const extension = (nombreArchivo) => nombreArchivo?.split('.').pop().toLowerCase() || '';

const formatTamano = (bytes) => {
  if (!bytes) return '-';
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / 1024 / 1024).toFixed(1)} MB`;
};

const esImagen = (archivo) => {
  const mime = archivo?.tipoMime || archivo?.mimeType || '';
  const ext = extension(archivo?.nombreArchivo);
  return mime.startsWith('image/') || ['jpg', 'jpeg', 'png', 'gif', 'webp', 'svg', 'bmp'].includes(ext);
};

const esPdf = (archivo) => {
  const mime = archivo?.tipoMime || archivo?.mimeType || '';
  const ext = extension(archivo?.nombreArchivo);
  return mime === 'application/pdf' || ext === 'pdf';
};

const limpiarPreview = () => {
  if (objetoUrl.value) {
    URL.revokeObjectURL(objetoUrl.value);
    objetoUrl.value = null;
  }
  errorPreview.value = false;
};

const cargarPreview = async (archivo) => {
  limpiarPreview();
  if (!archivo || (!esImagen(archivo) && !esPdf(archivo))) return;

  cargandoPreview.value = true;
  try {
    const response = await previewArchivo(props.documentoId, archivo.id);
    objetoUrl.value = URL.createObjectURL(response.data);
  } catch (err) {
    console.error('Error cargando vista previa:', err);
    errorPreview.value = true;
  } finally {
    cargandoPreview.value = false;
  }
};

const seleccionarArchivo = (archivo) => {
  archivoSeleccionado.value = archivo;
  cargarPreview(archivo);
};

watch(() => props.archivos, (nuevos) => {
  if (!nuevos.find((a) => a.id === archivoSeleccionado.value?.id)) {
    archivoSeleccionado.value = null;
    limpiarPreview();
  }
  if (nuevos.length === 1 && !archivoSeleccionado.value && props.showPreview) {
    seleccionarArchivo(nuevos[0]);
  }
}, { immediate: true, deep: true });

const handleUpload = async (event) => {
  const file = event.target.files[0];
  if (!file) return;
  subiendo.value = true;
  const result = await store.uploadArchivo(props.documentoId, file);
  subiendo.value = false;
  if (result.ok) {
    toast.success('Archivo adjuntado');
    emit('archivo-subido', result.archivo);
  } else {
    toast.error(result.message);
  }
  fileInput.value.value = '';
};

const handleDelete = async (archivoId) => {
  if (!confirm('¿Eliminar este archivo?')) return;
  const result = await store.deleteArchivo(props.documentoId, archivoId);
  if (result.ok) {
    toast.success('Archivo eliminado');
    emit('archivo-eliminado', archivoId);
  } else {
    toast.error(result.message);
  }
};

const handleDownload = async (archivoId, nombreArchivo) => {
  try {
    const response = await api.get(
      `/documentos/${props.documentoId}/archivos/${archivoId}/download`,
      { responseType: 'blob' },
    );
    const url = URL.createObjectURL(response.data);
    const link = document.createElement('a');
    link.href = url;
    link.download = nombreArchivo || 'archivo';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    setTimeout(() => URL.revokeObjectURL(url), 10000);
  } catch (err) {
    toast.error(apiMessage(err, 'No se pudo descargar el archivo'));
  }
};
</script>

<template>
  <div>
    <div class="archivos-header">
      <strong>Archivo adjunto</strong>
      <label
        v-if="canUpload && !archivos.length"
        class="btn-ghost btn-sm"
        style="cursor:pointer"
      >
        {{ subiendo ? 'Subiendo...' : 'Adjuntar archivo' }}
        <input
          ref="fileInput"
          type="file"
          accept=".pdf,.jpg,.jpeg,.png,.gif,.webp"
          style="display:none"
          :disabled="subiendo || !canUpload"
          @change="handleUpload"
        />
      </label>
      <span v-else-if="archivos.length" class="muted" style="font-size:0.8rem">
        Solo se permite un archivo por documento
      </span>
    </div>

    <p v-if="!archivos.length" class="muted">Sin archivo adjunto.</p>

    <ul v-else class="archivos-list">
      <li
        v-for="a in archivos"
        :key="a.id"
        class="archivo-item"
        :class="{ active: archivoSeleccionado?.id === a.id }"
        @click="seleccionarArchivo(a)"
      >
        <span class="archivo-icon">
          {{ esImagen(a) ? '🖼️' : esPdf(a) ? '📄' : '📎' }}
        </span>
        <span class="archivo-nombre">{{ a.nombreArchivo }}</span>
        <span class="muted archivo-meta">{{ formatTamano(a.tamano) }}</span>
        <button
          class="btn-ghost btn-sm"
          type="button"
          @click.stop="handleDownload(a.id, a.nombreArchivo)"
        >Descargar</button>
        <button
          v-if="canDelete"
          class="btn-ghost btn-sm"
          type="button"
          @click.stop="handleDelete(a.id)"
        >Eliminar</button>
      </li>
    </ul>

    <div v-if="showPreview && archivoSeleccionado" class="vista-previa">
      <div class="vista-previa__header">
        <strong>{{ archivoSeleccionado.nombreArchivo }}</strong>
      </div>

      <div v-if="cargandoPreview" class="vista-previa__estado">Cargando vista previa...</div>

      <div v-else-if="errorPreview" class="vista-previa__estado vista-previa__estado--error">
        <p>No se pudo cargar la vista previa.</p>
        <button
          class="btn-ghost btn-sm"
          type="button"
          @click="cargarPreview(archivoSeleccionado)"
        >Reintentar</button>
      </div>

      <img
        v-else-if="esImagen(archivoSeleccionado)"
        :src="objetoUrl"
        :alt="archivoSeleccionado.nombreArchivo"
        class="vista-previa__media"
        @error="errorPreview = true"
      />

      <embed
        v-else-if="esPdf(archivoSeleccionado)"
        :src="objetoUrl"
        type="application/pdf"
        class="vista-previa__media vista-previa__media--pdf"
      />

      <div v-else class="vista-previa__estado">
        <p>Vista previa no disponible para este tipo de archivo.</p>
      </div>
    </div>
  </div>
</template>

<style scoped>
.archivos-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 0.5rem;
}

.archivos-list {
  list-style: none;
  padding: 0;
  margin: 0;
  display: flex;
  flex-direction: column;
  gap: 0.4rem;
}

.archivo-item {
  display: flex;
  align-items: center;
  gap: 0.8rem;
  padding: 0.5rem 0.6rem;
  border: 1px solid transparent;
  border-bottom: 1px solid var(--color-border, #e5e7eb);
  border-radius: 0.4rem;
  cursor: pointer;
  transition: background 0.15s, border-color 0.15s;
}

.archivo-item:hover {
  background: #f8fafc;
}

.archivo-item.active {
  background: var(--primary-soft, #e8f5e9);
  border-color: var(--primary, #4caf50);
}

.archivo-icon {
  font-size: 1rem;
}

.archivo-nombre {
  flex: 1;
  font-size: 0.9rem;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.archivo-meta {
  font-size: 0.8rem;
  white-space: nowrap;
}

.vista-previa {
  margin-top: 1rem;
  border: 1px solid var(--outline, #e5e7eb);
  border-radius: 0.75rem;
  overflow: hidden;
  background: #f8fafc;
}

.vista-previa__header {
  padding: 0.75rem 1rem;
  border-bottom: 1px solid var(--outline, #e5e7eb);
  background: #fff;
}

.vista-previa__header strong {
  font-size: 0.9rem;
  font-weight: 600;
}

.vista-previa__media {
  display: block;
  max-width: 100%;
  max-height: 60vh;
  margin: 0 auto;
  object-fit: contain;
}

.vista-previa__media--pdf {
  width: 100%;
  height: 60vh;
  min-height: 400px;
  max-height: 70vh;
}

.vista-previa__estado {
  padding: 2rem;
  text-align: center;
  color: var(--muted, #6b7280);
}

.vista-previa__estado--error {
  color: #b91c1c;
}
</style>
