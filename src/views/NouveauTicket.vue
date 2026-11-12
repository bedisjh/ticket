<script setup lang="ts">
import { computed, reactive, ref, watchEffect } from 'vue';
import { useRouter } from 'vue-router';
import { AlertCircle, ArrowLeft, Check } from 'lucide-vue-next';
import type { PrioriteTicket } from '../types/ticket';
import {
  createTicket,
  extraireMessageErreur,
  PRIORITES_LISTE,
} from '../services/ticketService';
import BaseCarte from '../components/BaseCarte.vue';
import BaseChamp from '../components/BaseChamp.vue';
import BoutonTheme from '../components/BoutonTheme.vue';

const router = useRouter();

const formulaire = reactive({
  titre: '',
  description: '',
  demandeur: '',
  priorite: 'Moyenne' as PrioriteTicket,
});

const touche = reactive({
  titre: false,
  description: false,
  demandeur: false,
});

const enCoursEnvoi = ref(false);
const erreurServeur = ref('');

const dateDuJour = computed(() => new Date().toISOString().slice(0, 10));

watchEffect(() => {
  document.title = 'Nouveau ticket — Maintenance IT';
});

const erreurs = computed(() => {
  const e: Partial<Record<'titre' | 'description' | 'demandeur', string>> = {};

  if (!formulaire.titre.trim()) {
    e.titre = 'Le titre du ticket est obligatoire.';
  } else if (formulaire.titre.trim().length < 3) {
    e.titre = 'Le titre doit contenir au moins 3 caractères.';
  }

  if (!formulaire.description.trim()) {
    e.description = 'La description du problème est obligatoire.';
  }

  if (!formulaire.demandeur.trim()) {
    e.demandeur = 'Le nom du demandeur est obligatoire.';
  }

  return e;
});

const formulaireValide = computed(() => Object.keys(erreurs.value).length === 0);

async function soumettre() {
  touche.titre = true;
  touche.description = true;
  touche.demandeur = true;
  erreurServeur.value = '';

  if (!formulaireValide.value || enCoursEnvoi.value) return;

  enCoursEnvoi.value = true;
  try {
    await createTicket({
      titre: formulaire.titre,
      description: formulaire.description,
      demandeur: formulaire.demandeur,
      priorite: formulaire.priorite,
    });
    router.push('/tickets');
  } catch (err) {
    erreurServeur.value = extraireMessageErreur(err);
  } finally {
    enCoursEnvoi.value = false;
  }
}

function retourListe() {
  router.push('/tickets');
}
</script>

