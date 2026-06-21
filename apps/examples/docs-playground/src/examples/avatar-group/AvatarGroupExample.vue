<script setup lang="ts">
import { VyAvatar, VyAvatarGroup } from '@vyui/kit'

const people = [
  { name: 'Ada Lovelace', text: 'AL' },
  { name: 'Grace Hopper', text: 'GH' },
  { name: 'Margaret Hamilton', text: 'MH' },
  { name: 'Katherine Johnson', text: 'KJ' },
  { name: 'Alan Turing', text: 'AT' },
]
</script>

<template>
  <VyAvatarGroup size="lg" color="primary" :max="3">
    <VyAvatar
      v-for="person in people"
      :key="person.name"
      :text="person.text"
      :alt="person.name"
    />
  </VyAvatarGroup>
</template>
