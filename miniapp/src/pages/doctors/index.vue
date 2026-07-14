<script setup lang="ts">
import { onMounted } from 'vue'
import { usePatientStore } from '../../stores/patient'

const store = usePatientStore()

function chooseDoctor(doctorId: string) {
  void store.loadSlots(doctorId)
}

function chooseSlot(slot: (typeof store.slots)[number]) {
  store.selectSlot(slot)
  uni.navigateTo({ url: '/pages/appointment/index' })
}

function toggleFavorite(doctor: (typeof store.doctors)[number]) {
  if (doctor.isFavorite) {
    void store.unfavoriteDoctor(doctor.id)
  } else {
    void store.favoriteDoctor(doctor.id)
  }
}

onMounted(() => {
  const pages = getCurrentPages()
  const current = pages[pages.length - 1] as unknown as { options?: Record<string, string> }
  void store.loadDoctors(current.options?.departmentId)
})
</script>

<template>
  <view class="page">
    <view class="panel">
      <text class="title">选择医生</text>
      <text class="muted">点击医生加载可预约号源。</text>
    </view>

    <view v-for="doctor in store.doctors" :key="doctor.id" class="panel doctor-card" @tap="chooseDoctor(doctor.id)">
      <text class="name">{{ doctor.name }} · {{ doctor.title }}</text>
      <text class="muted">{{ doctor.department?.name }}｜{{ doctor.specialty }}</text>
      <text class="fee">¥{{ doctor.consultationFee }}</text>
      <button class="favorite" @tap.stop="toggleFavorite(doctor)">{{ doctor.isFavorite ? '已收藏' : '收藏医生' }}</button>
    </view>

    <view v-if="store.slots.length" class="panel">
      <text class="title small">可预约号源</text>
      <view v-for="slot in store.slots" :key="slot.id" class="slot-row" @tap="chooseSlot(slot)">
        <text>{{ slot.date }} {{ slot.startTime.slice(11, 16) }}-{{ slot.endTime.slice(11, 16) }}</text>
        <text class="fee">¥{{ slot.fee }}</text>
      </view>
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

.title.small {
  font-size: 32rpx;
  margin-bottom: 12rpx;
}

.name {
  font-size: 32rpx;
  margin-bottom: 12rpx;
}

.fee {
  color: #126c5b;
  display: block;
  margin-top: 12rpx;
}

.favorite {
  margin-top: 14rpx;
}

.slot-row {
  display: flex;
  justify-content: space-between;
  border-top: 1rpx solid #eef3f1;
  padding: 18rpx 0;
}
</style>