<template>
  <section class="max-w-3xl mx-auto px-4 sm:px-6 py-8 sm:py-10">
    <div class="mb-6 flex items-center justify-between gap-4">
      <button
        type="button"
        class="inline-flex items-center gap-2 min-h-[40px] px-3 py-2 -ml-3 text-sm font-medium text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors whitespace-nowrap focus-visible:outline-2 focus-visible:outline-teal-600 dark:focus-visible:outline-teal-400"
        @click="retourListe"
      >
        <ArrowLeft class="w-4 h-4 shrink-0" aria-hidden="true" />
        <span>Retour à la liste</span>
      </button>

      <BoutonTheme />
    </div>

    <BaseCarte>
      <template #entete>
        <h1 class="font-display text-xl sm:text-2xl font-bold tracking-tight text-slate-900 dark:text-slate-100">
          Nouveau ticket de maintenance
        </h1>
        <p class="mt-1 text-sm text-slate-500 dark:text-slate-400">
          Décrivez l'incident. Le statut est initialisé automatiquement à « Ouvert » à la date du {{ dateDuJour }}.
        </p>
      </template>

      <form
        class="p-6 sm:p-8 space-y-6"
        novalidate
        @submit.prevent="soumettre"
      >
        <div
          v-if="erreurServeur"
          role="alert"
          class="rounded-lg border border-rose-200 dark:border-rose-800/70 bg-rose-50 dark:bg-rose-950/50 p-4 flex items-start gap-2.5 text-sm text-rose-800 dark:text-rose-200"
        >
          <AlertCircle class="w-5 h-5 text-rose-600 dark:text-rose-400 shrink-0 mt-0.5" aria-hidden="true" />
          <span>{{ erreurServeur }}</span>
        </div>

        <BaseChamp
          id="ticket-titre"
          v-model.trim="formulaire.titre"
          type="text"
          placeholder="Ex. Clavier défectueux"
          obligatoire
          :erreur="touche.titre ? erreurs.titre : ''"
          @quitter="touche.titre = true"
        >
          Titre
        </BaseChamp>

        <div>
          <label for="ticket-description" class="block text-sm font-medium text-slate-800 dark:text-slate-200 mb-1.5">
            Description <span class="text-rose-600 dark:text-rose-400 ml-0.5" aria-hidden="true">*</span>
          </label>
          <textarea
            id="ticket-description"
            v-model.trim="formulaire.description"
            rows="4"
            required
            placeholder="Décrivez précisément l'anomalie, la localisation et l'impact..."
            class="w-full px-3.5 py-2.5 text-sm bg-white dark:bg-slate-950 border rounded-lg text-slate-900 dark:text-slate-100 placeholder:text-slate-400 dark:placeholder:text-slate-500 focus:outline-none focus:ring-2 transition-colors"
            :class="
              touche.description && erreurs.description
                ? 'border-rose-500 focus:border-rose-600 focus:ring-rose-600/20 dark:border-rose-500 dark:focus:border-rose-400 dark:focus:ring-rose-400/20'
                : 'border-slate-300 dark:border-slate-700 focus:border-teal-600 dark:focus:border-teal-400 focus:ring-teal-600/15 dark:focus:ring-teal-400/20'
            "
            @blur="touche.description = true"
          />
          <p v-if="touche.description && erreurs.description" class="mt-1.5 text-xs text-rose-600 dark:text-rose-400">
            {{ erreurs.description }}
          </p>
        </div>

        <div class="grid grid-cols-1 sm:grid-cols-2 gap-5">
          <BaseChamp
            id="ticket-demandeur"
            v-model.trim="formulaire.demandeur"
            type="text"
            placeholder="Ex. Ahmed Ben Ali"
            obligatoire
            :erreur="touche.demandeur ? erreurs.demandeur : ''"
            @quitter="touche.demandeur = true"
          >
            Demandeur
          </BaseChamp>

          <div>
            <label for="ticket-priorite" class="block text-sm font-medium text-slate-800 dark:text-slate-200 mb-1.5">
              Priorité
            </label>
            <select
              id="ticket-priorite"
              v-model="formulaire.priorite"
              class="w-full min-h-[42px] px-3.5 py-2 text-sm bg-white dark:bg-slate-950 border border-slate-300 dark:border-slate-700 rounded-lg text-slate-900 dark:text-slate-100 focus:outline-none focus:border-teal-600 dark:focus:border-teal-400 focus:ring-2 focus:ring-teal-600/15 dark:focus:ring-teal-400/20 transition-colors"
            >
              <option v-for="p in PRIORITES_LISTE" :key="p" :value="p">{{ p }}</option>
            </select>
          </div>
        </div>

        <div class="rounded-lg bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 px-4 py-3 flex flex-wrap items-center justify-between gap-2 text-xs text-slate-600 dark:text-slate-400">
          <span>Statut initial : <strong class="font-semibold text-amber-600 dark:text-amber-400">Ouvert</strong></span>
          <span class="font-mono-tabular">Date de création : {{ dateDuJour }}</span>
        </div>

        <div class="pt-4 border-t border-slate-200 dark:border-slate-800 flex items-center justify-end gap-3">
          <button
            type="button"
            :disabled="enCoursEnvoi"
            class="inline-flex items-center justify-center min-h-[42px] px-4 py-2 text-sm font-medium text-slate-700 dark:text-slate-200 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-700 disabled:opacity-50 rounded-lg transition-colors whitespace-nowrap"
            @click="retourListe"
          >
            Annuler
          </button>

          <button
            type="submit"
            :disabled="enCoursEnvoi"
            class="inline-flex items-center justify-center gap-2 min-h-[42px] px-5 py-2 text-sm font-semibold text-white bg-teal-600 hover:bg-teal-700 dark:hover:bg-teal-500 disabled:opacity-50 disabled:cursor-not-allowed rounded-lg transition-colors whitespace-nowrap focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-teal-600 dark:focus-visible:outline-teal-400"
          >
            <Check class="w-4 h-4 shrink-0" aria-hidden="true" />
            <span>{{ enCoursEnvoi ? 'Enregistrement...' : 'Créer le ticket' }}</span>
          </button>
        </div>
      </form>
    </BaseCarte>
  </section>
</template>
