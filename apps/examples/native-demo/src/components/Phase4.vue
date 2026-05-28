<script setup lang="ts">
import { ref } from "vue";
import {
    // PinInput
    PinInputRoot,
    PinInputInput,
    // Toast
    ToastProvider,
    ToastRoot,
    ToastTitle,
    ToastDescription,
    ToastAction,
    ToastClose,
    ToastViewport,
    // Icon (vyui original)
    Icon,
} from "@vyui/core";
import { ACCENT, ACCENT_LIGHT, DemoCard, DemoHint, DemoLabel, DemoSwitcher } from "./_shared";

// --- PinInput ---
const pin = ref<string[]>([]);
const pinDone = ref(false);
function onPinComplete(value: string[]) {
    pinDone.value = true;
    console.log("pin complete", value.join(""));
}

// --- Toast ---
let toastSeq = 0;
const toasts = ref<{ id: number; title: string; body: string }[]>([]);
function showToast() {
    toastSeq += 1;
    toasts.value = [
        ...toasts.value,
        { id: toastSeq, title: "Saved", body: `Changes synced · #${toastSeq}` },
    ];
}
function dismissToast(id: number) {
    toasts.value = toasts.value.filter((t) => t.id !== id);
}

// Component isolation: 0 = show all, N > 0 = show only N-th card.
//   1 PinInput · 2 Toast
const showComponent = ref(0);
const CARDS = 2;
</script>

<template>
    <view :style="{ display: 'flex', flexDirection: 'column', gap: '10px' }">

        <DemoSwitcher v-model="showComponent" :total="CARDS" />

        <!-- PinInput -->
        <DemoCard v-if="showComponent === 0 || showComponent === 1">
            <DemoLabel>PIN INPUT</DemoLabel>
            <DemoHint>One character per cell, focus auto-advances</DemoHint>
            <PinInputRoot
                v-model="pin"
                placeholder="○"
                :style="{ display: 'flex', flexDirection: 'row', gap: '10px' }"
                @complete="onPinComplete"
            >
                <PinInputInput
                    v-for="i in 4"
                    :key="i"
                    :index="i - 1"
                    :accessibility-label="`Pin input ${i}`"
                    accessibility-traits="keyboard"
                    :style="{
                        width: '52px',
                        height: '60px',
                        borderWidth: '1px',
                        borderColor: pinDone ? ACCENT : '#e2e8f0',
                        borderRadius: '10px',
                        backgroundColor: '#f8fafc',
                        textAlign: 'center',
                        fontSize: '22px',
                        fontWeight: '700',
                        color: '#0f172a',
                    }"
                />
            </PinInputRoot>
            <view
                v-if="pinDone"
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
                    >Code complete ✓</text
                >
            </view>
        </DemoCard>

        <!-- Toast -->
        <DemoCard v-if="showComponent === 0 || showComponent === 2">
            <DemoLabel>TOAST</DemoLabel>
            <DemoHint>Tap to fire a toast — auto-dismisses after 4s</DemoHint>
            <ToastProvider :duration="4000">
                <view
                    @tap="showToast"
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
                            color: '#ffffff',
                        }"
                        >Show toast</text
                    >
                </view>

                <ToastViewport
                    position="bottom"
                    :style="{
                        alignItems: 'center',
                        gap: '8px',
                        padding: '12px',
                    }"
                >
                    <ToastRoot
                        v-for="t in toasts"
                        :key="t.id"
                        :default-open="true"
                        @update:open="
                            (v) => {
                                if (!v) dismissToast(t.id);
                            }
                        "
                        :style="{
                            width: '320px',
                            maxWidth: '92%',
                            display: 'flex',
                            flexDirection: 'row',
                            alignItems: 'center',
                            gap: '12px',
                            padding: '14px',
                            borderRadius: '12px',
                            backgroundColor: '#0f172a',
                            boxShadow: '0px 8px 24px rgba(15, 23, 42, 0.35)',
                        }"
                    >
                        <view
                            :style="{
                                flexGrow: '1',
                                display: 'flex',
                                flexDirection: 'column',
                                gap: '2px',
                            }"
                        >
                            <ToastTitle
                                :style="{
                                    fontSize: '14px',
                                    fontWeight: '700',
                                    color: '#ffffff',
                                }"
                            >
                                {{ t.title }}
                            </ToastTitle>
                            <ToastDescription
                                :style="{ fontSize: '12px', color: '#cbd5e1' }"
                            >
                                {{ t.body }}
                            </ToastDescription>
                        </view>
                        <ToastAction
                            alt-text="Undo the change"
                            :style="{
                                paddingLeft: '10px',
                                paddingRight: '10px',
                                paddingTop: '6px',
                                paddingBottom: '6px',
                                borderRadius: '8px',
                                backgroundColor: 'rgba(255,255,255,0.12)',
                            }"
                        >
                            <text
                                :style="{
                                    fontSize: '12px',
                                    fontWeight: '700',
                                    color: '#93c5fd',
                                }"
                                >Undo</text
                            >
                        </ToastAction>
                        <ToastClose
                            :style="{
                                width: '22px',
                                height: '22px',
                                borderRadius: '11px',
                                alignItems: 'center',
                                justifyContent: 'center',
                                backgroundColor: 'rgba(255,255,255,0.12)',
                            }"
                        >
                            <text
                                :style="{
                                    fontSize: '13px',
                                    fontWeight: '700',
                                    color: '#ffffff',
                                }"
                                >×</text
                            >
                        </ToastClose>
                    </ToastRoot>
                </ToastViewport>
            </ToastProvider>
        </DemoCard>

    </view>
</template>
