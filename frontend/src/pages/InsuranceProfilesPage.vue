<template>
  <AdminResourcePage
    eyebrow="Insurance"
    title="医保档案"
    subtitle="维护患者医保号、参保机构、报销比例和起付自付比例。"
    resource="insurance-profiles"
    :columns="columns"
    :fields="fields"
  />
</template>

<script setup lang="ts">
import AdminResourcePage from './AdminResourcePage.vue'

const columns = [
  { key: 'insuredNo', label: '医保号' },
  { key: 'user.displayName', label: '患者' },
  { key: 'insurerName', label: '机构' },
  { key: 'planName', label: '方案' },
  { key: 'reimbursementRatio', label: '报销比例' },
]

const fields = [
  { key: 'userId', label: '患者用户ID', required: true },
  { key: 'insuredNo', label: '医保号', required: true },
  { key: 'insurerName', label: '医保机构', required: true },
  { key: 'planName', label: '方案名称', required: true },
  { key: 'reimbursementRatio', label: '报销比例', required: true, type: 'number' as const },
  { key: 'selfPayFirstRatio', label: '先自付比例', type: 'number' as const },
  { key: 'isActive', label: '启用', type: 'boolean' as const },
]
</script>
