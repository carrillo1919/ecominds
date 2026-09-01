<!-- filepath: c:\Users\tf carrillo\Documents\proyectos\ecoMinds\frontend\src\components\calendario\ModalEvento.vue -->
<template>
  <Teleport to="body">
    <div
      v-if="visible"
      class="fixed inset-0 z-50 flex items-center justify-center bg-black/40"
      @click.self="cerrar"
    >
      <div class="bg-white rounded-lg shadow-lg w-full max-w-md mx-4 overflow-hidden">
        <div
          class="flex items-center justify-between p-4 text-white"
          style="background: linear-gradient(135deg, var(--navy-800), var(--primary));"
        >
          <h3 class="text-lg font-semibold">
            {{ evento ? 'Editar evento' : 'Nuevo evento' }}
          </h3>
          <button
            type="button"
            class="text-white/70 hover:text-white transition-colors"
            @click="cerrar"
          >
            ✕
          </button>
        </div>

        <div class="space-y-4 p-4">
          <div class="flex gap-4">
            <label class="flex-1">
              <span class="text-sm text-gray-600">Tipo</span>
              <select
                v-model="form.tipo"
                :disabled="!!evento"
                class="w-full mt-1 p-2 border rounded"
              >
                <option value="nota">Nota</option>
                <option value="auditoria">Auditoría</option>
              </select>
            </label>

            <label class="flex-1">
              <span class="text-sm text-gray-600">Fecha</span>
              <input
                v-model="form.fecha"
                type="date"
                class="w-full mt-1 p-2 border rounded"
              />
            </label>
          </div>

          <!-- Campos solo para notas / edición -->
          <template v-if="form.tipo === 'nota' || evento">
            <label class="block">
              <span class="text-sm text-gray-600">Título</span>
              <input
                v-model="form.titulo"
                type="text"
                class="w-full mt-1 p-2 border rounded"
                placeholder="Título del evento"
              />
            </label>

            <label class="block">
              <span class="text-sm text-gray-600">Descripción</span>
              <textarea
                v-model="form.descripcion"
                rows="3"
                class="w-full mt-1 p-2 border rounded"
                placeholder="Descripción opcional"
              ></textarea>
            </label>
          </template>

          <label v-if="form.tipo === 'auditoria' && !evento" class="block">
            <span class="text-sm text-gray-600">Empresa</span>
            <select v-model="form.empresaId" class="w-full mt-1 p-2 border rounded">
              <option value="">Seleccione una empresa</option>
              <option
                v-for="empresa in empresas"
                :key="empresa.id"
                :value="empresa.id"
              >
                {{ nombreEmpresa(empresa) }}
              </option>
            </select>

            <span v-if="cargandoEmpresas" class="text-xs text-gray-500">
              Cargando empresas...
            </span>
            <span v-else-if="errorEmpresas" class="text-xs text-red-600">
              {{ errorEmpresas }}
            </span>
            <span v-else-if="!empresas.length" class="text-xs text-gray-500">
              No hay empresas registradas o no tienes acceso a ninguna.
              <button
                type="button"
                class="text-blue-600 underline"
                @click="cargarEmpresas"
              >
                Reintentar
              </button>
            </span>
          </label>

          <label v-if="form.tipo === 'nota'" class="block">
            <span class="text-sm text-gray-600">Color</span>
            <input
              v-model="form.color"
              type="color"
              class="mt-1 h-10 w-16 border rounded"
            />
          </label>

          <label v-if="form.tipo === 'nota'" class="block">
            <span class="text-sm text-gray-600">Privacidad</span>
            <select v-model="form.privacidad" class="w-full mt-1 p-2 border rounded">
              <option value="publico">Pública</option>
              <option value="privado">Privada (solo yo)</option>
            </select>
          </label>

          <label v-if="form.tipo === 'nota'" class="block">
            <span class="text-sm text-gray-600">Visible para</span>
            <select v-model="form.empresaId" class="w-full mt-1 p-2 border rounded">
              <option value="">Todas las empresas</option>
              <option
                v-for="empresa in empresas"
                :key="empresa.id"
                :value="empresa.id"
              >
                {{ nombreEmpresa(empresa) }}
              </option>
            </select>
          </label>

          <p v-if="error" class="text-red-600 text-sm">{{ error }}</p>

          <div class="flex justify-end gap-2">
            <button
              type="button"
              class="px-4 py-2 text-sm bg-gray-100 rounded hover:bg-gray-200"
              @click="cerrar"
            >
              Cancelar
            </button>
            <button
              type="button"
              class="px-4 py-2 text-sm bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50"
              :disabled="guardando"
              @click="guardar"
            >
              {{ guardando ? 'Guardando...' : 'Guardar' }}
            </button>
          </div>
        </div>
      </div>
    </div>
  </Teleport>
