<template>
  <section class="page-shell">
    <div class="page-heading">
      <div>
        <p class="eyebrow">Scheduling</p>
        <h1 class="page-title">排班管理</h1>
        <p class="page-subtitle">维护排班模板、批量生成号源，并处理临时停诊。</p>
      </div>
      <el-button @click="load">刷新</el-button>
    </div>

    <section class="panel scheduling-grid">
      <div class="template-form">
        <h2>排班模板</h2>
        <el-input v-model="form.name" placeholder="模板名称" />
        <el-input v-model="form.doctorId" placeholder="医生ID" />
        <el-input v-model="form.departmentId" placeholder="科室ID" />
        <el-input v-model="form.clinicRoomId" placeholder="诊室ID（可选）" />
        <el-input v-model="form.period" placeholder="时段，如 上午" />
        <el-input-number v-model="form.capacity" :min="1" />
        <el-input v-model="ruleText" placeholder="规则：1,08:00,08:30；多条用分号分隔" />
        <el-button type="primary" :loading="saving" @click="saveTemplate">新增模板</el-button>
      </div>

      <el-table v-loading="loading" :data="templates" border stripe>
        <el-table-column label="模板" prop="name" min-width="140" />
        <el-table-column label="医生" min-width="120">
          <template #default="{ row }">{{ row.doctor?.user?.displayName || '-' }}</template>
        </el-table-column>
        <el-table-column label="科室" min-width="120">
          <template #default="{ row }">{{ row.department?.name || '-' }}</template>
        </el-table-column>
        <el-table-column label="规则" min-width="160">
          <template #default="{ row }">{{ row.rules?.length || 0 }} 条</template>
        </el-table-column>
        <el-table-column label="操作" width="180">
          <template #default="{ row }">
            <el-button size="small" @click="generate(row.id)">生成7天</el-button>
          </template>
        </el-table-column>
      </el-table>
    </section>

    <section class="panel">
      <div class="section-heading">
        <h2>未来排班</h2>
      </div>
      <el-table v-loading="loading" :data="schedules" border stripe>
        <el-table-column label="医生" min-width="120">
          <template #default="{ row }">{{ row.doctor?.user?.displayName || '-' }}</template>
        </el-table-column>
        <el-table-column label="科室" min-width="120">
          <template #default="{ row }">{{ row.department?.name || '-' }}</template>
        </el-table-column>
        <el-table-column label="诊室" min-width="120">
          <template #default="{ row }">{{ row.clinicRoom?.name || '-' }}</template>
        </el-table-column>
        <el-table-column label="日期" prop="workDate" min-width="160" />
        <el-table-column label="时段" prop="period" width="100" />
        <el-table-column label="容量" prop="capacity" width="80" />
        <el-table-column label="操作" width="120">
          <template #default="{ row }">
            <el-button size="small" type="warning" @click="suspend(row.id)">停诊</el-button>
          </template>
        </el-table-column>
      </el-table>
    </section>
  </section>
</template>

<script setup lang="ts">
import { onMounted, reactive, ref } from 'vue'
import { createScheduleTemplate, fetchAdminResource, fetchScheduleTemplates, generateScheduleTemplate, suspendSchedule } from '../api/hospital'

const loading = ref(false)
const saving = ref(false)

type TemplateRow = {
  id: string
  name?: string
  doctor?: { user?: { displayName?: string } }
  department?: { name?: string }
  rules?: unknown[]
}

type ScheduleRow = {
  id: string
  doctor?: { user?: { displayName?: string } }
  department?: { name?: string }
  clinicRoom?: { name?: string }
}

const templates = ref<TemplateRow[]>([])
const schedules = ref<ScheduleRow[]>([])
const ruleText = ref('1,08:00,08:30')
const form = reactive({
  name: '',
  doctorId: '',
  departmentId: '',
  clinicRoomId: '',
  period: '上午',
  capacity: 10,
})

function parseRules() {
  return ruleText.value
    .split(';')
    .map((rule) => rule.trim())
    .filter(Boolean)
    .map((rule) => {
      const [weekday, startTime, endTime] = rule.split(',')
      return { weekday: Number(weekday), startTime, endTime }
    })
}

async function load() {
  loading.value = true
  try {
    const [templateItems, scheduleResult] = await Promise.all([fetchScheduleTemplates(), fetchAdminResource('schedules')])
    templates.value = templateItems as TemplateRow[]
    schedules.value = scheduleResult.items as ScheduleRow[]
  } finally {
    loading.value = false
  }
}

async function saveTemplate() {
  saving.value = true
  try {
    await createScheduleTemplate({ ...form, clinicRoomId: form.clinicRoomId || null, rules: parseRules() })
    await load()
  } finally {
    saving.value = false
  }
}

async function generate(id: string) {
  const start = new Date()
  const end = new Date()
  end.setDate(start.getDate() + 7)
  await generateScheduleTemplate(id, { startDate: start.toISOString().slice(0, 10), endDate: end.toISOString().slice(0, 10) })
  await load()
}

async function suspend(id: string) {
  await suspendSchedule(id, '后台临时停诊')
  await load()
}

onMounted(() => {
  void load()
})
</script>

<style scoped>
.scheduling-grid {
  display: grid;
  grid-template-columns: 320px minmax(0, 1fr);
  gap: 16px;
}

.template-form {
  display: grid;
  gap: 10px;
  align-content: start;
}

.template-form h2,
.section-heading h2 {
  margin: 0;
  font-size: 18px;
}

@media (max-width: 920px) {
  .scheduling-grid {
    grid-template-columns: 1fr;
  }
}
</style>
