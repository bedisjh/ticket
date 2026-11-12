<script setup lang="ts">
import { computed, type PropType } from 'vue';
import type { StatutTicket, Ticket } from '../types/ticket';
import { STATUTS_ORDRE } from '../services/ticketService';

const props = defineProps({
  tickets: {
    type: Array as PropType<Ticket[]>,
    required: true,
  },
  statutActif: {
    type: String as PropType<StatutTicket | ''>,
    default: '',
  },
});

const emit = defineEmits({
  selectionner: (statut: StatutTicket | '') =>
    statut === '' || STATUTS_ORDRE.includes(statut as StatutTicket),
});

const compteurs = computed(() => {
  const comptes: Record<StatutTicket, number> = {
    Ouvert: 0,
    'En cours': 0,
    Résolu: 0,
    Fermé: 0,
  };
  for (const t of props.tickets) {
    if (comptes[t.statut] !== undefined) {
      comptes[t.statut]++;
    }
  }
  return STATUTS_ORDRE.map((statut) => ({
    statut,
    total: comptes[statut],
  }));
});

function couleurAccent(statut: StatutTicket): string {
  if (statut === 'Ouvert') return 'text-amber-600 dark:text-amber-400';
  if (statut === 'En cours') return 'text-sky-600 dark:text-sky-400';
  if (statut === 'Résolu') return 'text-emerald-600 dark:text-emerald-400';
  return 'text-slate-500 dark:text-slate-400';
}

function basculerFiltre(statut: StatutTicket) {
  emit('selectionner', props.statutActif === statut ? '' : statut);
}
</script>

<template>
  <div class="grid grid-cols-2 sm:grid-cols-4 gap-3" role="group" aria-label="Tableau de bord par statut">
    <button
      v-for="item in compteurs"
      :key="item.statut"
      type="button"
      class="text-left p-4 rounded-xl border transition-colors focus-visible:outline-2 focus-visible:outline-teal-600 dark:focus-visible:outline-teal-400"
      :class="
        statutActif === item.statut
          ? 'bg-teal-50/70 dark:bg-teal-950/50 border-teal-600 dark:border-teal-500'
          : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700'
      "
      @click="basculerFiltre(item.statut)"
    >
      <div class="text-xs font-medium text-slate-500 dark:text-slate-400">
        {{ item.statut }}
      </div>
      <div class="mt-1.5 font-mono-tabular text-2xl font-bold" :class="couleurAccent(item.statut)">
        {{ item.total }}
      </div>
    </button>
  </div>
</template>
