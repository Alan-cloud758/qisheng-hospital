export function assertCanCancelRegistration(status: string) {
  if (status !== 'BOOKED') {
    throw new Error('Only booked registrations can be cancelled')
  }
}

export function assertCanCheckInRegistration(status: string) {
  if (status !== 'BOOKED') {
    throw new Error('Only booked registrations can be checked in')
  }
}

export function assertCanStartEncounter(status: string) {
  if (status !== 'CHECKED_IN') {
    throw new Error('Only checked-in registrations can start an encounter')
  }
}

export function assertCanCompleteEncounter(status: string) {
  if (status !== 'OPEN') {
    throw new Error('Only open encounters can be completed')
  }
}

export function assertCanPayOrder(status: string) {
  if (status !== 'PENDING') {
    throw new Error('Only pending payment orders can be paid')
  }
}

export function assertCanReviewPrescription(status: string) {
  if (status !== 'SUBMITTED') {
    throw new Error('Only submitted prescriptions can be reviewed')
  }
}

export function assertCanDispensePrescription(status: string) {
  if (status !== 'REVIEWED') {
    throw new Error('Only reviewed prescriptions can be dispensed')
  }
}
