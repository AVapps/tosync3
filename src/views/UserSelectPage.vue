<template>
  <ion-page>
    <ion-content>
      <div class="content">
        <section class="users-grid">
          <UserSelectItem v-for="user in userStore.usersList" :key="user._id" :user="user" />
          <UserAddItem />
        </section>
      </div>
    </ion-content>
  </ion-page>
</template>

<script setup>
import UserSelectItem from '@/components/UserSelectItem.vue'
import UserAddItem from '@/components/UserAddItem.vue'
import { useUser } from '@/store'

const userStore = useUser()

</script>

<style lang="scss" scoped>
.content {
  display: grid;
  place-content: center center;
  height: 100vh;
}
section.users-grid {
  display: flex;
  width: 80vw;
  flex-flow: row wrap;
  justify-content: center;
  
}
</style>