<script setup lang="ts">
import { onMounted } from 'vue'
import { usePatientStore } from '../../stores/patient'

const store = usePatientStore()

function openDoctors(departmentId: string) {
  uni.navigateTo({ url: '/pages/doctors/index?departmentId=' + departmentId })
}

onMounted(() => {
  void store.loadDepartments()
})
</script>

<template>
  <view class="page">
    <view class="panel page-head">
      <text class="title">选择科室</text>
      <text class="muted">按科室查看医生和可预约号源。</text>
    </view>

    <view v-for="department in store.departments" :key="department.id" class="panel department-card" @tap="openDoctors(department.id)">
      <text class="name">{{ department.name }}</text>
      <text class="muted">{{ department.summary || '门诊科室' }}</text>
      <text class="campus">{{ department.campus?.name || '启胜医院' }}</text>
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

.campus {
  color: #126c5b;
  display: block;
  margin-top: 14rpx;
}
</style>
