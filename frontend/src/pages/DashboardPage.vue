<template>
  <section class="page-shell">
    <div>
      <h1 class="page-title">启胜医院平台总览</h1>
      <p class="page-subtitle">查看今日预约、医生排班、收费待办和运营基础数据。</p>
    </div>
    <div class="metric-grid">
      <article v-for="metric in metrics" :key="metric.label" class="metric">
        <span>{{ metric.label }}</span>
        <strong>{{ metric.value }}</strong>
      </article>
    </div>
    <section class="panel">
      <h2>今日工作提醒</h2>
      <el-table :data="reminders" border>
        <el-table-column label="事项" prop="title" />
        <el-table-column label="工作台" prop="workspace" width="160" />
        <el-table-column label="状态" prop="status" width="120" />
      </el-table>
    </section>
  </section>
</template>

<script setup lang="ts">
const metrics = [
  { label: '科室数量', value: 3 },
  { label: '在线医生', value: 1 },
  { label: '今日预约', value: 1 },
  { label: '待支付订单', value: 0 },
]

const reminders = [
  { title: '陈明医生上午门诊号源已开放', workspace: '排班挂号', status: '正常' },
  { title: '患者端线上预约入口可用', workspace: '小程序', status: '正常' },
]
</script>

<style scoped>
h2 {
  margin: 0 0 14px;
  font-size: 18px;
}
</style>
