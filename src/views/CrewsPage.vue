<template>
  <ion-page>
    <ion-header collapse="fade">
        <ion-toolbar>
          <ion-title>Annuaire PN</ion-title>
        </ion-toolbar>
        <ion-toolbar>
          <ion-searchbar
            v-model="filters.searchTerm"
            clear-icon
            placeholder="Recherche"
            enterkeyhint="search"
            inputmode="search"
          />
          <ion-buttons slot="primary">
            <ion-button @click="$filtersModal.openModal()" color="theme">
              <ion-icon :icon="filterCircleOutline" slot="icon-only"/>
            </ion-button>
            <crews-filters-modal @modal:confirm="updateFilters" ref="$filtersModal" :roles="availableRoles"></crews-filters-modal>
          </ion-buttons>
        </ion-toolbar>
      </ion-header>
    

    <ion-content class="crews-content" fullscreen :scroll-y="false">
      <RecycleScroller
        class="ion-content-scroll-host scroller"
        :buffer="400"
        :items="filteredCrews"
        :item-size="44"
        key-field="_id"
      >
        <template #before>
          <ion-refresher
            slot="fixed"
            @ionRefresh="onRefresh($event)"
            :disabled="!connect.isConnected">
            <ion-refresher-content></ion-refresher-content>
          </ion-refresher>

          <ion-header collapse="condense">
            <ion-toolbar>
              <ion-title size="large">Annuaire PN</ion-title>
            </ion-toolbar>
          </ion-header>
          <ion-item lines="none">
            <ion-note>
              Dernière mise à jour : {{ toLocaleString(store.lastCrewsIndexSync, DATETIME_SHORT_FORMAT) }}
            </ion-note>
            <ion-note color="theme" slot="end">
              {{ filteredCrews.length }} PN
            </ion-note>
          </ion-item>
        </template>
        <template #default="{ item }">
          <ion-item class="crew-item">
            <ion-chip class="crew-code-chip" slot="start">{{ item._id }}</ion-chip>
            <ion-label>
              <span class="ion-text-uppercase">{{ item.lastName }}</span>
              &nbsp;
              <span class="ion-text-capitalize">{{ item.firstName }}</span>
            </ion-label>
            <ion-chip :color="roleColor(item.title)" outline class="role-chip" slot="end">{{ item.title }}</ion-chip>
          </ion-item>
        </template>
      </RecycleScroller>
    </ion-content>
  </ion-page>
</template>

<script setup>
import { useConnect, useCrews, useMainStore } from '@/store'
import { toastHttpError } from '@/helpers/toast'
import { computed, reactive } from 'vue'
import { filter, sortBy, some } from 'lodash'

import { toLocaleString, DATETIME_SHORT_FORMAT } from '@/helpers/dates'

import { filterCircleOutline, people } from 'ionicons/icons'
import CrewsFiltersModal from '@/components/CrewsFiltersModal.vue'

const store = useMainStore()
const connect = useConnect()
const crews = useCrews()

const $filtersModal = ref()

const filters = reactive({
  searchTerm: '',
  sortBy: ['lastName', 'firstName'],
  roles: []
})

const sortByValue = ref('lastName')

const filteredCrews = computed(() => {
  let list = crews.list
  if (filters.searchTerm) {
    list = filter(list, crew => {
      return crew._id.startsWith(filters.searchTerm.toUpperCase())
        || crew.lastName.toLowerCase().startsWith(filters.searchTerm.toLowerCase())
    })
  }
  if (filters.roles.length) {
    list = filter(list, crew => {
      return some(crew.contractRoles.split('+'), role => filters.roles.includes(role))
    })
  }
  return sortBy(list, filters.sortBy)
})

const availableRoles = computed(() => {
  const rolesSet = new Set()
  crews.list.forEach(crew => {
    crew.contractRoles.split('+')
      .forEach(role => rolesSet.add(role))
  })
  return [...rolesSet].sort()
})

function updateFilters(update) {
  filters.sortBy = update.sortBy
  filters.roles = update.roles
}

async function onRefresh(event) {
  await store.syncCrewsIndex(true)
  event.target.complete()
}

function roleColor(role) {
  switch (role.split(' ')[0]) {
    case 'CDB':
      return 'primary'
    case 'OPL':
      return 'secondary'
    case 'CC':
      return 'tertiary'
    case 'CA':
    case 'CAS':
      return 'yellow'
    default:
      return 'medium'
  }
}

</script>

<style scoped lang="scss">
.scroller {
  height: 100%;
  overflow-x: hidden;
}

ion-refresher {
  z-index: 10;
}

.crew-code-chip {
  min-width: 6.5ch;
  justify-content: center;
}
</style>
