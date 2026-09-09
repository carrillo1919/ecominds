<script setup>
import { computed, onMounted, reactive, ref } from 'vue';
import { useToast } from 'vue-toastification';
import { useProductosStore } from '@/stores/productos';
import { useAuthorization } from '@/composables/useAuthorization';
import PageToolbar from '@/components/ui/PageToolbar.vue';
import DataTable from '@/components/ui/DataTable.vue';
import CrudModal from '@/components/ui/CrudModal.vue';

const toast = useToast();
const store = useProductosStore();
const { canGestionarCatalogos } = useAuthorization();

const mostrarModal = ref(false);
const editandoId = ref(null);

const form = reactive({
  codigo: '',
  nombre: '',
  descripcion: '',
  precio: '',
  impuesto: '',
  activo: true,
});

const headers = [
  { key: 'codigo', label: 'Código' },
  { key: 'nombre', label: 'Nombre' },
  { key: 'descripcion', label: 'Descripción' },
  { key: 'precio', label: 'Precio base' },
  { key: 'impuesto', label: 'Impuesto %' },
  { key: 'activo', label: 'Activo' },
];

const modalTitle = computed(() => (editandoId.value ? 'Editar producto' : 'Nuevo producto'));
const saveLabel = computed(() => (editandoId.value ? 'Guardar cambios' : 'Crear producto'));

const limpiar = () => {
  editandoId.value = null;
  form.codigo = '';
  form.nombre = '';
  form.descripcion = '';
  form.precio = '';
  form.impuesto = '';
  form.activo = true;
};

const abrirCrear = () => {
  limpiar();
  mostrarModal.value = true;
};

const cerrarModal = () => {
  mostrarModal.value = false;
  limpiar();
};

const editar = (item) => {
  editandoId.value = item.id;
  form.codigo = item.codigo || '';
  form.nombre = item.nombre || '';
  form.descripcion = item.descripcion || '';
  form.precio = item.precio ?? '';
  form.impuesto = item.impuesto ?? '';
  form.activo = item.activo ?? true;
  mostrarModal.value = true;
};

const guardar = async () => {
  if (!form.codigo.trim() || !form.nombre.trim() || form.precio === '') {
    toast.error('Código, nombre y precio son obligatorios');
    return;
  }

  const payload = {
    codigo: form.codigo.trim(),
    nombre: form.nombre.trim(),
    descripcion: form.descripcion.trim() || undefined,
    precio: Number(form.precio),
    impuesto: form.impuesto === '' ? 0 : Number(form.impuesto),
    activo: form.activo,
  };

  let result;
  if (editandoId.value) {
    result = await store.update(editandoId.value, payload);
  } else {
    result = await store.create(payload);
  }

  if (result.ok) {
    toast.success(editandoId.value ? 'Producto actualizado' : 'Producto creado');
    cerrarModal();
    await store.fetchAll();
  } else {
    toast.error(result.message);
  }
};

const desactivar = async (item) => {
  if (!confirm(`¿Desactivar el producto "${item.nombre}"?`)) return;
  const result = await store.remove(item.id);
  if (result.ok) {
    toast.success('Producto desactivado');
    await store.fetchAll();
  } else {
    toast.error(result.message);
  }
};

onMounted(() => {
  limpiar();
  store.fetchAll();
});
</script>

<template>
  <section>
    <PageToolbar title="Productos" subtitle="Catálogo de productos comercializables.">
      <template #actions>
        <button v-if="canGestionarCatalogos" class="btn-primary" type="button" @click="abrirCrear">
          + Nuevo producto
        </button>
      </template>
    </PageToolbar>

    <div class="card">
      <div v-if="store.error" class="alert alert-error">{{ store.error }}</div>
      <DataTable
        :headers="headers"
        :items="store.productos"
        :loading="store.loading"
        empty-text="Aún no hay productos registrados."
      >
        <template #cell-descripcion="{ item }">
          <span class="muted">{{ item.descripcion || '—' }}</span>
        </template>
        <template #cell-precio="{ item }">
          {{ Number(item.precio).toFixed(2) }}
        </template>
        <template #cell-impuesto="{ item }">
          {{ Number(item.impuesto).toFixed(2) }}%
        </template>
        <template #cell-activo="{ item }">
          <span :class="item.activo ? 'badge-success' : 'badge-muted'">
            {{ item.activo ? 'Sí' : 'No' }}
          </span>
        </template>
        <template #actions="{ item }">
          <button v-if="canGestionarCatalogos" class="btn-ghost btn-sm" type="button" @click="editar(item)">Editar</button>
          <button v-if="canGestionarCatalogos && item.activo" class="btn-danger btn-sm" type="button" @click="desactivar(item)">Desactivar</button>
        </template>
      </DataTable>
    </div>

    <CrudModal
      :show="mostrarModal"
      :title="modalTitle"
      :save-label="saveLabel"
      :saving="store.loading"
      @close="cerrarModal"
      @save="guardar"
    >
      <div class="form-grid">
        <label>Código *<input v-model="form.codigo" type="text" /></label>
        <label>Nombre *<input v-model="form.nombre" type="text" /></label>
        <label>Precio base *<input v-model="form.precio" type="number" step="0.01" min="0" /></label>
        <label>Impuesto %<input v-model="form.impuesto" type="number" step="0.01" min="0" /></label>
        <label class="span-2">Descripción<textarea v-model="form.descripcion" rows="3"></textarea></label>
        <label class="flex items-center gap-2">
          <input v-model="form.activo" type="checkbox" /> Activo
        </label>
      </div>
    </CrudModal>
  </section>
</template>
