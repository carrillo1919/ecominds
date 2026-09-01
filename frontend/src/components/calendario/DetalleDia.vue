<template>
  <div class="h-full flex flex-col text-white">
    <h3 class="text-2xl font-light mb-1 text-white">
      {{ tituloDia }}
    </h3>
    <p class="text-sm text-white/70 mb-6">
      {{ subtituloDia }}
    </p>

    <!-- Input estilo referencia para agregar -->
    <div class="flex items-center gap-2 border-b border-white/30 pb-2 mb-4">
      <!-- Botón para agregar evento -->
    <button
      type="button"
      class="w-full inline-flex items-center justify-center gap-1 px-3 py-1.5 text-sm bg-[var(--surface-alt)] border border-[var(--border)] rounded-md text-[var(--navy-800)] hover:bg-white hover:border-[var(--primary)] transition-colors mb-4"
      @click="$emit('nuevo-evento', fecha)"
    >
      <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4" />
      </svg>
      Agregar evento
    </button>
    </div>

   

    <div v-if="!eventos.length" class="text-sm text-white/70">
      Sin eventos para este día.
    </div>

    <!-- Lista de eventos / notas -->
    <div v-else class="space-y-3 overflow-y-auto pr-1">
      <div
        v-for="evento in eventos"
        :key="evento.id"
        class="bg-white/10 backdrop-blur-sm border border-white/10 rounded-lg p-3 hover:bg-white/15 transition-colors"
      >
        <div class="flex items-start gap-2">
          <div class="flex-1 min-w-0">
            <div class="flex items-center gap-2 mb-1">
              <span
                class="w-2.5 h-2.5 rounded-full flex-shrink-0"
                :style="{ backgroundColor: evento.color || '#ffffff' }"
              ></span>
              <h4 class="text-sm font-semibold text-white line-clamp-2">
                {{ evento.tipo === 'compromiso' ? 'Compromiso de cumplimiento' : evento.titulo }}
              </h4>
              <span
                v-if="evento.tipo === 'nota' && evento.privacidad === 'privado'"
                class="ml-auto text-[10px] px-1.5 py-0.5 rounded bg-white/20 text-white/90"
                title="Solo tú puedes ver esta nota"
              >
                Privada
              </span>
            </div>

            <p
              v-if="evento.empresa"
              class="text-xs text-white/80 line-clamp-1 mb-1"
            >
              {{ evento.empresa }}
            </p>
            <p
              v-else-if="evento.tipo === 'nota' && evento.privacidad === 'publico'"
              class="text-xs text-white/60 line-clamp-1 mb-1"
            >
              Todas las empresas
            </p>

            
          </div>
          
        </div>

        <div class="flex gap-2 mt-3">
          <button
            type="button"
            class="flex-1 inline-flex items-center justify-center gap-1 text-xs px-3 py-1.5 bg-white/10 border border-white/20 rounded-md text-white hover:bg-white/20 transition-colors"
            @click="verEvento(evento)"
          >
            Ver
          </button>
          <button
            v-if="evento.origen === 'calendario'"
            type="button"
            class="flex-1 inline-flex items-center justify-center gap-1 text-xs px-3 py-1.5 bg-white/10 border border-white/20 rounded-md text-white hover:bg-white/20 transition-colors"
            @click="$emit('editar-evento', evento)"
          >
            Editar
          </button>
        </div>
      </div>
    </div>

    <!-- Modal de detalle -->
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
  });
});

const subtituloDia = computed(() => {
  if (!props.fecha) return "";
  const [anio, mes, dia] = props.fecha.split("-").map(Number);
  const fecha = new Date(anio, mes - 1, dia);
  return fecha.toLocaleDateString("es-MX", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
});

const etiquetaTipo = (evento) => {
  const etiquetas = {
    auditoria: "Auditoría",
    documento: "Documento",
    compromiso: "Compromiso de cumplimiento",
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
    eventoDetalle.value = evento;
  }
};
</script>
