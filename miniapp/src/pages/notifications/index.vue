<script setup lang="ts">
import { onMounted } from 'vue'
import { usePatientStore } from '../../stores/patient'

const store = usePatientStore()

function read(id: string) {
  void store.readNotification(id)
}

onMounted(() => {
  void store.loadNotifications()
})
</script>

<template>
  <view class="page">
    <view class="panel">
      <text class="title">消息通知</text>
      <text class="muted">查看预约、叫号和复诊提醒。</text>
    </view>

    <view v-for="item in store.notifications" :key="item.id" class="panel notice" @tap="read(item.id)">
      <text class="name">{{ item.title }}</text>
      <text class="muted">{{ item.content }}</text>
      <text class="status">{{ item.readAt ? '已读' : '未读' }}</text>
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
  margin-bottom: 10rpx;
}

.status {
  color: #126c5b;
  display: block;
  margin-top: 12rpx;
}
</style>
