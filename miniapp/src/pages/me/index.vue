<script setup lang="ts">
function navigateTo(path: string) {
  uni.navigateTo({ url: path })
}
</script>

<template>
  <view class="page">
    <view class="panel profile">
      <text class="title">??</text>
      <text class="muted">patient_demo</text>
    </view>
    <view class="panel nav" @tap="navigateTo('/pages/members/index')">?????</view>
    <view class="panel nav" @tap="navigateTo('/pages/appointments/index')">????</view>
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
