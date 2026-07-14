<template>
  <AdminResourcePage
    eyebrow="Insurance"
    title="医保目录映射"
    subtitle="维护院内收费项目到医保目录类别、报销比例和先自付比例的映射。"
    resource="insurance-mappings"
    :columns="columns"
    :fields="fields"
  />
</template>

<script setup lang="ts">
import AdminResourcePage from './AdminResourcePage.vue'

const columns = [
  { key: 'feeItemCode', label: '院内项目编码' },
  { key: 'insuranceCode', label: '医保编码' },
  { key: 'insuranceName', label: '医保名称' },
  { key: 'category', label: '类别' },
  { key: 'reimbursementRatio', label: '报销比例' },
]

const fields = [
  { key: 'feeItemCode', label: '院内项目编码', required: true },
  { key: 'insuranceCode', label: '医保编码', required: true },
  { key: 'insuranceName', label: '医保名称', required: true },
  { key: 'category', label: '医保类别', required: true },
  { key: 'reimbursementRatio', label: '报销比例', type: 'number' as const },
  { key: 'selfPayFirstRatio', label: '先自付比例', type: 'number' as const },
  { key: 'isActive', label: '启用', type: 'boolean' as const },
]
</script>
