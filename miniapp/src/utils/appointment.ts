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
    BOOKED: '???',
    CANCELLED: '???',
    CHECKED_IN: '???',
    IN_VISIT: '???',
    COMPLETED: '???',
    NO_SHOW: '??',
  }

  return map[status] ?? status
}
