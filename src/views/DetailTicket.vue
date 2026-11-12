<script setup lang="ts">
import { computed, reactive, ref, watch, watchEffect } from 'vue';
import { RouterLink, useRoute, useRouter } from 'vue-router';
import {
  AlertCircle,
  ArrowLeft,
  ArrowRight,
  Calendar,
  Check,
  MessageSquare,
  Pencil,
  RefreshCw,
  Send,
  Trash2,
  User,
} from 'lucide-vue-next';
import type {
  CommentaireTicket,
  PrioriteTicket,
  StatutTicket,
  Ticket,
} from '../types/ticket';
import {
  createComment,
  deleteTicket,
  estErreur404,
  extraireMessageErreur,
  getComments,
  getStatutSuivant,
  getTicket,
  patchTicket,
  PRIORITES_LISTE,
  STATUTS_ORDRE,
  updateTicket,
} from '../services/ticketService';
import BaseCarte from '../components/BaseCarte.vue';
import BaseChamp from '../components/BaseChamp.vue';
import BoutonTheme from '../components/BoutonTheme.vue';
import ModaleConfirmationSuppression from '../components/ModaleConfirmationSuppression.vue';

const route = useRoute();
const router = useRouter();

const ticket = ref<Ticket | null>(null);
const commentaires = ref<CommentaireTicket[]>([]);
const chargement = ref(true);
const introuvable404 = ref(false);
const erreurChargement = ref('');
const erreurOperation = ref('');

const modeEdition = ref(false);
const sauvegardeEnCours = ref(false);
const statutEnCours = ref(false);
const afficherModaleSuppression = ref(false);
const suppressionEnCours = ref(false);

const formulaire = reactive({
  titre: '',
  description: '',
  demandeur: '',
  priorite: 'Moyenne' as PrioriteTicket,
  statut: 'Ouvert' as StatutTicket,
});

const touche = reactive({
  titre: false,
  description: false,
  demandeur: false,
});

// --- Bonus Commentaires ---
const nouveauCommentaire = reactive({
  auteur: '',
  contenu: '',
});
const toucheCommentaire = reactive({
  auteur: false,
  contenu: false,
});
const envoiCommentaire = ref(false);
const erreurCommentaire = ref('');

const ticketId = computed(() => String(route.params.id ?? ''));

watchEffect(() => {
  if (introuvable404.value) {
    document.title = 'Ticket introuvable (404) — Maintenance IT';
  } else if (ticket.value) {
    document.title = `#${ticket.value.id} ${ticket.value.titre} — Maintenance IT`;
  } else {
    document.title = 'Détail du ticket — Maintenance IT';
  }
});

function remplirFormulaireDepuisTicket(t: Ticket) {
  formulaire.titre = t.titre;
  formulaire.description = t.description;
  formulaire.demandeur = t.demandeur;
  formulaire.priorite = t.priorite;
  formulaire.statut = t.statut;
  touche.titre = false;
  touche.description = false;
  touche.demandeur = false;
}

async function chargerDetail() {
  chargement.value = true;
  introuvable404.value = false;
  erreurChargement.value = '';
  erreurOperation.value = '';
  modeEdition.value = false;

  try {
    const [dataTicket, dataComments] = await Promise.all([
      getTicket(ticketId.value),
      getComments(ticketId.value).catch(() => [] as CommentaireTicket[]),
    ]);
    ticket.value = dataTicket;
    commentaires.value = dataComments;
    remplirFormulaireDepuisTicket(dataTicket);
  } catch (err) {
    if (estErreur404(err)) {
      introuvable404.value = true;
      ticket.value = null;
    } else {
      erreurChargement.value = extraireMessageErreur(err);
    }
  } finally {
    chargement.value = false;
  }
}

watch(
  () => route.params.id,
  () => {
    if (route.name === 'detail-ticket') {
      chargerDetail();
    }
  },
  { immediate: true }
);

const erreurs = computed(() => {
  const e: Partial<Record<'titre' | 'description' | 'demandeur', string>> = {};
  if (!formulaire.titre.trim()) {
    e.titre = 'Le titre est obligatoire.';
  } else if (formulaire.titre.trim().length < 3) {
    e.titre = 'Le titre doit contenir au moins 3 caractères.';
  }
  if (!formulaire.description.trim()) {
    e.description = 'La description est obligatoire.';
  }
  if (!formulaire.demandeur.trim()) {
    e.demandeur = 'Le demandeur est obligatoire.';
  }
  return e;
});

