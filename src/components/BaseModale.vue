<script setup lang="ts">
import { onMounted, onUnmounted } from 'vue';
import { X } from 'lucide-vue-next';

defineProps({
  titreLabelId: {
    type: String,
    default: 'modale-titre',
  },
});

const emit = defineEmits({
  fermer: null,
});

function gererTouche(event: KeyboardEvent) {
  if (event.key === 'Escape') {
    emit('fermer');
  }
}

onMounted(() => window.addEventListener('keydown', gererTouche));
onUnmounted(() => window.removeEventListener('keydown', gererTouche));
</script>

<template>
  <div
    class="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/70 backdrop-blur-xs p-4"
    role="dialog"
    aria-modal="true"
    :aria-labelledby="titreLabelId"
    @click.self="emit('fermer')"
  >
    <div class="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl w-full max-w-md overflow-hidden shadow-xl">
      <header class="flex items-center justify-between px-5 py-4 border-b border-slate-200 dark:border-slate-800">
        <h2 :id="titreLabelId" class="font-display text-base font-semibold text-slate-900 dark:text-slate-100">
          <slot name="titre">Sans titre</slot>
        </h2>
        <button
          type="button"
          class="p-2 text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors focus-visible:outline-2 focus-visible:outline-teal-600 dark:focus-visible:outline-teal-400"
          aria-label="Fermer"
          @click="emit('fermer')"
        >
          <X class="w-5 h-5" aria-hidden="true" />
        </button>
      </header>

      <main class="p-5">
        <slot />
      </main>

      <footer
        v-if="$slots.actions"
        class="px-5 py-4 border-t border-slate-100 dark:border-slate-800 flex items-center justify-end gap-3"
      >
        <slot name="actions" />
      </footer>
    </div>
  </div>
</template>
