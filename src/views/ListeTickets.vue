<script setup lang="ts">
import { computed, onMounted, ref, watchEffect } from 'vue';
import { RouterLink, useRouter } from 'vue-router';
import { AlertCircle, ClipboardList, Plus, RefreshCw, RotateCcw } from 'lucide-vue-next';
import type { PrioriteTicket, StatutTicket, Ticket } from '../types/ticket';
import {
  deleteTicket,
  extraireMessageErreur,
  getStatutSuivant,
  getTickets,
  patchTicket,
  PRIORITES_LISTE,
  STATUTS_ORDRE,
} from '../services/ticketService';
import BarreRecherche from '../components/BarreRecherche.vue';
import BoutonTheme from '../components/BoutonTheme.vue';
import TableauBordStatuts from '../components/TableauBordStatuts.vue';
import ListeGenerique from '../components/ListeGenerique.vue';
import CarteTicket from '../components/CarteTicket.vue';
import ModaleConfirmationSuppression from '../components/ModaleConfirmationSuppression.vue';

const router = useRouter();

const tickets = ref<Ticket[]>([]);
const chargement = ref(true);
const messageErreur = ref('');
const erreurAction = ref('');

const recherche = ref('');
const filtreStatut = ref<StatutTicket | ''>('');
const filtrePriorite = ref<PrioriteTicket | ''>('');

const ticketEnCoursStatut = ref<number | null>(null);
const ticketASupprimer = ref<Ticket | null>(null);
const suppressionEnCours = ref(false);

function normaliser(texte: string): string {
  return texte
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase();
}

const ticketsFiltres = computed(() => {
  const q = normaliser(recherche.value.trim());

  return tickets.value.filter((ticket) => {
    if (filtreStatut.value && ticket.statut !== filtreStatut.value) return false;
    if (filtrePriorite.value && ticket.priorite !== filtrePriorite.value) return false;

    if (!q) return true;
    return (
      normaliser(ticket.titre).includes(q) ||
      normaliser(ticket.description).includes(q) ||
      normaliser(ticket.demandeur).includes(q) ||
      String(ticket.id).includes(q)
    );
  });
});

const filtresActifs = computed(() =>
  Boolean(recherche.value || filtreStatut.value || filtrePriorite.value)
);

watchEffect(() => {
  document.title = `Tickets (${tickets.value.length}) — Maintenance IT`;
});

async function chargerTickets() {
  chargement.value = true;
  messageErreur.value = '';
  try {
    const data = await getTickets();
    tickets.value = [...data].sort((a, b) => Number(b.id) - Number(a.id));
  } catch (err) {
    messageErreur.value = extraireMessageErreur(err);
  } finally {
    chargement.value = false;
  }
}

function ouvrirDetail(id: number) {
  router.push({ name: 'detail-ticket', params: { id } });
}

async function avancerStatut(ticket: Ticket) {
  const suivant = getStatutSuivant(ticket.statut);
  if (!suivant || ticketEnCoursStatut.value === ticket.id) return;

  ticketEnCoursStatut.value = ticket.id;
  erreurAction.value = '';
  try {
    const misAJour = await patchTicket(ticket.id, { statut: suivant });
    const index = tickets.value.findIndex((t) => t.id === ticket.id);
    if (index !== -1) {
      tickets.value[index] = misAJour;
    }
  } catch (err) {
    erreurAction.value = extraireMessageErreur(err);
  } finally {
    ticketEnCoursStatut.value = null;
  }
}

function demanderSuppression(ticket: Ticket) {
  ticketASupprimer.value = ticket;
}

async function confirmerSuppression() {
  if (!ticketASupprimer.value || suppressionEnCours.value) return;
  const cible = ticketASupprimer.value;
  suppressionEnCours.value = true;
  erreurAction.value = '';

  try {
    await deleteTicket(cible.id);
    tickets.value = tickets.value.filter((t) => t.id !== cible.id);
    ticketASupprimer.value = null;
  } catch (err) {
    erreurAction.value = extraireMessageErreur(err);
    ticketASupprimer.value = null;
  } finally {
    suppressionEnCours.value = false;
  }
}

function reinitialiserFiltres() {
  recherche.value = '';
  filtreStatut.value = '';
  filtrePriorite.value = '';
}

onMounted(() => {
  chargerTickets();
});
</script>

