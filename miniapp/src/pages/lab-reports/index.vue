<template>
  <view class="page">
    <view class="card" v-for="report in store.labReports" :key="report.id">
      <view class="title">{{ report.request?.requestNo || '检验报告' }}</view>
      <view class="meta">{{ report.status }} · {{ formatDate(report.publishedAt) }}</view>
      <view class="summary" v-if="report.summary">{{ report.summary }}</view>
      <view class="result" v-for="row in report.results || []" :key="row.item?.name + row.resultValue">
        <text>{{ row.item?.name || '-' }}</text>
        <text>{{ row.resultValue }} {{ row.item?.unit || '' }}</text>
        <text :class="['flag', row.abnormalFlag]">{{ row.abnormalFlag }}</text>
      </view>
    </view>
    <view v-if="store.labReports.length === 0" class="empty">暂无检验报告</view>
  </view>
</template>

<script setup lang="ts">
import { onMounted } from 'vue'
import { usePatientStore } from '../../stores/patient'

const store = usePatientStore()

function formatDate(value?: string | null) {
  return value ? value.replace('T', ' ').slice(0, 16) : '-'
}

onMounted(() => {
  void store.loadLabReports()
})
</script>

<style scoped>
.page {
  padding: 24rpx;
}

.card {
  background: #ffffff;
  border-radius: 16rpx;
  margin-bottom: 20rpx;
  padding: 24rpx;
}

.title {
  color: #0f172a;
  font-size: 32rpx;
  font-weight: 700;
}

.meta,
.summary {
  color: #64748b;
  font-size: 24rpx;
  margin-top: 8rpx;
}

.result {
  align-items: center;
  border-top: 1px solid #e5e7eb;
  display: grid;
  gap: 12rpx;
  grid-template-columns: 1fr auto auto;
  margin-top: 16rpx;
  padding-top: 16rpx;
}

.flag {
  color: #126c5b;
  font-size: 22rpx;
}

.flag.HIGH,
.flag.LOW {
  color: #b91c1c;
}

.empty {
  color: #64748b;
  padding: 48rpx 0;
  text-align: center;
}
</style>
