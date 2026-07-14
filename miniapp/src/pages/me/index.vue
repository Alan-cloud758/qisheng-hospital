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
    <view class="panel nav" @tap="navigateTo('/pages/queue/index')">候诊队列</view>
    <view class="panel nav" @tap="navigateTo('/pages/inpatient/index')">我的住院</view>
    <view class="panel nav" @tap="navigateTo('/pages/lab-reports/index')">检验报告</view>
    <view class="panel nav" @tap="navigateTo('/pages/imaging-reports/index')">影像报告</view>
    <view class="panel nav" @tap="navigateTo('/pages/notifications/index')">消息通知</view>
    <view class="panel nav" @tap="navigateTo('/pages/fees/index')">费用记录</view>
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
