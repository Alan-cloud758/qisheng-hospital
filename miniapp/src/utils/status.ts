const registrationLabels: Record<string, string> = {
  BOOKED: '已预约',
  CANCELLED: '已取消',
  CHECKED_IN: '已签到',
  IN_VISIT: '就诊中',
  COMPLETED: '已完成',
  NO_SHOW: '爽约',
}

const prescriptionLabels: Record<string, string> = {
  DRAFT: '草稿',
  SUBMITTED: '待审核',
  REVIEWED: '已审核',
  DISPENSED: '已发药',
  CANCELLED: '已取消',
}

export function registrationStatusText(status: string) {
  return registrationLabels[status] ?? status
}

export function prescriptionStatusText(status: string) {
  return prescriptionLabels[status] ?? status
}
