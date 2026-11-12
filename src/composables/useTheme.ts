import { ref, watchEffect } from 'vue';

const THEME_STORAGE_KEY = 'tp_vuejs_theme_v1';

function chargerThemeInitial(): boolean {
  try {
    const saved = localStorage.getItem(THEME_STORAGE_KEY);
    if (saved === 'light') return false;
    if (saved === 'dark') return true;
  } catch {
    // Ignorer si localStorage est indisponible
  }
  return true;
}

const estSombre = ref<boolean>(chargerThemeInitial());

watchEffect(() => {
  if (typeof document !== 'undefined') {
    document.documentElement.classList.toggle('dark', estSombre.value);
  }
  try {
    localStorage.setItem(THEME_STORAGE_KEY, estSombre.value ? 'dark' : 'light');
  } catch {
    // Ignorer les erreurs de stockage
  }
});

export function useTheme() {
  function basculerTheme() {
    estSombre.value = !estSombre.value;
  }

  return {
    estSombre,
    basculerTheme,
  };
}
