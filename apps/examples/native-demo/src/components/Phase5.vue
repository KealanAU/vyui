<script setup lang="ts">
import {
    SheetRoot,
    SheetTrigger,
    SheetBackdrop,
    SheetContent,
    SheetHandle,
    SheetView,
    SwiperRoot,
    SwiperItem,
    SwipeAction,
    Draggable,
    SortableRoot,
    SortableItem,
    ScrollView,
    LazyComponent,
    FeedList,
} from '@vyui/core'

import { computed, ref } from "vue";
import { runOnMainThread, useMainThreadRef } from "vue-lynx";
import { useMtSmoke } from "@vyui/core";
import { useMtSmoke as useMtSmokeRel } from "../../../../../packages/core/src/shared/composables/useMtSmoke";
import {
    ACCENT,
    ACCENT_LIGHT,
    DemoCard,
    DemoLabel,
    DemoHint,
} from "./_shared";

const coreSmoke = useMtSmoke();
function runCoreSmoke() {
    coreSmoke.bump(1);
}

const relSmoke = useMtSmokeRel();
function runRelSmoke() {
    relSmoke.bump(1);
}

const smokeCount = ref(0);
function _smokeMT(n: number) {
    "main thread";
    if (typeof console !== "undefined") {
        console.log("[smoke] MT worklet ran, n=" + n);
    }
}
function runSmoke() {
    smokeCount.value += 1;
    console.log("[smoke] BG dispatching, _wkltId=", (_smokeMT as any)._wkltId);
    runOnMainThread(_smokeMT)(smokeCount.value);
}

const smokeRef = useMainThreadRef<number>(0);
function _smokeRefMT() {
    "main thread";
    smokeRef.current = smokeRef.current + 1;
    if (typeof console !== "undefined") {
        console.log("[smoke-ref] MT worklet ran, smokeRef=" + smokeRef.current);
    }
}
function runSmokeRef() {
    console.log(
        "[smoke-ref] BG dispatching, _wkltId=",
        (_smokeRefMT as any)._wkltId,
    );
    runOnMainThread(_smokeRefMT)();
}

const sheetOpen = ref(false);

const swiperIndex = ref(0);
const swiperItems = computed(() =>
    Array.from({ length: 4 }, (_, i) => ({ id: i, label: `Slide ${i + 1}` })),
);

const swipeOpen = ref(false);
const swipeCommitCount = ref(0);
function onSwipeCommit() {
    swipeCommitCount.value += 1;
}

const dragCount = ref(0);
const lastDragEnd = ref<{ x: number; y: number } | null>(null);
function onDragStart() {
    dragCount.value += 1;
}
function onDragEnd(p: { x: number; y: number; vx: number; vy: number }) {
    lastDragEnd.value = { x: Math.round(p.x), y: Math.round(p.y) };
}

const sortableItems = ref([
    { id: "a", label: "Item A" },
    { id: "b", label: "Item B" },
    { id: "c", label: "Item C" },
    { id: "d", label: "Item D" },
]);
const lastReorder = ref<{ from: number; to: number } | null>(null);
function onReorder(p: { from: number; to: number }) {
    lastReorder.value = p;
}

const feedItems = ref<Array<{ id: string; label: string }>>(
    Array.from({ length: 30 }, (_, i) => ({
        id: `r-${i}`,
        label: `Row ${i + 1}`,
    })),
);
const feedRefreshing = ref(false);
const feedLoadingMore = ref(false);
function onFeedRefresh() {
    feedRefreshing.value = true;
    setTimeout(() => {
        feedItems.value = feedItems.value.map((it) => ({
            ...it,
            label: `${it.label} ★`,
        }));
        feedRefreshing.value = false;
    }, 600);
}
function onFeedLoadMore() {
    if (feedLoadingMore.value) return;
    feedLoadingMore.value = true;
    setTimeout(() => {
        const start = feedItems.value.length;
        feedItems.value = [
            ...feedItems.value,
            ...Array.from({ length: 10 }, (_, i) => ({
                id: `r-${start + i}`,
                label: `Row ${start + i + 1}`,
            })),
        ];
        feedLoadingMore.value = false;
    }, 600);
}

const lazyEpoch = ref(0);
const lazyShown = ref(false);
function onLazyShow(visible: boolean) {
    lazyShown.value = visible;
}
function remountLazy() {
    lazyShown.value = false;
    lazyEpoch.value += 1;
}

