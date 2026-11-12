<script setup lang="ts">
import type { PropType } from 'vue';
import { AlertTriangle } from 'lucide-vue-next';
import type { Ticket } from '../types/ticket';
import BaseModale from './BaseModale.vue';

defineProps({
  ticket: {
    type: Object as PropType<Ticket>,
    required: true,
  },
  enCours: {
    type: Boolean,
    default: false,
  },
});

const emit = defineEmits({
  confirmer: null,
  annuler: null,
});
</script>

<template>
  <BaseModale titre-label-id="suppression-modale-titre" @fermer="emit('annuler')">
    <template #titre>Confirmer la suppression</template>

    <div class="flex items-start gap-3">
      <div class="p-2 rounded-lg bg-rose-50 dark:bg-rose-950/60 text-rose-600 dark:text-rose-400 shrink-0">
        <AlertTriangle class="w-5 h-5" aria-hidden="true" />
      </div>
      <div class="space-y-1.5 text-sm">
        <p class="text-slate-700 dark:text-slate-200 leading-relaxed">
          Voulez-vous vraiment supprimer définitivement le ticket
          <span class="font-mono-tabular font-semibold">#{{ ticket.id }}</span>
          « <strong class="font-semibold text-slate-900 dark:text-white">{{ ticket.titre }}</strong> » ?
        </p>
        <p class="text-xs text-slate-500 dark:text-slate-400">
          Cette action est irréversible et supprime également les commentaires associés.
        </p>
      </div>
    </div>

    <template #actions>
      <button
        type="button"
        :disabled="enCours"
        class="inline-flex items-center justify-center min-h-[40px] px-4 py-2 text-sm font-medium text-slate-700 dark:text-slate-200 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-700 disabled:opacity-50 rounded-lg transition-colors whitespace-nowrap"
        @click="emit('annuler')"
      >
        Annuler
      </button>
      <button
        type="button"
        :disabled="enCours"
        class="inline-flex items-center justify-center min-h-[40px] px-4 py-2 text-sm font-semibold text-white bg-rose-600 hover:bg-rose-700 disabled:opacity-50 disabled:cursor-not-allowed rounded-lg transition-colors whitespace-nowrap"
        @click="emit('confirmer')"
      >
        {{ enCours ? 'Suppression...' : 'Supprimer définitivement' }}
      </button>
    </template>
  </BaseModale>
</template>
