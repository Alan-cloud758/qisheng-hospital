import { hashPassword } from '../src/lib/password'

const demoPassword = 'Qisheng@123'

export const outpatientSeedPlan = {
  campuses: [
    { id: 'campus-main', name: '启胜医院总院', address: '启胜路 88 号', phone: '020-88008800' },
    { id: 'campus-east', name: '启胜医院东院区', address: '东湖路 16 号', phone: '020-88008816' },
    { id: 'campus-rehab', name: '启胜康复院区', address: '康宁街 6 号', phone: '020-88008806' },
  ],
  departments: [
    ['IM', '内科', '常见内科疾病、慢病管理与复诊随访'],
    ['SURG', '外科', '普通外科疾病诊疗与术后复查'],
    ['PED', '儿科', '儿童常见病、发热咳嗽与生长发育咨询'],
    ['OBGYN', '妇产科', '妇科常见病、孕产咨询与产后复查'],
    ['ENT', '耳鼻喉科', '鼻炎、咽喉炎、听力与眩晕门诊'],
    ['OPH', '眼科', '视力筛查、干眼、结膜炎与眼底初筛'],
    ['DERM', '皮肤科', '湿疹、痤疮、过敏与皮肤感染'],
    ['ORTH', '骨科', '颈肩腰腿痛、关节损伤与骨折复查'],
    ['CARD', '心血管内科', '高血压、胸闷心悸与心血管随访'],
    ['NEURO', '神经内科', '头痛头晕、睡眠障碍与脑血管随访'],
    ['ENDO', '内分泌科', '糖尿病、甲状腺与代谢疾病管理'],
    ['RESP', '呼吸内科', '咳嗽、哮喘、慢阻肺与感染后随访'],
    ['GASTRO', '消化内科', '胃痛、腹泻、肝胆胰疾病初诊复诊'],
    ['TCM', '中医科', '中医调理、针灸康复与慢病辅助治疗'],
    ['REHAB', '康复医学科', '术后康复、运动损伤与功能训练'],
    ['DENTAL', '口腔科', '牙痛、洁牙、口腔溃疡与修复咨询'],
  ].map(([code, name, summary], index) => ({
    id: `dept-${code.toLowerCase()}`,
    code,
    name,
    summary,
    campusId: index % 5 === 0 ? 'campus-east' : index % 7 === 0 ? 'campus-rehab' : 'campus-main',
    sortOrder: index + 1,
  })),
  doctors: [
    ['doctor_chen', '陈明', 'D2026001', 'IM', '主任医师', '高血压、糖尿病与慢病综合管理'],
    ['doctor_li', '李雅', 'D2026002', 'SURG', '副主任医师', '甲状腺、乳腺与腹部外科复诊'],
    ['doctor_wang', '王宁', 'D2026003', 'PED', '主治医师', '儿童呼吸道感染与发热管理'],
    ['doctor_zhao', '赵晴', 'D2026004', 'OBGYN', '副主任医师', '妇科炎症、孕期咨询与产后康复'],
    ['doctor_luo', '罗浩', 'D2026005', 'ENT', '主治医师', '鼻炎、咽喉炎与耳鸣眩晕'],
    ['doctor_xu', '许薇', 'D2026006', 'OPH', '主治医师', '干眼、视疲劳与青少年近视防控'],
    ['doctor_lin', '林珊', 'D2026007', 'DERM', '副主任医师', '皮炎湿疹、痤疮与过敏性疾病'],
    ['doctor_zhou', '周远', 'D2026008', 'ORTH', '主任医师', '关节损伤、骨折复查与腰腿痛'],
    ['doctor_huang', '黄骏', 'D2026009', 'CARD', '主任医师', '冠心病、高血压与心律失常'],
    ['doctor_yang', '杨帆', 'D2026010', 'NEURO', '副主任医师', '头痛、眩晕与脑血管病随访'],
    ['doctor_he', '何静', 'D2026011', 'ENDO', '主治医师', '糖尿病、甲状腺与肥胖管理'],
    ['doctor_sun', '孙越', 'D2026012', 'RESP', '副主任医师', '哮喘、慢阻肺与肺部感染'],
    ['doctor_guo', '郭然', 'D2026013', 'GASTRO', '主治医师', '胃炎、肠易激与肝胆疾病'],
    ['doctor_feng', '冯岚', 'D2026014', 'TCM', '主任医师', '中医内科调理与针灸康复'],
    ['doctor_jiang', '姜诚', 'D2026015', 'REHAB', '主治医师', '运动损伤与术后功能恢复'],
    ['doctor_qin', '秦悦', 'D2026016', 'DENTAL', '主治医师', '牙体牙髓病与口腔修复咨询'],
    ['doctor_tan', '谭硕', 'D2026017', 'IM', '主治医师', '发热、腹痛与全科内科初诊'],
    ['doctor_ma', '马睿', 'D2026018', 'PED', '副主任医师', '儿童哮喘与过敏性疾病'],
    ['doctor_ye', '叶婷', 'D2026019', 'CARD', '主治医师', '血脂异常与心衰慢病管理'],
    ['doctor_peng', '彭博', 'D2026020', 'ORTH', '副主任医师', '运动医学与肩膝关节损伤'],
    ['doctor_deng', '邓琳', 'D2026021', 'DERM', '主治医师', '皮肤感染与医学护肤咨询'],
    ['doctor_cai', '蔡森', 'D2026022', 'RESP', '主治医师', '慢性咳嗽与呼吸康复'],
    ['doctor_mo', '莫雨', 'D2026023', 'ENDO', '副主任医师', '甲状腺结节与妊娠糖尿病'],
    ['doctor_xie', '谢航', 'D2026024', 'GASTRO', '副主任医师', '消化道溃疡与幽门螺杆菌管理'],
  ].map(([username, displayName, employeeNo, departmentCode, title, specialty]) => ({
    id: `profile-${username}`,
    username,
    displayName,
    employeeNo,
    departmentCode,
    title,
    specialty,
  })),
  patientUsers: Array.from({ length: 16 }, (_, index) => {
    const n = index + 1
    return {
      id: `patient-user-${n}`,
      profileId: `patient-profile-${n}`,
      username: n === 1 ? 'patient_demo' : `patient_demo_${String(n).padStart(2, '0')}`,
      displayName: ['张晓雨', '刘晨', '吴桐', '郑欣', '何一鸣', '梁安', '宋佳', '唐睿', '韩雪', '沈宁', '许诺', '程远', '陆敏', '曹阳', '袁可', '邱泽'][index],
      patientNo: `P2026${String(n).padStart(4, '0')}`,
      phone: `1390000${String(n).padStart(4, '0')}`,
    }
  }),
  drugs: [
    ['DRUG001', '阿莫西林胶囊', '0.25g*24粒', '盒', 18.5],
    ['DRUG002', '头孢克洛胶囊', '0.25g*12粒', '盒', 32.0],
    ['DRUG003', '布洛芬缓释胶囊', '0.3g*20粒', '盒', 21.8],
    ['DRUG004', '对乙酰氨基酚片', '0.5g*12片', '盒', 8.6],
    ['DRUG005', '氯雷他定片', '10mg*6片', '盒', 16.5],
    ['DRUG006', '孟鲁司特钠片', '10mg*5片', '盒', 42.0],
    ['DRUG007', '盐酸氨溴索口服液', '100ml', '瓶', 25.0],
    ['DRUG008', '奥美拉唑肠溶胶囊', '20mg*14粒', '盒', 19.9],
    ['DRUG009', '多潘立酮片', '10mg*30片', '盒', 14.5],
    ['DRUG010', '蒙脱石散', '3g*10袋', '盒', 18.0],
    ['DRUG011', '二甲双胍片', '0.5g*48片', '盒', 12.8],
    ['DRUG012', '格列美脲片', '2mg*30片', '盒', 31.5],
    ['DRUG013', '左甲状腺素钠片', '50ug*100片', '盒', 29.0],
    ['DRUG014', '氨氯地平片', '5mg*28片', '盒', 24.0],
    ['DRUG015', '缬沙坦胶囊', '80mg*7粒', '盒', 36.0],
    ['DRUG016', '阿托伐他汀钙片', '20mg*7片', '盒', 45.0],
    ['DRUG017', '美托洛尔缓释片', '47.5mg*7片', '盒', 27.5],
    ['DRUG018', '阿司匹林肠溶片', '100mg*30片', '盒', 15.0],
    ['DRUG019', '甲钴胺片', '0.5mg*20片', '盒', 22.0],
    ['DRUG020', '银杏叶片', '24片', '盒', 28.0],
    ['DRUG021', '玻璃酸钠滴眼液', '5ml', '支', 38.0],
    ['DRUG022', '左氧氟沙星滴眼液', '5ml', '支', 26.0],
    ['DRUG023', '糠酸莫米松鼻喷雾剂', '60喷', '瓶', 58.0],
    ['DRUG024', '炉甘石洗剂', '100ml', '瓶', 9.8],
    ['DRUG025', '丁酸氢化可的松乳膏', '10g', '支', 13.5],
    ['DRUG026', '云南白药气雾剂', '85g+30g', '盒', 48.0],
    ['DRUG027', '塞来昔布胶囊', '0.2g*6粒', '盒', 34.0],
    ['DRUG028', '复方丹参滴丸', '180丸', '瓶', 29.0],
    ['DRUG029', '小儿豉翘清热颗粒', '2g*6袋', '盒', 35.0],
    ['DRUG030', '益生菌冻干粉', '1g*10袋', '盒', 46.0],
    ['DRUG031', '康复新液', '100ml', '瓶', 33.0],
    ['DRUG032', '口腔溃疡散', '3g', '瓶', 11.0],
  ].map(([code, name, spec, unit, price]) => ({ code, name, spec, unit, price })),
  feeItems: [
    ['FEE001', '普通挂号费', 10],
    ['FEE002', '专家挂号费', 30],
    ['FEE003', '主任医师诊查费', 50],
    ['FEE004', '副主任医师诊查费', 35],
    ['FEE005', '普通门诊诊查费', 20],
    ['FEE006', '换药费', 18],
    ['FEE007', '雾化治疗费', 25],
    ['FEE008', '针灸治疗费', 45],
    ['FEE009', '康复评定费', 60],
    ['FEE010', '心电图检查费', 30],
    ['FEE011', '血糖检测费', 8],
    ['FEE012', '血压监测费', 6],
    ['FEE013', '视力检查费', 12],
    ['FEE014', '耳鼻喉内镜检查费', 80],
    ['FEE015', '口腔检查费', 25],
    ['FEE016', '皮肤镜检查费', 60],
  ].map(([code, name, amount]) => ({ code, name, amount })),
  announcements: [
    ['暑期儿科夜诊安排', '儿科周一至周五增设夜诊号源，请按预约时间就诊。'],
    ['慢病复诊线上预约提示', '高血压、糖尿病复诊患者可提前 7 天预约。'],
    ['东院区停车指引', '东院区地下停车场 A 区开放，建议从东门进入。'],
    ['药房取药窗口调整', '门诊药房 3 号窗口调整为处方审核专窗。'],
    ['医保系统维护通知', '本演示系统暂不接入真实医保结算，请使用模拟支付流程。'],
    ['体检报告领取说明', '体检报告可在服务台凭身份证领取。'],
    ['呼吸门诊防护提醒', '发热或咳嗽患者请佩戴口罩并配合预检分诊。'],
    ['中医科针灸预约开放', '中医科针灸治疗需先完成医生评估。'],
    ['康复医学科新设备启用', '康复训练区新增步态训练设备。'],
    ['口腔科洁牙预约说明', '洁牙项目请提前预约并避开急诊时段。'],
  ].map(([title, content], index) => ({ id: `ann-${index + 1}`, title, content })),
  dictionaryCategories: [
    {
      id: 'dict-gender',
      code: 'GENDER',
      name: '性别',
      items: [
        ['MALE', '男'],
        ['FEMALE', '女'],
        ['UNKNOWN', '未知'],
      ],
    },
    {
      id: 'dict-period',
      code: 'SCHEDULE_PERIOD',
      name: '排班时段',
      items: [
        ['AM', '上午'],
        ['PM', '下午'],
        ['NIGHT', '夜诊'],
      ],
    },
    {
      id: 'dict-pay-method',
      code: 'PAY_METHOD',
      name: '支付方式',
      items: [
        ['WECHAT', '微信'],
        ['ALIPAY', '支付宝'],
        ['CASH', '现金'],
        ['CARD', '银行卡'],
      ],
    },
    {
      id: 'dict-order-type',
      code: 'MEDICAL_ORDER_TYPE',
      name: '医嘱类型',
      items: [
        ['CHECK', '检查'],
        ['TREATMENT', '治疗'],
        ['CARE', '护理'],
        ['ADVICE', '健康建议'],
      ],
    },
    {
      id: 'dict-relationship',
      code: 'VISIT_MEMBER_RELATIONSHIP',
      name: '就诊人关系',
      items: [
        ['SELF', '本人'],
        ['PARENT', '父母'],
        ['CHILD', '子女'],
        ['SPOUSE', '配偶'],
        ['OTHER', '其他'],
      ],
    },
  ],
}