</template>

<script setup>
import { ref, reactive, watch, onMounted } from 'vue';
import api from '../../api/axios';
import { useCalendarioStore } from '../../stores/calendario';
import { useAuditoriasStore } from '../../stores/auditorias';

const props = defineProps({
  visible: { type: Boolean, default: false },
  fecha: { type: String, default: null },
  evento: { type: Object, default: null },
});

const emit = defineEmits(['close', 'guardado']);

const calendarioStore = useCalendarioStore();
const auditoriasStore = useAuditoriasStore();

const error = ref('');
const guardando = ref(false);

const form = reactive({
  titulo: '',
  descripcion: '',
  fecha: props.fecha || new Date().toISOString().slice(0, 10),
  tipo: 'nota',
  color: '#10b981',
  empresaId: '',
  privacidad: 'publico',
});

const empresas = ref([]);
const cargandoEmpresas = ref(false);
const errorEmpresas = ref('');

const nombreEmpresa = (empresa) =>
  empresa.nombre ||
  empresa.razonSocial ||
  empresa.nombreComercial ||
  `Empresa ${empresa.id}`;

const cargarEmpresas = async () => {
  cargandoEmpresas.value = true;
  errorEmpresas.value = '';
  try {
    const response = await api.get('/empresas');
    const data = response.data ?? response;
    const lista = Array.isArray(data)
      ? data
      : (data.empresas ?? data.data ?? data.rows ?? []);
    empresas.value = lista;

    // Si solo hay una empresa, selecciónala automáticamente.
    if (lista.length === 1) {
      form.empresaId = lista[0].id;
    }
  } catch (e) {
    errorEmpresas.value =
      e.response?.data?.message || e.message || 'Error al cargar empresas';
  } finally {
    cargandoEmpresas.value = false;
  }
};

onMounted(cargarEmpresas);

watch(
  () => props.visible,
  (visible) => {
    if (!visible) return;
    error.value = '';
    guardando.value = false;

    if (props.evento) {
      form.titulo = props.evento.titulo || '';
      form.descripcion = props.evento.descripcion || '';
      form.fecha = props.evento.fecha || props.fecha;
      form.tipo = props.evento.tipo === 'auditoria' ? 'auditoria' : 'nota';
      form.color = props.evento.color || '#10b981';
      form.empresaId = props.evento.empresaId || '';
      form.privacidad = props.evento.privacidad || 'publico';
    } else {
      form.titulo = '';
      form.descripcion = '';
      form.fecha = props.fecha;
      form.tipo = 'nota';
      form.color = '#10b981';
      form.empresaId = '';
      form.privacidad = 'publico';
    }
  }
);

const cerrar = () => {
  emit('close');
};

const guardar = async () => {
  error.value = '';

  if (form.tipo === 'nota' && !form.titulo.trim()) {
    error.value = 'El título es obligatorio.';
    return;
  }
  if (!form.fecha) {
    error.value = 'La fecha es obligatoria.';
    return;
  }

  guardando.value = true;

  try {
    if (props.evento) {
      await calendarioStore.actualizarEvento(props.evento.entidadId || props.evento.id, {
        titulo: form.titulo,
        descripcion: form.descripcion,
        fecha: form.fecha,
        color: form.color,
        privacidad: form.privacidad,
        empresaId: form.empresaId || undefined,
      });
    } else if (form.tipo === 'auditoria') {
      if (!form.empresaId) {
        error.value = 'Debe seleccionar una empresa para crear la auditoría.';
        guardando.value = false;
        return;
      }

      const resultado = await auditoriasStore.create({
        fecha: form.fecha,
        empresaId: form.empresaId,
      });

      if (!resultado.ok) {
        throw new Error(resultado.message);
      }
    } else {
      await calendarioStore.crearEvento({
        titulo: form.titulo,
        descripcion: form.descripcion,
        fecha: form.fecha,
        tipo: 'nota',
        color: form.color,
        privacidad: form.privacidad,
        empresaId: form.empresaId || undefined,
      });
    }

    emit('guardado');
  } catch (e) {
    error.value = e.response?.data?.message || e.message || 'Error al guardar el evento.';
  } finally {
    guardando.value = false;
  }
};
</script>