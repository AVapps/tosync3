<template>
  <ion-page>
    <ion-tabs>
      <ion-tab-bar slot="bottom">
        <ion-tab-button tab="home" href="/tabs/home">
          <ion-icon :icon="homeOutline"></ion-icon>
        </ion-tab-button>
          
        <ion-tab-button tab="planning" href="/tabs/planning">
          <ion-icon :icon="calendarOutline" />
        </ion-tab-button>
        
        <ion-tab-button tab="settings" href="/tabs/settings">
          <ion-icon :icon="cogOutline" />
        </ion-tab-button>
      </ion-tab-bar>
    </ion-tabs>
  </ion-page>
</template>

<script>
import { IonTabBar, IonTabButton, IonTabs, IonIcon, IonPage } from '@ionic/vue';
import { homeOutline, calendarOutline, cogOutline } from 'ionicons/icons';

export default {
  name: 'Tabs',
  components: { IonTabs, IonTabBar, IonTabButton, IonIcon, IonPage },
  setup() {
    return {
      homeOutline,
      calendarOutline,
      cogOutline
    }
  }
}
</script>