const SCROLL_LAZY_COUNT = 6;
const scrollLazyEpoch = ref(0);
const scrollLazyShown = ref<boolean[]>(
    Array.from({ length: SCROLL_LAZY_COUNT }, () => false),
);
function onScrollLazyShow(i: number, visible: boolean) {
    const next = scrollLazyShown.value.slice();
    next[i] = visible;
    scrollLazyShown.value = next;
}
function resetScrollLazy() {
    scrollLazyShown.value = Array.from(
        { length: SCROLL_LAZY_COUNT },
        () => false,
    );
    scrollLazyEpoch.value += 1;
}

const showSheet = ref(false);
const showSwiper = ref(false);
const showSwipeAction = ref(false);
const showDraggable = ref(false);
const showSortable = ref(false);
const showScrollView = ref(false);
const showLazy = ref(false);
const showFeedList = ref(false);

const TOGGLES = computed(() => [
    { label: "Sheet", on: showSheet },
    { label: "Swiper", on: showSwiper },
    { label: "SwipeAction", on: showSwipeAction },
    { label: "Draggable", on: showDraggable },
    { label: "Sortable", on: showSortable },
    { label: "ScrollView", on: showScrollView },
    { label: "Lazy", on: showLazy },
    { label: "FeedList", on: showFeedList },
]);

function toggle(r: { value: boolean }) {
    r.value = !r.value;
}
function allOff() {
    showSheet.value = false;
    showSwiper.value = false;
    showSwipeAction.value = false;
    showDraggable.value = false;
    showSortable.value = false;
    showScrollView.value = false;
    showLazy.value = false;
    showFeedList.value = false;
}
</script>

