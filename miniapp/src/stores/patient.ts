import { defineStore } from 'pinia'
import {
  cancelRegistration,
  createRegistration,
  fetchAnnouncements,
  fetchDepartments,
  fetchDoctorSlots,
  fetchDoctors,
  fetchFees,
  fetchInpatientAdmissions,
  fetchNotifications,
  fetchQueueTickets,
  fetchRegistrations,
  fetchVisitMembers,
  fetchVisitRecords,
  favoriteDoctor,
  lockAppointmentSlot,
  loginPatient,
  markNotificationRead,
  requestFollowUp,
  rescheduleRegistration,
  setDefaultVisitMember,
  unfavoriteDoctor,
  type Announcement,
  type DepartmentSummary,
  type DoctorScheduleSlot,
  type DoctorSummary,
  type FeeOrder,
  type InpatientAdmission,
  type PatientNotification,
  type QueueTicket,
  type Registration,
  type VisitMember,
} from '../api/hospital'

export const usePatientStore = defineStore('patient', {
  state: () => ({
    announcements: [] as Announcement[],
    departments: [] as DepartmentSummary[],
    doctors: [] as DoctorSummary[],
    slots: [] as DoctorScheduleSlot[],
    visitMembers: [] as VisitMember[],
    registrations: [] as Registration[],
    visitRecords: [] as unknown[],
    fees: [] as FeeOrder[],
    inpatientAdmissions: [] as InpatientAdmission[],
    notifications: [] as PatientNotification[],
    queueTickets: [] as QueueTicket[],
    selectedDoctorId: '',
    selectedSlot: null as DoctorScheduleSlot | null,
    loading: false,
  }),
  getters: {
    defaultMember(state) {
      return state.visitMembers.find((member) => member.isDefault) || state.visitMembers[0] || null
    },
  },
  actions: {
    async ensureLogin() {
      if (uni.getStorageSync('qisheng_token')) return
      const result = await loginPatient()
      uni.setStorageSync('qisheng_token', result.token)
    },
    async loadHome() {
      this.loading = true
      try {
        const [announcements, departments] = await Promise.all([fetchAnnouncements(), fetchDepartments()])
        this.announcements = announcements.items
        this.departments = departments.items
      } finally {
        this.loading = false
      }
    },
    async loadDepartments() {
      this.loading = true
      try {
        const response = await fetchDepartments()
        this.departments = response.items
      } finally {
        this.loading = false
      }
    },
    async loadDoctors(departmentId?: string) {
      this.loading = true
      try {
        const response = await fetchDoctors(departmentId)
        this.doctors = response.items
      } finally {
        this.loading = false
      }
    },
    async loadSlots(doctorId: string) {
      this.selectedDoctorId = doctorId
      const response = await fetchDoctorSlots(doctorId)
      this.slots = response.items
    },
    selectSlot(slot: DoctorScheduleSlot) {
      this.selectedSlot = slot
    },
    async loadMembers() {
      await this.ensureLogin()
      const response = await fetchVisitMembers()
      this.visitMembers = response.items
    },
    async setDefaultMember(id: string) {
      await this.ensureLogin()
      await setDefaultVisitMember(id)
      await this.loadMembers()
    },
    async submitRegistration() {
      await this.ensureLogin()
      if (!this.selectedSlot || !this.defaultMember) {
        throw new Error('请选择号源和就诊人')
      }
      const response = await createRegistration({ slotId: this.selectedSlot.id, visitMemberId: this.defaultMember.id })
      await this.loadRegistrations()
      return response.item
    },
    async lockSelectedSlot() {
      await this.ensureLogin()
      if (!this.selectedSlot) {
        throw new Error('请选择号源')
      }
      const response = await lockAppointmentSlot(this.selectedSlot.id)
      this.selectedSlot = { ...this.selectedSlot, ...response.item }
      return response.item
    },
    async loadRegistrations() {
      await this.ensureLogin()
      const response = await fetchRegistrations()
      this.registrations = response.items
    },
    async loadNotifications() {
      await this.ensureLogin()
      const response = await fetchNotifications()
      this.notifications = response.items
    },
    async readNotification(id: string) {
      await this.ensureLogin()
      await markNotificationRead(id)
      await this.loadNotifications()
    },
    async loadQueueTickets() {
      await this.ensureLogin()
      const response = await fetchQueueTickets()
      this.queueTickets = response.items
    },
    async favoriteDoctor(id: string) {
      await this.ensureLogin()
      await favoriteDoctor(id)
      this.doctors = this.doctors.map((doctor) => (doctor.id === id ? { ...doctor, isFavorite: true } : doctor))
    },
    async unfavoriteDoctor(id: string) {
      await this.ensureLogin()
      await unfavoriteDoctor(id)
      this.doctors = this.doctors.map((doctor) => (doctor.id === id ? { ...doctor, isFavorite: false } : doctor))
    },
    async cancelRegistration(id: string) {
      await this.ensureLogin()
      await cancelRegistration(id)
      await this.loadRegistrations()
    },
    async rescheduleRegistration(id: string) {
      await this.ensureLogin()
      if (!this.selectedSlot) {
        throw new Error('请选择新号源')
      }
      await rescheduleRegistration(id, this.selectedSlot.id)
      await this.loadRegistrations()
    },
    async loadVisitRecords() {
      await this.ensureLogin()
      const response = await fetchVisitRecords()
      this.visitRecords = response.items
    },
    async requestFollowUp(id: string) {
      await this.ensureLogin()
      await requestFollowUp(id)
      await this.loadNotifications()
    },
    async loadFees() {
      await this.ensureLogin()
      const response = await fetchFees()
      this.fees = response.items
    },
    async loadInpatientAdmissions() {
      await this.ensureLogin()
      const response = await fetchInpatientAdmissions()
      this.inpatientAdmissions = response.items
    },
  },
})
