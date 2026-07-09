<script setup lang="ts">
import { onMounted } from 'vue'
import { usePatientStore } from '../../stores/patient'

const store = usePatientStore()

onMounted(() => {
  void store.loadDepartments()
})

function openDoctor(doctorId: string) {
  uni.navigateTo({ url: '/pages/doctors/index?doctorId=' + doctorId })
}
</script>

<template>
  <view class="page">
    <view class="panel page-head">
      <text class="title">????</text>
      <text class="muted">??????????????</text>
    </view>

    <view v-for="department in store.departments" :key="department.id" class="panel department-card">
      <text class="name">{{ department.name }}</text>
      <text class="muted">{{ department.description || '????' }}</text>
      <view class="doctor-row" v-for="doctor in department.doctors" :key="doctor.id" @tap="openDoctor(doctor.id)">
        <text>{{ doctor.name }}</text>
        <text class="muted">{{ doctor.title }}</text>
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
  margin-bottom: 10rpx;
}

.name {
  font-size: 32rpx;
  margin-bottom: 12rpx;
}

.doctor-row {
  display: flex;
  justify-content: space-between;
  border-top: 1rpx solid #eef3f1;
  margin-top: 18rpx;
  padding-top: 18rpx;
}
</style>
