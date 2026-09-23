<script setup>
import { computed, ref, watch } from 'vue';
import { UNIDADES_MEDIDA, UNIDAD_POR_DEFECTO } from '@/utils/unidades';

const UNIDAD_PERSONALIZADA = '__personalizada__';

const props = defineProps({
  modelValue: { type: String, default: '' },
  porDefecto: { type: String, default: UNIDAD_POR_DEFECTO },
  placeholder: { type: String, default: '' },
});

const emit = defineEmits(['update:modelValue']);

const personalizada = ref(false);
const textoPersonalizado = ref('');

const estaEnCatalogo = (valor) => UNIDADES_MEDIDA.includes(valor);

watch(
  () => props.modelValue,
  (valor) => {
    const limpio = String(valor ?? '').trim();

    if (personalizada.value) {
      if (textoPersonalizado.value === limpio) return;
      if (estaEnCatalogo(limpio)) {
        personalizada.value = false;
        textoPersonalizado.value = '';
        return;
      }
      personalizada.value = limpio !== '';
      textoPersonalizado.value = limpio;
      return;
    }

    if (limpio === '' || estaEnCatalogo(limpio)) return;
    personalizada.value = true;
    textoPersonalizado.value = limpio;
  },
  { immediate: true },
);

const seleccion = computed({
  get() {
    if (personalizada.value) return UNIDAD_PERSONALIZADA;
    const actual = String(props.modelValue ?? '').trim();
    if (estaEnCatalogo(actual)) return actual;
    return props.placeholder ? '' : props.porDefecto;
  },
  set(valor) {
    if (valor === UNIDAD_PERSONALIZADA) {
      personalizada.value = true;
      emit('update:modelValue', textoPersonalizado.value);
      return;
    }
    personalizada.value = false;
    textoPersonalizado.value = '';
    emit('update:modelValue', valor);
  },
});

const onTexto = (event) => {
  textoPersonalizado.value = event.target.value;
  emit('update:modelValue', textoPersonalizado.value);
};
</script>

<template>
  <div class="unidad-medida">
    <select v-model="seleccion" aria-label="Unidad de medida">
      <option v-if="placeholder" value="">{{ placeholder }}</option>
      <option v-for="unidad in UNIDADES_MEDIDA" :key="unidad" :value="unidad">{{ unidad }}</option>
      <option :value="UNIDAD_PERSONALIZADA">Otra (especificar)…</option>
    </select>
    <input
      v-if="personalizada"
      :value="textoPersonalizado"
      type="text"
      maxlength="20"
      placeholder="Escriba la unidad de medida"
      aria-label="Otra unidad de medida"
      @input="onTexto"
    />
  </div>
</template>

<style scoped>
.unidad-medida {
  display: flex;
  flex-direction: column;
  gap: 0.4rem;
}
</style>
