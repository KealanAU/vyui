<script setup lang="ts">
const { data: changelogEntries } = await useAsyncData("changelog", () =>
    queryCollection("changelog").all(),
);

const dateFormatter = new Intl.DateTimeFormat("en-US", {
    day: "numeric",
    month: "short",
    year: "numeric",
});

function parseChangelogDate(value: unknown) {
    if (value instanceof Date && Number.isFinite(value.getTime())) {
        return value;
    }

    if (typeof value !== "string" || !value.trim()) {
        return undefined;
    }

    // Parse as UTC so the displayed day doesn't drift across timezones.
    const date = new Date(`${value.trim()}T00:00:00Z`);
    return Number.isFinite(date.getTime()) ? date : undefined;
}

function formatDate(date: unknown) {
    const parsed = parseChangelogDate(date);
    return parsed ? dateFormatter.format(parsed) : "Unknown date";
}

function parseVersionOrder(version: unknown) {
    if (typeof version !== "string") {
        return 0;
    }

    const match = version.match(/^v?(\d+)\.(\d+)\.(\d+)$/);
    if (!match) {
        return 0;
    }

    const [, major, minor, patch] = match;
    return Number(major) * 1_000_000 + Number(minor) * 1_000 + Number(patch);
}

function getChangelogOrder(entry: { version?: unknown }) {
    return (
        (entry as { changelogOrder?: number }).changelogOrder ??
        parseVersionOrder(entry.version)
    );
}

const entries = computed(() =>
    [...(changelogEntries.value ?? [])].sort((a, b) => {
        const dateA = parseChangelogDate(a.date)?.getTime() ?? 0;
        const dateB = parseChangelogDate(b.date)?.getTime() ?? 0;

        if (dateA !== dateB) {
            return dateB - dateA;
        }

        const orderA = getChangelogOrder(a);
        const orderB = getChangelogOrder(b);

        if (orderA !== orderB) {
            return orderB - orderA;
        }

        return String(a.path).localeCompare(String(b.path));
    }),
);

useSeoMeta({
    title: "Changelog",
    description: "Release notes for Vy UI — @vyui/core and @vyui/kit.",
});

defineOgImageComponent("Default", {
    title: "Changelog",
    description: "Release notes for Vy UI — @vyui/core and @vyui/kit.",
});
</script>

<template>
    <UContainer>
        <div class="py-12 sm:py-16">
            <div class="mx-auto mb-12 max-w-2xl text-center">
                <h1
                    class="text-highlighted text-4xl font-semibold tracking-tight sm:text-5xl"
                >
                    Changelog
                </h1>
                <p class="text-muted mt-3 text-base sm:text-lg">
                    What's shipping across
                    <code class="text-highlighted">@vyui/core</code> and
                    <code class="text-highlighted">@vyui/kit</code> — one
                    rolling timeline, newest first.
                </p>
            </div>

            <UAlert
                v-if="!entries?.length"
                icon="i-lucide-flask-conical"
                color="warning"
                variant="subtle"
                title="No entries yet"
                description="Vy UI is pre-alpha. This page fills in as core and kit evolve."
            />

            <template v-else>
                <!-- Rail headers (desktop only) -->
                <div
                    class="text-muted mb-6 hidden grid-cols-[1fr_auto_1fr] items-center gap-x-12 text-sm font-medium md:grid"
                >
                    <div class="flex items-center justify-end gap-2">
                        <UIcon
                            name="i-lucide-box"
                            class="text-primary size-4"
                        />
                        <code class="text-highlighted">@vyui/core</code>
                    </div>
                    <div class="size-3" />
                    <div class="flex items-center gap-2">
                        <UIcon
                            name="i-lucide-layers"
                            class="text-info size-4"
                        />
                        <code class="text-highlighted">@vyui/kit</code>
                    </div>
                </div>

                <div class="relative">
                    <!-- Center spine -->
                    <div
                        class="bg-border absolute inset-y-0 left-[7px] w-px md:left-1/2 md:-translate-x-1/2"
                    />

                    <ul class="space-y-10">
                        <li
                            v-for="entry in entries"
                            :key="entry.path"
                            class="relative md:grid md:grid-cols-2 md:gap-x-12"
                        >
                            <!-- Node on the spine -->
                            <span
                                class="ring-bg absolute top-2 left-[7px] z-10 size-3.5 -translate-x-1/2 rounded-full ring-4 md:left-1/2"
                                :class="
                                    entry.package === 'core'
                                        ? 'bg-primary'
                                        : 'bg-info'
                                "
                            />

                            <div
                                :class="[
                                    'pl-8 md:pl-0',
                                    entry.package === 'core'
                                        ? 'md:col-start-1 md:pr-2 md:text-right'
                                        : 'md:col-start-2 md:pl-2',
                                ]"
                            >
                                <UCard
                                    variant="subtle"
                                    :ui="{ body: 'sm:p-5' }"
                                >
                                    <div
                                        class="flex items-center gap-2"
                                        :class="
                                            entry.package === 'core' &&
                                            'md:flex-row-reverse'
                                        "
                                    >
                                        <UBadge
                                            :color="
                                                entry.package === 'core'
                                                    ? 'primary'
                                                    : 'info'
                                            "
                                            variant="subtle"
                                            size="sm"
                                        >
                                            @vyui/{{ entry.package }}
                                        </UBadge>
                                        <UBadge
                                            color="neutral"
                                            variant="outline"
                                            size="sm"
                                            class="font-mono"
                                        >
                                            {{ entry.version }}
                                        </UBadge>
                                    </div>

                                    <time
                                        class="text-dimmed mt-3 block font-mono text-xs"
                                    >
                                        {{ formatDate(entry.date) }}
                                    </time>

                                    <h2
                                        class="text-highlighted mt-1 text-lg font-semibold"
                                    >
                                        {{ entry.title }}
                                    </h2>

                                    <ChangelogBody
                                        :entry="entry"
                                        :align="
                                            entry.package === 'core'
                                                ? 'right'
                                                : 'left'
                                        "
                                        class="mt-2"
                                    />
                                </UCard>
                            </div>
                        </li>
                    </ul>
                </div>
            </template>
        </div>
    </UContainer>
</template>
