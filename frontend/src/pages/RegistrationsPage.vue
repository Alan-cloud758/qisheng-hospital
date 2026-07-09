<template>
  <section class="page-shell">
    <div>
      <h1 class="page-title">预约列表</h1>
      <p class="page-subtitle">查看患者预约、签到、就诊与取消状态。</p>
    </div>
    <section class="panel">
      <el-table :data="registrations" border>
        <el-table-column label="挂号单号" prop="no" />
        <el-table-column label="患者" prop="patient" width="140" />
        <el-table-column label="科室" prop="department" width="120" />
        <el-table-column label="医生" prop="doctor" width="140" />
        <el-table-column label="状态" prop="status" width="120" />
      </el-table>
    </section>
  </section>
</template>

<script setup lang="ts">
const registrations = [
  { no: 'REG-DEMO-0001', patient: '李安康', department: '内科', doctor: '陈明医生', status: '已预约' },
]
</script>
