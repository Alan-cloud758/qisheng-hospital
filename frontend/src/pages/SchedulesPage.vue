<template>
  <section class="page-shell">
    <div>
      <h1 class="page-title">排班挂号</h1>
      <p class="page-subtitle">管理医生排班、号源开放和预约状态。</p>
    </div>
    <section class="panel">
      <el-table :data="schedules" border>
        <el-table-column label="医生" prop="doctor" width="140" />
        <el-table-column label="科室" prop="department" width="140" />
        <el-table-column label="日期" prop="date" />
        <el-table-column label="时段" prop="period" width="120" />
        <el-table-column label="号源" prop="slots" width="120" />
      </el-table>
    </section>
  </section>
</template>

<script setup lang="ts">
const schedules = [{ doctor: '陈明医生', department: '内科', date: '未来 7 天', period: '上午', slots: 21 }]
</script>
