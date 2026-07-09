import { defineStore } from 'pinia'
import { fetchDepartments, type DepartmentSummary } from '../api/hospital'

export const usePatientStore = defineStore('patient', {
  state: () => ({
    departments: [] as DepartmentSummary[],
    loading: false,
  }),
  actions: {
    async loadDepartments() {
      this.loading = true
      try {
        const response = await fetchDepartments()
        this.departments = response.items
      } finally {
        this.loading = false
      }
    },
  },
})
