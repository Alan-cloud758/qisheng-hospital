<script setup lang="ts">
import { onMounted } from 'vue'
import { usePatientStore } from '../../stores/patient'

const store = usePatientStore()

onMounted(() => {
  void store.loadQueueTickets()
})
</script>

<template>
  <view class="page">
    <view class="panel">
      <text class="title">候诊队列</text>
      <text class="muted">查看排队号、前方人数和预计等待时间。</text>
    </view>

    <view v-for="ticket in store.queueTickets" :key="ticket.id" class="panel ticket">
      <text class="name">{{ ticket.department?.name }} · {{ ticket.doctor?.user?.displayName }}</text>
      <text class="queue-no">第 {{ ticket.queueNo }} 号</text>
      <text class="muted">当前叫号：{{ ticket.currentQueueNo || '-' }}</text>
      <text class="muted">前方 {{ ticket.ahead }} 人，预计 {{ ticket.waitMinutes }} 分钟</text>
      <text class="status">{{ ticket.status }}</text>
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

.queue-no {
  color: #126c5b;
  display: block;
  font-size: 46rpx;
  font-weight: 800;
  margin: 16rpx 0;
}

.status {
  display: block;
  margin-top: 12rpx;
}
</style>
