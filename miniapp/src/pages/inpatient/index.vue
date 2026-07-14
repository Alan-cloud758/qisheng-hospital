<script setup lang="ts">
import { onMounted } from 'vue'
import { usePatientStore } from '../../stores/patient'

const store = usePatientStore()

function money(value: string | number) {
  return Number(value || 0).toFixed(2)
}

function totalCharges(charges: Array<{ amount: string | number }> = []) {
  return charges.reduce((sum, charge) => sum + Number(charge.amount), 0).toFixed(2)
}

onMounted(() => {
  void store.loadInpatientAdmissions()
})
</script>

<template>
  <view class="page">
    <view class="panel">
      <text class="title">我的住院</text>
      <text class="muted">查看住院床位、医嘱、费用和出院进度。</text>
    </view>

    <view v-for="admission in store.inpatientAdmissions" :key="admission.id" class="panel admission">
      <text class="name">{{ admission.visitMember?.name || '住院患者' }}</text>
      <text class="status">{{ admission.status }}</text>
      <text class="muted">住院号：{{ admission.admissionNo }}</text>
      <text class="muted">病区床位：{{ admission.ward?.name || '-' }} / {{ admission.currentBed?.bedNo || '-' }}</text>
      <text class="muted">主管医生：{{ admission.attendingDoctor?.user?.displayName || '-' }}</text>
      <text class="diagnosis">诊断：{{ admission.diagnosis || '-' }}</text>

      <view class="summary-row">
        <text>医嘱 {{ admission.orders?.length || 0 }} 条</text>
        <text>费用 ¥{{ totalCharges(admission.charges) }}</text>
      </view>

      <view v-for="charge in admission.charges || []" :key="charge.id" class="line">
        <text>{{ charge.itemName }}</text>
        <text>¥{{ money(charge.amount) }} · {{ charge.status }}</text>
      </view>

      <view v-for="request in admission.dischargeRequests || []" :key="request.id" class="line">
        <text>出院申请</text>
        <text>{{ request.status }}</text>
      </view>
    </view>
  </view>
</template>

<style scoped>
.title,
.name,
.status,
.diagnosis {
  display: block;
}

.title {
  font-size: 38rpx;
  font-weight: 700;
}

.name {
  font-size: 32rpx;
  font-weight: 700;
}

.status {
  color: #126c5b;
  font-weight: 700;
  margin: 8rpx 0;
}

.diagnosis {
  margin-top: 12rpx;
}

.summary-row,
.line {
  align-items: center;
  border-top: 1px solid #e5e7eb;
  display: flex;
  justify-content: space-between;
  margin-top: 14rpx;
  padding-top: 14rpx;
}
</style>
