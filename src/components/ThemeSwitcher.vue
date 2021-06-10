<template>
  <div class="theme-switcher" @click="toggleTheme()">
    <ion-icon
      :icon="sunnyOutline"
      :style="{ opacity: theme === 'light' ? 1 : 0.3 }"
    />
    <span class="divider">/</span>
    <ion-icon
      :icon="moonOutline"
      :style="{ opacity: theme === 'dark' ? 1 : 0.3 }"
    />
  </div>
</template>

<script>
import { defineComponent, computed } from 'vue'
import { IonIcon } from '@ionic/vue'
import { sunnyOutline, moonOutline } from 'ionicons/icons'

import { useMainStore } from '@/store'

export default defineComponent({
  name: 'ThemeSwitcher',
  components: {
    IonIcon
  },
  setup() {
    const store = useMainStore()

    return {
      theme: computed(() => store.config?.theme || 'auto'),
      toggleTheme: store.toggleTheme,
      sunnyOutline,
      moonOutline
    }
  }
})
</script>

<style lang="scss">
.theme-switcher {
  display: inline-flex;
  flex-flow: row nowrap;
  justify-content: center;
  align-items: center;
  padding: 0.25rem 0.5rem;
  border-radius: var(--border-radius);
  cursor: pointer;

  > span.divider {
    display: inline-block;
    margin: 0 0.5rem;
    opacity: 0.5;
    font-size: 1.25rem;
    line-height: 1;
  }

  > ion-icon {
    font-size: 24px;
    --ionicon-stroke-width: 32px;
  }

  &:hover,
  &:active,
  &:focus {
    background-color: rgba($color: #fff, $alpha: 0.05);
  }
}
</style>

