<script setup lang="ts">
function openAppointments() {
  uni.switchTab({ url: '/pages/appointments/index' })
}
</script>

<template>
  <view class="page">
    <view class="panel result">
      <text class="title">预约已提交</text>
      <text class="muted">系统已生成挂号记录和待支付订单，请在我的预约中查看状态。</text>
      <button class="primary" @tap="openAppointments">查看我的预约</button>
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
