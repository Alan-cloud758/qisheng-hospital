<script setup lang="ts">
function openAppointments() {
  uni.switchTab({ url: '/pages/appointments/index' })
}
</script>

<template>
  <view class="page">
    <view class="panel result">
      <text class="title">?????</text>
      <text class="muted">??????????????????</text>
      <button class="primary" @tap="openAppointments">????</button>
    </view>
  </view>
</template>

<style scoped>
.title {
  display: block;
  font-size: 38rpx;
  font-weight: 700;
  margin-bottom: 12rpx;
}

.primary {
  margin-top: 24rpx;
  background: #126c5b;
  color: #fff;
}
</style>