<template>
    <view :style="{ display: 'flex', flexDirection: 'column', gap: '10px' }">
        <view
            :style="{
                display: 'flex',
                flexDirection: 'row',
                gap: '8px',
                paddingTop: '8px',
                paddingBottom: '8px',
                paddingLeft: '12px',
                paddingRight: '12px',
                borderRadius: '10px',
                backgroundColor: '#fef3c7',
                borderWidth: '1px',
                borderColor: '#fbbf24',
            }"
        >
            <view
                @tap="runSmoke"
                :style="{
                    paddingLeft: '12px',
                    paddingRight: '12px',
                    paddingTop: '6px',
                    paddingBottom: '6px',
                    borderRadius: '6px',
                    backgroundColor: '#f59e0b',
                }"
            >
                <text
                    :style="{
                        fontSize: '12px',
                        fontWeight: '700',
                        color: '#fff',
                    }"
                    >SMOKE (no ref)</text
                >
            </view>
            <view
                @tap="runSmokeRef"
                :style="{
                    paddingLeft: '12px',
                    paddingRight: '12px',
                    paddingTop: '6px',
                    paddingBottom: '6px',
                    borderRadius: '6px',
                    backgroundColor: '#d97706',
                }"
            >
                <text
                    :style="{
                        fontSize: '12px',
                        fontWeight: '700',
                        color: '#fff',
                    }"
                    >SMOKE (with ref)</text
                >
            </view>
            <view
                @tap="runCoreSmoke"
                :style="{
                    paddingLeft: '12px',
                    paddingRight: '12px',
                    paddingTop: '6px',
                    paddingBottom: '6px',
                    borderRadius: '6px',
                    backgroundColor: '#b45309',
                }"
            >
                <text
                    :style="{
                        fontSize: '12px',
                        fontWeight: '700',
                        color: '#fff',
                    }"
                    >SMOKE (alias)</text
                >
            </view>
            <view
                @tap="runRelSmoke"
                :style="{
                    paddingLeft: '12px',
                    paddingRight: '12px',
                    paddingTop: '6px',
                    paddingBottom: '6px',
                    borderRadius: '6px',
                    backgroundColor: '#78350f',
                }"
            >
                <text
                    :style="{
                        fontSize: '12px',
                        fontWeight: '700',
                        color: '#fff',
                    }"
                    >SMOKE (relative)</text
                >
            </view>
            <text
                :style="{
                    fontSize: '11px',
                    color: '#92400e',
                    alignSelf: 'center',
                }"
                >count={{ smokeCount }}</text
            >
        </view>
        <view
            :style="{
                display: 'flex',
                flexDirection: 'row',
                flexWrap: 'wrap',
                gap: '6px',
                paddingTop: '10px',
                paddingBottom: '10px',
                paddingLeft: '12px',
                paddingRight: '12px',
                borderRadius: '10px',
                backgroundColor: '#f8fafc',
                borderWidth: '1px',
                borderColor: '#e2e8f0',
            }"
        >
            <text
                :style="{
                    fontSize: '11px',
                    fontWeight: '700',
                    color: '#94a3b8',
                    letterSpacing: '0.5px',
                    marginRight: '4px',
                }"
                >LOCK</text
            >
            <view
                @tap="allOff"
                :style="{
                    paddingLeft: '10px',
                    paddingRight: '10px',
                    paddingTop: '4px',
                    paddingBottom: '4px',
                    borderRadius: '6px',
                    backgroundColor: ACCENT_LIGHT,
                }"
            >
                <text
                    :style="{
                        fontSize: '11px',
                        fontWeight: '700',
                        color: ACCENT,
                    }"
                    >ALL OFF</text
                >
            </view>
            <view
                v-for="(t, i) in TOGGLES"
                :key="i"
                @tap="toggle(t.on)"
                :style="{
                    paddingLeft: '9px',
                    paddingRight: '9px',
                    paddingTop: '4px',
                    paddingBottom: '4px',
                    borderRadius: '6px',
                    backgroundColor: t.on.value ? ACCENT : '#ffffff',
                    borderWidth: '1px',
                    borderColor: t.on.value ? ACCENT : '#e2e8f0',
                }"
            >
                <text
                    :style="{
                        fontSize: '11px',
                        fontWeight: '700',
                        color: t.on.value ? '#fff' : '#64748b',
                    }"
                    >{{ t.label }}</text
                >
            </view>
        </view>

        <!-- Sheet -->
        <DemoCard v-if="showSheet">
            <DemoLabel>SHEET</DemoLabel>
            <DemoHint
                >Snap-point bottom sheet (40% / 90%) — drag handle to
                resize</DemoHint
            >
            <SheetRoot v-model:open="sheetOpen" :snap-points="[0.4, 0.9]">
                <SheetTrigger
                    :style="{
                        alignSelf: 'flex-start',
                        paddingLeft: '16px',
                        paddingRight: '16px',
                        paddingTop: '10px',
                        paddingBottom: '10px',
                        borderRadius: '10px',
                        backgroundColor: ACCENT,
                    }"
                >
                    <text
                        :style="{
                            fontSize: '13px',
                            fontWeight: '700',
                            color: '#fff',
                        }"
                        >Open sheet</text
                    >
                </SheetTrigger>
                <SheetBackdrop
                    :style="{ backgroundColor: 'rgba(0,0,0,0.4)' }"
                />
                <SheetContent
                    :style="{
                        backgroundColor: '#fff',
                        borderTopLeftRadius: '20px',
                        borderTopRightRadius: '20px',
                    }"
                >
                    <SheetHandle
                        :style="{
                            alignSelf: 'center',
                            width: '40px',
                            height: '6px',
                            backgroundColor: 'rgba(15,23,42,0.18)',
                            borderRadius: '999px',
                            marginTop: '8px',
                            marginBottom: '8px',
                        }"
                    />
                    <SheetView>
                        <view
                            :style="{
                                padding: '20px',
                                display: 'flex',
                                flexDirection: 'column',
                                gap: '8px',
                            }"
                        >
                            <text
                                :style="{
                                    fontSize: '18px',
                                    fontWeight: '700',
                                    color: '#0f172a',
                                }"
                                >Trip details</text
                            >
                            <text
                                :style="{ fontSize: '13px', color: '#64748b' }"
                                >Drag the handle up to 90%, or back down to
                                dismiss.</text
                            >
                        </view>
                    </SheetView>
                </SheetContent>
            </SheetRoot>
        </DemoCard>

        <!-- Swiper -->
        <DemoCard v-if="showSwiper">
            <DemoLabel>SWIPER</DemoLabel>
            <DemoHint>Horizontal paged carousel — fling left/right</DemoHint>
            <SwiperRoot
                v-model="swiperIndex"
                :item-width="280"
                :item-count="swiperItems.length"
            >
                <SwiperItem v-for="item in swiperItems" :key="item.id">
                    <view
                        :style="{
                            width: '280px',
                            height: '140px',
                            borderRadius: '14px',
                            backgroundColor: ACCENT_LIGHT,
                            alignItems: 'center',
                            justifyContent: 'center',
                            marginRight: '12px',
                        }"
                    >
                        <text
                            :style="{
                                fontSize: '18px',
                                fontWeight: '700',
                                color: ACCENT,
                            }"
                            >{{ item.label }}</text
                        >
                    </view>
                </SwiperItem>
            </SwiperRoot>
            <view
                :style="{
                    alignSelf: 'flex-start',
                    paddingLeft: '12px',
                    paddingRight: '12px',
                    paddingTop: '6px',
                    paddingBottom: '6px',
                    borderRadius: '20px',
                    backgroundColor: ACCENT_LIGHT,
                }"
            >
                <text
                    :style="{
                        fontSize: '13px',
                        fontWeight: '600',
                        color: ACCENT,
                    }"
                    >Slide {{ swiperIndex + 1 }} /
                    {{ swiperItems.length }}</text
                >
            </view>
        </DemoCard>

        <!-- SwipeAction -->
        <DemoCard v-if="showSwipeAction">
            <DemoLabel>SWIPE ACTION</DemoLabel>
            <DemoHint
                >iOS-style swipe to reveal trailing action; hard fling
                commits</DemoHint
            >
            <SwipeAction
                v-model:open="swipeOpen"
                :action-width="80"
                :row-width="320"
                @commit="onSwipeCommit"
            >
                <template #default>
                    <view
                        :style="{
                            width: '320px',
                            height: '60px',
                            paddingLeft: '16px',
                            display: 'flex',
                            flexDirection: 'row',
                            alignItems: 'center',
                            backgroundColor: '#fff',
                            borderWidth: '1px',
                            borderColor: '#e2e8f0',
                            borderRadius: '8px',
                        }"
                    >
                        <text
                            :style="{
                                fontSize: '14px',
                                fontWeight: '600',
                                color: '#0f172a',
                            }"
                            >Inbox · Swipe me left</text
                        >
                    </view>
                </template>
                <template #action="{ close }">
                    <view
                        @tap="close"
                        :style="{
                            width: '80px',
                            height: '60px',
                            backgroundColor: '#ef4444',
                            alignItems: 'center',
                            justifyContent: 'center',
                            borderRadius: '8px',
                        }"
                    >
                        <text
                            :style="{
                                fontSize: '13px',
                                fontWeight: '700',
                                color: '#fff',
                            }"
                            >Delete</text
                        >
                    </view>
                </template>
            </SwipeAction>
            <view
                :style="{
                    alignSelf: 'flex-start',
                    paddingLeft: '12px',
                    paddingRight: '12px',
                    paddingTop: '6px',
                    paddingBottom: '6px',
                    borderRadius: '20px',
                    backgroundColor: ACCENT_LIGHT,
                }"
            >
                <text
                    :style="{
                        fontSize: '13px',
                        fontWeight: '600',
                        color: ACCENT,
                    }"
                    >Commits: {{ swipeCommitCount }}</text
                >
            </view>
        </DemoCard>

        <!-- Draggable -->
        <DemoCard v-if="showDraggable">
            <DemoLabel>DRAGGABLE</DemoLabel>
            <DemoHint>Free 2D pan gesture — releases settle in place</DemoHint>
            <view
                :style="{
                    width: '100%',
                    height: '180px',
                    borderRadius: '10px',
                    borderWidth: '1px',
                    borderColor: '#e2e8f0',
                    backgroundColor: '#f8fafc',
                    padding: '12px',
                }"
            >
                <Draggable @drag-start="onDragStart" @drag-end="onDragEnd">
                    <template #default="{ dragging }">
                        <view
                            :style="{
                                width: '80px',
                                height: '80px',
                                borderRadius: '12px',
                                backgroundColor: dragging ? ACCENT : '#94a3b8',
                                alignItems: 'center',
                                justifyContent: 'center',
                            }"
                        >
                            <text
                                :style="{
                                    fontSize: '12px',
                                    fontWeight: '700',
                                    color: '#fff',
                                }"
                                >DRAG</text
                            >
                        </view>
                    </template>
                </Draggable>
            </view>
            <view
                :style="{ display: 'flex', flexDirection: 'row', gap: '8px' }"
            >
                <view
                    :style="{
                        paddingLeft: '10px',
                        paddingRight: '10px',
                        paddingTop: '5px',
                        paddingBottom: '5px',
                        borderRadius: '20px',
                        backgroundColor: '#f1f5f9',
                    }"
                >
                    <text
                        :style="{
                            fontSize: '12px',
                            fontWeight: '600',
                            color: '#64748b',
                        }"
                        >drags: {{ dragCount }}</text
                    >
                </view>
                <view
                    v-if="lastDragEnd"
                    :style="{
                        paddingLeft: '10px',
                        paddingRight: '10px',
                        paddingTop: '5px',
                        paddingBottom: '5px',
                        borderRadius: '20px',
                        backgroundColor: ACCENT_LIGHT,
                    }"
                >
                    <text
                        :style="{
                            fontSize: '12px',
                            fontWeight: '600',
                            color: ACCENT,
                        }"
                        >{{ lastDragEnd.x }}, {{ lastDragEnd.y }}</text
                    >
                </view>
            </view>
        </DemoCard>

        <!-- Sortable -->
        <DemoCard v-if="showSortable">
            <DemoLabel>SORTABLE</DemoLabel>
            <DemoHint>Long-press a row, drag to reorder</DemoHint>
            <SortableRoot
                v-model="sortableItems"
                :item-height="56"
                @reorder="onReorder"
            >
                <template #default="{ items: rendered }">
                    <SortableItem
                        v-for="(item, idx) in rendered as Array<{
                            id: string;
                            label: string;
                        }>"
                        :key="item.id"
                        :index="idx"
                    >
                        <template #default="{ dragging }">
                            <view
                                :style="{
                                    height: '56px',
                                    paddingLeft: '16px',
                                    paddingRight: '16px',
                                    display: 'flex',
                                    flexDirection: 'row',
                                    alignItems: 'center',
                                    backgroundColor: dragging
                                        ? ACCENT_LIGHT
                                        : '#fff',
                                    borderBottomWidth: '1px',
                                    borderBottomColor: '#f1f5f9',
                                }"
                            >
                                <text
                                    :style="{
                                        fontSize: '15px',
                                        fontWeight: '600',
                                        color: dragging ? ACCENT : '#0f172a',
                                    }"
                                    >{{ item.label }}</text
                                >
                            </view>
                        </template>
                    </SortableItem>
                </template>
            </SortableRoot>
            <view
                v-if="lastReorder"
                :style="{
                    alignSelf: 'flex-start',
                    paddingLeft: '12px',
                    paddingRight: '12px',
                    paddingTop: '6px',
                    paddingBottom: '6px',
                    borderRadius: '20px',
                    backgroundColor: ACCENT_LIGHT,
                }"
            >
                <text
                    :style="{
                        fontSize: '13px',
                        fontWeight: '600',
                        color: ACCENT,
                    }"
                    >Moved {{ lastReorder.from }} → {{ lastReorder.to }}</text
                >
            </view>
        </DemoCard>

        <!-- ScrollView -->
        <DemoCard v-if="showScrollView">
            <DemoLabel>SCROLL VIEW</DemoLabel>
            <DemoHint
                >Lynx scroll-view with native bounce (PTR via FeedList)</DemoHint
            >
            <ScrollView
                scroll-orientation="vertical"
                :style="{
                    width: '100%',
                    height: '220px',
                    borderRadius: '10px',
                    borderWidth: '1px',
                    borderColor: '#e2e8f0',
                }"
            >
                <view
                    v-for="n in 24"
                    :key="n"
                    :style="{
                        height: '48px',
                        paddingLeft: '14px',
                        paddingRight: '14px',
                        display: 'flex',
                        flexDirection: 'row',
                        alignItems: 'center',
                        backgroundColor: n % 2 ? '#f8fafc' : '#fff',
                        borderBottomWidth: '1px',
                        borderBottomColor: '#f1f5f9',
                    }"
                >
                    <text :style="{ fontSize: '14px', color: '#0f172a' }"
                        >Row {{ n }}</text
                    >
                </view>
            </ScrollView>
        </DemoCard>

        <!-- LazyComponent -->
        <DemoCard v-if="showLazy">
            <DemoLabel>LAZY COMPONENT</DemoLabel>
            <DemoHint
                >Renders nothing real until Lynx fires an `exposure` event for
                the placeholder. Yellow = placeholder, blue = mounted
                children.</DemoHint
            >
            <view
                :style="{
                    padding: '10px',
                    borderRadius: '8px',
                    backgroundColor: lazyShown ? '#f0fdf4' : '#fffbeb',
                    borderWidth: '1px',
                    borderColor: lazyShown ? '#bbf7d0' : '#fde68a',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '4px',
                }"
            >
                <text
                    :style="{
                        fontSize: '12px',
                        fontWeight: '700',
                        color: lazyShown ? '#166534' : '#92400e',
                    }"
                    >status:
                    {{
                        lazyShown
                            ? "loaded ✓ (exposure fired)"
                            : "waiting for exposure…"
                    }}</text
                >
                <text :style="{ fontSize: '11px', color: '#64748b' }"
                    >How it works: the placeholder carries `exposure-id` +
                    `exposure-scene` attrs. Lynx watches the viewport and
                    fires `exposure` once the placeholder is visible (plus a
                    10px margin on each side). The component listens on the
                    global `exposure` event and swaps the placeholder for the
                    real children.</text
                >
                <text :style="{ fontSize: '11px', color: '#64748b' }"
                    >Tap Remount → component re-mounts → placeholder renders →
                    exposure fires again because it's still on-screen. To
                    catch it mid-flight, scroll this card partly off-screen
                    before Remounting.</text
                >
            </view>
            <view
                :style="{
                    display: 'flex',
                    flexDirection: 'row',
                    justifyContent: 'flex-end',
                }"
            >
                <view
                    @tap="remountLazy"
                    :style="{
                        paddingLeft: '12px',
                        paddingRight: '12px',
                        paddingTop: '6px',
                        paddingBottom: '6px',
                        borderRadius: '6px',
                        backgroundColor: ACCENT,
                    }"
                >
                    <text
                        :style="{
                            fontSize: '12px',
                            fontWeight: '700',
                            color: '#fff',
                        }"
                        >Remount</text
                    >
                </view>
            </view>
            <LazyComponent
                :key="`solo-${lazyEpoch}`"
                pid="demo-card"
                scene="phase5"
                :estimated-style="{
                    width: '100%',
                    height: '120px',
                    borderRadius: '10px',
                    backgroundColor: '#fef3c7',
                    borderWidth: '1px',
                    borderColor: '#fbbf24',
                }"
                @show="onLazyShow"
            >
                <view
                    :style="{
                        width: '100%',
                        height: '120px',
                        borderRadius: '10px',
                        backgroundColor: ACCENT_LIGHT,
                        alignItems: 'center',
                        justifyContent: 'center',
                    }"
                >
                    <text
                        :style="{
                            fontSize: '15px',
                            fontWeight: '700',
                            color: ACCENT,
                        }"
                        >Loaded ✓</text
                    >
                </view>
            </LazyComponent>
        </DemoCard>

        <!-- LazyComponent — scroll-into-view -->
        <DemoCard v-if="showLazy">
            <DemoLabel>LAZY · SCROLL INTO VIEW</DemoLabel>
            <DemoHint
                >Six lazy items stacked inside a 220px ScrollView. The first
                is in view at start; the rest stay as yellow placeholders
                until you scroll them past Lynx's exposure margin.</DemoHint
            >
            <view
                :style="{
                    display: 'flex',
                    flexDirection: 'row',
                    flexWrap: 'wrap',
                    gap: '4px',
                }"
            >
                <view
                    v-for="(loaded, i) in scrollLazyShown"
                    :key="i"
                    :style="{
                        paddingLeft: '8px',
                        paddingRight: '8px',
                        paddingTop: '3px',
                        paddingBottom: '3px',
                        borderRadius: '4px',
                        backgroundColor: loaded ? '#bbf7d0' : '#fde68a',
                    }"
                >
                    <text
                        :style="{
                            fontSize: '11px',
                            fontWeight: '700',
                            color: loaded ? '#166534' : '#92400e',
                        }"
                        >{{ i + 1 }} {{ loaded ? "✓" : "…" }}</text
                    >
                </view>
            </view>
            <ScrollView
                :key="`scroll-${scrollLazyEpoch}`"
                scroll-orientation="vertical"
                :style="{
                    width: '100%',
                    height: '220px',
                    borderRadius: '10px',
                    borderWidth: '1px',
                    borderColor: '#e2e8f0',
                    backgroundColor: '#f8fafc',
                }"
            >
                <view
                    v-for="(_, i) in scrollLazyShown"
                    :key="i"
                    :style="{
                        paddingLeft: '12px',
                        paddingRight: '12px',
                        paddingTop: '6px',
                        paddingBottom: '6px',
                    }"
                >
                    <LazyComponent
                        :pid="`scroll-${i}`"
                        scene="phase5-scroll"
                        :estimated-style="{
                            width: '100%',
                            height: '140px',
                            borderRadius: '10px',
                            backgroundColor: '#fef3c7',
                            borderWidth: '1px',
                            borderColor: '#fbbf24',
                        }"
                        @show="(v: boolean) => onScrollLazyShow(i, v)"
                    >
                        <view
                            :style="{
                                width: '100%',
                                height: '140px',
                                borderRadius: '10px',
                                backgroundColor: ACCENT_LIGHT,
                                alignItems: 'center',
                                justifyContent: 'center',
                            }"
                        >
                            <text
                                :style="{
                                    fontSize: '14px',
                                    fontWeight: '700',
                                    color: ACCENT,
                                }"
                                >Item {{ i + 1 }} loaded ✓</text
                            >
                        </view>
                    </LazyComponent>
                </view>
            </ScrollView>
            <view
                :style="{
                    display: 'flex',
                    flexDirection: 'row',
                    justifyContent: 'flex-end',
                }"
            >
                <view
                    @tap="resetScrollLazy"
                    :style="{
                        paddingLeft: '12px',
                        paddingRight: '12px',
                        paddingTop: '6px',
                        paddingBottom: '6px',
                        borderRadius: '6px',
                        backgroundColor: ACCENT,
                    }"
                >
                    <text
                        :style="{
                            fontSize: '12px',
                            fontWeight: '700',
                            color: '#fff',
                        }"
                        >Reset</text
                    >
                </view>
            </view>
        </DemoCard>

        <!-- FeedList -->
        <DemoCard v-if="showFeedList">
            <DemoLabel>FEED LIST</DemoLabel>
            <DemoHint
                >Virtualised list + load-more. Pull-to-refresh is not provided:
                the native `&lt;refresh&gt;` element is unused upstream
                (lynx-ui) and absent from the default LynxExplorer build
                (mounting it crashes `LynxCreateUIException: refresh ui not
                found`). PTR is deferred — see FeedList REFRESH-PHYSICS.md.</DemoHint
            >
            <FeedList
                :items="feedItems"
                enable-load-more
                :style="{
                    width: '100%',
                    height: '280px',
                    borderRadius: '10px',
                    borderWidth: '1px',
                    borderColor: '#e2e8f0',
                }"
                @load-more="onFeedLoadMore"
            >
                <template #item="{ item, index }">
                    <view
                        :style="{
                            height: '52px',
                            paddingLeft: '16px',
                            paddingRight: '16px',
                            display: 'flex',
                            flexDirection: 'row',
                            alignItems: 'center',
                            justifyContent: 'space-between',
                            borderBottomWidth: '1px',
                            borderBottomColor: '#f1f5f9',
                            backgroundColor: '#fff',
                        }"
                    >
                        <text :style="{ fontSize: '14px', color: '#0f172a' }">{{
                            item.label
                        }}</text>
                        <text :style="{ fontSize: '11px', color: '#94a3b8' }"
                            >#{{ index }}</text
                        >
                    </view>
                </template>
                <template #empty>
                    <view :style="{ padding: '24px', alignItems: 'center' }">
                        <text :style="{ fontSize: '13px', color: '#94a3b8' }"
                            >No items</text
                        >
                    </view>
                </template>
            </FeedList>
            <view
                :style="{
                    alignSelf: 'flex-start',
                    paddingLeft: '12px',
                    paddingRight: '12px',
                    paddingTop: '6px',
                    paddingBottom: '6px',
                    borderRadius: '20px',
                    backgroundColor: ACCENT_LIGHT,
                }"
            >
                <text
                    :style="{
                        fontSize: '13px',
                        fontWeight: '600',
                        color: ACCENT,
                    }"
                    >{{ feedItems.length }} rows</text
                >
            </view>
        </DemoCard>
    </view>
</template>
