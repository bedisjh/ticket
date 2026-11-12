<script setup lang="ts">
import { computed, type PropType } from 'vue';
import { ArrowRight, Calendar, Eye, Trash2, User } from 'lucide-vue-next';
import type { Ticket } from '../types/ticket';
import { getStatutSuivant } from '../services/ticketService';

const props = defineProps({
  ticket: {
    type: Object as PropType<Ticket>,
    required: true,
  },
  enCoursStatut: {
    type: Boolean,
    default: false,
  },
});

const emit = defineEmits({
  ouvrir: (id: number) => typeof id === 'number' && id > 0,
  avancerStatut: (ticket: Ticket) => Boolean(ticket && ticket.id),
  supprimer: (ticket: Ticket) => Boolean(ticket && ticket.id),
});

const statutSuivant = computed(() => getStatutSuivant(props.ticket.statut));

const couleurPriorite = computed(() => {
  if (props.ticket.priorite === 'Haute') return 'text-rose-600 dark:text-rose-400 font-semibold';
  if (props.ticket.priorite === 'Moyenne') return 'text-amber-600 dark:text-amber-400 font-medium';
  return 'text-slate-600 dark:text-slate-400 font-medium';
});

const couleurStatut = computed(() => {
  if (props.ticket.statut === 'Ouvert') return 'text-amber-600 dark:text-amber-400 font-semibold';
  if (props.ticket.statut === 'En cours') return 'text-sky-600 dark:text-sky-400 font-semibold';
  if (props.ticket.statut === 'Résolu') return 'text-emerald-600 dark:text-emerald-400 font-semibold';
  return 'text-slate-500 dark:text-slate-400 font-medium';
});
</script>

<template>
  <article
    class="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-4 sm:p-5 hover:border-slate-300 dark:hover:border-slate-700 transition-colors cursor-pointer"
    @click="emit('ouvrir', ticket.id)"
  >
    <div class="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
      <div class="min-w-0 flex-1 space-y-1.5">
        <div class="flex flex-wrap items-center gap-x-2.5 gap-y-1 text-xs text-slate-500 dark:text-slate-400">
          <span class="font-mono-tabular font-semibold text-slate-700 dark:text-slate-300">
            #{{ ticket.id }}
          </span>
          <span aria-hidden="true">·</span>
          <span :class="couleurStatut">Statut : {{ ticket.statut }}</span>
          <span aria-hidden="true">·</span>
          <span :class="couleurPriorite">Priorité : {{ ticket.priorite }}</span>
        </div>

        <h2 class="font-display text-base font-semibold text-slate-900 dark:text-slate-100 truncate">
          {{ ticket.titre }}
        </h2>

        <p class="text-sm text-slate-600 dark:text-slate-400 line-clamp-2">
          {{ ticket.description }}
        </p>

        <div class="pt-1 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-slate-500 dark:text-slate-400">
          <span class="inline-flex items-center gap-1.5">
            <User class="w-3.5 h-3.5 shrink-0" aria-hidden="true" />
            <span>{{ ticket.demandeur }}</span>
          </span>
          <span aria-hidden="true">·</span>
          <span class="inline-flex items-center gap-1.5 font-mono-tabular">
            <Calendar class="w-3.5 h-3.5 shrink-0" aria-hidden="true" />
            <span>{{ ticket.dateCreation }}</span>
          </span>
        </div>
      </div>

      <div class="flex flex-wrap sm:flex-nowrap items-center gap-2 shrink-0">
        <button
          v-if="statutSuivant"
          type="button"
          :disabled="enCoursStatut"
          class="inline-flex items-center justify-center gap-1.5 min-h-[40px] px-3.5 py-2 text-xs sm:text-sm font-medium text-teal-700 dark:text-teal-300 bg-teal-50 dark:bg-teal-950/70 hover:bg-teal-100 dark:hover:bg-teal-900/70 disabled:opacity-50 disabled:cursor-not-allowed rounded-lg transition-colors whitespace-nowrap shrink-0 focus-visible:outline-2 focus-visible:outline-teal-600 dark:focus-visible:outline-teal-400"
          @click.stop="emit('avancerStatut', ticket)"
        >
          <ArrowRight class="w-3.5 h-3.5 shrink-0" aria-hidden="true" />
          <span>{{ enCoursStatut ? 'Mise à jour...' : `Passer à ${statutSuivant}` }}</span>
        </button>

        <button
          type="button"
          class="inline-flex items-center justify-center gap-1.5 min-h-[40px] px-3.5 py-2 text-xs sm:text-sm font-medium text-slate-700 dark:text-slate-200 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-lg transition-colors whitespace-nowrap shrink-0 focus-visible:outline-2 focus-visible:outline-teal-600 dark:focus-visible:outline-teal-400"
          @click.stop="emit('ouvrir', ticket.id)"
        >
          <Eye class="w-3.5 h-3.5 shrink-0" aria-hidden="true" />
          <span>Détails</span>
        </button>

        <button
          type="button"
          aria-label="Supprimer le ticket"
          class="inline-flex items-center justify-center gap-1.5 min-h-[40px] px-3 py-2 text-xs sm:text-sm font-medium text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/50 rounded-lg transition-colors whitespace-nowrap shrink-0 focus-visible:outline-2 focus-visible:outline-rose-600"
          @click.stop="emit('supprimer', ticket)"
        >
          <Trash2 class="w-4 h-4 shrink-0" aria-hidden="true" />
          <span>Supprimer</span>
        </button>
      </div>
    </div>
  </article>
</template>