const formulaireValide = computed(() => Object.keys(erreurs.value).length === 0);

const statutSuivant = computed(() =>
  ticket.value ? getStatutSuivant(ticket.value.statut) : null
);

function activerEdition() {
  if (!ticket.value) return;
  remplirFormulaireDepuisTicket(ticket.value);
  erreurOperation.value = '';
  modeEdition.value = true;
}

function annulerEdition() {
  if (ticket.value) {
    remplirFormulaireDepuisTicket(ticket.value);
  }
  erreurOperation.value = '';
  modeEdition.value = false;
}

async function enregistrerModifications() {
  if (!ticket.value) return;
  touche.titre = true;
  touche.description = true;
  touche.demandeur = true;
  erreurOperation.value = '';

  if (!formulaireValide.value || sauvegardeEnCours.value) return;

  sauvegardeEnCours.value = true;
  try {
    const misAJour = await updateTicket(ticket.value.id, {
      titre: formulaire.titre,
      description: formulaire.description,
      demandeur: formulaire.demandeur,
      priorite: formulaire.priorite,
      statut: formulaire.statut,
      dateCreation: ticket.value.dateCreation,
    });
    ticket.value = misAJour;
    remplirFormulaireDepuisTicket(misAJour);
    modeEdition.value = false;
  } catch (err) {
    erreurOperation.value = extraireMessageErreur(err);
  } finally {
    sauvegardeEnCours.value = false;
  }
}

async function changerStatutRapide(nouveauStatut: StatutTicket) {
  if (!ticket.value || ticket.value.statut === nouveauStatut || statutEnCours.value) return;

  statutEnCours.value = true;
  erreurOperation.value = '';
  try {
    const misAJour = await patchTicket(ticket.value.id, { statut: nouveauStatut });
    ticket.value = misAJour;
    formulaire.statut = misAJour.statut;
  } catch (err) {
    erreurOperation.value = extraireMessageErreur(err);
  } finally {
    statutEnCours.value = false;
  }
}

async function confirmerSuppression() {
  if (!ticket.value || suppressionEnCours.value) return;
  suppressionEnCours.value = true;
  erreurOperation.value = '';

  try {
    await deleteTicket(ticket.value.id);
    afficherModaleSuppression.value = false;
    router.push('/tickets');
  } catch (err) {
    erreurOperation.value = extraireMessageErreur(err);
    afficherModaleSuppression.value = false;
  } finally {
    suppressionEnCours.value = false;
  }
}

const erreursCommentaire = computed(() => {
  const e: Partial<Record<'auteur' | 'contenu', string>> = {};
  if (!nouveauCommentaire.auteur.trim()) e.auteur = "Le nom de l'auteur est requis.";
  if (!nouveauCommentaire.contenu.trim()) e.contenu = 'Le message du commentaire est requis.';
  return e;
});

async function ajouterCommentaire() {
  if (!ticket.value) return;
  toucheCommentaire.auteur = true;
  toucheCommentaire.contenu = true;
  erreurCommentaire.value = '';

  if (Object.keys(erreursCommentaire.value).length > 0 || envoiCommentaire.value) return;

  envoiCommentaire.value = true;
  try {
    const cree = await createComment({
      ticketId: ticket.value.id,
      auteur: nouveauCommentaire.auteur,
      contenu: nouveauCommentaire.contenu,
    });
    commentaires.value.push(cree);
    nouveauCommentaire.auteur = '';
    nouveauCommentaire.contenu = '';
    toucheCommentaire.auteur = false;
    toucheCommentaire.contenu = false;
  } catch (err) {
    erreurCommentaire.value = extraireMessageErreur(err);
  } finally {
    envoiCommentaire.value = false;
  }
}

function couleurStatut(statut: StatutTicket): string {
  if (statut === 'Ouvert') return 'text-amber-600 dark:text-amber-400 font-semibold';
  if (statut === 'En cours') return 'text-sky-600 dark:text-sky-400 font-semibold';
  if (statut === 'Résolu') return 'text-emerald-600 dark:text-emerald-400 font-semibold';
  return 'text-slate-500 dark:text-slate-400 font-medium';
}

function couleurPriorite(priorite: PrioriteTicket): string {
  if (priorite === 'Haute') return 'text-rose-600 dark:text-rose-400 font-semibold';
  if (priorite === 'Moyenne') return 'text-amber-600 dark:text-amber-400 font-medium';
  return 'text-slate-600 dark:text-slate-400 font-medium';
}
</script>

