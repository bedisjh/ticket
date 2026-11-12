<script setup lang="ts">
import { RouterView } from 'vue-router';
import { useTheme } from './composables/useTheme';
import AppEnTete from './components/AppEnTete.vue';

// Initialise et synchronise la classe .dark sur <html>
useTheme();
</script>

<template>
  <div class="min-h-screen flex flex-col bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 transition-colors">
    <AppEnTete />
    <main class="flex-1">
      <RouterView />
    </main>
  </div>
</template>