<template>
  <section class="max-w-5xl mx-auto px-4 sm:px-6 py-8 sm:py-10 space-y-6">
    <!-- En-tête de la page -->
    <div class="flex flex-col sm:flex-row sm:items-end justify-between gap-4 pb-6 border-b border-slate-200 dark:border-slate-800">
      <div>
        <h1 class="font-display text-2xl sm:text-3xl font-bold tracking-tight text-slate-900 dark:text-slate-100">
          Tickets de maintenance
        </h1>
        <p class="mt-1.5 text-sm text-slate-500 dark:text-slate-400 flex items-center gap-2">
          <span class="font-mono-tabular font-medium text-slate-700 dark:text-slate-200">{{ tickets.length }}</span>
          <span>{{ tickets.length > 1 ? 'tickets enregistrés' : 'ticket enregistré' }}</span>
          <span aria-hidden="true">·</span>
          <span>API REST db.json</span>
        </p>
      </div>

      <div class="flex items-center gap-2.5 self-start sm:self-auto">
        <BoutonTheme />
      </div>
    </div>

    <!-- Tableau de bord par statut (cliquable pour filtrer) -->
    <TableauBordStatuts
      v-if="!chargement && !messageErreur"
      :tickets="tickets"
      :statut-actif="filtreStatut"
      @selectionner="filtreStatut = $event"
    />

    <!-- Barre de recherche et filtres -->
    <div class="flex flex-col md:flex-row md:items-center justify-between gap-3">
      <div class="flex flex-wrap items-center gap-3 flex-1">
        <BarreRecherche
          v-model="recherche"
          placeholder="Rechercher titre, demandeur, #id..."
        />

        <select
          v-model="filtreStatut"
          aria-label="Filtrer par statut"
          class="min-h-[42px] px-3 py-2 text-sm bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-800 dark:text-slate-200 focus:outline-none focus:border-teal-600 dark:focus:border-teal-400 transition-colors"
        >
          <option value="">Tous les statuts</option>
          <option v-for="s in STATUTS_ORDRE" :key="s" :value="s">{{ s }}</option>
        </select>

        <select
          v-model="filtrePriorite"
          aria-label="Filtrer par priorité"
          class="min-h-[42px] px-3 py-2 text-sm bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-800 dark:text-slate-200 focus:outline-none focus:border-teal-600 dark:focus:border-teal-400 transition-colors"
        >
          <option value="">Toutes les priorités</option>
          <option v-for="p in PRIORITES_LISTE" :key="p" :value="p">{{ p }}</option>
        </select>

        <button
          v-if="filtresActifs"
          type="button"
          class="inline-flex items-center gap-1.5 min-h-[42px] px-3 py-2 text-xs font-medium text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors whitespace-nowrap"
          @click="reinitialiserFiltres"
        >
          <RotateCcw class="w-3.5 h-3.5" aria-hidden="true" />
          <span>Réinitialiser</span>
        </button>
      </div>
    </div>

    <!-- Erreur d'action (PATCH / DELETE) non bloquante -->
    <div
      v-if="erreurAction"
      role="alert"
      class="rounded-xl border border-rose-200 dark:border-rose-800/70 bg-rose-50 dark:bg-rose-950/50 p-4 flex items-center justify-between gap-4 text-sm text-rose-800 dark:text-rose-200"
    >
      <div class="flex items-center gap-2.5">
        <AlertCircle class="w-5 h-5 shrink-0 text-rose-600 dark:text-rose-400" aria-hidden="true" />
        <span>{{ erreurAction }}</span>
      </div>
      <button
        type="button"
        class="text-xs font-medium underline underline-offset-4 whitespace-nowrap"
        @click="erreurAction = ''"
      >
        Fermer
      </button>
    </div>

    <!-- État de chargement (skeletons) -->
    <div v-if="chargement" class="space-y-3" aria-busy="true" aria-label="Chargement des tickets">
      <div
        v-for="n in 3"
        :key="n"
        class="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-5 animate-pulse space-y-3"
      >
        <div class="h-3 w-48 bg-slate-200 dark:bg-slate-800 rounded" />
        <div class="h-5 w-2/3 bg-slate-200 dark:bg-slate-800 rounded" />
        <div class="h-4 w-full bg-slate-100 dark:bg-slate-800/60 rounded" />
      </div>
    </div>

    <!-- Erreur réseau / chargement initial -->
    <div
      v-else-if="messageErreur"
      role="alert"
      class="bg-white dark:bg-slate-900 border border-rose-200 dark:border-rose-900/70 rounded-xl p-8 text-center space-y-4"
    >
      <div class="w-12 h-12 mx-auto rounded-full bg-rose-50 dark:bg-rose-950/70 flex items-center justify-center text-rose-600 dark:text-rose-400">
        <AlertCircle class="w-6 h-6" aria-hidden="true" />
      </div>
      <div class="space-y-1">
        <h2 class="font-display text-lg font-semibold text-slate-900 dark:text-slate-100">
          Erreur de chargement
        </h2>
        <p class="text-sm text-rose-700 dark:text-rose-300 max-w-md mx-auto">
          {{ messageErreur }}
        </p>
      </div>
      <button
        type="button"
        class="inline-flex items-center justify-center gap-2 min-h-[40px] px-4 py-2 text-sm font-semibold text-white bg-teal-600 hover:bg-teal-700 dark:hover:bg-teal-500 rounded-lg transition-colors"
        @click="chargerTickets"
      >
        <RefreshCw class="w-4 h-4" aria-hidden="true" />
        <span>Réessayer</span>
      </button>
    </div>

    <!-- Liste vide (aucun ticket dans db.json) -->
    <div
      v-else-if="tickets.length === 0"
      class="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-10 text-center"
    >
      <div class="w-12 h-12 mx-auto rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-slate-500 dark:text-slate-400">
        <ClipboardList class="w-6 h-6" aria-hidden="true" />
      </div>
      <h2 class="mt-4 font-display text-lg font-semibold text-slate-900 dark:text-slate-100">
        Aucun ticket enregistré
      </h2>
      <p class="mt-1.5 text-sm text-slate-600 dark:text-slate-400 max-w-md mx-auto">
        Créez un premier ticket de maintenance pour commencer le suivi des interventions.
      </p>
      <RouterLink
        to="/tickets/nouveau"
        class="mt-6 inline-flex items-center justify-center gap-2 min-h-[40px] px-4 py-2 text-sm font-semibold text-white bg-teal-600 hover:bg-teal-700 dark:hover:bg-teal-500 rounded-lg transition-colors whitespace-nowrap"
      >
        <Plus class="w-4 h-4" aria-hidden="true" />
        <span>Nouveau ticket</span>
      </RouterLink>
    </div>

    <!-- Aucun résultat après filtrage -->
    <div
      v-else-if="ticketsFiltres.length === 0"
      class="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-10 text-center"
    >
      <h2 class="font-display text-base font-semibold text-slate-900 dark:text-slate-100">
        Aucun ticket ne correspond aux critères sélectionnés
      </h2>
      <p class="mt-1 text-sm text-slate-600 dark:text-slate-400">
        Modifiez votre recherche ou réinitialisez les filtres actifs.
      </p>
      <button
        type="button"
        class="mt-5 inline-flex items-center justify-center min-h-[40px] px-4 py-2 text-sm font-medium text-teal-700 dark:text-teal-300 bg-teal-50 dark:bg-teal-950/70 hover:bg-teal-100 dark:hover:bg-teal-900/70 rounded-lg transition-colors whitespace-nowrap"
        @click="reinitialiserFiltres"
      >
        Réinitialiser les filtres
      </button>
    </div>

    <!-- Liste des tickets via ListeGenerique -->
    <ListeGenerique
      v-else
      :elements="ticketsFiltres"
      cle="id"
      :colonnes="1"
    >
      <template #default="{ element }">
        <CarteTicket
          :ticket="element"
          :en-cours-statut="ticketEnCoursStatut === element.id"
          @ouvrir="ouvrirDetail"
          @avancer-statut="avancerStatut"
          @supprimer="demanderSuppression"
        />
      </template>
    </ListeGenerique>

    <!-- Modale de confirmation avant DELETE -->
    <ModaleConfirmationSuppression
      v-if="ticketASupprimer"
      :ticket="ticketASupprimer"
      :en-cours="suppressionEnCours"
      @confirmer="confirmerSuppression"
      @annuler="ticketASupprimer = null"
    />
  </section>
</template>
