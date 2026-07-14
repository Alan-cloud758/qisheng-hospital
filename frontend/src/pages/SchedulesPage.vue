<template>
  <ModuleListPage
    eyebrow="Scheduling"
    title="排班管理"
    subtitle="查看医生未来排班、诊室和号源容量。"
    resource="schedules"
    :columns="columns"
  />
</template>

<script setup lang="ts">
import ModuleListPage from './ModuleListPage.vue'

const columns = [
  { key: 'doctor.user.displayName', label: '医生' },
  { key: 'department.name', label: '科室' },
  { key: 'clinicRoom.name', label: '诊室' },
  { key: 'workDate', label: '日期' },
  { key: 'period', label: '时段' },
  { key: 'capacity', label: '容量' },
]
</script>
