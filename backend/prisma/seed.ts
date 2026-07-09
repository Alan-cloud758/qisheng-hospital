import { createHash, randomBytes } from 'node:crypto'
import {
  AppointmentSlotStatus,
  PrismaClient,
  PrescriptionStatus,
  RegistrationStatus,
} from '../src/generated/prisma/client'
import { createMariaDbAdapter } from '../src/lib/prisma-adapter'

const prisma = new PrismaClient({ adapter: createMariaDbAdapter() })

function hashPassword(password: string, salt = randomBytes(16).toString('hex')) {
  const hash = createHash('sha256').update(`${salt}:${password}`).digest('hex')
  return `${salt}:${hash}`
}

function atDate(date: Date, hour: number, minute: number) {
  const value = new Date(date)
  value.setHours(hour, minute, 0, 0)
  return value
}

async function upsertRole(code: string, name: string, description: string) {
  return prisma.role.upsert({
    where: { code },
    update: { name, description },
    create: { code, name, description },
  })
}

async function upsertUser(input: {
  username: string
  displayName: string
  phone: string
  roleCode: string
  roleId: string
}) {
  const user = await prisma.user.upsert({
    where: { username: input.username },
    update: {
      displayName: input.displayName,
      phone: input.phone,
    },
    create: {
      username: input.username,
      displayName: input.displayName,
      phone: input.phone,
      passwordHash: hashPassword('Qisheng@123'),
    },
  })

  await prisma.userRole.upsert({
    where: { userId_roleId: { userId: user.id, roleId: input.roleId } },
    update: {},
    create: { userId: user.id, roleId: input.roleId },
  })

  return user
}

