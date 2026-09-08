<script setup>
import { onMounted, onUnmounted } from 'vue';

const props = defineProps({
  show: { type: Boolean, default: false },
  title: { type: String, default: '' },
});

const emit = defineEmits(['close']);

const close = () => emit('close');
const onKeydown = (event) => {
  if (event.key === 'Escape' && props.show) close();
};

onMounted(() => window.addEventListener('keydown', onKeydown));
onUnmounted(() => window.removeEventListener('keydown', onKeydown));
</script>

<template>
  <Teleport to="body">
    <Transition name="sheet">
      <div v-if="show" class="bottom-sheet" role="dialog" aria-modal="true">
        <div class="bottom-sheet__backdrop" @click.self="close"></div>
        <div class="bottom-sheet__panel">
          <div class="bottom-sheet__handle"></div>
          <div v-if="title || $slots.header" class="bottom-sheet__header">
            <slot name="header">
              <h3 class="bottom-sheet__title">{{ title }}</h3>
            </slot>
            <button type="button" class="bottom-sheet__close" aria-label="Cerrar" @click="close">&times;</button>
          </div>
          <div class="bottom-sheet__body">
            <slot />
          </div>
          <div v-if="$slots.footer" class="bottom-sheet__footer">
            <slot name="footer" />
          </div>
        </div>
      </div>
    </Transition>
  </Teleport>
</template>

<style scoped>
.bottom-sheet {
  position: fixed;
  inset: 0;
  z-index: 50;
  display: flex;
  flex-direction: column;
  justify-content: flex-end;
}
.bottom-sheet__backdrop {
  position: absolute;
  inset: 0;
  background: rgba(0, 0, 0, 0.45);
}
.bottom-sheet__panel {
  position: relative;
  background: #fff;
  border-radius: 1rem 1rem 0 0;
  max-height: 85vh;
  overflow-y: auto;
  padding: 0.75rem 1.25rem 1.25rem;
  box-shadow: 0 -4px 20px rgba(0, 0, 0, 0.15);
}
.bottom-sheet__handle {
  width: 40px;
  height: 4px;
  border-radius: 999px;
  background: var(--border);
  margin: 0 auto 0.75rem;
}
.bottom-sheet__header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 1rem;
}
.bottom-sheet__title { margin: 0; font-size: 1.125rem; font-weight: 600; }
.bottom-sheet__close {
  background: transparent;
  border: none;
  font-size: 1.5rem;
  line-height: 1;
  color: var(--text-muted);
  cursor: pointer;
}
.bottom-sheet__footer {
  display: flex;
  gap: 0.75rem;
  justify-content: flex-end;
  margin-top: 1rem;
  padding-top: 1rem;
  border-top: 1px solid var(--border);
}
.sheet-enter-active, .sheet-leave-active { transition: opacity 0.2s; }
.sheet-enter-from, .sheet-leave-to { opacity: 0; }
.sheet-enter-active .bottom-sheet__panel,
.sheet-leave-active .bottom-sheet__panel {
  transition: transform 0.2s ease-out;
}
.sheet-enter-from .bottom-sheet__panel,
.sheet-leave-to .bottom-sheet__panel {
  transform: translateY(100%);
}

@media (min-width: 701px) {
  .bottom-sheet { display: none; }
}
</style>
