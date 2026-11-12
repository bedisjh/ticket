<script setup lang="ts">
import { Moon, Sun } from 'lucide-vue-next';
import { useTheme } from '../composables/useTheme';

const { estSombre, basculerTheme } = useTheme();
</script>

<template>
  <button
    type="button"
    :aria-label="estSombre ? 'Passer au thème clair' : 'Passer au thème sombre'"
    class="inline-flex items-center justify-center gap-2 min-h-[42px] px-3.5 py-2 text-sm font-medium text-slate-700 dark:text-slate-200 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors whitespace-nowrap shrink-0 focus-visible:outline-2 focus-visible:outline-teal-600 dark:focus-visible:outline-teal-400"
    @click="basculerTheme"
  >
    <Sun v-if="estSombre" class="w-4 h-4 text-amber-400 shrink-0" aria-hidden="true" />
    <Moon v-else class="w-4 h-4 text-slate-600 shrink-0" aria-hidden="true" />
    <span>{{ estSombre ? 'Clair' : 'Sombre' }}</span>
  </button>
</template>