export const hisExpansionSeedPlan = {
  adminResources: {
    departments: outpatientSeedPlan.departments,
  },
  scheduleTemplates: Array.from({ length: 6 }, (_, index) => ({
    id: `tpl-demo-${index + 1}`,
    name: `Demo schedule template ${index + 1}`,
    doctorId: outpatientSeedPlan.doctors[index].id,
    departmentCode: outpatientSeedPlan.doctors[index].departmentCode,
  })),
  stockBatches: outpatientSeedPlan.drugs.slice(0, 30).map((drug, index) => ({
    id: `stock-demo-${index + 1}`,
    drugId: `drug-${drug.code}`,
    batchNo: `BATCH2026${String(index + 1).padStart(3, '0')}`,
    quantity: 80 + index * 3,
  })),
  stockMovements: outpatientSeedPlan.drugs.slice(0, 12).map((drug, index) => ({
    id: `stock-movement-demo-${index + 1}`,
    batchId: `stock-demo-${index + 1}`,
    drugId: `drug-${drug.code}`,
    type: index % 3 === 0 ? 'DISPENSE' : index % 3 === 1 ? 'RECEIVE' : 'ADJUST',
    quantity: 2 + index,
  })),
  stockAlerts: outpatientSeedPlan.drugs.slice(0, 6).map((drug, index) => ({
    id: `stock-alert-demo-${index + 1}`,
    batchId: `stock-demo-${index + 1}`,
    drugId: `drug-${drug.code}`,
    type: index % 2 === 0 ? 'LOW_STOCK' : 'EXPIRING',
  })),
  paymentTransactions: Array.from({ length: 6 }, (_, index) => ({
    id: `payment-transaction-demo-${index + 1}`,
    paymentOrderId: `pay-reg-${index + 1}`,
    transactionNo: `TXN20260714${String(index + 1).padStart(4, '0')}`,
    amount: 20 + index * 5,
  })),
  refundOrders: Array.from({ length: 3 }, (_, index) => ({
    id: `refund-demo-${index + 1}`,
    paymentOrderId: `pay-reg-${index + 1}`,
    refundNo: `RF20260714${String(index + 1).padStart(4, '0')}`,
    amount: 10 + index * 2,
  })),
  clinicalTemplates: Array.from({ length: 12 }, (_, index) => ({
    id: `record-template-${index + 1}`,
    name: `Demo clinical template ${index + 1}`,
    summary: ['发热咳嗽门诊模板', '慢病复诊模板', '消化道症状模板', '皮肤过敏模板'][index % 4],
  })),
  notifications: Array.from({ length: 10 }, (_, index) => ({
    id: `notice-demo-${index + 1}`,
    userId: outpatientSeedPlan.patientUsers[index % outpatientSeedPlan.patientUsers.length].id,
    title: `Demo notification ${index + 1}`,
  })),
  wards: [
    ['WARD-A', '综合内科一病区', '8F'],
    ['WARD-B', '外科一病区', '9F'],
    ['WARD-C', '儿科病区', '6F'],
    ['WARD-D', '康复病区', '5F'],
  ].map(([code, name, floor]) => ({ id: `ward-${code.toLowerCase()}`, code, name, floor })),
  insuranceProfiles: outpatientSeedPlan.patientUsers.slice(0, 10).map((patient, index) => ({
    id: `ins-profile-${index + 1}`,
    userId: patient.id,
    insuredNo: `INS2026${String(index + 1).padStart(5, '0')}`,
  })),
  labItems: [
    ['LAB001', '血常规-白细胞', 'BLOOD', '10^9/L', 4, 10, 12],
    ['LAB002', '血常规-红细胞', 'BLOOD', '10^12/L', 3.5, 5.5, 12],
    ['LAB003', '血红蛋白', 'BLOOD', 'g/L', 110, 160, 12],
    ['LAB004', '血小板', 'BLOOD', '10^9/L', 100, 300, 12],
    ['LAB005', 'C反应蛋白', 'BLOOD', 'mg/L', 0, 8, 35],
    ['LAB006', '空腹血糖', 'BLOOD', 'mmol/L', 3.9, 6.1, 10],
    ['LAB007', '糖化血红蛋白', 'BLOOD', '%', 4, 6.5, 48],
    ['LAB008', '总胆固醇', 'BLOOD', 'mmol/L', 0, 5.2, 18],
    ['LAB009', '甘油三酯', 'BLOOD', 'mmol/L', 0, 1.7, 18],
    ['LAB010', '低密度脂蛋白', 'BLOOD', 'mmol/L', 0, 3.4, 18],
    ['LAB011', '谷丙转氨酶', 'BLOOD', 'U/L', 0, 40, 16],
    ['LAB012', '谷草转氨酶', 'BLOOD', 'U/L', 0, 40, 16],
    ['LAB013', '肌酐', 'BLOOD', 'umol/L', 44, 106, 16],
    ['LAB014', '尿素氮', 'BLOOD', 'mmol/L', 2.9, 8.2, 16],
    ['LAB015', '尿常规-蛋白', 'URINE', '', null, null, 8],
    ['LAB016', '尿常规-白细胞', 'URINE', '/HP', 0, 5, 8],
    ['LAB017', '甲状腺TSH', 'BLOOD', 'mIU/L', 0.27, 4.2, 45],
    ['LAB018', '游离T3', 'BLOOD', 'pmol/L', 3.1, 6.8, 45],
    ['LAB019', '游离T4', 'BLOOD', 'pmol/L', 12, 22, 45],
    ['LAB020', '降钙素原', 'BLOOD', 'ng/mL', 0, 0.5, 80],
  ].map(([code, name, specimenType, unit, referenceLow, referenceHigh, price]) => ({
    id: `lab-${code}`,
    code,
    name,
    specimenType,
    unit,
    referenceLow,
    referenceHigh,
    price,
  })),
  imagingItems: [
    ['IMG001', '胸部正位片', 'DR', '胸部', 80],
    ['IMG002', '腹部立位片', 'DR', '腹部', 80],
    ['IMG003', '颈椎正侧位片', 'DR', '颈椎', 120],
    ['IMG004', '膝关节正侧位片', 'DR', '膝关节', 120],
    ['IMG005', '头颅CT平扫', 'CT', '头颅', 280],
    ['IMG006', '胸部CT平扫', 'CT', '胸部', 320],
    ['IMG007', '腹部CT平扫', 'CT', '腹部', 360],
    ['IMG008', '腰椎CT', 'CT', '腰椎', 300],
    ['IMG009', '头颅MRI平扫', 'MR', '头颅', 520],
    ['IMG010', '膝关节MRI', 'MR', '膝关节', 560],
    ['IMG011', '腹部超声', 'US', '腹部', 120],
    ['IMG012', '甲状腺超声', 'US', '甲状腺', 120],
  ].map(([code, name, modality, bodyPart, price]) => ({ id: `img-${code}`, code, name, modality, bodyPart, price })),
  providerLogs: {
    insurance: Array.from({ length: 5 }, (_, index) => ({ id: `insurance-provider-log-demo-${index + 1}`, settlementId: `ins-settlement-${index + 1}` })),
    lab: Array.from({ length: 5 }, (_, index) => ({ id: `lab-provider-log-demo-${index + 1}`, requestId: `lab-request-demo-${index + 1}` })),
    pacs: Array.from({ length: 5 }, (_, index) => ({ id: `pacs-provider-log-demo-${index + 1}`, requestId: `img-request-demo-${index + 1}` })),
  },
}

