<script setup lang="ts">
import type { Collections } from "@nuxt/content";

const props = defineProps<{
    entry: Collections["changelog"];
    align?: "left" | "right";
}>();

// Collapsed height cap (px). Entries taller than this get a Read more toggle.
const COLLAPSED_MAX = 160;

const content = ref<HTMLElement | null>(null);
const expanded = ref(false);
const overflowing = ref(false);

function measure() {
    const el = content.value;
    if (!el) return;
    overflowing.value = el.scrollHeight > COLLAPSED_MAX + 24;
}

onMounted(() => {
    measure();
    if (typeof ResizeObserver !== "undefined" && content.value) {
        const ro = new ResizeObserver(() => measure());
        ro.observe(content.value);
        onBeforeUnmount(() => ro.disconnect());
    }
});

// Fade the last stretch to transparent while collapsed, independent of the
// card background colour.
const collapsed = computed(() => overflowing.value && !expanded.value);
const maskStyle = computed(() =>
    collapsed.value
        ? "linear-gradient(to bottom, black calc(100% - 3rem), transparent)"
        : undefined,
);
</script>

<template>
    <div>
        <div
            ref="content"
            class="text-muted text-sm [&_a]:text-primary [&_code]:text-highlighted overflow-hidden transition-[max-height] duration-300 ease-out"
            :style="{
                maxHeight: collapsed ? `${COLLAPSED_MAX}px` : 'none',
                maskImage: maskStyle,
                WebkitMaskImage: maskStyle,
            }"
        >
            <ContentRenderer :value="props.entry" />
        </div>

        <button
            v-if="overflowing"
            type="button"
            class="text-primary mt-2 flex items-center gap-1 text-sm font-medium hover:underline"
            :class="props.align === 'right' && 'md:ml-auto md:flex-row-reverse'"
            @click="expanded = !expanded"
        >
            {{ expanded ? "Show less" : "Read more" }}
            <UIcon
                :name="
                    expanded ? 'i-lucide-chevron-up' : 'i-lucide-chevron-down'
                "
                class="size-4"
            />
        </button>
    </div>
</template>
