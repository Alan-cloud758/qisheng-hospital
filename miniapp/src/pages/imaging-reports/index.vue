<template>
  <view class="page">
    <view class="card" v-for="report in store.imagingReports" :key="report.id">
      <view class="title">{{ report.request?.requestNo || '影像报告' }}</view>
      <view class="meta">{{ report.status }} · {{ formatDate(report.publishedAt) }}</view>
      <view class="items">{{ itemNames(report).join(' / ') || '-' }}</view>
      <view class="section" v-if="report.findings">
        <text class="label">所见</text>
        <text>{{ report.findings }}</text>
      </view>
      <view class="section" v-if="report.impression">
        <text class="label">结论</text>
        <text>{{ report.impression }}</text>
      </view>
      <view class="viewer" v-if="report.request?.study?.imageUrl" @tap="openViewer(report.request.study.imageUrl)">
        查看影像：{{ report.request.study.studyUid || 'mock PACS' }}
      </view>
    </view>
    <view v-if="store.imagingReports.length === 0" class="empty">暂无影像报告</view>
  </view>
</template>

<script setup lang="ts">
import { onMounted } from 'vue'
import type { ImagingReport } from '../../api/hospital'
import { usePatientStore } from '../../stores/patient'

const store = usePatientStore()

function formatDate(value?: string | null) {
  return value ? value.replace('T', ' ').slice(0, 16) : '-'
}

function itemNames(report: ImagingReport) {
  return report.request?.items?.map((row) => row.item?.name ?? '').filter(Boolean) ?? []
}

function openViewer(url: string) {
  uni.showModal({ title: 'mock PACS', content: url, showCancel: false })
}

onMounted(() => {
  void store.loadImagingReports()
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
.items {
  color: #64748b;
  font-size: 24rpx;
  margin-top: 8rpx;
}

.section {
  border-top: 1px solid #e5e7eb;
  display: grid;
  gap: 8rpx;
  margin-top: 16rpx;
  padding-top: 16rpx;
}

.label {
  color: #126c5b;
  font-size: 24rpx;
  font-weight: 700;
}

.viewer {
  color: #126c5b;
  font-size: 24rpx;
  margin-top: 16rpx;
}

.empty {
  color: #64748b;
  padding: 48rpx 0;
  text-align: center;
}
</style>