const staffUsers = [
  { id: 'user-admin', username: 'admin', displayName: '系统管理员', role: 'ADMIN' },
  { id: 'user-cashier-lin', username: 'cashier_lin', displayName: '林收费员', role: 'CASHIER' },
  { id: 'user-pharmacy-wu', username: 'pharmacy_wu', displayName: '吴药师', role: 'PHARMACY' },
  { id: 'user-nurse-qiu', username: 'nurse_qiu', displayName: '邱护士', role: 'NURSE' },
]

const roles = [
  ['ADMIN', '平台管理员', '系统配置、基础资料和全局运营'],
  ['DOCTOR', '医生', '医生工作台、接诊和处方'],
  ['CASHIER', '收费员', '收费订单和模拟支付'],
  ['PHARMACY', '药房人员', '处方审核与发药'],
  ['NURSE', '护士', '签到分诊与队列管理'],
  ['PATIENT', '患者', '患者端预约和记录查询'],
].map(([code, name, description]) => ({ id: `role-${code.toLowerCase()}`, code, name, description }))

const permissions = [
  ['dashboard:view', '查看工作台'],
  ['system:manage', '管理系统设置'],
  ['hospital:manage', '管理医院组织'],
  ['schedule:manage', '管理排班号源'],
  ['registration:manage', '管理挂号'],
  ['doctor:workbench', '医生工作台'],
  ['cashier:workbench', '收费工作台'],
  ['pharmacy:workbench', '药房工作台'],
  ['patient:miniapp', '患者端服务'],
].map(([code, name]) => ({ id: `perm-${code.replace(':', '-')}`, code, name }))

const menuItems = [
  ['menu-dashboard', 'dashboard', '工作台', '/dashboard', 1],
  ['menu-system', 'system', '系统管理', '/system/accounts', 2],
  ['menu-hospital', 'hospital', '医院组织', '/hospital/departments', 3],
  ['menu-patients', 'patients', '患者中心', '/patients/profiles', 4],
  ['menu-schedule', 'schedule', '排班挂号', '/schedule/schedules', 5],
  ['menu-doctor', 'doctor', '医生工作台', '/doctor/workbench', 6],
  ['menu-cashier', 'cashier', '收费管理', '/cashier/workbench', 7],
  ['menu-pharmacy', 'pharmacy', '药房管理', '/pharmacy/workbench', 8],
  ['menu-operations', 'operations', '运营配置', '/operations/announcements', 9],
]

function todayAt(dayOffset: number, hour: number, minute = 0) {
  const date = new Date()
  date.setHours(0, 0, 0, 0)
  date.setDate(date.getDate() + dayOffset)
  date.setHours(hour, minute, 0, 0)
  return date
}

async function createPrisma() {
  const [{ PrismaClient }, { createMariaDbAdapter }] = await Promise.all([
    import('../src/generated/prisma/client'),
    import('../src/lib/prisma-adapter'),
  ])

  return new PrismaClient({ adapter: createMariaDbAdapter() })
}

interface SeedIdMaps {
  userIds: Map<string, string>
  doctorProfileIds: Map<string, string>
  patientProfileIds: Map<string, string>
}

function mappedId(map: Map<string, string>, seedId: string) {
  const value = map.get(seedId)
  if (!value) {
    throw new Error(`Missing mapped seed id: ${seedId}`)
  }
  return value
}

