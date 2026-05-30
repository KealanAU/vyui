<script setup lang="ts">
import { TabsContent, TabsList, TabsRoot, TabsTrigger } from '..'
</script>

<template>
  <TabsRoot :default-value="1">
    <TabsList>
      <TabsTrigger :value="1" data-testid="tab">Account</TabsTrigger>
      <TabsTrigger value="tab2" data-testid="tab" disabled>Password</TabsTrigger>
    </TabsList>
    <TabsContent :value="1">
      <text>Make changes to your account here.</text>
    </TabsContent>
    <TabsContent value="tab2">
      <text>Change your password here.</text>
    </TabsContent>
  </TabsRoot>
</template>
