<template>
  <view class="app-header">
    <view class="app-header__logo-row">
      <view class="app-header__mark">
        <text class="app-header__mark-text">L</text>
      </view>
      <text class="app-header__title">vyui</text>
    </view>
    <text class="app-header__tagline">Lynx-native Vue 3 primitives</text>
    <view class="app-header__badges">
      <view class="app-header__badge app-header__badge--blue">
        <text class="app-header__badge-text app-header__badge-text--blue">Vue 3</text>
      </view>
      <view class="app-header__badge app-header__badge--blue">
        <text class="app-header__badge-text app-header__badge-text--blue">Lynx</text>
      </view>
      <view class="app-header__badge app-header__badge--green">
        <text class="app-header__badge-text app-header__badge-text--green">Live</text>
      </view>
    </view>
  </view>
</template>

<style>
/*
 * Lynx CSS — note longhand padding/margin only.
 * `paddingHorizontal` / `paddingVertical` are React Native names and are
 * silently dropped by the Lynx CSS engine. Lynx defaults `display` to
 * `linear`, so any element using flex alignment must set `display: flex`.
 */

.app-header {
  /* 34px = App.vue outer 16px + Phase card 18px — keeps the logo aligned
     with the phase card icons/titles below. */
  padding-left: 34px;
  padding-right: 34px;
  padding-top: 28px;
  padding-bottom: 18px;
  background-color: #0f172a;
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.app-header__logo-row {
  display: flex;
  flex-direction: row;
  align-items: center;
  gap: 12px;
}

.app-header__mark {
  width: 32px;
  height: 32px;
  border-radius: 8px;
  background-color: #3b82f6;
  display: flex;
  align-items: center;
  justify-content: center;
}

.app-header__mark-text {
  font-size: 16px;
  font-weight: 700;
  line-height: 20px;
  color: #ffffff;
}

.app-header__title {
  font-size: 26px;
  font-weight: 800;
  line-height: 32px;
  letter-spacing: -0.5px;
  color: #f8fafc;
}

.app-header__tagline {
  font-size: 13px;
  line-height: 18px;
  color: #94a3b8;
  /* aligns under "@vyui/core": 32px mark + 12px gap */
  margin-left: 44px;
}

.app-header__badges {
  display: flex;
  flex-direction: row;
  align-items: center;
  gap: 8px;
  margin-top: 8px;
}

.app-header__badge {
  display: flex;
  flex-direction: row;
  align-items: center;
  justify-content: center;
  padding-left: 12px;
  padding-right: 12px;
  padding-top: 6px;
  padding-bottom: 6px;
  border-radius: 20px;
}

.app-header__badge--blue {
  background-color: #1e3a5f;
}

.app-header__badge--green {
  background-color: #064e3b;
}

.app-header__badge-text {
  font-size: 11px;
  font-weight: 600;
  line-height: 15px;
}

.app-header__badge-text--blue {
  color: #60a5fa;
}

.app-header__badge-text--green {
  color: #34d399;
}
</style>
