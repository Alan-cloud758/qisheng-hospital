<script setup lang="ts">
function navigateTo(path: string) {
  uni.navigateTo({ url: path })
}
</script>

<template>
  <view class="page">
    <view class="panel profile">
      <text class="title">我的</text>
      <text class="muted">演示患者：patient_demo</text>
    </view>
    <view class="panel nav" @tap="navigateTo('/pages/members/index')">就诊人管理</view>
    <view class="panel nav" @tap="navigateTo('/pages/appointments/index')">我的预约</view>
  </view>
</template>

<style scoped>
.title {
  display: block;
  font-size: 38rpx;
  font-weight: 700;
}

.nav {
  font-weight: 600;
}
</style>