async function seedHisExpansion(prisma: Awaited<ReturnType<typeof createPrisma>>, idMaps: SeedIdMaps) {
  for (const role of [
    { id: 'role-inpatient-admin', code: 'INPATIENT_ADMIN', name: '住院管理员', description: '住院入出院和床位管理' },
    { id: 'role-lab', code: 'LAB', name: '检验技师', description: 'LIS 检验样本和报告管理' },
    { id: 'role-radiology', code: 'RADIOLOGY', name: '放射技师', description: 'PACS 影像检查和报告管理' },
  ]) {
    await prisma.role.upsert({ where: { code: role.code }, create: role, update: role })
  }

  for (const user of [
    { id: 'user-lab-tech', username: 'lab_tech', displayName: '检验技师', roleId: 'role-lab' },
    { id: 'user-radiology-tech', username: 'radiology_tech', displayName: '放射技师', roleId: 'role-radiology' },
    { id: 'user-inpatient-admin', username: 'inpatient_admin', displayName: '住院管理员', roleId: 'role-inpatient-admin' },
  ]) {
    const actualUser = await prisma.user.upsert({
      where: { username: user.username },
      create: { id: user.id, username: user.username, passwordHash: hashPassword(demoPassword, 'qisheng-demo-salt'), displayName: user.displayName },
      update: { passwordHash: hashPassword(demoPassword, 'qisheng-demo-salt'), displayName: user.displayName, status: 'ACTIVE' },
    })
    idMaps.userIds.set(user.id, actualUser.id)
    await prisma.userRole.upsert({
      where: { userId_roleId: { userId: actualUser.id, roleId: user.roleId } },
      create: { id: `ur-${actualUser.id}-${user.roleId}`, userId: actualUser.id, roleId: user.roleId },
      update: {},
    })
  }

  for (const [index, template] of hisExpansionSeedPlan.scheduleTemplates.entries()) {
    const department = outpatientSeedPlan.departments.find((item) => item.code === template.departmentCode)!
    const doctorId = mappedId(idMaps.doctorProfileIds, template.doctorId)
    await prisma.scheduleTemplate.upsert({
      where: { id: template.id },
      create: {
        id: template.id,
        name: template.name,
        doctorId,
        departmentId: department.id,
        clinicRoomId: `room-${department.code.toLowerCase()}-1`,
        period: index % 2 === 0 ? 'AM' : 'PM',
        capacity: 12,
        rules: { create: [{ weekday: (index % 6) + 1, startTime: index % 2 === 0 ? '08:00' : '14:00', endTime: index % 2 === 0 ? '12:00' : '17:30' }] },
      },
      update: { name: template.name, doctorId, departmentId: department.id, clinicRoomId: `room-${department.code.toLowerCase()}-1`, isActive: true },
    })
  }

  for (const batch of hisExpansionSeedPlan.stockBatches) {
    await prisma.drugStockBatch.upsert({
      where: { drugId_batchNo: { drugId: batch.drugId, batchNo: batch.batchNo } },
      create: { id: batch.id, drugId: batch.drugId, batchNo: batch.batchNo, quantity: batch.quantity, expiresAt: todayAt(180, 0), unitCost: 5 },
      update: { quantity: batch.quantity, expiresAt: todayAt(180, 0), isActive: true },
    })
  }

  for (const movement of hisExpansionSeedPlan.stockMovements) {
    await prisma.drugStockMovement.upsert({
      where: { id: movement.id },
      create: {
        id: movement.id,
        batchId: movement.batchId,
        drugId: movement.drugId,
        type: movement.type as 'DISPENSE' | 'RECEIVE' | 'ADJUST',
        quantity: movement.quantity,
        beforeQuantity: 100,
        afterQuantity: movement.type === 'DISPENSE' ? 100 - movement.quantity : 100 + movement.quantity,
        reason: '演示库存流水',
        operatorId: mappedId(idMaps.userIds, 'user-pharmacy-wu'),
      },
      update: {
        type: movement.type as 'DISPENSE' | 'RECEIVE' | 'ADJUST',
        quantity: movement.quantity,
        beforeQuantity: 100,
        afterQuantity: movement.type === 'DISPENSE' ? 100 - movement.quantity : 100 + movement.quantity,
        reason: '演示库存流水',
      },
    })
  }

  for (const alert of hisExpansionSeedPlan.stockAlerts) {
    await prisma.drugStockAlert.upsert({
      where: { id: alert.id },
      create: {
        id: alert.id,
        drugId: alert.drugId,
        batchId: alert.batchId,
        type: alert.type,
        level: alert.type === 'LOW_STOCK' ? 'WARNING' : 'INFO',
        message: alert.type === 'LOW_STOCK' ? '演示低库存预警' : '演示近效期预警',
      },
      update: {
        type: alert.type,
        level: alert.type === 'LOW_STOCK' ? 'WARNING' : 'INFO',
        message: alert.type === 'LOW_STOCK' ? '演示低库存预警' : '演示近效期预警',
        isResolved: false,
      },
    })
  }

  for (const transaction of hisExpansionSeedPlan.paymentTransactions) {
    await prisma.paymentTransaction.upsert({
      where: { transactionNo: transaction.transactionNo },
      create: {
        id: transaction.id,
        paymentOrderId: transaction.paymentOrderId,
        transactionNo: transaction.transactionNo,
        providerTradeNo: `MOCK-${transaction.transactionNo}`,
        payMethod: 'MOCK_CASH',
        amount: transaction.amount,
        status: 'SUCCESS',
        raw: { seed: true, channel: 'mock' },
      },
      update: { amount: transaction.amount, status: 'SUCCESS', raw: { seed: true, channel: 'mock' } },
    })
  }

  for (const refund of hisExpansionSeedPlan.refundOrders) {
    await prisma.refundOrder.upsert({
      where: { refundNo: refund.refundNo },
      create: {
        id: refund.id,
        paymentOrderId: refund.paymentOrderId,
        refundNo: refund.refundNo,
        amount: refund.amount,
        reason: '演示退款',
        status: 'SUCCESS',
        requestedById: mappedId(idMaps.userIds, 'user-cashier-lin'),
        executedAt: todayAt(-1, 15),
        transactions: {
          create: {
            id: `${refund.id}-transaction`,
            transactionNo: `${refund.refundNo}-TXN`,
            providerRefundNo: `MOCK-${refund.refundNo}`,
            amount: refund.amount,
            status: 'SUCCESS',
            raw: { seed: true, channel: 'mock' },
          },
        },
      },
      update: { amount: refund.amount, reason: '演示退款', status: 'SUCCESS', executedAt: todayAt(-1, 15) },
    })
  }

  for (const [index, template] of hisExpansionSeedPlan.clinicalTemplates.entries()) {
    await prisma.medicalRecordTemplate.upsert({
      where: { id: template.id },
      create: { id: template.id, name: template.name, summary: template.summary, advice: '按医嘱治疗，必要时复诊。' },
      update: { name: template.name, summary: template.summary, advice: '按医嘱治疗，必要时复诊。', isActive: true },
    })
    await prisma.commonDiagnosis.upsert({
      where: { id: `common-diagnosis-${index + 1}` },
      create: { id: `common-diagnosis-${index + 1}`, code: `CD${String(index + 1).padStart(3, '0')}`, name: template.summary, sortOrder: index + 1 },
      update: { name: template.summary, sortOrder: index + 1, isActive: true },
    })
  }

  for (const notification of hisExpansionSeedPlan.notifications) {
    await prisma.patientNotification.upsert({
      where: { id: notification.id },
      create: { id: notification.id, userId: mappedId(idMaps.userIds, notification.userId), type: 'SYSTEM', title: notification.title, content: '演示通知：请关注就诊、检验和住院状态。' },
      update: { title: notification.title, content: '演示通知：请关注就诊、检验和住院状态。' },
    })
  }

  for (const ward of hisExpansionSeedPlan.wards) {
    await prisma.ward.upsert({
      where: { code: ward.code },
      create: { id: ward.id, campusId: 'campus-main', code: ward.code, name: ward.name, floor: ward.floor, nurseStation: `${ward.name}护士站` },
      update: { name: ward.name, floor: ward.floor, nurseStation: `${ward.name}护士站`, isActive: true },
    })
    for (let bedIndex = 1; bedIndex <= 6; bedIndex += 1) {
      await prisma.bed.upsert({
        where: { wardId_bedNo: { wardId: ward.id, bedNo: `${ward.code}-${bedIndex}` } },
        create: { id: `bed-${ward.code.toLowerCase()}-${bedIndex}`, wardId: ward.id, bedNo: `${ward.code}-${bedIndex}`, dailyRate: 80 + bedIndex * 5 },
        update: { dailyRate: 80 + bedIndex * 5, isActive: true },
      })
    }
  }

  for (let index = 0; index < 8; index += 1) {
    const patient = outpatientSeedPlan.patientUsers[index]
    const ward = hisExpansionSeedPlan.wards[index % hisExpansionSeedPlan.wards.length]
    const doctor = outpatientSeedPlan.doctors[index % outpatientSeedPlan.doctors.length]
    const userId = mappedId(idMaps.userIds, patient.id)
    const doctorId = mappedId(idMaps.doctorProfileIds, doctor.id)
    const admissionId = `ip-demo-${index + 1}`
    const bedId = `bed-${ward.code.toLowerCase()}-${(index % 6) + 1}`
    await prisma.inpatientAdmission.upsert({
      where: { admissionNo: `IP20260714${String(index + 1).padStart(4, '0')}` },
      create: {
        id: admissionId,
        admissionNo: `IP20260714${String(index + 1).padStart(4, '0')}`,
        status: index % 3 === 0 ? 'DISCHARGE_REQUESTED' : 'ADMITTED',
        userId,
        visitMemberId: `visit-member-${patient.patientNo}-1`,
        attendingDoctorId: doctorId,
        wardId: ward.id,
        currentBedId: bedId,
        diagnosis: ['肺炎', '腰椎间盘突出', '糖尿病血糖控制', '术后康复'][index % 4],
        depositAmount: 1000 + index * 200,
        admittedAt: todayAt(-index - 1, 10),
      },
      update: { status: index % 3 === 0 ? 'DISCHARGE_REQUESTED' : 'ADMITTED', currentBedId: bedId, wardId: ward.id, depositAmount: 1000 + index * 200 },
    })
    await prisma.bed.update({ where: { id: bedId }, data: { status: 'OCCUPIED' } })
    await prisma.bedAssignment.upsert({
      where: { id: `bed-assign-${index + 1}` },
      create: { id: `bed-assign-${index + 1}`, admissionId, bedId, status: 'ACTIVE', reason: '演示入院分床' },
      update: { admissionId, bedId, status: 'ACTIVE', releasedAt: null },
    })
    await prisma.inpatientOrder.upsert({
      where: { id: `ip-order-${index + 1}` },
      create: { id: `ip-order-${index + 1}`, admissionId, doctorId, type: 'LONG_TERM', content: '每日查房，监测生命体征' },
      update: { content: '每日查房，监测生命体征', status: 'ACTIVE' },
    })
    await prisma.inpatientCharge.upsert({
      where: { id: `ip-charge-${index + 1}` },
      create: { id: `ip-charge-${index + 1}`, admissionId, orderId: `ip-order-${index + 1}`, itemName: '住院床位费', quantity: 1, unitPrice: 100, amount: 100 },
      update: { itemName: '住院床位费', quantity: 1, unitPrice: 100, amount: 100, status: 'UNBILLED' },
    })
  }

  for (const profile of hisExpansionSeedPlan.insuranceProfiles) {
    const userId = mappedId(idMaps.userIds, profile.userId)
    await prisma.insuranceProfile.upsert({
      where: { insuredNo: profile.insuredNo },
      create: { id: profile.id, userId, insuredNo: profile.insuredNo, insurerName: '启胜医保中心', planName: '职工基本医保', activeKey: userId },
      update: { insurerName: '启胜医保中心', planName: '职工基本医保', isActive: true, activeKey: userId },
    })
  }

  for (const feeItem of outpatientSeedPlan.feeItems.slice(0, 12)) {
    await prisma.insuranceCatalogMapping.upsert({
      where: { feeItemCode: feeItem.code as string },
      create: { id: `ins-map-${feeItem.code}`, feeItemCode: feeItem.code as string, insuranceCode: `YB-${feeItem.code}`, insuranceName: feeItem.name as string, category: 'B' },
      update: { insuranceName: feeItem.name as string, category: 'B', isActive: true },
    })
  }

  for (const [index, profile] of hisExpansionSeedPlan.insuranceProfiles.slice(0, 5).entries()) {
    const paymentOrderId = `pay-reg-${index + 1}`
    await prisma.insuranceSettlement.upsert({
      where: { settlementNo: `INSSET20260714${String(index + 1).padStart(4, '0')}` },
      create: {
        id: `ins-settlement-${index + 1}`,
        settlementNo: `INSSET20260714${String(index + 1).padStart(4, '0')}`,
        paymentOrderId,
        profileId: profile.id,
        source: 'OUTPATIENT',
        status: index % 2 === 0 ? 'SETTLED' : 'PRE_SETTLED',
        totalAmount: 100,
        insuranceAmount: 60,
        selfPayAmount: 40,
        activeKey: `seed-${paymentOrderId}`,
      },
      update: { status: index % 2 === 0 ? 'SETTLED' : 'PRE_SETTLED', totalAmount: 100, insuranceAmount: 60, selfPayAmount: 40 },
    })
  }

  for (const log of hisExpansionSeedPlan.providerLogs.insurance) {
    await prisma.insuranceProviderLog.upsert({
      where: { id: log.id },
      create: { id: log.id, settlementId: log.settlementId, action: 'settle', request: { seed: true }, response: { status: 'OK' }, success: true },
      update: { action: 'settle', request: { seed: true }, response: { status: 'OK' }, success: true },
    })
  }

  for (const item of hisExpansionSeedPlan.labItems) {
    await prisma.labTestItem.upsert({
      where: { code: item.code as string },
      create: {
        id: item.id as string,
        code: item.code as string,
        name: item.name as string,
        specimenType: item.specimenType as string,
        unit: item.unit as string,
        referenceLow: item.referenceLow as number | null,
        referenceHigh: item.referenceHigh as number | null,
        price: item.price as number,
      },
      update: {
        name: item.name as string,
        specimenType: item.specimenType as string,
        unit: item.unit as string,
        referenceLow: item.referenceLow as number | null,
        referenceHigh: item.referenceHigh as number | null,
        price: item.price as number,
        isActive: true,
      },
    })
  }

  for (const item of hisExpansionSeedPlan.imagingItems) {
    await prisma.imagingExamItem.upsert({
      where: { code: item.code as string },
      create: { id: item.id as string, code: item.code as string, name: item.name as string, modality: item.modality as string, bodyPart: item.bodyPart as string, price: item.price as number },
      update: { name: item.name as string, modality: item.modality as string, bodyPart: item.bodyPart as string, price: item.price as number, isActive: true },
    })
  }

  for (let index = 0; index < 6; index += 1) {
    const patient = outpatientSeedPlan.patientUsers[index]
    const doctor = outpatientSeedPlan.doctors[index]
    const userId = mappedId(idMaps.userIds, patient.id)
    const doctorId = mappedId(idMaps.doctorProfileIds, doctor.id)
    const labRequestId = `lab-request-demo-${index + 1}`
    await prisma.labRequest.upsert({
      where: { requestNo: `LIS20260714${String(index + 1).padStart(4, '0')}` },
      create: {
        id: labRequestId,
        requestNo: `LIS20260714${String(index + 1).padStart(4, '0')}`,
        status: 'PUBLISHED',
        userId,
        visitMemberId: `visit-member-${patient.patientNo}-1`,
        doctorId,
        source: 'OUTPATIENT',
        clinicalNote: '演示检验申请',
        items: { create: [{ itemId: 'lab-LAB001' }, { itemId: 'lab-LAB006' }] },
        sample: { create: { id: `lab-sample-demo-${index + 1}`, barcode: `LABBC20260714${String(index + 1).padStart(4, '0')}`, status: 'RECEIVED', receivedAt: todayAt(-1, 9) } },
        report: {
          create: {
            id: `lab-report-demo-${index + 1}`,
            status: 'PUBLISHED',
            summary: '演示检验报告，主要指标平稳。',
            reviewedAt: todayAt(-1, 11),
            publishedAt: todayAt(-1, 12),
            results: {
              create: [
                { itemId: 'lab-LAB001', resultValue: '6.2', numericValue: 6.2, unit: '10^9/L', referenceLow: 4, referenceHigh: 10, abnormalFlag: 'NORMAL' },
                { itemId: 'lab-LAB006', resultValue: '5.4', numericValue: 5.4, unit: 'mmol/L', referenceLow: 3.9, referenceHigh: 6.1, abnormalFlag: 'NORMAL' },
              ],
            },
          },
        },
      },
      update: { status: 'PUBLISHED', clinicalNote: '演示检验申请' },
    })
  }

  for (const log of hisExpansionSeedPlan.providerLogs.lab) {
    await prisma.labProviderLog.upsert({
      where: { id: log.id },
      create: { id: log.id, requestId: log.requestId, action: 'publishReport', request: { seed: true }, response: { status: 'OK' }, success: true },
      update: { action: 'publishReport', request: { seed: true }, response: { status: 'OK' }, success: true },
    })
  }

  for (let index = 0; index < 6; index += 1) {
    const patient = outpatientSeedPlan.patientUsers[index]
    const doctor = outpatientSeedPlan.doctors[index]
    const userId = mappedId(idMaps.userIds, patient.id)
    const doctorId = mappedId(idMaps.doctorProfileIds, doctor.id)
    const requestId = `img-request-demo-${index + 1}`
    await prisma.imagingRequest.upsert({
      where: { requestNo: `PACS20260714${String(index + 1).padStart(4, '0')}` },
      create: {
        id: requestId,
        requestNo: `PACS20260714${String(index + 1).padStart(4, '0')}`,
        status: 'PUBLISHED',
        userId,
        visitMemberId: `visit-member-${patient.patientNo}-1`,
        doctorId,
        source: 'OUTPATIENT',
        clinicalNote: '演示影像申请',
        items: { create: [{ itemId: `img-IMG${String((index % 12) + 1).padStart(3, '0')}` }] },
        appointment: { create: { id: `img-appt-demo-${index + 1}`, status: 'COMPLETED', scheduledAt: todayAt(-1, 10), checkedInAt: todayAt(-1, 10, 10), completedAt: todayAt(-1, 10, 30), room: `DR-${index + 1}` } },
        study: { create: { id: `img-study-demo-${index + 1}`, studyUid: `1.2.826.0.1.3680043.10.543.20260714.${index + 1}`, imageUrl: `/mock-pacs/studies/${requestId}/viewer`, modality: index % 2 === 0 ? 'DR' : 'CT' } },
        report: { create: { id: `img-report-demo-${index + 1}`, status: 'PUBLISHED', findings: '演示影像所见未见明显急性异常。', impression: '演示影像结论：建议结合临床随访。', reviewedAt: todayAt(-1, 11), publishedAt: todayAt(-1, 12) } },
      },
      update: { status: 'PUBLISHED', clinicalNote: '演示影像申请' },
    })
  }

  for (const log of hisExpansionSeedPlan.providerLogs.pacs) {
    await prisma.pacsProviderLog.upsert({
      where: { id: log.id },
      create: { id: log.id, requestId: log.requestId, action: 'publishReport', request: { seed: true }, response: { status: 'OK' }, success: true },
      update: { action: 'publishReport', request: { seed: true }, response: { status: 'OK' }, success: true },
    })
  }
}

