import { defineStore } from 'pinia';
import { ref } from 'vue';
import * as notificacionApi from '../api/notificaciones';

export const useNotificacionesStore = defineStore('notificaciones', () => {
  const configs = ref([]);
  const loading = ref(false);

  const fetchConfigs = async () => {
    loading.value = true;
    const { data } = await notificacionApi.getNotificacionConfigs();
    configs.value = data;
    loading.value = false;
  };

  const updateConfig = async (id, payload) => {
    const { data } = await notificacionApi.updateNotificacionConfig(id, payload);
    const index = configs.value.findIndex((c) => c.id === id);
    if (index !== -1) configs.value[index] = data;
  };

  return { configs, loading, fetchConfigs, updateConfig };
});