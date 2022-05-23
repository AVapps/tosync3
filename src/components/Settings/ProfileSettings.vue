<template>
  <ion-list>
    <ion-list-header>
      <ion-label>Profil</ion-label>
    </ion-list-header>

    <ion-item lines="none">
      <ion-note> Options par défaut pour le calcul de rémunération </ion-note>
    </ion-item>

    <ion-item>
      <ion-label>Fonction</ion-label>
      <ion-select slot="end" v-model="user.profile.fonction" interface="popover">
        <ion-select-option value="CDB">CDB</ion-select-option>
        <ion-select-option value="OPL">OPL</ion-select-option>
      </ion-select>
    </ion-item>

    <ion-item>
      <ion-label>Catégorie</ion-label>
      <ion-select slot="end" v-model="user.profile.categorie" interface="popover">
        <ion-select-option value="A">A</ion-select-option>
        <ion-select-option value="B">B</ion-select-option>
        <ion-select-option value="C">C</ion-select-option>
      </ion-select>
    </ion-item>

    <ion-item>
      <ion-label>Date ancienneté rémunération</ion-label>
      <date-input slot="end" v-model="user.profile.dateAnciennete" />
    </ion-item>

    <ion-item>
      <ion-label>Classe</ion-label>
      <number-input slot="end" v-model="user.profile.classe" :min="1" :max="5" />
    </ion-item>

    <ion-item :disabled="user.profile?.fonction === 'CDB'">
      <ion-label>ATPL</ion-label>
      <ion-toggle slot="end" v-model="user.profile.atpl"></ion-toggle>
    </ion-item>

    <ion-item>
      <ion-label>Affichage des HS</ion-label>
      <ion-select slot="end" v-model="user.profile.eHS" interface="popover">
        <ion-select-option value="TO">Règles « A »</ion-select-option>
        <ion-select-option value="AF">Règles « B »</ion-select-option>
      </ion-select>
    </ion-item>
  </ion-list>
</template>

<script setup>
import { useUser } from '@/store'

import {
  IonItem,
  IonLabel,
  IonList,
  IonListHeader,
  IonNote,
  IonSelect,
  IonSelectOption,
  IonToggle
} from '@ionic/vue'

import DateInput from '@/components/DateInput.vue'
import NumberInput from '@/components/NumberInput.vue'

const user = useUser()
</script>

<style lang="scss" scoped>
</style>
