<script setup lang="ts">
import { onMounted } from 'vue'
import { usePatientStore } from '../../stores/patient'

const store = usePatientStore()

function money(value: unknown) {
  const amount = typeof value === 'number' ? value : Number(value ?? 0)
  return amount.toFixed(2)
}

onMounted(() => {
  void store.loadFees()
})
</script>

<template>
  <view class="page">
    <view class="panel">
      <text class="title">费用记录</text>
      <text class="muted">查看待支付、已支付和退款记录。</text>
    </view>

    <view v-for="item in store.fees" :key="item.id" class="panel fee-card">
      <text>{{ item.title }}</text>
      <text class="muted">订单号：{{ item.orderNo }}</text>
      <text>金额：¥{{ money(item.amount) }}</text>
      <text class="status">{{ item.status }}</text>
      <text class="muted">交易 {{ item.transactions?.length || 0 }} 笔｜退款 {{ item.refundOrders?.length || 0 }} 笔</text>
    </view>
  </view>
</template>

<style scoped>
.title {
  display: block;
  font-size: 38rpx;
  font-weight: 700;
}

.fee-card text {
  display: block;
  margin-bottom: 10rpx;
}

.status {
  color: #126c5b;
  font-weight: 700;
}
</style>
