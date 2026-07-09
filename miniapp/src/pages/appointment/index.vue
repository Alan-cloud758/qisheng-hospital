<script setup lang="ts">
import { formatAppointmentWindow } from '../../utils/appointment'

const demoWindow = formatAppointmentWindow('2026-07-10T01:00:00.000Z', '2026-07-10T01:30:00.000Z')

function submitAppointment() {
  uni.navigateTo({ url: '/pages/payment-result/index' })
}
</script>

<template>
  <view class="page">
    <view class="panel">
      <text class="title">????</text>
      <text class="muted">?????????????</text>
    </view>
    <view class="panel detail">
      <text>???????</text>
      <text>????? ????</text>
      <text>???{{ demoWindow }}</text>
      <button class="primary" @tap="submitAppointment">????</button>
    </view>
  </view>
</template>

<style scoped>
.title {
  display: block;
  font-size: 38rpx;
  font-weight: 700;
}

.detail text {
  display: block;
  margin-bottom: 14rpx;
}

.primary {
  margin-top: 20rpx;
  background: #126c5b;
  color: #fff;
}
</style>
