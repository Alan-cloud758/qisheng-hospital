<script setup lang="ts">
import { onMounted } from 'vue'
import { usePatientStore } from '../../stores/patient'

const store = usePatientStore()

onMounted(() => {
  void store.loadVisitRecords()
})
</script>

<template>
  <view class="page">
    <view class="panel">
      <text class="title">就诊记录</text>
      <text class="muted">查看已完成门诊的病历、诊断和处方摘要。</text>
    </view>

    <view v-for="record in store.visitRecords as any[]" :key="record.id" class="panel">
      <text class="name">{{ record.registration?.department?.name }} · {{ record.doctor?.user?.displayName }}</text>
      <text class="muted">{{ record.medicalRecord?.summary || '暂无病历摘要' }}</text>
      <text class="muted">诊断：{{ record.diagnoses?.map((item: any) => item.name).join('、') || '-' }}</text>
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
  margin-bottom: 12rpx;
}
</style>
