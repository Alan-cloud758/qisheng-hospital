<script setup lang="ts">
function openAppointment() {
  uni.navigateTo({ url: '/pages/appointment/index' })
}
</script>

<template>
  <view class="page">
    <view class="panel">
      <text class="title">????</text>
      <text class="muted">?????????????????</text>
    </view>
    <view class="panel">
      <text class="name">?? ????</text>
      <text class="muted">????????????????????</text>
      <button class="primary" @tap="openAppointment">????</button>
    </view>
  </view>
</template>

<style scoped>
.title,
.name {
  display: block;
  font-weight: 700;
}

.title {
  font-size: 38rpx;
}

.name {
  font-size: 32rpx;
  margin-bottom: 12rpx;
}

.primary {
  margin-top: 24rpx;
  background: #126c5b;
  color: #fff;
}
</style>
