<script setup lang="ts">
const shortcuts = [
  { label: '????', path: '/pages/departments/index' },
  { label: '????', path: '/pages/appointments/index' },
  { label: '???', path: '/pages/members/index' },
]

function navigateTo(path: string) {
  uni.navigateTo({ url: path })
}
</script>

<template>
  <view class="page home-page">
    <view class="hero">
      <text class="eyebrow">QiSheng Hospital</text>
      <text class="title">????</text>
      <text class="subtitle">??????????????</text>
    </view>

    <view class="shortcut-grid">
      <view v-for="item in shortcuts" :key="item.label" class="panel shortcut" @tap="navigateTo(item.path)">
        <text>{{ item.label }}</text>
      </view>
    </view>

    <view class="panel">
      <text class="section-title">????</text>
      <text class="muted">?? 08:00-17:30??? 24 ?????</text>
    </view>
  </view>
</template>

<style scoped>
.hero {
  background: #0f6b5c;
  border-radius: 12rpx;
  color: #fff;
  padding: 40rpx;
  margin-bottom: 24rpx;
}

.eyebrow,
.subtitle,
.title,
.section-title {
  display: block;
}

.eyebrow {
  font-size: 24rpx;
  opacity: 0.78;
}

.title {
  font-size: 44rpx;
  font-weight: 700;
  margin: 10rpx 0;
}

.subtitle {
  font-size: 28rpx;
}

.shortcut-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 18rpx;
}

.shortcut {
  text-align: center;
  font-weight: 600;
}

.section-title {
  font-size: 32rpx;
  font-weight: 700;
  margin-bottom: 12rpx;
}
</style>
