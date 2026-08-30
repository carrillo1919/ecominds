<script setup>
import { ref } from 'vue';
import { useToast } from 'vue-toastification';
import { useDocumentosStore } from '@/stores/documentos';
import api, { apiMessage } from '@/api/axios.js';

const props = defineProps({
  documentoId: { type: String, required: true },
  archivos: { type: Array, default: () => [] },
  canUpload: { type: Boolean, default: false },
  canDelete: { type: Boolean, default: false },
});

const emit = defineEmits(['archivo-eliminado', 'archivo-subido']);

const toast = useToast();
const store = useDocumentosStore();
const fileInput = ref(null);
const subiendo = ref(false);

const formatTamano = (bytes) => {
  if (!bytes) return '-';
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / 1024 / 1024).toFixed(1)} MB`;
};

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
      <strong>Archivos adjuntos ({{ archivos.length }})</strong>
      <label v-if="canUpload" class="btn-ghost btn-sm" style="cursor:pointer">
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
    </div>

    <p v-if="!archivos.length" class="muted">Sin archivos adjuntos.</p>

    <ul v-else class="archivos-list">
      <li v-for="a in archivos" :key="a.id" class="archivo-item">
        <span class="archivo-nombre">{{ a.nombreArchivo }}</span>
        <span class="muted archivo-meta">{{ formatTamano(a.tamano) }}</span>
        <button
          class="btn-ghost btn-sm"
          type="button"
          @click="handleDownload(a.id, a.nombreArchivo)"
        >Descargar</button>
        <button
          v-if="canDelete"
          class="btn-ghost btn-sm"
          type="button"
          @click="handleDelete(a.id)"
        >Eliminar</button>
      </li>
    </ul>
  </div>
</template>

<style scoped>
.archivos-header { display: flex; align-items: center; justify-content: space-between; margin-bottom: 0.5rem; }
.archivos-list { list-style: none; padding: 0; margin: 0; display: flex; flex-direction: column; gap: 0.4rem; }
.archivo-item { display: flex; align-items: center; gap: 0.8rem; padding: 0.4rem 0; border-bottom: 1px solid var(--color-border, #e5e7eb); }
.archivo-nombre { flex: 1; font-size: 0.9rem; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.archivo-meta { font-size: 0.8rem; white-space: nowrap; }
</style>
