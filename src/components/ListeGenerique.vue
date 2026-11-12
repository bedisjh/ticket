<script setup lang="ts" generic="T extends Record<string, any>">
const props = withDefaults(
  defineProps<{
    elements: T[];
    cle?: keyof T;
    colonnes?: 1 | 2;
  }>(),
  {
    colonnes: 1,
  }
);

function obtenirCle(element: T, index: number): string | number {
  if (props.cle && element[props.cle] !== undefined && element[props.cle] !== null) {
    return element[props.cle] as string | number;
  }
  return index;
}
</script>

<template>
  <div
    class="grid gap-3"
    :class="colonnes === 2 ? 'grid-cols-1 lg:grid-cols-2 gap-4' : 'grid-cols-1'"
  >
    <div v-for="(el, index) in elements" :key="obtenirCle(el, index)">
      <slot :element="el" :index="index">
        {{ el }}
      </slot>
    </div>
  </div>
</template>
