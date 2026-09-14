<script setup>
import { computed, onMounted, reactive, ref } from 'vue';
import { useToast } from 'vue-toastification';
import { useConfiguracionFacturaStore } from '@/stores/configuracionFactura';
import { useAuthorization } from '@/composables/useAuthorization';
import PageToolbar from '@/components/ui/PageToolbar.vue';
import DataTable from '@/components/ui/DataTable.vue';
import CrudModal from '@/components/ui/CrudModal.vue';

const toast = useToast();
const store = useConfiguracionFacturaStore();
const { canGestionarCatalogos } = useAuthorization();

const mostrarModal = ref(false);
const editandoId = ref(null);

const form = reactive({
  tipo: 'impuesto',
  nombre: '',
  porcentaje: '',
  descripcion: '',
  activo: true,
});

const headers = [
  { key: 'nombre', label: 'Nombre' },
  { key: 'porcentaje', label: 'Porcentaje' },
  { key: 'descripcion', label: 'Descripción' },
  { key: 'activo', label: 'Activo' },
];

const tituloTipo = (tipo) => (tipo === 'impuesto' ? 'Impuesto' : 'Descuento');

const modalTitle = computed(
  () => `${editandoId.value ? 'Editar' : 'Nuevo'} ${tituloTipo(form.tipo).toLowerCase()}`,
);
const saveLabel = computed(() => (editandoId.value ? 'Guardar cambios' : 'Crear'));

const limpiar = () => {
  editandoId.value = null;
  form.tipo = 'impuesto';
  form.nombre = '';
  form.porcentaje = '';
  form.descripcion = '';
  form.activo = true;
};

const abrirCrear = (tipo) => {
  limpiar();
  form.tipo = tipo;
  mostrarModal.value = true;
};

const cerrarModal = () => {
  mostrarModal.value = false;
  limpiar();
};

const editar = (item) => {
  editandoId.value = item.id;
  form.tipo = item.tipo;
  form.nombre = item.nombre || '';
  form.porcentaje = item.porcentaje ?? '';
  form.descripcion = item.descripcion || '';
  form.activo = item.activo ?? true;
  mostrarModal.value = true;
};

const guardar = async () => {
  const nombre = form.nombre.trim();
  const porcentaje = Number(form.porcentaje);

  if (!nombre) {
    toast.error('El nombre es obligatorio');
    return;
  }
  if (form.porcentaje === '' || Number.isNaN(porcentaje) || porcentaje < 0 || porcentaje > 100) {
    toast.error('El porcentaje debe estar entre 0 y 100');
    return;
  }

  const payload = {
    tipo: form.tipo,
    nombre,
    porcentaje,
    descripcion: form.descripcion.trim() || undefined,
    activo: form.activo,
  };

  const result = editandoId.value
    ? await store.update(editandoId.value, payload)
    : await store.create(payload);

  if (result.ok) {
    toast.success(editandoId.value ? 'Configuración actualizada' : 'Configuración creada');
    cerrarModal();
    await store.fetchAll();
  } else {
    toast.error(result.message);
  }
};

const desactivar = async (item) => {
  if (!confirm(`¿Desactivar "${item.nombre}"?`)) return;
  const result = await store.remove(item.id);
  if (result.ok) {
    toast.success('Configuración desactivada');
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
    <PageToolbar
      title="Configuración de factura"
      subtitle="Impuestos y descuentos en porcentaje aplicables a las facturas."
    />

    <div v-if="store.error" class="alert alert-error mb-4">{{ store.error }}</div>

    <div v-for="grupo in ['impuesto', 'descuento']" :key="grupo" class="card mb-6">
      <div class="flex items-center justify-between mb-4">
        <div>
          <h3 class="font-semibold">{{ grupo === 'impuesto' ? 'Impuestos de factura' : 'Descuentos de factura' }}</h3>
          <p class="muted text-sm">
            {{
              grupo === 'impuesto'
                ? 'Porcentajes de impuesto que se pueden aplicar al generar una factura.'
                : 'Porcentajes de descuento opcionales que se pueden aplicar al generar una factura.'
            }}
          </p>
        </div>
        <button v-if="canGestionarCatalogos" class="btn-primary" type="button" @click="abrirCrear(grupo)">
          + Nuevo {{ tituloTipo(grupo).toLowerCase() }}
        </button>
      </div>

      <DataTable
        :headers="headers"
        :items="grupo === 'impuesto' ? store.impuestos : store.descuentos"
        :loading="store.loading"
        :empty-text="`Aún no hay ${grupo === 'impuesto' ? 'impuestos' : 'descuentos'} configurados.`"
      >
        <template #cell-porcentaje="{ item }">
          {{ Number(item.porcentaje).toFixed(2) }}%
        </template>
        <template #cell-descripcion="{ item }">
          <span class="muted">{{ item.descripcion || '—' }}</span>
        </template>
        <template #cell-activo="{ item }">
          <span :class="item.activo ? 'badge-success' : 'badge-muted'">
            {{ item.activo ? 'Sí' : 'No' }}
          </span>
        </template>
        <template #actions="{ item }">
          <button v-if="canGestionarCatalogos" class="btn-ghost btn-sm" type="button" @click="editar(item)">
            Editar
          </button>
          <button
            v-if="canGestionarCatalogos && item.activo"
            class="btn-danger btn-sm"
            type="button"
            @click="desactivar(item)"
          >
            Desactivar
          </button>
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
        <label>Nombre *<input v-model="form.nombre" type="text" maxlength="150" /></label>
        <label>Porcentaje (%) *<input v-model="form.porcentaje" type="number" step="0.01" min="0" max="100" /></label>
        <label class="span-2">Descripción<textarea v-model="form.descripcion" rows="3" maxlength="255"></textarea></label>
        <label class="flex items-center gap-2">
          <input v-model="form.activo" type="checkbox" /> Activo
        </label>
      </div>
    </CrudModal>
  </section>
</template>
