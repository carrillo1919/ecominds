<!-- filepath: c:\Users\tf carrillo\Documents\proyectos\ecoMinds\frontend\src\views\administracion\NotificacionesConfigView.vue -->
<template>
  <div class="p-6">
    <PageHeader title="Configuración de notificaciones" />

    <div v-if="notificacionesStore.loading" class="mt-4">
      <LoadingState />
    </div>

    <div v-else class="mt-6 space-y-6">
      <BaseCard v-for="config in notificacionesStore.configs" :key="config.id">
        <h3 class="text-lg font-semibold mb-4 capitalize">{{ config.tipo }}</h3>

        <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
          <BaseInput
            v-model="config.horaEnvio"
            label="Hora de envío"
            type="time"
          />
          <BaseSelect
            v-model="config.activo"
            label="Activo"
            :options="[{ value: true, label: 'Sí' }, { value: false, label: 'No' }]"
          />
        </div>

        <div class="mt-4">
          <label class="block text-sm font-medium mb-2">Rangos de días (separados por coma)</label>
          <BaseInput
            :modelValue="config.rangosDias.join(', ')"
            @update:modelValue="val => config.rangosDias = val.split(',').map(n => Number(n.trim()))"
          />
        </div>

        <div class="mt-4">
          <BaseInput v-model="config.plantillaAsunto" label="Asunto del correo" />
        </div>

        <div class="mt-4">
          <label class="block text-sm font-medium mb-2">Cuerpo del correo</label>
          <textarea
            v-model="config.plantillaCuerpo"
            rows="4"
            class="w-full border rounded p-2"
          ></textarea>
        </div>

        <div class="mt-4 flex justify-end">
          <BaseButton @click="guardar(config)">Guardar</BaseButton>
        </div>
      </BaseCard>
    </div>
  </div>
</template>

<script setup>
import { onMounted } from 'vue';
import { useNotificacionesStore } from '@/stores/notificaciones';
import PageHeader from '@/components/ui/PageHeader.vue';
import BaseCard from '@/components/ui/BaseCard.vue';
import BaseInput from '@/components/ui/BaseInput.vue';
import BaseSelect from '@/components/ui/BaseSelect.vue';
import BaseButton from '@/components/ui/BaseButton.vue';
import LoadingState from '@/components/ui/LoadingState.vue';

const notificacionesStore = useNotificacionesStore();

onMounted(() => {
  notificacionesStore.fetchConfigs();
});

const guardar = async (config) => {
  await notificacionesStore.updateConfig(config.id, {
    rangosDias: config.rangosDias,
    horaEnvio: config.horaEnvio,
    activo: config.activo,
    plantillaAsunto: config.plantillaAsunto,
    plantillaCuerpo: config.plantillaCuerpo,
  });
};
</script>