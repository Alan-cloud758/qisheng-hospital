<script setup lang="ts">
import { onMounted } from 'vue'
import { usePatientStore } from '../../stores/patient'
import { formatAppointmentWindow } from '../../utils/appointment'
import { registrationStatusText } from '../../utils/status'

const store = usePatientStore()

function timeText(row: { slot?: { startTime: string; endTime: string } }) {
  return row.slot ? formatAppointmentWindow(row.slot.startTime, row.slot.endTime) : '-'
}

function cancel(id: string) {
  void store.cancelRegistration(id)
}

onMounted(() => {
  void store.loadRegistrations()
})
</script>

<template>
  <view class="page">
    <view class="panel">
      <text class="title">我的预约</text>
      <text class="muted">查看预约、签到、就诊和取消状态。</text>
    </view>

    <view v-for="item in store.registrations" :key="item.id" class="panel appointment">
      <text>{{ item.department?.name }} · {{ item.doctor?.user?.displayName }}</text>
      <text class="muted">{{ item.visitMember?.name }}｜{{ timeText(item) }}</text>
      <text class="status">{{ registrationStatusText(item.status) }}</text>
      <button v-if="item.status === 'BOOKED'" class="plain" @tap="cancel(item.id)">取消预约</button>
    </view>
  </view>
</template>

<style scoped>
.title {
  display: block;
  font-size: 38rpx;
  font-weight: 700;
}

.appointment text {
  display: block;
  margin-bottom: 10rpx;
}

.status {
  color: #126c5b;
  font-weight: 700;
}

.plain {
  margin-top: 16rpx;
}
</style>
