<!-- filepath: c:\Users\tf carrillo\Documents\proyectos\ecoMinds\frontend\src\components\calendario\DetalleDia.vue -->
<template>
  <div>
    <div class="bg-white rounded-lg shadow p-4">
      <h3 class="text-lg font-semibold text-gray-800">{{ tituloDia }}</h3>

      <button
        type="button"
        class="mt-2 w-full px-3 py-1.5 text-sm bg-blue-600 text-white rounded hover:bg-blue-700"
        @click="$emit('nuevo-evento', fecha)"
      >
        + Agregar evento
      </button>

      <div v-if="!eventos.length" class="mt-4 text-sm text-gray-500">
        Sin eventos para este día.
      </div>

      <ul v-else class="mt-4 space-y-2">
        <li
          v-for="evento in eventos"
          :key="evento.id"
          class="border rounded p-2 hover:bg-gray-50"
        >
          <div class="flex items-center gap-2">
            <span
              class="w-2 h-2 rounded-full"
              :style="{ backgroundColor: evento.color || '#6b7280' }"
            ></span>
            <span class="text-sm font-medium text-gray-800 truncate">
              {{ evento.titulo }}
            </span>
          </div>

          <div class="text-xs text-gray-500 ml-4 mt-1">
            {{ etiquetaTipo(evento) }}
          </div>

          <div class="ml-4 mt-1">
            <button
              type="button"
              class="text-xs text-blue-600 hover:underline"
              @click="verEvento(evento)"
            >
              Ver
            </button>
            <button
              v-if="evento.origen === 'calendario'"
              type="button"
              class="text-xs text-gray-500 hover:underline ml-2"
              @click="$emit('editar-evento', evento)"
            >
              Editar
            </button>
          </div>
        </li>
      </ul>
    </div>

    <!-- Modal de detalle para notas y eventos no navegables -->
    <Teleport to="body">
      <div
        v-if="eventoDetalle"
        class="fixed inset-0 z-50 flex items-center justify-center bg-black/40"
        @click.self="cerrarDetalle"
      >
        <div class="bg-white rounded-lg shadow-lg w-full max-w-md mx-4">
          <div class="flex items-center justify-between p-4 border-b">
            <h3 class="text-lg font-semibold text-gray-800">
              {{ eventoDetalle.titulo }}
            </h3>
            <button
              type="button"
              class="text-gray-400 hover:text-gray-600"
              @click="cerrarDetalle"
            >
              ✕
            </button>
          </div>

          <dl class="p-4 space-y-2 text-sm">
            <div class="flex gap-2">
              <dt class="text-gray-500 w-24">Tipo:</dt>
              <dd>{{ etiquetaTipo(eventoDetalle) }}</dd>
            </div>
            <div class="flex gap-2">
              <dt class="text-gray-500 w-24">Fecha:</dt>
              <dd>{{ eventoDetalle.fecha }}</dd>
            </div>
            <div v-if="eventoDetalle.descripcion" class="flex gap-2">
              <dt class="text-gray-500 w-24">Descripción:</dt>
              <dd>{{ eventoDetalle.descripcion }}</dd>
            </div>
            <div class="flex gap-2 items-center">
              <dt class="text-gray-500 w-24">Color:</dt>
              <dd>
                <span
                  class="inline-block w-4 h-4 rounded-full"
                  :style="{ backgroundColor: eventoDetalle.color || '#6b7280' }"
                ></span>
              </dd>
            </div>
          </dl>
        </div>
      </div>
    </Teleport>
  </div>
</template>

<script setup>
import { ref, computed } from "vue";
import { useRouter } from "vue-router";

const props = defineProps({
  fecha: { type: String, required: true },
  eventos: { type: Array, default: () => [] },
});

const emit = defineEmits(["nuevo-evento", "editar-evento"]);
const router = useRouter();

const eventoDetalle = ref(null);

const tituloDia = computed(() => {
  if (!props.fecha) return "";
  const [anio, mes, dia] = props.fecha.split("-").map(Number);
  const fecha = new Date(anio, mes - 1, dia);
  return fecha.toLocaleDateString("es-MX", {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
  });
});

const etiquetaTipo = (evento) => {
  const etiquetas = {
    auditoria: "Auditoría",
    documento: "Documento",
    compromiso: "Compromiso",
    nota: "Nota",
  };
  return etiquetas[evento.tipo] || evento.tipo;
};

const esNavegable = (evento) =>
  (evento.tipo === "documento" && evento.documentoId) ||
  (evento.tipo === "compromiso" && evento.auditoriaId) ||
  (evento.tipo === "auditoria" && evento.auditoriaId);

const verEvento = (evento) => {
  if (esNavegable(evento)) {
    irAlDetalle(evento);
  } else {
    eventoDetalle.value = evento;
  }
};

const cerrarDetalle = () => {
  eventoDetalle.value = null;
};

const irAlDetalle = (evento) => {
  if (evento.tipo === "documento" && evento.documentoId) {
    router.push({
      name: "documento-detalle",
      params: { id: evento.documentoId },
    });
  } else if (
    (evento.tipo === "compromiso" || evento.tipo === "auditoria") &&
    evento.auditoriaId
  ) {
    router.push({
      name: "auditoria-detalle",
      params: { id: evento.auditoriaId },
    });
  } else {
    // Si no tiene ID navegable, mostrar el modal de detalle
    eventoDetalle.value = evento;
  }
};
</script>
