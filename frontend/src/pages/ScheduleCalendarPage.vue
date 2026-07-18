<template>
  <section class="page-shell">
    <div class="page-heading">
      <div>
        <p class="eyebrow">Schedule Calendar</p>
        <h1 class="page-title">排班日历</h1>
        <p class="page-subtitle">按周查看医生排班与号源状态。</p>
      </div>
      <div class="nav-actions">
        <el-button @click="prevWeek">&lt; 上一周</el-button>
        <el-date-picker v-model="weekStart" type="week" format="YYYY 第 ww 周" placeholder="选择周" @change="onWeekChange" style="width:180px" />
        <el-button @click="nextWeek">下一周 &gt;</el-button>
        <el-button @click="load">刷新</el-button>
      </div>
    </div>

    <section class="panel" v-loading="loading">
      <div class="legend">
        <span class="legend-item"><i class="dot available" /> 可预约</span>
        <span class="legend-item"><i class="dot booked" /> 已预约</span>
        <span class="legend-item"><i class="dot full" /> 已满</span>
      </div>
      <div class="calendar-grid">
        <div class="time-header" />
        <div v-for="d in weekDays" :key="d" class="day-header">{{ d }}</div>
        <template v-for="slot in timeSlots" :key="slot">
          <div class="time-label">{{ slot }}</div>
          <div v-for="d in weekDays" :key="`${d}-${slot}`" class="cell" :class="cellClass(d, slot)" @click="showDetail(d, slot)">
            <span v-if="getCell(d, slot)">{{ getCell(d, slot)!.doctorName }}</span>
          </div>
        </template>
      </div>
    </section>

    <el-dialog v-model="detailVisible" title="排班详情" width="480px">
      <el-descriptions v-if="detailSlot" :column="1" border>
        <el-descriptions-item label="医生">{{ detailSlot.doctorName }}</el-descriptions-item>
        <el-descriptions-item label="科室">{{ detailSlot.departmentName }}</el-descriptions-item>
        <el-descriptions-item label="日期">{{ detailSlot.date }}</el-descriptions-item>
        <el-descriptions-item label="时段">{{ detailSlot.period }}</el-descriptions-item>
        <el-descriptions-item label="已预约/容量">{{ detailSlot.booked }} / {{ detailSlot.capacity }}</el-descriptions-item>
        <el-descriptions-item label="状态">
          <el-tag :type="statusTag(detailSlot.status)">{{ statusLabel(detailSlot.status) }}</el-tag>
        </el-descriptions-item>
      </el-descriptions>
    </el-dialog>
  </section>
</template>

<script setup lang="ts">
import { onMounted, reactive, ref } from 'vue'
import { apiClient } from '../api/client'

interface ScheduleSlot {
  date: string
  period: string
  doctorName: string
  departmentName: string
  capacity: number
  booked: number
  status: string
}

const loading = ref(false)
const weekStart = ref(getMonday(new Date()))
const schedules = ref<ScheduleSlot[]>([])
const detailVisible = ref(false)
const detailSlot = ref<ScheduleSlot | null>(null)

const timeSlots = ['上午', '下午', '夜间']
const weekDays = ['周一', '周二', '周三', '周四', '周五', '周六', '周日']

function getMonday(d: Date) {
  const dt = new Date(d)
  const day = dt.getDay()
  const diff = dt.getDate() - day + (day === 0 ? -6 : 1)
  return new Date(dt.setDate(diff))
}

function formatDate(d: Date) { return d.toISOString().slice(0, 10) }

function weekDates() {
  const start = new Date(weekStart.value)
  return Array.from({ length: 7 }, (_, i) => {
    const d = new Date(start)
    d.setDate(start.getDate() + i)
    return formatDate(d)
  })
}

function prevWeek() {
  const d = new Date(weekStart.value)
  d.setDate(d.getDate() - 7)
  weekStart.value = d
  load()
}

function nextWeek() {
  const d = new Date(weekStart.value)
  d.setDate(d.getDate() + 7)
  weekStart.value = d
  load()
}

function onWeekChange() { load() }

const slotMap = reactive(new Map<string, ScheduleSlot>())

function buildKey(date: string, period: string) { return `${date}|${period}` }

function getCell(dayLabel: string, period: string): ScheduleSlot | undefined {
  const idx = weekDays.indexOf(dayLabel)
  const dates = weekDates()
  return slotMap.get(buildKey(dates[idx], period))
}

function cellClass(dayLabel: string, period: string) {
  const s = getCell(dayLabel, period)
  if (!s) return ''
  return { available: s.status === 'AVAILABLE', booked: s.status === 'BOOKED', full: s.status === 'FULL' }
}

function statusTag(s: string) { return s === 'AVAILABLE' ? 'success' : s === 'FULL' ? 'info' : 'primary' }
function statusLabel(s: string) { return s === 'AVAILABLE' ? '可预约' : s === 'FULL' ? '已满' : '已预约' }

function showDetail(dayLabel: string, period: string) {
  const s = getCell(dayLabel, period)
  if (s) { detailSlot.value = s; detailVisible.value = true }
}

async function load() {
  loading.value = true
  try {
    const dates = weekDates()
    const { data } = await apiClient.get('/admin/schedules', {
      params: { startDate: dates[0], endDate: dates[6], pageSize: 500 },
    })
    const items = (data.items || []) as Array<Record<string, unknown>>
    slotMap.clear()
    schedules.value = items.map((r: Record<string, unknown>) => {
      const s: ScheduleSlot = {
        date: (r.workDate as string) || '',
        period: (r.period as string) || '',
        doctorName: ((r.doctor as Record<string, unknown>)?.user as Record<string, unknown>)?.displayName as string || '-',
        departmentName: ((r.department as Record<string, unknown>)?.name as string) || '-',
        capacity: (r.capacity as number) || 0,
        booked: (r.booked as number) || 0,
        status: (r.booked as number) >= (r.capacity as number) ? 'FULL' : (r.booked as number) > 0 ? 'BOOKED' : 'AVAILABLE',
      }
      slotMap.set(buildKey(s.date, s.period), s)
      return s
    })
  } finally { loading.value = false }
}

onMounted(() => { void load() })
</script>

<style scoped>
.nav-actions { display: flex; gap: 8px; align-items: center; flex-wrap: wrap; }
.legend { display: flex; gap: 16px; margin-bottom: 12px; }
.legend-item { display: flex; align-items: center; gap: 4px; font-size: 13px; }
.dot { width: 12px; height: 12px; border-radius: 50%; display: inline-block; }
.dot.available { background: #67c23a; }
.dot.booked { background: #409eff; }
.dot.full { background: #909399; }
.calendar-grid { display: grid; grid-template-columns: 60px repeat(7, 1fr); gap: 2px; }
.day-header, .time-header { text-align: center; font-weight: 600; padding: 8px 4px; background: var(--el-fill-color-light); font-size: 13px; }
.time-label { display: flex; align-items: center; justify-content: center; font-size: 13px; font-weight: 500; padding: 8px 4px; }
.cell { min-height: 48px; padding: 6px; border: 1px solid var(--el-border-color-lighter); border-radius: 4px; cursor: pointer; font-size: 12px; text-align: center; transition: background .15s; }
.cell:hover { background: var(--el-fill-color-light); }
.cell.available { background: #f0f9eb; }
.cell.booked { background: #ecf5ff; }
.cell.full { background: #f4f4f5; }
</style>
