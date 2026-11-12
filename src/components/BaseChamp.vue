<script setup lang="ts">
defineOptions({ inheritAttrs: false });

const modele = defineModel<string>({ default: '' });

defineProps({
  id: {
    type: String,
    required: true,
  },
  erreur: {
    type: String,
    default: '',
  },
  obligatoire: {
    type: Boolean,
    default: false,
  },
  monospace: {
    type: Boolean,
    default: false,
  },
});

const emit = defineEmits({
  quitter: null,
  saisie: null,
});
</script>

<template>
  <div>
    <label :for="id" class="block text-sm font-medium text-slate-800 dark:text-slate-200 mb-1.5">
      <slot />
      <span v-if="obligatoire" class="text-rose-600 dark:text-rose-400 ml-0.5" aria-hidden="true">*</span>
    </label>
    <input
      :id="id"
      v-model="modele"
      v-bind="$attrs"
      :required="obligatoire"
      class="w-full min-h-[42px] px-3.5 py-2 text-sm bg-white dark:bg-slate-950 border rounded-lg text-slate-900 dark:text-slate-100 placeholder:text-slate-400 dark:placeholder:text-slate-500 focus:outline-none focus:ring-2 transition-colors"
      :class="[
        monospace ? 'font-mono-tabular' : '',
        erreur
          ? 'border-rose-500 focus:border-rose-600 focus:ring-rose-600/20 dark:border-rose-500 dark:focus:border-rose-400 dark:focus:ring-rose-400/20'
          : 'border-slate-300 dark:border-slate-700 focus:border-teal-600 dark:focus:border-teal-400 focus:ring-teal-600/15 dark:focus:ring-teal-400/20',
      ]"
      @blur="emit('quitter')"
      @input="emit('saisie')"
    />
    <p v-if="erreur" class="mt-1.5 text-xs text-rose-600 dark:text-rose-400">{{ erreur }}</p>
  </div>
</template>