async function main() {
  const adminRole = await upsertRole('ADMIN', '平台管理员', '管理医院平台配置和基础资料')
  const doctorRole = await upsertRole('DOCTOR', '医生', '查看待就诊患者并维护门诊记录')
  const cashierRole = await upsertRole('CASHIER', '收费员', '处理挂号和模拟支付订单')
  const pharmacyRole = await upsertRole('PHARMACY', '药房人员', '查看处方并处理发药流程')
  const patientRole = await upsertRole('PATIENT', '患者', '使用患者端预约挂号')

  await upsertUser({
    username: 'admin',
    displayName: '启胜管理员',
    phone: '13800000001',
    roleCode: adminRole.code,
    roleId: adminRole.id,
  })

  const doctorUser = await upsertUser({
    username: 'doctor_chen',
    displayName: '陈明医生',
    phone: '13800000002',
    roleCode: doctorRole.code,
    roleId: doctorRole.id,
  })

  await upsertUser({
    username: 'cashier_lin',
    displayName: '林静收费员',
    phone: '13800000003',
    roleCode: cashierRole.code,
    roleId: cashierRole.id,
  })

  await upsertUser({
    username: 'pharmacy_wu',
    displayName: '吴敏药师',
    phone: '13800000004',
    roleCode: pharmacyRole.code,
    roleId: pharmacyRole.id,
  })

  const patientUser = await upsertUser({
    username: 'patient_demo',
    displayName: '演示患者',
    phone: '13800000005',
    roleCode: patientRole.code,
    roleId: patientRole.id,
  })

  await prisma.menu.upsert({
    where: { code: 'dashboard' },
    update: { title: '平台总览', path: '/' },
    create: { code: 'dashboard', title: '平台总览', path: '/', icon: 'DataBoard', sortOrder: 1 },
  })
  await prisma.menu.upsert({
    where: { code: 'departments' },
    update: { title: '医院组织', path: '/departments' },
    create: { code: 'departments', title: '医院组织', path: '/departments', icon: 'OfficeBuilding', sortOrder: 2 },
  })

  const campus = await prisma.hospitalCampus.upsert({
    where: { name: '启胜医院主院区' },
    update: {
      address: '启胜路 88 号',
      phone: '0571-88888888',
      isActive: true,
    },
    create: {
      name: '启胜医院主院区',
      address: '启胜路 88 号',
      phone: '0571-88888888',
    },
  })

  const departments = await Promise.all(
    [
      { code: 'internal', name: '内科', summary: '常见内科疾病诊疗与慢病管理', sortOrder: 1 },
      { code: 'pediatrics', name: '儿科', summary: '儿童常见病、发热咳嗽与生长发育咨询', sortOrder: 2 },
      { code: 'orthopedics', name: '骨科', summary: '骨关节疼痛、运动损伤与康复指导', sortOrder: 3 },
    ].map((item) =>
      prisma.department.upsert({
        where: { code: item.code },
        update: {
          name: item.name,
          summary: item.summary,
          campusId: campus.id,
          sortOrder: item.sortOrder,
          isActive: true,
        },
        create: {
          ...item,
          campusId: campus.id,
        },
      }),
    ),
  )

  const rooms = await Promise.all(
    departments.map((department, index) =>
      prisma.clinicRoom.upsert({
        where: { id: `demo-room-${department.code}` },
        update: {
          name: `${department.name}诊室`,
          floor: `${index + 2}F`,
          campusId: campus.id,
          departmentId: department.id,
          isActive: true,
        },
        create: {
          id: `demo-room-${department.code}`,
          name: `${department.name}诊室`,
          floor: `${index + 2}F`,
          campusId: campus.id,
          departmentId: department.id,
        },
      }),
    ),
  )

  const internalDepartment = departments[0]
  const internalRoom = rooms[0]
  const doctor = await prisma.doctorProfile.upsert({
    where: { employeeNo: 'D202607001' },
    update: {
      userId: doctorUser.id,
      departmentId: internalDepartment.id,
      title: '主任医师',
      specialty: '高血压、糖尿病、呼吸系统常见病',
      consultationFee: '20.00',
      isActive: true,
    },
    create: {
      userId: doctorUser.id,
      departmentId: internalDepartment.id,
      employeeNo: 'D202607001',
      title: '主任医师',
      specialty: '高血压、糖尿病、呼吸系统常见病',
      introduction: '从事内科临床工作 15 年，擅长慢病管理和常见病诊疗。',
      licenseNo: 'QS-DOC-0001',
      consultationFee: '20.00',
    },
  })

  const patient = await prisma.patientProfile.upsert({
    where: { patientNo: 'P202607001' },
    update: {
      userId: patientUser.id,
      realName: '李安康',
      gender: '男',
      phone: '13800000005',
    },
    create: {
      userId: patientUser.id,
      patientNo: 'P202607001',
      realName: '李安康',
      gender: '男',
      birthday: new Date('1990-05-16T00:00:00+08:00'),
      phone: '13800000005',
      healthNote: '无特殊过敏史',
    },
  })

  const visitMember = await prisma.visitMember.upsert({
    where: { id: 'demo-visit-member-self' },
    update: {
      patientId: patient.id,
      name: patient.realName,
      gender: patient.gender,
      phone: patient.phone,
      relationship: 'SELF',
      isDefault: true,
    },
    create: {
      id: 'demo-visit-member-self',
      patientId: patient.id,
      name: patient.realName,
      gender: patient.gender,
      birthday: new Date('1990-05-16T00:00:00+08:00'),
      phone: patient.phone,
      relationship: 'SELF',
      isDefault: true,
    },
  })

  let slotCount = 0
  const today = new Date()
  today.setHours(0, 0, 0, 0)

  for (let day = 0; day < 7; day += 1) {
    const workDate = new Date(today)
    workDate.setDate(today.getDate() + day)

    const schedule = await prisma.doctorSchedule.upsert({
      where: { id: `demo-schedule-chen-${day}` },
      update: {
        doctorId: doctor.id,
        departmentId: internalDepartment.id,
        clinicRoomId: internalRoom.id,
        workDate,
        period: '上午',
        capacity: 3,
      },
      create: {
        id: `demo-schedule-chen-${day}`,
        doctorId: doctor.id,
        departmentId: internalDepartment.id,
        clinicRoomId: internalRoom.id,
        workDate,
        period: '上午',
        capacity: 3,
      },
    })

    for (let index = 0; index < 3; index += 1) {
      await prisma.appointmentSlot.upsert({
        where: { id: `demo-slot-chen-${day}-${index}` },
        update: {
          scheduleId: schedule.id,
          startTime: atDate(workDate, 9, index * 20),
          endTime: atDate(workDate, 9, index * 20 + 15),
          fee: '20.00',
          status: AppointmentSlotStatus.AVAILABLE,
        },
        create: {
          id: `demo-slot-chen-${day}-${index}`,
          scheduleId: schedule.id,
          startTime: atDate(workDate, 9, index * 20),
          endTime: atDate(workDate, 9, index * 20 + 15),
          fee: '20.00',
          status: AppointmentSlotStatus.AVAILABLE,
        },
      })
      slotCount += 1
    }
  }

  await prisma.feeItem.upsert({
    where: { code: 'REG_NORMAL' },
    update: {
      name: '普通门诊挂号费',
      amount: '20.00',
      isActive: true,
    },
    create: {
      code: 'REG_NORMAL',
      name: '普通门诊挂号费',
      amount: '20.00',
    },
  })

  const drug = await prisma.drugCatalog.upsert({
    where: { code: 'DRUG_DEMO_001' },
    update: {
      name: '对乙酰氨基酚片',
      spec: '0.5g*24片',
      unit: '盒',
      price: '12.50',
      isActive: true,
    },
    create: {
      code: 'DRUG_DEMO_001',
      name: '对乙酰氨基酚片',
      spec: '0.5g*24片',
      unit: '盒',
      price: '12.50',
    },
  })

  const prescription = await prisma.prescription.upsert({
    where: { id: 'demo-prescription-draft' },
    update: {
      doctorId: doctor.id,
      status: PrescriptionStatus.DRAFT,
      note: '演示处方草稿',
    },
    create: {
      id: 'demo-prescription-draft',
      doctorId: doctor.id,
      status: PrescriptionStatus.DRAFT,
      note: '演示处方草稿',
    },
  })

  await prisma.prescriptionItem.upsert({
    where: { id: 'demo-prescription-item-001' },
    update: {
      prescriptionId: prescription.id,
      drugId: drug.id,
      quantity: 1,
      dosage: '一次 1 片',
      usage: '发热时口服',
    },
    create: {
      id: 'demo-prescription-item-001',
      prescriptionId: prescription.id,
      drugId: drug.id,
      quantity: 1,
      dosage: '一次 1 片',
      usage: '发热时口服',
    },
  })

  await prisma.announcement.upsert({
    where: { id: 'demo-announcement-online-booking' },
    update: {
      title: '启胜医院线上预约开放',
      content: '患者可通过小程序选择科室、医生和号源完成预约挂号。',
      isActive: true,
    },
    create: {
      id: 'demo-announcement-online-booking',
      title: '启胜医院线上预约开放',
      content: '患者可通过小程序选择科室、医生和号源完成预约挂号。',
    },
  })

  await prisma.registration.upsert({
    where: { registrationNo: 'REG-DEMO-0001' },
    update: {
      status: RegistrationStatus.BOOKED,
      userId: patientUser.id,
      visitMemberId: visitMember.id,
      departmentId: internalDepartment.id,
      doctorId: doctor.id,
      slotId: 'demo-slot-chen-0-0',
    },
    create: {
      registrationNo: 'REG-DEMO-0001',
      status: RegistrationStatus.BOOKED,
      userId: patientUser.id,
      visitMemberId: visitMember.id,
      departmentId: internalDepartment.id,
      doctorId: doctor.id,
      slotId: 'demo-slot-chen-0-0',
    },
  })

  console.log('Seed completed for Qisheng Hospital')
  console.log('Demo password for all accounts: Qisheng@123')
  console.log('Demo accounts: admin, doctor_chen, cashier_lin, pharmacy_wu, patient_demo')
  console.log(`Generated appointment slots: ${slotCount}`)
}

main()
  .catch((error) => {
    console.error(error)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
