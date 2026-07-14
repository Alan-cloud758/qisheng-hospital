export function formatAppointmentWindow(startAt: string, endAt: string) {
  const start = new Date(startAt)
  const end = new Date(endAt)
  const date = start.toLocaleDateString('zh-CN', { month: '2-digit', day: '2-digit' })
  const startTime = start.toISOString().slice(11, 16)
  const endTime = end.toISOString().slice(11, 16)

  return date + ' ' + startTime + '-' + endTime
}

export function appointmentStatusText(status: string) {
  const map: Record<string, string> = {
    BOOKED: '已预约',
    CANCELLED: '已取消',
    CHECKED_IN: '已签到',
    IN_VISIT: '就诊中',
    COMPLETED: '已完成',
    NO_SHOW: '爽约',
  }

  return map[status] ?? status
}

export function lockCountdownText(now: Date, lockedUntil?: string | null) {
  if (!lockedUntil) return ''
  const remaining = new Date(lockedUntil).getTime() - now.getTime()
  if (remaining <= 0) return '锁号已过期'
  const minutes = Math.floor(remaining / 60000)
  const seconds = Math.floor((remaining % 60000) / 1000)
  return `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`
}
