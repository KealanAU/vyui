<script setup lang="ts">
import { AspectRatio } from '.'
</script>

<template>
  <Story
    title="AspectRatio/Demo"
    :layout="{ type: 'single', iframe: true }"
  >
    <Variant title="16/9">
      <div class="w-[300px]">
        <AspectRatio
          :ratio="16 / 9"
          class="bg-[#d7cff9] rounded-md overflow-hidden"
        >
          <image
            src="https://images.unsplash.com/photo-1535025183041-0991a977e25b?w=300&dpr=2&q=80"
            class="w-full h-full"
            mode="aspectFill"
          />
        </AspectRatio>
      </div>
    </Variant>

    <Variant title="1/1 (default)">
      <div class="w-[200px]">
        <AspectRatio class="bg-[#d7cff9] rounded-md">
          <text>1:1</text>
        </AspectRatio>
      </div>
    </Variant>
  </Story>
</template>
