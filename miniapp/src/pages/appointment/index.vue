<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import { usePatientStore } from '../../stores/patient'
import { formatAppointmentWindow, lockCountdownText } from '../../utils/appointment'

const store = usePatientStore()
const submitting = ref(false)
const locking = ref(false)
const now = ref(new Date())
const windowText = computed(() =>
  store.selectedSlot ? formatAppointmentWindow(store.selectedSlot.startTime, store.selectedSlot.endTime) : '未选择号源',
)
const countdown = computed(() => (store.selectedSlot ? lockCountdownText(now.value, store.selectedSlot.lockedUntil) : ''))

async function lockSlot() {
  locking.value = true
  try {
    await store.lockSelectedSlot()
    now.value = new Date()
  } finally {
    locking.value = false
  }
}

async function submitAppointment() {
  submitting.value = true
  try {
    await store.submitRegistration()
    uni.navigateTo({ url: '/pages/payment-result/index' })
  } finally {
    submitting.value = false
  }
}

onMounted(() => {
  void store.loadMembers()
  setInterval(() => {
    now.value = new Date()
  }, 1000)
})
</script>

<template>
  <view class="page">
    <view class="panel">
      <text class="title">确认预约</text>
      <text class="muted">确认号源和默认就诊人后提交挂号。</text>
    </view>

    <view class="panel detail">
      <text>科室：{{ store.selectedSlot?.department?.name || '-' }}</text>
      <text>诊室：{{ store.selectedSlot?.clinicRoom?.name || '-' }}</text>
      <text>时间：{{ windowText }}</text>
      <text v-if="countdown">锁号倒计时：{{ countdown }}</text>
      <text>费用：¥{{ store.selectedSlot?.fee || 0 }}</text>
      <text>就诊人：{{ store.defaultMember?.name || '请先维护就诊人' }}</text>
      <button class="plain" :loading="locking" :disabled="!store.selectedSlot" @tap="lockSlot">锁定号源</button>
      <button class="primary" :loading="submitting" :disabled="!store.selectedSlot || !store.defaultMember" @tap="submitAppointment">提交预约</button>
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

.plain {
  margin-top: 16rpx;
}
</style>