<template>
  <section class="max-w-3xl mx-auto px-4 sm:px-6 py-8 sm:py-10 space-y-6">
    <!-- Retour liste + Thème -->
    <div class="flex items-center justify-between gap-4">
      <RouterLink
        to="/tickets"
        class="inline-flex items-center gap-2 min-h-[40px] px-3 py-2 -ml-3 text-sm font-medium text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors whitespace-nowrap focus-visible:outline-2 focus-visible:outline-teal-600 dark:focus-visible:outline-teal-400"
      >
        <ArrowLeft class="w-4 h-4 shrink-0" aria-hidden="true" />
        <span>Retour à la liste</span>
      </RouterLink>

      <BoutonTheme />
    </div>

    <!-- Chargement -->
    <BaseCarte v-if="chargement">
      <div class="p-8 space-y-4 animate-pulse" aria-busy="true">
        <div class="h-4 w-32 bg-slate-200 dark:bg-slate-800 rounded" />
        <div class="h-7 w-2/3 bg-slate-200 dark:bg-slate-800 rounded" />
        <div class="h-20 w-full bg-slate-100 dark:bg-slate-800/60 rounded" />
      </div>
    </BaseCarte>

    <!-- 404 Ticket introuvable -->
    <BaseCarte v-else-if="introuvable404">
      <div class="p-10 text-center space-y-4">
        <div class="font-mono-tabular text-4xl font-bold text-rose-600 dark:text-rose-400">
          404
        </div>
        <h1 class="font-display text-xl font-bold text-slate-900 dark:text-slate-100">
          Ticket introuvable
        </h1>
        <p class="text-sm text-slate-600 dark:text-slate-400 max-w-md mx-auto">
          Aucun ticket ne correspond à l'identifiant <span class="font-mono-tabular font-semibold">#{{ ticketId }}</span>. Il a peut-être été supprimé.
        </p>
        <RouterLink
          to="/tickets"
          class="inline-flex items-center justify-center min-h-[40px] px-4 py-2 text-sm font-semibold text-white bg-teal-600 hover:bg-teal-700 dark:hover:bg-teal-500 rounded-lg transition-colors"
        >
          Retour à la liste des tickets
        </RouterLink>
      </div>
    </BaseCarte>

    <!-- Erreur réseau -->
    <BaseCarte v-else-if="erreurChargement">
      <div class="p-8 text-center space-y-4" role="alert">
        <div class="w-12 h-12 mx-auto rounded-full bg-rose-50 dark:bg-rose-950/70 flex items-center justify-center text-rose-600 dark:text-rose-400">
          <AlertCircle class="w-6 h-6" aria-hidden="true" />
        </div>
        <h1 class="font-display text-lg font-semibold text-slate-900 dark:text-slate-100">
          Impossible de charger le ticket
        </h1>
        <p class="text-sm text-rose-700 dark:text-rose-300">{{ erreurChargement }}</p>
        <div class="flex items-center justify-center gap-3">
          <button
            type="button"
            class="inline-flex items-center gap-2 min-h-[40px] px-4 py-2 text-sm font-semibold text-white bg-teal-600 hover:bg-teal-700 rounded-lg transition-colors"
            @click="chargerDetail"
          >
            <RefreshCw class="w-4 h-4" aria-hidden="true" />
            <span>Réessayer</span>
          </button>
        </div>
      </div>
    </BaseCarte>

    <!-- Contenu principal du ticket -->
    <template v-else-if="ticket">
      <BaseCarte>
        <template #entete>
          <div class="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
            <div>
              <div class="flex flex-wrap items-center gap-x-2.5 gap-y-1 text-xs text-slate-500 dark:text-slate-400">
                <span class="font-mono-tabular font-semibold text-slate-700 dark:text-slate-300">
                  Ticket #{{ ticket.id }}
                </span>
                <span aria-hidden="true">·</span>
                <span :class="couleurStatut(ticket.statut)">Statut : {{ ticket.statut }}</span>
                <span aria-hidden="true">·</span>
                <span :class="couleurPriorite(ticket.priorite)">Priorité : {{ ticket.priorite }}</span>
              </div>
              <h1 class="mt-2 font-display text-xl sm:text-2xl font-bold tracking-tight text-slate-900 dark:text-slate-100">
                {{ modeEdition ? 'Modifier le ticket' : ticket.titre }}
              </h1>
            </div>

            <div v-if="!modeEdition" class="flex items-center gap-2 shrink-0">
              <button
                type="button"
                class="inline-flex items-center gap-1.5 min-h-[40px] px-3.5 py-2 text-sm font-medium text-teal-700 dark:text-teal-300 bg-teal-50 dark:bg-teal-950/70 hover:bg-teal-100 dark:hover:bg-teal-900/70 rounded-lg transition-colors whitespace-nowrap"
                @click="activerEdition"
              >
                <Pencil class="w-4 h-4 shrink-0" aria-hidden="true" />
                <span>Modifier</span>
              </button>

              <button
                type="button"
                class="inline-flex items-center gap-1.5 min-h-[40px] px-3.5 py-2 text-sm font-medium text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/50 rounded-lg transition-colors whitespace-nowrap"
                @click="afficherModaleSuppression = true"
              >
                <Trash2 class="w-4 h-4 shrink-0" aria-hidden="true" />
                <span>Supprimer</span>
              </button>
            </div>
          </div>
        </template>

        <!-- Erreur d'opération -->
        <div
          v-if="erreurOperation"
          role="alert"
          class="mx-6 sm:mx-8 mt-6 rounded-lg border border-rose-200 dark:border-rose-800/70 bg-rose-50 dark:bg-rose-950/50 p-4 flex items-start gap-2.5 text-sm text-rose-800 dark:text-rose-200"
        >
          <AlertCircle class="w-5 h-5 text-rose-600 dark:text-rose-400 shrink-0 mt-0.5" aria-hidden="true" />
          <span>{{ erreurOperation }}</span>
        </div>

        <!-- Mode lecture détaillée -->
        <div v-if="!modeEdition" class="p-6 sm:p-8 space-y-6">
          <div>
            <h2 class="text-xs font-medium text-slate-500 dark:text-slate-400 mb-1.5">
              Description détaillée
            </h2>
            <p class="text-sm sm:text-base text-slate-800 dark:text-slate-200 leading-relaxed whitespace-pre-line">
              {{ ticket.description }}
            </p>
          </div>

          <dl class="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-5 border-t border-slate-200 dark:border-slate-800 text-sm">
            <div>
              <dt class="text-xs text-slate-500 dark:text-slate-400">Identifiant</dt>
              <dd class="mt-1 font-mono-tabular font-semibold text-slate-900 dark:text-slate-100">
                #{{ ticket.id }}
              </dd>
            </div>
            <div>
              <dt class="text-xs text-slate-500 dark:text-slate-400">Date de création</dt>
              <dd class="mt-1 font-mono-tabular text-slate-900 dark:text-slate-100 flex items-center gap-1.5">
                <Calendar class="w-4 h-4 text-slate-400" aria-hidden="true" />
                <span>{{ ticket.dateCreation }}</span>
              </dd>
            </div>
            <div>
              <dt class="text-xs text-slate-500 dark:text-slate-400">Demandeur</dt>
              <dd class="mt-1 text-slate-900 dark:text-slate-100 flex items-center gap-1.5">
                <User class="w-4 h-4 text-slate-400" aria-hidden="true" />
                <span>{{ ticket.demandeur }}</span>
              </dd>
            </div>
            <div>
              <dt class="text-xs text-slate-500 dark:text-slate-400">Priorité</dt>
              <dd class="mt-1" :class="couleurPriorite(ticket.priorite)">
                {{ ticket.priorite }}
              </dd>
            </div>
          </dl>

          <!-- Changement rapide de statut -->
          <div class="pt-5 border-t border-slate-200 dark:border-slate-800 space-y-3">
            <div class="flex flex-wrap items-center justify-between gap-3">
              <span class="text-xs font-medium text-slate-500 dark:text-slate-400">
                Suivi rapide du statut (PATCH)
              </span>
              <button
                v-if="statutSuivant"
                type="button"
                :disabled="statutEnCours"
                class="inline-flex items-center gap-1.5 min-h-[38px] px-3.5 py-1.5 text-xs font-semibold text-white bg-teal-600 hover:bg-teal-700 dark:hover:bg-teal-500 disabled:opacity-50 rounded-lg transition-colors whitespace-nowrap"
                @click="changerStatutRapide(statutSuivant)"
              >
                <ArrowRight class="w-3.5 h-3.5 shrink-0" aria-hidden="true" />
                <span>{{ statutEnCours ? 'Mise à jour...' : `Passer à ${statutSuivant}` }}</span>
              </button>
            </div>

            <div class="grid grid-cols-2 sm:grid-cols-4 gap-2" role="group" aria-label="Changer le statut">
              <button
                v-for="s in STATUTS_ORDRE"
                :key="s"
                type="button"
                :disabled="statutEnCours || ticket.statut === s"
                class="min-h-[40px] px-3 py-2 text-xs font-medium rounded-lg border transition-colors whitespace-nowrap"
                :class="
                  ticket.statut === s
                    ? 'bg-teal-50 dark:bg-teal-950/60 border-teal-600 dark:border-teal-500 text-teal-800 dark:text-teal-200 font-semibold cursor-default'
                    : 'bg-white dark:bg-slate-950 border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-300 hover:border-slate-300 dark:hover:border-slate-700 hover:text-slate-900 dark:hover:text-white disabled:opacity-50'
                "
                @click="changerStatutRapide(s)"
              >
                {{ s }}
              </button>
            </div>
          </div>
        </div>

        <!-- Mode édition (PUT /tickets/:id) -->
        <form
          v-else
          class="p-6 sm:p-8 space-y-6"
          novalidate
          @submit.prevent="enregistrerModifications"
        >
          <BaseChamp
            id="edit-titre"
            v-model.trim="formulaire.titre"
            type="text"
            obligatoire
            :erreur="touche.titre ? erreurs.titre : ''"
            @quitter="touche.titre = true"
          >
            Titre
          </BaseChamp>

          <div>
            <label for="edit-description" class="block text-sm font-medium text-slate-800 dark:text-slate-200 mb-1.5">
              Description <span class="text-rose-600 dark:text-rose-400 ml-0.5" aria-hidden="true">*</span>
            </label>
            <textarea
              id="edit-description"
              v-model.trim="formulaire.description"
              rows="4"
              required
              class="w-full px-3.5 py-2.5 text-sm bg-white dark:bg-slate-950 border rounded-lg text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 transition-colors"
              :class="
                touche.description && erreurs.description
                  ? 'border-rose-500 focus:border-rose-600 focus:ring-rose-600/20'
                  : 'border-slate-300 dark:border-slate-700 focus:border-teal-600 dark:focus:border-teal-400 focus:ring-teal-600/15 dark:focus:ring-teal-400/20'
              "
              @blur="touche.description = true"
            />
            <p v-if="touche.description && erreurs.description" class="mt-1.5 text-xs text-rose-600 dark:text-rose-400">
              {{ erreurs.description }}
            </p>
          </div>

          <div class="grid grid-cols-1 sm:grid-cols-3 gap-5">
            <BaseChamp
              id="edit-demandeur"
              v-model.trim="formulaire.demandeur"
              type="text"
              obligatoire
              :erreur="touche.demandeur ? erreurs.demandeur : ''"
              @quitter="touche.demandeur = true"
            >
              Demandeur
            </BaseChamp>

            <div>
              <label for="edit-priorite" class="block text-sm font-medium text-slate-800 dark:text-slate-200 mb-1.5">
                Priorité
              </label>
              <select
                id="edit-priorite"
                v-model="formulaire.priorite"
                class="w-full min-h-[42px] px-3.5 py-2 text-sm bg-white dark:bg-slate-950 border border-slate-300 dark:border-slate-700 rounded-lg text-slate-900 dark:text-slate-100 focus:outline-none focus:border-teal-600 dark:focus:border-teal-400"
              >
                <option v-for="p in PRIORITES_LISTE" :key="p" :value="p">{{ p }}</option>
              </select>
            </div>

            <div>
              <label for="edit-statut" class="block text-sm font-medium text-slate-800 dark:text-slate-200 mb-1.5">
                Statut
              </label>
              <select
                id="edit-statut"
                v-model="formulaire.statut"
                class="w-full min-h-[42px] px-3.5 py-2 text-sm bg-white dark:bg-slate-950 border border-slate-300 dark:border-slate-700 rounded-lg text-slate-900 dark:text-slate-100 focus:outline-none focus:border-teal-600 dark:focus:border-teal-400"
              >
                <option v-for="s in STATUTS_ORDRE" :key="s" :value="s">{{ s }}</option>
              </select>
            </div>
          </div>

          <div class="pt-4 border-t border-slate-200 dark:border-slate-800 flex items-center justify-end gap-3">
            <button
              type="button"
              :disabled="sauvegardeEnCours"
              class="inline-flex items-center justify-center min-h-[42px] px-4 py-2 text-sm font-medium text-slate-700 dark:text-slate-200 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-700 disabled:opacity-50 rounded-lg transition-colors whitespace-nowrap"
              @click="annulerEdition"
            >
              Annuler
            </button>

            <button
              type="submit"
              :disabled="sauvegardeEnCours"
              class="inline-flex items-center justify-center gap-2 min-h-[42px] px-5 py-2 text-sm font-semibold text-white bg-teal-600 hover:bg-teal-700 dark:hover:bg-teal-500 disabled:opacity-50 disabled:cursor-not-allowed rounded-lg transition-colors whitespace-nowrap"
            >
              <Check class="w-4 h-4 shrink-0" aria-hidden="true" />
              <span>{{ sauvegardeEnCours ? 'Enregistrement...' : 'Enregistrer les modifications' }}</span>
            </button>
          </div>
        </form>
      </BaseCarte>

      <!-- Bonus : Commentaires associés au ticket -->
      <BaseCarte>
        <template #entete>
          <div class="flex items-center justify-between gap-2">
            <h2 class="font-display text-base font-semibold text-slate-900 dark:text-slate-100 flex items-center gap-2">
              <MessageSquare class="w-4 h-4 text-teal-600 dark:text-teal-400" aria-hidden="true" />
              <span>Commentaires d'intervention</span>
            </h2>
            <span class="font-mono-tabular text-xs text-slate-500 dark:text-slate-400">
              {{ commentaires.length }}
            </span>
          </div>
        </template>

        <div class="p-6 sm:p-8 space-y-6">
          <div v-if="commentaires.length === 0" class="text-sm text-slate-500 dark:text-slate-400">
            Aucun commentaire pour ce ticket pour le moment.
          </div>

          <ul v-else class="divide-y divide-slate-200 dark:divide-slate-800">
            <li
              v-for="com in commentaires"
              :key="com.id"
              class="py-3.5 first:pt-0 last:pb-0 space-y-1"
            >
              <div class="flex items-center justify-between gap-2 text-xs">
                <span class="font-semibold text-slate-900 dark:text-slate-100">{{ com.auteur }}</span>
                <span class="font-mono-tabular text-slate-500 dark:text-slate-400">{{ com.date }}</span>
              </div>
              <p class="text-sm text-slate-700 dark:text-slate-300 leading-relaxed">
                {{ com.contenu }}
              </p>
            </li>
          </ul>

          <form class="pt-5 border-t border-slate-200 dark:border-slate-800 space-y-4" novalidate @submit.prevent="ajouterCommentaire">
            <h3 class="text-xs font-medium text-slate-500 dark:text-slate-400">
              Ajouter un commentaire
            </h3>

            <p v-if="erreurCommentaire" class="text-xs text-rose-600 dark:text-rose-400">
              {{ erreurCommentaire }}
            </p>

            <div class="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <BaseChamp
                id="com-auteur"
                v-model.trim="nouveauCommentaire.auteur"
                type="text"
                placeholder="Votre nom"
                obligatoire
                :erreur="toucheCommentaire.auteur ? erreursCommentaire.auteur : ''"
                @quitter="toucheCommentaire.auteur = true"
              >
                Auteur
              </BaseChamp>

              <div class="sm:col-span-2">
                <BaseChamp
                  id="com-contenu"
                  v-model.trim="nouveauCommentaire.contenu"
                  type="text"
                  placeholder="Note d'intervention ou suivi..."
                  obligatoire
                  :erreur="toucheCommentaire.contenu ? erreursCommentaire.contenu : ''"
                  @quitter="toucheCommentaire.contenu = true"
                >
                  Message
                </BaseChamp>
              </div>
            </div>

            <div class="flex justify-end">
              <button
                type="submit"
                :disabled="envoiCommentaire"
                class="inline-flex items-center gap-1.5 min-h-[40px] px-4 py-2 text-sm font-semibold text-white bg-teal-600 hover:bg-teal-700 dark:hover:bg-teal-500 disabled:opacity-50 disabled:cursor-not-allowed rounded-lg transition-colors whitespace-nowrap"
              >
                <Send class="w-4 h-4 shrink-0" aria-hidden="true" />
                <span>{{ envoiCommentaire ? 'Envoi...' : 'Publier' }}</span>
              </button>
            </div>
          </form>
        </div>
      </BaseCarte>
    </template>

    <!-- Modale de confirmation avant DELETE -->
    <ModaleConfirmationSuppression
      v-if="afficherModaleSuppression && ticket"
      :ticket="ticket"
      :en-cours="suppressionEnCours"
      @confirmer="confirmerSuppression"
      @annuler="afficherModaleSuppression = false"
    />
  </section>
</template>
