<template>
  <div class="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl overflow-hidden transition-colors">
    <div v-if="$slots.entete" class="px-6 sm:px-8 py-5 border-b border-slate-200 dark:border-slate-800">
      <slot name="entete" />
    </div>
    <div>
      <slot />
    </div>
  </div>
</template>
