<script setup lang="ts">
import { onMounted } from 'vue'
import { usePatientStore } from '../../stores/patient'

const store = usePatientStore()

const shortcuts = [
  { label: '预约挂号', path: '/pages/departments/index' },
  { label: '我的预约', path: '/pages/appointments/index' },
  { label: '就诊人', path: '/pages/members/index' },
]

function navigateTo(path: string) {
  uni.navigateTo({ url: path })
}

onMounted(() => {
  void store.loadHome()
})
</script>

<template>
  <view class="page home-page">
    <view class="hero">
      <text class="eyebrow">QiSheng Hospital</text>
      <text class="title">启胜医院</text>
      <text class="subtitle">在线预约、门诊缴费、处方与就诊记录查询</text>
    </view>

    <view class="shortcut-grid">
      <view v-for="item in shortcuts" :key="item.label" class="panel shortcut" @tap="navigateTo(item.path)">
        <text>{{ item.label }}</text>
      </view>
    </view>

    <view class="panel">
      <text class="section-title">推荐科室</text>
      <view v-for="department in store.departments.slice(0, 6)" :key="department.id" class="row" @tap="navigateTo('/pages/doctors/index?departmentId=' + department.id)">
        <text>{{ department.name }}</text>
        <text class="muted">{{ department.campus?.name || '启胜医院' }}</text>
      </view>
    </view>

    <view class="panel">
      <text class="section-title">医院公告</text>
      <view v-for="item in store.announcements.slice(0, 3)" :key="item.id" class="notice">
        <text>{{ item.title }}</text>
        <text class="muted">{{ item.content }}</text>
      </view>
    </view>
  </view>
</template>

<style scoped>
.hero {
  background: #0f6b5c;
  border-radius: 16rpx;
  color: #fff;
  padding: 42rpx;
  margin-bottom: 24rpx;
}

.eyebrow,
.subtitle,
.title,
.section-title {
  display: block;
}

.eyebrow {
  font-size: 24rpx;
  opacity: 0.78;
}

.title {
  font-size: 46rpx;
  font-weight: 700;
  margin: 10rpx 0;
}

.shortcut-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 18rpx;
}

.shortcut {
  text-align: center;
  font-weight: 600;
}

.section-title {
  font-size: 32rpx;
  font-weight: 700;
  margin-bottom: 12rpx;
}

.row,
.notice {
  border-top: 1rpx solid #eef3f1;
  display: grid;
  gap: 6rpx;
  padding: 18rpx 0;
}
</style>
