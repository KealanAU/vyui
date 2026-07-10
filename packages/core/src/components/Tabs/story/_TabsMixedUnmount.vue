<script setup lang="ts">
// Keep-alive root with one panel opting back into unmount-on-hide — the shape
// for gesture/worklet tabs whose MT-written styles outlive a display:none hide.
import { TabsContent, TabsList, TabsRoot, TabsTrigger } from '..'
</script>

<template>
  <TabsRoot :default-value="1" :unmount-on-hide="false">
    <TabsList>
      <TabsTrigger :value="1" data-testid="tab">Account</TabsTrigger>
      <TabsTrigger value="tab2" data-testid="tab">Password</TabsTrigger>
    </TabsList>
    <TabsContent :value="1">
      <text>Make changes to your account here.</text>
    </TabsContent>
    <TabsContent value="tab2" :unmount-on-hide="true">
      <text>Change your password here.</text>
    </TabsContent>
  </TabsRoot>
</template>
