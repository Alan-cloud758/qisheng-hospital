<template>
  <section class="page-shell">
    <div>
      <h1 class="page-title">医院组织</h1>
      <p class="page-subtitle">维护院区、科室、诊室与医生档案。</p>
    </div>
    <section class="panel">
      <el-table :data="departments" border>
        <el-table-column label="科室" prop="name" />
        <el-table-column label="编码" prop="code" width="140" />
        <el-table-column label="说明" prop="summary" />
      </el-table>
    </section>
  </section>
</template>

<script setup lang="ts">
const departments = [
  { name: '内科', code: 'internal', summary: '常见内科疾病诊疗与慢病管理' },
  { name: '儿科', code: 'pediatrics', summary: '儿童常见病、发热咳嗽与生长发育咨询' },
  { name: '骨科', code: 'orthopedics', summary: '骨关节疼痛、运动损伤与康复指导' },
]
</script>