async function seed() {
  const prisma = await createPrisma()
  const passwordHash = hashPassword(demoPassword, 'qisheng-demo-salt')
  const idMaps: SeedIdMaps = {
    userIds: new Map(),
    doctorProfileIds: new Map(),
    patientProfileIds: new Map(),
  }

  try {
    for (const role of roles) {
      await prisma.role.upsert({ where: { code: role.code }, create: role, update: role })
    }

    for (const permission of permissions) {
      await prisma.permission.upsert({ where: { code: permission.code }, create: permission, update: permission })
    }

    const adminRole = roles.find((role) => role.code === 'ADMIN')!
    for (const permission of permissions) {
      await prisma.rolePermission.upsert({
        where: { roleId_permissionId: { roleId: adminRole.id, permissionId: permission.id } },
        create: { id: `rp-admin-${permission.id}`, roleId: adminRole.id, permissionId: permission.id },
        update: {},
      })
    }

    for (const item of menuItems) {
      await prisma.menu.upsert({
        where: { code: item[1] as string },
        create: { id: item[0] as string, code: item[1] as string, title: item[2] as string, path: item[3] as string, sortOrder: item[4] as number },
        update: { title: item[2] as string, path: item[3] as string, sortOrder: item[4] as number, isActive: true },
      })
    }

    for (const campus of outpatientSeedPlan.campuses) {
      await prisma.hospitalCampus.upsert({ where: { name: campus.name }, create: campus, update: campus })
    }

    for (const department of outpatientSeedPlan.departments) {
      await prisma.department.upsert({
        where: { code: department.code },
        create: department,
        update: { name: department.name, summary: department.summary, campusId: department.campusId, sortOrder: department.sortOrder, isActive: true },
      })
    }

    for (const department of outpatientSeedPlan.departments) {
      for (let roomIndex = 1; roomIndex <= 2; roomIndex += 1) {
        const id = `room-${department.code.toLowerCase()}-${roomIndex}`
        await prisma.clinicRoom.upsert({
          where: { id },
          create: {
            id,
            campusId: department.campusId,
            departmentId: department.id,
            name: `${department.name}${roomIndex}诊室`,
            floor: `${(department.sortOrder % 5) + 2}F`,
          },
          update: {
            campusId: department.campusId,
            departmentId: department.id,
            name: `${department.name}${roomIndex}诊室`,
            floor: `${(department.sortOrder % 5) + 2}F`,
            isActive: true,
          },
        })
      }
    }

    for (const staff of staffUsers) {
      const user = await prisma.user.upsert({
        where: { username: staff.username },
        create: { id: staff.id, username: staff.username, passwordHash, displayName: staff.displayName },
        update: { passwordHash, displayName: staff.displayName, status: 'ACTIVE' },
      })
      idMaps.userIds.set(staff.id, user.id)
      await prisma.userRole.upsert({
        where: { userId_roleId: { userId: user.id, roleId: `role-${staff.role.toLowerCase()}` } },
        create: { id: `ur-${user.id}-${staff.role.toLowerCase()}`, userId: user.id, roleId: `role-${staff.role.toLowerCase()}` },
        update: {},
      })
    }

    for (const doctor of outpatientSeedPlan.doctors) {
      const userId = `user-${doctor.username}`
      const department = outpatientSeedPlan.departments.find((item) => item.code === doctor.departmentCode)!
      const user = await prisma.user.upsert({
        where: { username: doctor.username },
        create: { id: userId, username: doctor.username, passwordHash, displayName: doctor.displayName },
        update: { passwordHash, displayName: doctor.displayName, status: 'ACTIVE' },
      })
      idMaps.userIds.set(userId, user.id)
      await prisma.userRole.upsert({
        where: { userId_roleId: { userId: user.id, roleId: 'role-doctor' } },
        create: { id: `ur-${user.id}-doctor`, userId: user.id, roleId: 'role-doctor' },
        update: {},
      })
      const doctorProfileData = {
        userId: user.id,
        departmentId: department.id,
        employeeNo: doctor.employeeNo,
        title: doctor.title,
        specialty: doctor.specialty,
        introduction: `${doctor.displayName}${doctor.title}，擅长${doctor.specialty}。`,
        licenseNo: `LIC-${doctor.employeeNo}`,
        consultationFee: doctor.title === '主任医师' ? 50 : doctor.title === '副主任医师' ? 35 : 20,
      }
      const existingDoctorProfile = await prisma.doctorProfile.findFirst({
        where: { OR: [{ employeeNo: doctor.employeeNo }, { userId: user.id }] },
      })
      const doctorProfile = existingDoctorProfile
        ? await prisma.doctorProfile.update({
            where: { id: existingDoctorProfile.id },
            data: { ...doctorProfileData, isActive: true },
          })
        : await prisma.doctorProfile.create({
            data: {
              id: doctor.id,
              ...doctorProfileData,
            },
          })
      idMaps.doctorProfileIds.set(doctor.id, doctorProfile.id)
    }

    for (const patient of outpatientSeedPlan.patientUsers) {
      const user = await prisma.user.upsert({
        where: { username: patient.username },
        create: { id: patient.id, username: patient.username, phone: patient.phone, passwordHash, displayName: patient.displayName },
        update: { phone: patient.phone, passwordHash, displayName: patient.displayName, status: 'ACTIVE' },
      })
      idMaps.userIds.set(patient.id, user.id)
      await prisma.userRole.upsert({
        where: { userId_roleId: { userId: user.id, roleId: 'role-patient' } },
        create: { id: `ur-${user.id}-patient`, userId: user.id, roleId: 'role-patient' },
        update: {},
      })
      const patientProfileData = {
        userId: user.id,
        patientNo: patient.patientNo,
        realName: patient.displayName,
        gender: Number(patient.patientNo.slice(-1)) % 2 === 0 ? '女' : '男',
        birthday: todayAt(-12000 + Number(patient.patientNo.slice(-2)) * 100, 0),
        phone: patient.phone,
        healthNote: '演示患者档案，可用于预约、缴费和记录查询。',
      }
      const existingPatientProfile = await prisma.patientProfile.findFirst({
        where: { OR: [{ patientNo: patient.patientNo }, { userId: user.id }] },
      })
      const patientProfile = existingPatientProfile
        ? await prisma.patientProfile.update({
            where: { id: existingPatientProfile.id },
            data: patientProfileData,
          })
        : await prisma.patientProfile.create({
            data: {
              id: patient.profileId,
              ...patientProfileData,
            },
          })
      idMaps.patientProfileIds.set(patient.profileId, patientProfile.id)

      for (let memberIndex = 1; memberIndex <= (patient.username === 'patient_demo' ? 3 : 1); memberIndex += 1) {
        const id = `visit-member-${patient.patientNo}-${memberIndex}`
        await prisma.visitMember.upsert({
          where: { id },
          create: {
            id,
            patientId: patientProfile.id,
            name: memberIndex === 1 ? patient.displayName : `${patient.displayName}家属${memberIndex - 1}`,
            gender: memberIndex % 2 === 0 ? '女' : '男',
            birthday: todayAt(-9000 - memberIndex * 300, 0),
            idCardNo: `440100199${memberIndex}0101${String(Number(patient.patientNo.slice(-2)) * 7 + memberIndex).padStart(4, '0')}`,
            phone: patient.phone,
            relationship: memberIndex === 1 ? 'SELF' : memberIndex === 2 ? 'PARENT' : 'CHILD',
            isDefault: memberIndex === 1,
          },
          update: { patientId: patientProfile.id, phone: patient.phone, isDefault: memberIndex === 1 },
        })
      }
    }

    for (const feeItem of outpatientSeedPlan.feeItems) {
      await prisma.feeItem.upsert({
        where: { code: feeItem.code as string },
        create: { id: `fee-${feeItem.code}`, code: feeItem.code as string, name: feeItem.name as string, amount: feeItem.amount as number },
        update: { name: feeItem.name as string, amount: feeItem.amount as number, isActive: true },
      })
    }

    for (const drug of outpatientSeedPlan.drugs) {
      await prisma.drugCatalog.upsert({
        where: { code: drug.code as string },
        create: {
          id: `drug-${drug.code}`,
          code: drug.code as string,
          name: drug.name as string,
          spec: drug.spec as string,
          unit: drug.unit as string,
          price: drug.price as number,
        },
        update: {
          name: drug.name as string,
          spec: drug.spec as string,
          unit: drug.unit as string,
          price: drug.price as number,
          isActive: true,
        },
      })
    }

    for (const announcement of outpatientSeedPlan.announcements) {
      await prisma.announcement.upsert({
        where: { id: announcement.id },
        create: { ...announcement, publishedAt: todayAt(-Number(announcement.id.replace('ann-', '')), 9) },
        update: { title: announcement.title, content: announcement.content, isActive: true },
      })
    }

    for (const category of outpatientSeedPlan.dictionaryCategories) {
      await prisma.dictionaryCategory.upsert({
        where: { code: category.code },
        create: { id: category.id, code: category.code, name: category.name, description: `${category.name}字典` },
        update: { name: category.name, description: `${category.name}字典` },
      })
      for (const [index, item] of category.items.entries()) {
        await prisma.dictionaryItem.upsert({
          where: { categoryId_code: { categoryId: category.id, code: item[0] } },
          create: {
            id: `${category.id}-${item[0].toLowerCase()}`,
            categoryId: category.id,
            code: item[0],
            label: item[1],
            sortOrder: index + 1,
          },
          update: { label: item[1], sortOrder: index + 1, isActive: true },
        })
      }
    }

    const scheduleDoctors = outpatientSeedPlan.doctors.slice(0, 12)
    for (const [doctorIndex, doctor] of scheduleDoctors.entries()) {
      const department = outpatientSeedPlan.departments.find((item) => item.code === doctor.departmentCode)!
      const doctorId = mappedId(idMaps.doctorProfileIds, doctor.id)
      for (let day = 1; day <= 7; day += 1) {
        const period = doctorIndex % 2 === 0 ? 'AM' : 'PM'
        const scheduleId = `sched-${doctor.employeeNo}-${day}-${period.toLowerCase()}`
        const roomId = `room-${department.code.toLowerCase()}-${(doctorIndex % 2) + 1}`
        await prisma.doctorSchedule.upsert({
          where: { id: scheduleId },
          create: {
            id: scheduleId,
            doctorId,
            departmentId: department.id,
            clinicRoomId: roomId,
            workDate: todayAt(day, 0),
            period,
            capacity: 4,
          },
          update: { doctorId, departmentId: department.id, clinicRoomId: roomId, workDate: todayAt(day, 0), period, capacity: 4 },
        })

        for (let slot = 0; slot < 4; slot += 1) {
          const startHour = period === 'AM' ? 8 + Math.floor(slot / 2) : 14 + Math.floor(slot / 2)
          const startMinute = slot % 2 === 0 ? 0 : 30
          const slotId = `slot-${scheduleId}-${slot + 1}`
          await prisma.appointmentSlot.upsert({
            where: { id: slotId },
            create: {
              id: slotId,
              scheduleId,
              startTime: todayAt(day, startHour, startMinute),
              endTime: todayAt(day, startHour, startMinute + 25),
              fee: doctor.title === '主任医师' ? 50 : doctor.title === '副主任医师' ? 35 : 20,
              status: 'AVAILABLE',
            },
            update: {
              startTime: todayAt(day, startHour, startMinute),
              endTime: todayAt(day, startHour, startMinute + 25),
              fee: doctor.title === '主任医师' ? 50 : doctor.title === '副主任医师' ? 35 : 20,
            },
          })
        }
      }
    }

    const registrationStatuses = ['BOOKED', 'CHECKED_IN', 'IN_VISIT', 'COMPLETED', 'CANCELLED'] as const
    const allSlotIds = scheduleDoctors.flatMap((doctor) =>
      Array.from({ length: 7 }, (_, dayIndex) => {
        const period = scheduleDoctors.indexOf(doctor) % 2 === 0 ? 'AM' : 'PM'
        return Array.from({ length: 4 }, (_, slotIndex) => `slot-sched-${doctor.employeeNo}-${dayIndex + 1}-${period.toLowerCase()}-${slotIndex + 1}`)
      }).flat(),
    )

    for (let index = 0; index < 30; index += 1) {
      const patient = outpatientSeedPlan.patientUsers[index % outpatientSeedPlan.patientUsers.length]
      const doctor = scheduleDoctors[index % scheduleDoctors.length]
      const department = outpatientSeedPlan.departments.find((item) => item.code === doctor.departmentCode)!
      const userId = mappedId(idMaps.userIds, patient.id)
      const doctorId = mappedId(idMaps.doctorProfileIds, doctor.id)
      const slotId = allSlotIds[index]
      const status = registrationStatuses[index % registrationStatuses.length]
      const payStatus = index % 5 === 0 ? 'CANCELLED' : index % 3 === 0 ? 'PAID' : 'PENDING'
      const paymentOrderId = `pay-reg-${index + 1}`
      const registrationId = `reg-${index + 1}`
      const amount = doctor.title === '主任医师' ? 50 : doctor.title === '副主任医师' ? 35 : 20

      await prisma.paymentOrder.upsert({
        where: { orderNo: `PAY2026${String(index + 1).padStart(5, '0')}` },
        create: {
          id: paymentOrderId,
          orderNo: `PAY2026${String(index + 1).padStart(5, '0')}`,
          title: `${department.name}${doctor.displayName}门诊费用`,
          amount,
          status: payStatus,
          userId,
          paidAt: payStatus === 'PAID' ? todayAt(-1, 10, index % 50) : null,
        },
        update: { title: `${department.name}${doctor.displayName}门诊费用`, amount, status: payStatus, paidAt: payStatus === 'PAID' ? todayAt(-1, 10, index % 50) : null },
      })

      await prisma.paymentOrderItem.upsert({
        where: { id: `pay-item-${index + 1}-registration` },
        create: {
          id: `pay-item-${index + 1}-registration`,
          paymentOrderId,
          itemType: 'REGISTRATION',
          itemName: doctor.title.includes('主任') ? '专家挂号费' : '普通挂号费',
          quantity: 1,
          unitPrice: amount,
          amount,
        },
        update: { itemName: doctor.title.includes('主任') ? '专家挂号费' : '普通挂号费', unitPrice: amount, amount },
      })

      await prisma.appointmentSlot.update({ where: { id: slotId }, data: { status: status === 'CANCELLED' ? 'AVAILABLE' : 'BOOKED' } })

      await prisma.registration.upsert({
        where: { registrationNo: `REG2026${String(index + 1).padStart(5, '0')}` },
        create: {
          id: registrationId,
          registrationNo: `REG2026${String(index + 1).padStart(5, '0')}`,
          status,
          userId,
          visitMemberId: `visit-member-${patient.patientNo}-1`,
          departmentId: department.id,
          doctorId,
          slotId,
          paymentOrderId,
          checkedInAt: ['CHECKED_IN', 'IN_VISIT', 'COMPLETED'].includes(status) ? todayAt(0, 8, index) : null,
          cancelledAt: status === 'CANCELLED' ? todayAt(0, 7, index) : null,
        },
        update: {
          status,
          userId,
          visitMemberId: `visit-member-${patient.patientNo}-1`,
          departmentId: department.id,
          doctorId,
          slotId,
          paymentOrderId,
          checkedInAt: ['CHECKED_IN', 'IN_VISIT', 'COMPLETED'].includes(status) ? todayAt(0, 8, index) : null,
          cancelledAt: status === 'CANCELLED' ? todayAt(0, 7, index) : null,
        },
      })
    }

    for (let index = 0; index < 15; index += 1) {
      const registrationId = `reg-${index + 1}`
      const doctor = scheduleDoctors[index % scheduleDoctors.length]
      const doctorId = mappedId(idMaps.doctorProfileIds, doctor.id)
      const encounterId = `enc-${index + 1}`
      const completed = index % 2 === 0
      await prisma.encounter.upsert({
        where: { registrationId },
        create: {
          id: encounterId,
          registrationId,
          doctorId,
          chiefComplaint: ['咳嗽三天', '头晕乏力', '复诊调药', '皮疹瘙痒', '胃痛反酸'][index % 5],
          status: completed ? 'COMPLETED' : 'OPEN',
          startedAt: todayAt(0, 9, index),
          completedAt: completed ? todayAt(0, 9, index + 20) : null,
        },
        update: {
          doctorId,
          chiefComplaint: ['咳嗽三天', '头晕乏力', '复诊调药', '皮疹瘙痒', '胃痛反酸'][index % 5],
          status: completed ? 'COMPLETED' : 'OPEN',
          startedAt: todayAt(0, 9, index),
          completedAt: completed ? todayAt(0, 9, index + 20) : null,
        },
      })
      await prisma.medicalRecord.upsert({
        where: { encounterId },
        create: { id: `record-${index + 1}`, encounterId, summary: '生命体征平稳，结合主诉给予门诊处理。', advice: '按医嘱用药，症状加重及时复诊。' },
        update: { summary: '生命体征平稳，结合主诉给予门诊处理。', advice: '按医嘱用药，症状加重及时复诊。' },
      })
      await prisma.diagnosis.upsert({
        where: { id: `diag-${index + 1}` },
        create: { id: `diag-${index + 1}`, encounterId, code: `D${String(index + 1).padStart(3, '0')}`, name: ['上呼吸道感染', '高血压', '胃炎', '湿疹', '腰肌劳损'][index % 5], note: '门诊初步诊断' },
        update: { name: ['上呼吸道感染', '高血压', '胃炎', '湿疹', '腰肌劳损'][index % 5], note: '门诊初步诊断' },
      })
      await prisma.medicalOrder.upsert({
        where: { id: `order-${index + 1}` },
        create: { id: `order-${index + 1}`, encounterId, type: ['CHECK', 'TREATMENT', 'ADVICE'][index % 3], content: ['测血压并记录', '雾化治疗一次', '低盐低脂饮食'][index % 3] },
        update: { type: ['CHECK', 'TREATMENT', 'ADVICE'][index % 3], content: ['测血压并记录', '雾化治疗一次', '低盐低脂饮食'][index % 3], status: 'ACTIVE' },
      })
    }

    for (let index = 0; index < 20; index += 1) {
      const doctor = scheduleDoctors[index % scheduleDoctors.length]
      const doctorId = mappedId(idMaps.doctorProfileIds, doctor.id)
      const prescriptionId = `rx-${index + 1}`
      const status = (['SUBMITTED', 'REVIEWED', 'DISPENSED', 'DRAFT'] as const)[index % 4]
      await prisma.prescription.upsert({
        where: { id: prescriptionId },
        create: {
          id: prescriptionId,
          encounterId: index < 15 ? `enc-${index + 1}` : null,
          doctorId,
          status,
          note: '演示处方，请按医嘱使用。',
        },
        update: { encounterId: index < 15 ? `enc-${index + 1}` : null, doctorId, status, note: '演示处方，请按医嘱使用。' },
      })

      for (let itemIndex = 0; itemIndex < 2; itemIndex += 1) {
        const drug = outpatientSeedPlan.drugs[(index * 2 + itemIndex) % outpatientSeedPlan.drugs.length]
        await prisma.prescriptionItem.upsert({
          where: { id: `rx-item-${index + 1}-${itemIndex + 1}` },
          create: {
            id: `rx-item-${index + 1}-${itemIndex + 1}`,
            prescriptionId,
            drugId: `drug-${drug.code}`,
            quantity: itemIndex + 1,
            dosage: itemIndex === 0 ? '一次1粒' : '一次1袋',
            usage: itemIndex === 0 ? '每日两次，口服' : '每日三次，温水冲服',
          },
          update: { drugId: `drug-${drug.code}`, quantity: itemIndex + 1, dosage: itemIndex === 0 ? '一次1粒' : '一次1袋', usage: itemIndex === 0 ? '每日两次，口服' : '每日三次，温水冲服' },
        })
      }
    }

    for (let index = 0; index < 30; index += 1) {
      await prisma.auditLog.upsert({
        where: { id: `audit-${index + 1}` },
        create: {
          id: `audit-${index + 1}`,
          userId: index % 2 === 0 ? mappedId(idMaps.userIds, 'user-admin') : mappedId(idMaps.userIds, 'user-doctor_chen'),
          action: (['CREATE', 'UPDATE', 'LOGIN', 'PAY', 'CANCEL'] as const)[index % 5],
          resource: ['Registration', 'Encounter', 'PaymentOrder', 'Prescription', 'User'][index % 5],
          resourceId: `demo-${index + 1}`,
          detail: `演示审计日志 ${index + 1}`,
          ip: `192.168.1.${index + 10}`,
          createdAt: todayAt(-Math.floor(index / 3), 10, index),
        },
        update: { detail: `演示审计日志 ${index + 1}`, createdAt: todayAt(-Math.floor(index / 3), 10, index) },
      })
    }

    await seedHisExpansion(prisma, idMaps)

    console.log('Seed completed:', {
      campuses: outpatientSeedPlan.campuses.length,
      departments: outpatientSeedPlan.departments.length,
      doctors: outpatientSeedPlan.doctors.length,
      patients: outpatientSeedPlan.patientUsers.length,
      schedules: scheduleDoctors.length * 7,
      slots: scheduleDoctors.length * 7 * 4,
      registrations: 30,
      prescriptions: 20,
      drugs: outpatientSeedPlan.drugs.length,
      labItems: hisExpansionSeedPlan.labItems.length,
      imagingItems: hisExpansionSeedPlan.imagingItems.length,
    })
  } finally {
    await prisma.$disconnect()
  }
}

if (require.main === module) {
  seed().catch((error) => {
    console.error(error)
    process.exit(1)
  })
}
