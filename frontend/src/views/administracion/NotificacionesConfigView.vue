<!-- filepath: c:\Users\tf carrillo\Documents\proyectos\ecoMinds\frontend\src\views\administracion\NotificacionesConfigView.vue -->
<template>
  <div class="p-6">
    <PageHeader
      title="Configuración de notificaciones"
      subtitle="Define cuándo y cómo se enviarán los recordatorios automáticos."
    >
      <template #actions>
        <BaseButton variant="ghost" :disabled="notificacionesStore.loading" @click="cargar">
          Actualizar
        </BaseButton>
      </template>
    </PageHeader>

    <div v-if="notificacionesStore.loading" class="mt-4">
      <LoadingState />
    </div>

    <EmptyState
      v-else-if="errorCarga"
      title="No se pudo cargar la configuración"
      :message="errorCarga"
    >
      <BaseButton class="mt-4" @click="cargar">Reintentar</BaseButton>
    </EmptyState>

    <EmptyState
      v-else-if="!notificacionesStore.configs.length"
      title="No hay configuraciones disponibles"
      message="Aún no se han definido reglas de notificación."
    />

    <div v-else class="mt-6 space-y-6">
      <BaseCard v-for="config in notificacionesStore.configs" :key="config.id">
        <h3 class="text-lg font-semibold mb-1">{{ tipoLabel(config.tipo) }}</h3>
        <p class="text-sm text-gray-600 mb-4">{{ tipoDescripcion(config.tipo) }}</p>

        <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
          <BaseInput
            v-model="borrador(config.id).horaEnvio"
            label="Hora de envío"
            type="time"
            required
          />
          <BaseSelect
            :modelValue="String(borrador(config.id).activo)"
            label="Activo"
            :options="estadoOptions"
            @update:modelValue="valor => borrador(config.id).activo = valor === 'true'"
          />
        </div>

        <div class="mt-4">
          <label class="block text-sm font-medium mb-2">Rangos de días (separados por coma)</label>
          <BaseInput
            v-model="borrador(config.id).rangosDias"
            placeholder="30, 15, 1, 0"
            :error="erroresRangos[config.id]"
            help="Indica días enteros antes del evento; usa 0 para el mismo día."
          />
        </div>

        <div class="mt-4">
          <BaseInput v-model="borrador(config.id).plantillaAsunto" label="Asunto del correo" />
        </div>

        <div class="mt-4">
          <label :for="`plantilla-cuerpo-${config.id}`" class="block text-sm font-medium mb-2">
            Cuerpo del correo
          </label>
          <textarea
            :id="`plantilla-cuerpo-${config.id}`"
            v-model="borrador(config.id).plantillaCuerpo"
            rows="4"
            class="w-full border rounded p-2"
          ></textarea>
        </div>

        <div class="mt-4 flex justify-end">
          <BaseButton :loading="guardandoIds.has(config.id)" @click="guardar(config)">
            Guardar
          </BaseButton>
        </div>
      </BaseCard>
    </div>
  </div>
</template>

<script setup>
import { onMounted, ref } from 'vue';
import { useToast } from 'vue-toastification';
import { apiMessage } from '@/api/axios';
import { useNotificacionesStore } from '@/stores/notificaciones';
import PageHeader from '@/components/ui/PageHeader.vue';
import BaseCard from '@/components/ui/BaseCard.vue';
import BaseInput from '@/components/ui/BaseInput.vue';
import BaseSelect from '@/components/ui/BaseSelect.vue';
import BaseButton from '@/components/ui/BaseButton.vue';
import LoadingState from '@/components/ui/LoadingState.vue';
import EmptyState from '@/components/ui/EmptyState.vue';

const notificacionesStore = useNotificacionesStore();
const toast = useToast();
const borradores = ref({});
const erroresRangos = ref({});
const guardandoIds = ref(new Set());
const errorCarga = ref('');

const estadoOptions = [
  { value: 'true', label: 'Sí' },
  { value: 'false', label: 'No' },
];

const tipoLabel = (tipo) => ({
  documento_vencimiento: 'Vencimiento de documentos',
  auditoria: 'Auditorías',
}[tipo] || tipo);

const tipoDescripcion = (tipo) => ({
  documento_vencimiento: 'Recordatorios para documentos próximos a vencer.',
  auditoria: 'Recordatorios de auditorías programadas.',
}[tipo] || 'Configuración de notificación.');

const normalizarHora = (hora) => String(hora || '').slice(0, 5);

const crearBorrador = (config) => ({
  rangosDias: Array.isArray(config.rangosDias) ? config.rangosDias.join(', ') : '',
  horaEnvio: normalizarHora(config.horaEnvio),
  activo: Boolean(config.activo),
  plantillaAsunto: config.plantillaAsunto || '',
  plantillaCuerpo: config.plantillaCuerpo || '',
});

const borrador = (id) => borradores.value[id] || (borradores.value[id] = {});

const cargar = async () => {
  errorCarga.value = '';
  try {
    await notificacionesStore.fetchConfigs();
    borradores.value = Object.fromEntries(
      notificacionesStore.configs.map((config) => [config.id, crearBorrador(config)]),
    );
    erroresRangos.value = {};
  } catch (error) {
    errorCarga.value = apiMessage(error, 'Intenta nuevamente en unos minutos.');
  }
};

const parsearRangosDias = (valor) => {
  const valores = valor.split(',').map((dia) => dia.trim());
  if (!valores.length || valores.some((dia) => !/^\d+$/.test(dia))) {
    return null;
  }

  const rangosDias = valores.map(Number);
  return new Set(rangosDias).size === rangosDias.length ? rangosDias : null;
};

const guardar = async (config) => {
  const datos = borrador(config.id);
  const rangosDias = parsearRangosDias(datos.rangosDias);

  if (!rangosDias) {
    erroresRangos.value[config.id] = 'Ingresa días enteros no repetidos, separados por coma.';
    return;
  }

  erroresRangos.value[config.id] = '';
  guardandoIds.value.add(config.id);
  try {
    await notificacionesStore.updateConfig(config.id, {
      rangosDias,
      horaEnvio: datos.horaEnvio,
      activo: datos.activo,
      plantillaAsunto: datos.plantillaAsunto.trim() || null,
      plantillaCuerpo: datos.plantillaCuerpo.trim() || null,
    });
    borradores.value[config.id] = crearBorrador(
      notificacionesStore.configs.find((item) => item.id === config.id),
    );
    toast.success('Configuración actualizada');
  } catch (error) {
    toast.error(apiMessage(error, 'No se pudo guardar la configuración'));
  } finally {
    guardandoIds.value.delete(config.id);
  }
};

onMounted(cargar);
</script>