<script setup lang="ts">
import { RouterLink, useRoute } from 'vue-router';
import { Plus } from 'lucide-vue-next';

const route = useRoute();
</script>

<template>
  <header class="sticky top-0 z-30 bg-white/95 dark:bg-slate-900/95 backdrop-blur-sm border-b border-slate-200 dark:border-slate-800 transition-colors">
    <div class="max-w-5xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between gap-8">
      <!-- Zone 1 : Nom de l'application -->
      <RouterLink
        to="/tickets"
        class="font-display text-lg font-bold tracking-tight text-slate-900 dark:text-slate-100 whitespace-nowrap shrink-0 focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-teal-600 dark:focus-visible:outline-teal-400 rounded"
      >
        Maintenance IT
      </RouterLink>

      <!-- Zone 2 : Liens de navigation -->
      <nav aria-label="Navigation principale" class="hidden sm:flex items-center gap-6 text-sm font-medium">
        <RouterLink
          to="/tickets"
          class="py-1 whitespace-nowrap shrink-0 transition-colors border-b-2 focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-teal-600 dark:focus-visible:outline-teal-400"
          :class="
            route.name === 'liste-tickets'
              ? 'text-slate-900 dark:text-white border-teal-600 dark:border-teal-400'
              : 'text-slate-600 dark:text-slate-400 border-transparent hover:text-slate-900 dark:hover:text-slate-100 hover:border-slate-300 dark:hover:border-slate-700'
          "
        >
          Tickets
        </RouterLink>
        <RouterLink
          to="/tickets/nouveau"
          class="py-1 whitespace-nowrap shrink-0 transition-colors border-b-2 focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-teal-600 dark:focus-visible:outline-teal-400"
          :class="
            route.name === 'nouveau-ticket'
              ? 'text-slate-900 dark:text-white border-teal-600 dark:border-teal-400'
              : 'text-slate-600 dark:text-slate-400 border-transparent hover:text-slate-900 dark:hover:text-slate-100 hover:border-slate-300 dark:hover:border-slate-700'
          "
        >
          Nouveau ticket
        </RouterLink>
      </nav>

      <!-- Zone 3 : Action principale -->
      <div class="flex items-center shrink-0">
        <RouterLink
          to="/tickets/nouveau"
          class="inline-flex items-center justify-center gap-1.5 min-h-[40px] px-4 py-2 text-sm font-semibold text-white bg-teal-600 hover:bg-teal-700 dark:bg-teal-600 dark:hover:bg-teal-500 rounded-lg transition-colors whitespace-nowrap shrink-0 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-teal-600 dark:focus-visible:outline-teal-400"
        >
          <Plus class="w-4 h-4 shrink-0" aria-hidden="true" />
          <span>Nouveau ticket</span>
        </RouterLink>
      </div>
    </div>
  </header>
</template>
