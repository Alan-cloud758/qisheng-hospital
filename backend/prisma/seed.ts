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
  patientUsers: Array.from({ length: 40 }, (_, index) => {
    const n = index + 1
    const names = [
      '张晓雨', '刘晨', '吴桐', '郑欣', '何一鸣', '梁安', '宋佳', '唐睿',
      '韩雪', '沈宁', '许诺', '程远', '陆敏', '曹阳', '袁可', '邱泽',
      '钟意', '卢瑶', '蒋帆', '丁悦', '潘宇', '戴明', '任芳', '姜浩',
      '范蕾', '田甜', '石磊', '廖琪', '姚杰', '廖雪', '邹敏', '白洋',
      '秦峰', '江琳', '崔健', '薛婷', '贺强', '万虹', '龙凯', '邵文',
    ]
    return {
      id: `patient-user-${n}`,
      profileId: `patient-profile-${n}`,
      username: n === 1 ? 'patient_demo' : `patient_demo_${String(n).padStart(2, '0')}`,
      displayName: names[index],
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
  scheduleTemplates: Array.from({ length: 12 }, (_, index) => ({
    id: `tpl-demo-${index + 1}`,
    name: [
      '内科上午门诊', '外科下午门诊', '儿科上午门诊', '妇产科下午门诊',
      '耳鼻喉上午门诊', '眼科下午门诊', '皮肤科上午门诊', '骨科下午门诊',
      '心内科上午门诊', '神内下午门诊', '内分泌上午门诊', '呼吸内科下午门诊',
    ][index],
    doctorId: outpatientSeedPlan.doctors[index].id,
    departmentCode: outpatientSeedPlan.doctors[index].departmentCode,
  })),
  stockBatches: [
    ...outpatientSeedPlan.drugs.slice(0, 30).map((drug, index) => ({
      id: `stock-demo-${index + 1}`,
      drugId: `drug-${drug.code}`,
      batchNo: `BATCH2026${String(index + 1).padStart(3, '0')}`,
      quantity: 80 + index * 3,
    })),
    ...outpatientSeedPlan.drugs.slice(0, 20).map((drug, index) => ({
      id: `stock-demo-b-${index + 1}`,
      drugId: `drug-${drug.code}`,
      batchNo: `BATCH2026B${String(index + 1).padStart(3, '0')}`,
      quantity: 40 + index * 2,
    })),
    ...outpatientSeedPlan.drugs.slice(0, 10).map((drug, index) => ({
      id: `stock-demo-c-${index + 1}`,
      drugId: `drug-${drug.code}`,
      batchNo: `BATCH2026C${String(index + 1).padStart(3, '0')}`,
      quantity: 15 + index * 4,
    })),
  ],
  stockMovements: Array.from({ length: 30 }, (_, index) => {
    const drug = outpatientSeedPlan.drugs[index % 20]
    const types = ['DISPENSE', 'RECEIVE', 'ADJUST', 'DISPENSE', 'RECEIVE'] as const
    const reasons = ['门诊发药', '采购入库', '盘点调整', '住院发药', '退货出库']
    return {
      id: `stock-movement-demo-${index + 1}`,
      batchId: `stock-demo-${(index % 30) + 1}`,
      drugId: `drug-${drug.code}`,
      type: types[index % types.length],
      quantity: 2 + (index % 10),
      reason: reasons[index % reasons.length],
    }
  }),
  stockAlerts: Array.from({ length: 15 }, (_, index) => {
    const drug = outpatientSeedPlan.drugs[index % 15]
    const alertTypes = ['LOW_STOCK', 'EXPIRING', 'LOW_STOCK', 'EXPIRING', 'LOW_STOCK'] as const
    const levels = ['WARNING', 'INFO', 'CRITICAL', 'WARNING', 'INFO'] as const
    const messages = ['库存低于安全线', '药品即将过期', '库存严重不足', '批号近效期30天', '库存偏低需补货']
    return {
      id: `stock-alert-demo-${index + 1}`,
      batchId: `stock-demo-${index + 1}`,
      drugId: `drug-${drug.code}`,
      type: alertTypes[index % alertTypes.length],
      level: levels[index % levels.length],
      message: messages[index % messages.length],
    }
  }),
  paymentTransactions: Array.from({ length: 20 }, (_, index) => ({
    id: `payment-transaction-demo-${index + 1}`,
    paymentOrderId: `pay-reg-${index + 1}`,
    transactionNo: `TXN20260714${String(index + 1).padStart(4, '0')}`,
    amount: [20, 35, 50, 20, 35, 50, 20, 35, 50, 20, 35, 50, 20, 35, 50, 20, 35, 50, 20, 35][index],
  })),
  refundOrders: Array.from({ length: 8 }, (_, index) => ({
    id: `refund-demo-${index + 1}`,
    paymentOrderId: `pay-reg-${index + 1}`,
    refundNo: `RF20260714${String(index + 1).padStart(4, '0')}`,
    amount: [10, 15, 20, 12, 18, 25, 10, 15][index],
  })),
  clinicalTemplates: Array.from({ length: 24 }, (_, index) => ({
    id: `record-template-${index + 1}`,
    name: [
      '发热咳嗽门诊模板', '慢病复诊模板', '消化道症状模板', '皮肤过敏模板',
      '高血压随访模板', '糖尿病管理模板', '骨科复查模板', '儿科发热模板',
      '妇科炎症模板', '耳鼻喉炎症模板', '心内科初诊模板', '呼吸内科模板',
      '甲状腺随访模板', '术后复查模板', '体检报告解读模板', '中医调理模板',
      '眼科检查模板', '口腔治疗模板', '康复评估模板', '急诊处理模板',
      '神经内科头痛模板', '泌尿系统感染模板', '贫血查因模板', '失眠门诊模板',
    ][index],
    summary: [
      '发热咳嗽门诊', '慢病复诊', '消化道症状', '皮肤过敏',
      '高血压随访', '糖尿病管理', '骨科复查', '儿科发热',
      '妇科炎症', '耳鼻喉炎症', '心内科初诊', '呼吸内科',
      '甲状腺随访', '术后复查', '体检解读', '中医调理',
      '眼科检查', '口腔治疗', '康复评估', '急诊处理',
      '头痛头晕', '泌尿感染', '贫血查因', '失眠焦虑',
    ][index],
  })),
  notifications: Array.from({ length: 30 }, (_, index) => {
    const titles = [
      '预约成功提醒', '就诊时间变更', '检验报告已出', '处方已审核', '住院费用通知',
      '复诊提醒', '体检报告可取', '医保结算完成', '退款处理通知', '排班调整通知',
      '药房发药通知', '检查预约确认', '就诊排队叫号', '健康体检提醒', '慢病随访通知',
      '疫苗接种提醒', '住院押金提醒', '出院小结可查', '医生停诊通知', '复诊配药提醒',
      '检验结果异常', '影像报告可查', '处方驳回通知', '住院日清单', '医保余额不足',
      '预约爽约通知', '就诊满意度调查', '健康教育推送', '节假日门诊安排', '新功能上线通知',
    ]
    return {
      id: `notice-demo-${index + 1}`,
      userId: outpatientSeedPlan.patientUsers[index % outpatientSeedPlan.patientUsers.length].id,
      title: titles[index],
    }
  }),
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
    insurance: Array.from({ length: 10 }, (_, index) => ({ id: `insurance-provider-log-demo-${index + 1}`, settlementId: `ins-settlement-${index + 1}` })),
    lab: Array.from({ length: 15 }, (_, index) => ({ id: `lab-provider-log-demo-${index + 1}`, requestId: `lab-request-demo-${index + 1}` })),
    pacs: Array.from({ length: 15 }, (_, index) => ({ id: `pacs-provider-log-demo-${index + 1}`, requestId: `img-request-demo-${index + 1}` })),
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
    const expansionPasswordHash = await hashPassword(demoPassword)
    const actualUser = await prisma.user.upsert({
      where: { username: user.username },
      create: { id: user.id, username: user.username, passwordHash: expansionPasswordHash, displayName: user.displayName },
      update: { passwordHash: expansionPasswordHash, displayName: user.displayName, status: 'ACTIVE' },
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
    const afterQty = movement.type === 'DISPENSE' ? 100 - movement.quantity : 100 + movement.quantity
    await prisma.drugStockMovement.upsert({
      where: { id: movement.id },
      create: {
        id: movement.id,
        batchId: movement.batchId,
        drugId: movement.drugId,
        type: movement.type as 'DISPENSE' | 'RECEIVE' | 'ADJUST',
        quantity: movement.quantity,
        beforeQuantity: 100,
        afterQuantity: afterQty,
        reason: movement.reason,
        operatorId: mappedId(idMaps.userIds, 'user-pharmacy-wu'),
      },
      update: {
        type: movement.type as 'DISPENSE' | 'RECEIVE' | 'ADJUST',
        quantity: movement.quantity,
        beforeQuantity: 100,
        afterQuantity: afterQty,
        reason: movement.reason,
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
        level: alert.level,
        message: alert.message,
      },
      update: {
        type: alert.type,
        level: alert.level,
        message: alert.message,
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

  for (let index = 0; index < 16; index += 1) {
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
        diagnosis: ['肺炎', '腰椎间盘突出', '糖尿病血糖控制', '术后康复', '心力衰竭', '慢阻肺急性加重', '脑梗死恢复期', '骨折术后', '急性胰腺炎', '甲状腺术后', '慢性肾病', '肝硬化代偿期', '类风湿关节炎', '支气管哮喘', '胃溃疡出血', '帕金森病'][index % 16],
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
      create: { id: `ip-order-${index + 1}`, admissionId, doctorId, type: 'LONG_TERM', content: ['每日查房，监测生命体征', '抗感染治疗，头孢曲松2g静滴', '降压治疗，硝苯地平控释片', '控制血糖，胰岛素皮下注射', '康复训练，每日两次', '吸氧治疗，低流量持续', '雾化吸入治疗', '营养支持，高蛋白饮食'][index % 8] },
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

  for (const [index, profile] of hisExpansionSeedPlan.insuranceProfiles.slice(0, 10).entries()) {
    const paymentOrderId = `pay-reg-${index + 1}`
    const status = (['SETTLED', 'PRE_SETTLED', 'SETTLED', 'SETTLED', 'PRE_SETTLED', 'SETTLED', 'SETTLED', 'PRE_SETTLED', 'SETTLED', 'SETTLED'] as const)[index]
    const totalAmount = [100, 150, 200, 80, 120, 300, 160, 90, 250, 180][index]
    await prisma.insuranceSettlement.upsert({
      where: { settlementNo: `INSSET20260714${String(index + 1).padStart(4, '0')}` },
      create: {
        id: `ins-settlement-${index + 1}`,
        settlementNo: `INSSET20260714${String(index + 1).padStart(4, '0')}`,
        paymentOrderId,
        profileId: profile.id,
        source: 'OUTPATIENT',
        status,
        totalAmount,
        insuranceAmount: Math.round(totalAmount * 0.6),
        selfPayAmount: Math.round(totalAmount * 0.4),
        activeKey: `seed-${paymentOrderId}`,
      },
      update: { status, totalAmount, insuranceAmount: Math.round(totalAmount * 0.6), selfPayAmount: Math.round(totalAmount * 0.4) },
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

  for (let index = 0; index < 20; index += 1) {
    const patient = outpatientSeedPlan.patientUsers[index % outpatientSeedPlan.patientUsers.length]
    const doctor = outpatientSeedPlan.doctors[index % outpatientSeedPlan.doctors.length]
    const userId = mappedId(idMaps.userIds, patient.id)
    const doctorId = mappedId(idMaps.doctorProfileIds, doctor.id)
    const labRequestId = `lab-request-demo-${index + 1}`
    const dayOffset = index % 7
    const labStatuses = ['PUBLISHED', 'PUBLISHED', 'SAMPLE_RECEIVED', 'SAMPLE_COLLECTED', 'PUBLISHED', 'PUBLISHED', 'PUBLISHED', 'PUBLISHED', 'PUBLISHED', 'PUBLISHED',
      'PUBLISHED', 'PUBLISHED', 'PUBLISHED', 'PUBLISHED', 'PUBLISHED', 'PUBLISHED', 'PUBLISHED', 'PUBLISHED', 'PUBLISHED', 'PUBLISHED'] as const
    const labItemPairs = [
      ['lab-LAB001', 'lab-LAB006'],
      ['lab-LAB002', 'lab-LAB003'],
      ['lab-LAB004', 'lab-LAB005'],
      ['lab-LAB007', 'lab-LAB008'],
      ['lab-LAB009', 'lab-LAB010'],
      ['lab-LAB011', 'lab-LAB012'],
      ['lab-LAB013', 'lab-LAB014'],
      ['lab-LAB015', 'lab-LAB016'],
      ['lab-LAB017', 'lab-LAB018'],
      ['lab-LAB019', 'lab-LAB020'],
    ]
    const selectedItems = labItemPairs[index % labItemPairs.length]
    const resultPairs = [
      [['6.2', 6.2], ['5.4', 5.4]],
      [['4.8', 4.8], ['138', 138]],
      [['210', 210], ['3.5', 3.5]],
      [['5.5', 5.5], ['18', 18]],
      [['1.2', 1.2], ['2.8', 2.8]],
      [['25', 25], ['28', 28]],
      [['72', 72], ['5.1', 5.1]],
      [['-', null], ['2', 2]],
      [['2.5', 2.5], ['4.8', 4.8]],
      [['16', 16], ['0.15', 0.15]],
    ]
    const results = resultPairs[index % resultPairs.length]
    await prisma.labRequest.upsert({
      where: { requestNo: `LIS20260714${String(index + 1).padStart(4, '0')}` },
      create: {
        id: labRequestId,
        requestNo: `LIS20260714${String(index + 1).padStart(4, '0')}`,
        status: labStatuses[index],
        userId,
        visitMemberId: `visit-member-${patient.patientNo}-1`,
        doctorId,
        source: 'OUTPATIENT',
        clinicalNote: ['常规体检', '发热待查', '慢病复查', '术前检查', '感染筛查'][index % 5],
        items: { create: selectedItems.map((itemId) => ({ itemId })) },
        sample: { create: { id: `lab-sample-demo-${index + 1}`, barcode: `LABBC20260714${String(index + 1).padStart(4, '0')}`, status: 'RECEIVED', receivedAt: todayAt(-dayOffset, 9) } },
        report: labStatuses[index] === 'PUBLISHED' ? {
          create: {
            id: `lab-report-demo-${index + 1}`,
            status: 'PUBLISHED',
            summary: '演示检验报告，主要指标平稳。',
            reviewedAt: todayAt(-dayOffset, 11),
            publishedAt: todayAt(-dayOffset, 12),
            results: {
              create: selectedItems.map((itemId, i) => ({
                itemId,
                resultValue: String(results[i][0]),
                numericValue: results[i][1] as number,
                unit: ['10^9/L', 'mmol/L', '10^12/L', 'g/L', '10^9/L', 'mg/L', '%', 'mmol/L', 'mmol/L', 'mmol/L'][selectedItems[i] === 'lab-LAB001' ? 0 : selectedItems[i] === 'lab-LAB006' ? 1 : i],
                referenceLow: [4, 3.9, 3.5, 110, 100, 0, 4, 0, 0, 0, 0, 0, 44, 2.9, 0, 0, 0.27, 3.1, 12, 0][Number(selectedItems[i].replace('lab-LAB0', '')) - 1],
                referenceHigh: [10, 6.1, 5.5, 160, 300, 8, 6.5, 5.2, 1.7, 3.4, 40, 40, 106, 8.2, null, 5, 4.2, 6.8, 22, 0.5][Number(selectedItems[i].replace('lab-LAB0', '')) - 1],
                abnormalFlag: 'NORMAL',
              })),
            },
          },
        } : undefined,
      },
      update: { status: labStatuses[index], clinicalNote: ['常规体检', '发热待查', '慢病复查', '术前检查', '感染筛查'][index % 5] },
    })
  }

  for (const log of hisExpansionSeedPlan.providerLogs.lab) {
    await prisma.labProviderLog.upsert({
      where: { id: log.id },
      create: { id: log.id, requestId: log.requestId, action: 'publishReport', request: { seed: true }, response: { status: 'OK' }, success: true },
      update: { action: 'publishReport', request: { seed: true }, response: { status: 'OK' }, success: true },
    })
  }

  for (let index = 0; index < 20; index += 1) {
    const patient = outpatientSeedPlan.patientUsers[index % outpatientSeedPlan.patientUsers.length]
    const doctor = outpatientSeedPlan.doctors[index % outpatientSeedPlan.doctors.length]
    const userId = mappedId(idMaps.userIds, patient.id)
    const doctorId = mappedId(idMaps.doctorProfileIds, doctor.id)
    const requestId = `img-request-demo-${index + 1}`
    const dayOffset = index % 7
    const imgItemCode = `img-IMG${String((index % 12) + 1).padStart(3, '0')}`
    const imgStatuses = ['PUBLISHED', 'PUBLISHED', 'CHECKED_IN', 'SCHEDULED', 'PUBLISHED', 'PUBLISHED', 'PUBLISHED', 'PUBLISHED', 'PUBLISHED', 'PUBLISHED',
      'PUBLISHED', 'PUBLISHED', 'PUBLISHED', 'PUBLISHED', 'PUBLISHED', 'PUBLISHED', 'PUBLISHED', 'PUBLISHED', 'PUBLISHED', 'PUBLISHED'] as const
    const findings = [
      '胸部未见明显实质性病变', '腹部未见明显异常密度影', '颈椎生理曲度变直', '膝关节间隙未见明显狭窄',
      '头颅未见明显异常', '双肺纹理清晰', '肝脏形态正常', '腰椎轻度骨质增生',
      '脑实质未见异常信号', '关节腔少量积液', '肝胆胰脾未见异常', '甲状腺未见明显结节',
      '心影大小正常', '肺部少许炎症', '胆囊壁稍增厚', '腰椎间盘轻度膨出',
      '双侧基底节区腔隙灶', '半月板信号未见异常', '脾脏体积正常', '乳腺未见明显肿块',
    ]
    const impressions = [
      '胸部DR未见明显异常', '腹部平片未见明显异常', '颈椎退行性变', '膝关节退行性改变',
      '头颅CT平扫未见明显异常', '胸部CT平扫未见明显异常', '腹部CT未见明显异常', '腰椎退行性变',
      '头颅MRI未见明显异常', '膝关节MRI示少量积液', '腹部超声未见异常', '甲状腺超声未见结节',
      '心影正常', '肺部炎症', '胆囊壁增厚', '腰椎间盘膨出',
      '腔隙性脑梗死', '半月板未见异常', '脾脏正常', '乳腺超声未见异常',
    ]
    await prisma.imagingRequest.upsert({
      where: { requestNo: `PACS20260714${String(index + 1).padStart(4, '0')}` },
      create: {
        id: requestId,
        requestNo: `PACS20260714${String(index + 1).padStart(4, '0')}`,
        status: imgStatuses[index],
        userId,
        visitMemberId: `visit-member-${patient.patientNo}-1`,
        doctorId,
        source: 'OUTPATIENT',
        clinicalNote: ['胸痛待查', '腹痛待查', '颈肩痛', '膝关节疼痛', '头痛头晕', '咳嗽咳痰', '黄疸查因', '腰痛查因', '肢体麻木', '关节肿胀',
          '吞咽困难', '颈部肿物', '心悸胸闷', '发热待查', '肝功能异常', '腰腿痛', '偏头痛', '运动损伤', '脾大查因', '乳腺检查'][index],
        items: { create: [{ itemId: imgItemCode }] },
        appointment: imgStatuses[index] !== 'PUBLISHED' ? { create: { id: `img-appt-demo-${index + 1}`, status: imgStatuses[index] === 'SCHEDULED' ? 'SCHEDULED' : 'COMPLETED', scheduledAt: todayAt(-dayOffset, 10), checkedInAt: imgStatuses[index] === 'CHECKED_IN' ? todayAt(-dayOffset, 10, 10) : null, completedAt: null, room: `DR-${(index % 6) + 1}` } } : { create: { id: `img-appt-demo-${index + 1}`, status: 'COMPLETED', scheduledAt: todayAt(-dayOffset, 10), checkedInAt: todayAt(-dayOffset, 10, 10), completedAt: todayAt(-dayOffset, 10, 30), room: `DR-${(index % 6) + 1}` } },
        study: imgStatuses[index] === 'PUBLISHED' ? { create: { id: `img-study-demo-${index + 1}`, studyUid: `1.2.826.0.1.3680043.10.543.20260714.${index + 1}`, imageUrl: `/mock-pacs/studies/${requestId}/viewer`, modality: ['DR', 'CT', 'MR', 'US'][index % 4] } } : undefined,
        report: imgStatuses[index] === 'PUBLISHED' ? { create: { id: `img-report-demo-${index + 1}`, status: 'PUBLISHED', findings: findings[index], impression: impressions[index], reviewedAt: todayAt(-dayOffset, 11), publishedAt: todayAt(-dayOffset, 12) } } : undefined,
      },
      update: { status: imgStatuses[index], clinicalNote: ['胸痛待查', '腹痛待查', '颈肩痛', '膝关节疼痛', '头痛头晕'][index % 5] },
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
  const passwordHash = await hashPassword(demoPassword)
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

    for (let index = 0; index < 100; index += 1) {
      const patient = outpatientSeedPlan.patientUsers[index % outpatientSeedPlan.patientUsers.length]
      const doctor = scheduleDoctors[index % scheduleDoctors.length]
      const department = outpatientSeedPlan.departments.find((item) => item.code === doctor.departmentCode)!
      const userId = mappedId(idMaps.userIds, patient.id)
      const doctorId = mappedId(idMaps.doctorProfileIds, doctor.id)
      const slotId = allSlotIds[index % allSlotIds.length]
      const status = registrationStatuses[index % registrationStatuses.length]
      const dayOffset = index % 7
      const payStatus = index % 10 === 0 ? 'CANCELLED' : index % 4 === 0 ? 'REFUNDED' : index % 3 === 0 ? 'PAID' : 'PENDING'
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
          paidAt: payStatus === 'PAID' ? todayAt(-dayOffset, 10, index % 50) : null,
        },
        update: { title: `${department.name}${doctor.displayName}门诊费用`, amount, status: payStatus, paidAt: payStatus === 'PAID' ? todayAt(-dayOffset, 10, index % 50) : null },
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
          checkedInAt: ['CHECKED_IN', 'IN_VISIT', 'COMPLETED'].includes(status) ? todayAt(-dayOffset, 8, index) : null,
          cancelledAt: status === 'CANCELLED' ? todayAt(-dayOffset, 7, index) : null,
        },
        update: {
          status,
          userId,
          visitMemberId: `visit-member-${patient.patientNo}-1`,
          departmentId: department.id,
          doctorId,
          slotId,
          paymentOrderId,
          checkedInAt: ['CHECKED_IN', 'IN_VISIT', 'COMPLETED'].includes(status) ? todayAt(-dayOffset, 8, index) : null,
          cancelledAt: status === 'CANCELLED' ? todayAt(-dayOffset, 7, index) : null,
        },
      })
    }

    for (let index = 0; index < 60; index += 1) {
      const registrationId = `reg-${index + 1}`
      const doctor = scheduleDoctors[index % scheduleDoctors.length]
      const doctorId = mappedId(idMaps.doctorProfileIds, doctor.id)
      const encounterId = `enc-${index + 1}`
      const completed = index % 3 !== 0
      const dayOffset = index % 7
      const chiefComplaints = [
        '咳嗽三天', '头晕乏力', '复诊调药', '皮疹瘙痒', '胃痛反酸',
        '腰痛两周', '发热一天', '胸闷气短', '失眠多梦', '关节肿痛',
        '鼻塞流涕', '视力下降', '牙龈出血', '心悸不适', '腹胀腹泻',
        '皮肤红疹', '肩颈酸痛', '血糖升高', '耳鸣眩晕', '食欲减退',
      ]
      const diagnosisNames = [
        '上呼吸道感染', '高血压', '胃炎', '湿疹', '腰肌劳损',
        '急性扁桃体炎', '冠心病', '神经衰弱', '类风湿关节炎', '过敏性鼻炎',
        '结膜炎', '牙周炎', '心律失常', '肠易激综合征', '荨麻疹',
        '颈椎病', '2型糖尿病', '耳石症', '脂肪肝', '支气管炎',
      ]
      const orderContents = [
        '测血压并记录', '雾化治疗一次', '低盐低脂饮食', '休息三天', '一周后复查',
        '血糖监测一周', '理疗五次', '戒烟限酒', '加强锻炼', '定期复查肝功',
      ]
      await prisma.encounter.upsert({
        where: { registrationId },
        create: {
          id: encounterId,
          registrationId,
          doctorId,
          chiefComplaint: chiefComplaints[index % chiefComplaints.length],
          status: completed ? 'COMPLETED' : 'OPEN',
          startedAt: todayAt(-dayOffset, 9, index),
          completedAt: completed ? todayAt(-dayOffset, 9, index + 20) : null,
        },
        update: {
          doctorId,
          chiefComplaint: chiefComplaints[index % chiefComplaints.length],
          status: completed ? 'COMPLETED' : 'OPEN',
          startedAt: todayAt(-dayOffset, 9, index),
          completedAt: completed ? todayAt(-dayOffset, 9, index + 20) : null,
        },
      })
      await prisma.medicalRecord.upsert({
        where: { encounterId },
        create: { id: `record-${index + 1}`, encounterId, summary: '生命体征平稳，结合主诉给予门诊处理。', advice: '按医嘱用药，症状加重及时复诊。' },
        update: { summary: '生命体征平稳，结合主诉给予门诊处理。', advice: '按医嘱用药，症状加重及时复诊。' },
      })
      await prisma.diagnosis.upsert({
        where: { id: `diag-${index + 1}` },
        create: { id: `diag-${index + 1}`, encounterId, code: `D${String(index + 1).padStart(3, '0')}`, name: diagnosisNames[index % diagnosisNames.length], note: '门诊初步诊断' },
        update: { name: diagnosisNames[index % diagnosisNames.length], note: '门诊初步诊断' },
      })
      await prisma.medicalOrder.upsert({
        where: { id: `order-${index + 1}` },
        create: { id: `order-${index + 1}`, encounterId, type: ['CHECK', 'TREATMENT', 'ADVICE', 'CARE'][index % 4], content: orderContents[index % orderContents.length] },
        update: { type: ['CHECK', 'TREATMENT', 'ADVICE', 'CARE'][index % 4], content: orderContents[index % orderContents.length], status: 'ACTIVE' },
      })
    }

    for (let index = 0; index < 50; index += 1) {
      const doctor = scheduleDoctors[index % scheduleDoctors.length]
      const doctorId = mappedId(idMaps.doctorProfileIds, doctor.id)
      const prescriptionId = `rx-${index + 1}`
      const status = (['SUBMITTED', 'REVIEWED', 'DISPENSED', 'DRAFT', 'REJECTED'] as const)[index % 5]
      const encounterId = index < 60 ? `enc-${index + 1}` : null
      const notes = ['演示处方，请按医嘱使用。', '饭后服用，多饮水。', '睡前服用，忌辛辣。', '急性期用药，症状缓解后停药。', '慢性病长期用药，定期复查。']
      await prisma.prescription.upsert({
        where: { id: prescriptionId },
        create: {
          id: prescriptionId,
          encounterId,
          doctorId,
          status,
          note: notes[index % notes.length],
          rejectedReason: status === 'REJECTED' ? '剂量需调整，请重新确认' : null,
        },
        update: { encounterId, doctorId, status, note: notes[index % notes.length], rejectedReason: status === 'REJECTED' ? '剂量需调整，请重新确认' : null },
      })

      for (let itemIndex = 0; itemIndex < 2 + (index % 3); itemIndex += 1) {
        const drug = outpatientSeedPlan.drugs[(index * 3 + itemIndex) % outpatientSeedPlan.drugs.length]
        const dosages = ['一次1粒', '一次2粒', '一次1袋', '一次1片', '一次2片']
        const usages = ['每日两次，口服', '每日三次，温水冲服', '每日一次，饭后服用', '每日三次，口服', '睡前服用一次']
        await prisma.prescriptionItem.upsert({
          where: { id: `rx-item-${index + 1}-${itemIndex + 1}` },
          create: {
            id: `rx-item-${index + 1}-${itemIndex + 1}`,
            prescriptionId,
            drugId: `drug-${drug.code}`,
            quantity: 1 + (itemIndex % 3),
            dosage: dosages[itemIndex % dosages.length],
            usage: usages[itemIndex % usages.length],
          },
          update: { drugId: `drug-${drug.code}`, quantity: 1 + (itemIndex % 3), dosage: dosages[itemIndex % dosages.length], usage: usages[itemIndex % usages.length] },
        })
      }
    }

    for (let index = 0; index < 80; index += 1) {
      const userIds = ['user-admin', 'user-doctor_chen', 'user-cashier-lin', 'user-pharmacy-wu', 'user-nurse-qiu']
      const actions = ['CREATE', 'UPDATE', 'LOGIN', 'PAY', 'CANCEL', 'REVIEW', 'DISPENSE', 'EXPORT'] as const
      const resources = ['Registration', 'Encounter', 'PaymentOrder', 'Prescription', 'User', 'DrugStock', 'InsuranceSettlement', 'LabRequest'] as const
      const details = [
        '演示审计日志：创建挂号记录', '演示审计日志：更新患者信息', '演示审计日志：用户登录系统', '演示审计日志：完成收费',
        '演示审计日志：取消预约', '演示审计日志：审核处方', '演示审计日志：发药确认', '演示审计日志：导出报表',
      ]
      await prisma.auditLog.upsert({
        where: { id: `audit-${index + 1}` },
        create: {
          id: `audit-${index + 1}`,
          userId: mappedId(idMaps.userIds, userIds[index % userIds.length]),
          action: actions[index % actions.length],
          resource: resources[index % resources.length],
          resourceId: `demo-${index + 1}`,
          detail: details[index % details.length],
          ip: `192.168.1.${(index % 254) + 1}`,
          createdAt: todayAt(-Math.floor(index / 5), 10, index),
        },
        update: { detail: details[index % details.length], createdAt: todayAt(-Math.floor(index / 5), 10, index) },
      })
    }

    await seedHisExpansion(prisma, idMaps)

    // ── Exam Packages ──────────────────────────────────────────────────────────────────

    const examPackages = [
      { id: 'exam-pkg-basic', code: 'PKG-BASIC', name: '基础体检套餐', description: '血常规、尿常规和胸部X光基础筛查', price: 280 },
      { id: 'exam-pkg-comp', code: 'PKG-COMP', name: '综合体检套餐', description: '血生化、甲状腺功能、胸部和腹部CT全面筛查', price: 860 },
      { id: 'exam-pkg-vip', code: 'PKG-VIP', name: 'VIP尊享体检', description: '肝肾功能、甲状腺、肿瘤标志物和心脏彩超深度筛查', price: 1680 },
    ]

    const examPackageItems = [
      { packageId: 'exam-pkg-basic', itemType: 'LAB', itemId: 'lab-LAB001', itemName: '血常规-白细胞', sortOrder: 1 },
      { packageId: 'exam-pkg-basic', itemType: 'LAB', itemId: 'lab-LAB002', itemName: '血常规-红细胞', sortOrder: 2 },
      { packageId: 'exam-pkg-basic', itemType: 'LAB', itemId: 'lab-LAB003', itemName: '血红蛋白', sortOrder: 3 },
      { packageId: 'exam-pkg-basic', itemType: 'LAB', itemId: 'lab-LAB015', itemName: '尿常规-蛋白', sortOrder: 4 },
      { packageId: 'exam-pkg-basic', itemType: 'IMAGING', itemId: 'img-IMG001', itemName: '胸部正位片', sortOrder: 5 },
      { packageId: 'exam-pkg-comp', itemType: 'LAB', itemId: 'lab-LAB001', itemName: '血常规-白细胞', sortOrder: 1 },
      { packageId: 'exam-pkg-comp', itemType: 'LAB', itemId: 'lab-LAB006', itemName: '空腹血糖', sortOrder: 2 },
      { packageId: 'exam-pkg-comp', itemType: 'LAB', itemId: 'lab-LAB008', itemName: '总胆固醇', sortOrder: 3 },
      { packageId: 'exam-pkg-comp', itemType: 'LAB', itemId: 'lab-LAB011', itemName: '谷丙转氨酶', sortOrder: 4 },
      { packageId: 'exam-pkg-comp', itemType: 'LAB', itemId: 'lab-LAB013', itemName: '肌酐', sortOrder: 5 },
      { packageId: 'exam-pkg-comp', itemType: 'LAB', itemId: 'lab-LAB017', itemName: '甲状腺TSH', sortOrder: 6 },
      { packageId: 'exam-pkg-comp', itemType: 'IMAGING', itemId: 'img-IMG006', itemName: '胸部CT平扫', sortOrder: 7 },
      { packageId: 'exam-pkg-comp', itemType: 'IMAGING', itemId: 'img-IMG007', itemName: '腹部CT平扫', sortOrder: 8 },
      { packageId: 'exam-pkg-vip', itemType: 'LAB', itemId: 'lab-LAB001', itemName: '血常规-白细胞', sortOrder: 1 },
      { packageId: 'exam-pkg-vip', itemType: 'LAB', itemId: 'lab-LAB005', itemName: 'C反应蛋白', sortOrder: 2 },
      { packageId: 'exam-pkg-vip', itemType: 'LAB', itemId: 'lab-LAB006', itemName: '空腹血糖', sortOrder: 3 },
      { packageId: 'exam-pkg-vip', itemType: 'LAB', itemId: 'lab-LAB007', itemName: '糖化血红蛋白', sortOrder: 4 },
      { packageId: 'exam-pkg-vip', itemType: 'LAB', itemId: 'lab-LAB011', itemName: '谷丙转氨酶', sortOrder: 5 },
      { packageId: 'exam-pkg-vip', itemType: 'LAB', itemId: 'lab-LAB013', itemName: '肌酐', sortOrder: 6 },
      { packageId: 'exam-pkg-vip', itemType: 'LAB', itemId: 'lab-LAB017', itemName: '甲状腺TSH', sortOrder: 7 },
      { packageId: 'exam-pkg-vip', itemType: 'LAB', itemId: 'lab-LAB020', itemName: '降钙素原', sortOrder: 8 },
      { packageId: 'exam-pkg-vip', itemType: 'IMAGING', itemId: 'img-IMG011', itemName: '腹部超声', sortOrder: 9 },
      { packageId: 'exam-pkg-vip', itemType: 'IMAGING', itemId: 'img-IMG012', itemName: '甲状腺超声', sortOrder: 10 },
    ]

    for (const pkg of examPackages) {
      await prisma.examPackage.upsert({
        where: { code: pkg.code },
        create: { id: pkg.id, code: pkg.code, name: pkg.name, description: pkg.description, price: pkg.price },
        update: { name: pkg.name, description: pkg.description, price: pkg.price, isActive: true },
      })
    }

    for (const item of examPackageItems) {
      await prisma.examPackageItem.upsert({
        where: { id: `epi-${item.packageId}-${item.itemId}` },
        create: { id: `epi-${item.packageId}-${item.itemId}`, packageId: item.packageId, itemType: item.itemType, itemId: item.itemId, itemName: item.itemName, sortOrder: item.sortOrder },
        update: { itemType: item.itemType, itemId: item.itemId, itemName: item.itemName, sortOrder: item.sortOrder },
      })
    }

    // ── Exam Orders ────────────────────────────────────────────────────────────────────

    const examOrders = [
      { id: 'exam-order-1', orderNo: 'EXAM20260001', patientId: 'patient-user-1', packageId: 'exam-pkg-basic', status: 'REPORTED' as const, scheduledAt: todayAt(-5, 9), completedAt: todayAt(-5, 10), reportSummary: '基础体检指标均在正常范围。' },
      { id: 'exam-order-2', orderNo: 'EXAM20260002', patientId: 'patient-user-2', packageId: 'exam-pkg-comp', status: 'COMPLETED' as const, scheduledAt: todayAt(-3, 9), completedAt: todayAt(-3, 11) },
      { id: 'exam-order-3', orderNo: 'EXAM20260003', patientId: 'patient-user-3', packageId: 'exam-pkg-vip', status: 'IN_PROGRESS' as const, scheduledAt: todayAt(-1, 8) },
      { id: 'exam-order-4', orderNo: 'EXAM20260004', patientId: 'patient-user-4', packageId: 'exam-pkg-basic', status: 'PENDING' as const, scheduledAt: todayAt(1, 9) },
      { id: 'exam-order-5', orderNo: 'EXAM20260005', patientId: 'patient-user-5', packageId: 'exam-pkg-comp', status: 'REPORTED' as const, scheduledAt: todayAt(-7, 9), completedAt: todayAt(-7, 12), reportSummary: '综合体检报告：血脂偏高，其余正常。' },
      { id: 'exam-order-6', orderNo: 'EXAM20260006', patientId: 'patient-user-6', packageId: 'exam-pkg-vip', status: 'PENDING' as const, scheduledAt: todayAt(2, 8) },
      { id: 'exam-order-7', orderNo: 'EXAM20260007', patientId: 'patient-user-7', packageId: 'exam-pkg-basic', status: 'CANCELLED' as const, scheduledAt: todayAt(-2, 10) },
      { id: 'exam-order-8', orderNo: 'EXAM20260008', patientId: 'patient-user-8', packageId: 'exam-pkg-comp', status: 'IN_PROGRESS' as const, scheduledAt: todayAt(0, 9) },
    ]

    for (const order of examOrders) {
      const userId = mappedId(idMaps.userIds, order.patientId)
      await prisma.examOrder.upsert({
        where: { orderNo: order.orderNo },
        create: { id: order.id, orderNo: order.orderNo, status: order.status, userId, packageId: order.packageId, visitMemberId: `visit-member-${outpatientSeedPlan.patientUsers[Number(order.patientId.replace('patient-user-', '')) - 1].patientNo}-1`, scheduledAt: order.scheduledAt, completedAt: order.completedAt, reportSummary: order.reportSummary },
        update: { status: order.status, scheduledAt: order.scheduledAt, completedAt: order.completedAt, reportSummary: order.reportSummary },
      })
    }

    // ── Operating Rooms ────────────────────────────────────────────────────────────────

    const operatingRooms = [
      { id: 'or-room-1', code: 'OR-01', name: '第一手术室', floor: '3F', status: 'AVAILABLE' as const },
      { id: 'or-room-2', code: 'OR-02', name: '第二手术室', floor: '3F', status: 'IN_USE' as const },
      { id: 'or-room-3', code: 'OR-03', name: '第三手术室', floor: '3F', status: 'CLEANING' as const },
      { id: 'or-room-4', code: 'OR-04', name: '第四手术室（百级）', floor: '4F', status: 'AVAILABLE' as const },
    ]

    for (const room of operatingRooms) {
      await prisma.operatingRoom.upsert({
        where: { code: room.code },
        create: { id: room.id, code: room.code, name: room.name, campusId: 'campus-main', floor: room.floor, status: room.status },
        update: { name: room.name, floor: room.floor, status: room.status, isActive: true },
      })
    }

    // ── Surgery Requests & Schedules ────────────────────────────────────────────────────

    const surgeryRequests = [
      { id: 'surg-req-1', requestNo: 'SRG20260001', patientId: 'patient-user-1', admissionId: 'ip-demo-1', surgeonUsername: 'doctor_zhou', procedureName: '阑尾切除术', anesthesiaType: '全麻', urgency: 'URGENT', diagnosis: '急性阑尾炎', plannedDuration: 90, status: 'COMPLETED' as const, roomId: 'or-room-2', scheduledStart: todayAt(-2, 8), scheduledEnd: todayAt(-2, 10), actualStart: todayAt(-2, 8, 15), actualEnd: todayAt(-2, 9, 50) },
      { id: 'surg-req-2', requestNo: 'SRG20260002', patientId: 'patient-user-2', admissionId: 'ip-demo-2', surgeonUsername: 'doctor_li', procedureName: '甲状腺部分切除术', anesthesiaType: '全麻', urgency: 'NORMAL', diagnosis: '甲状腺结节', plannedDuration: 120, status: 'SCHEDULED' as const, roomId: 'or-room-1', scheduledStart: todayAt(1, 8), scheduledEnd: todayAt(1, 10) },
      { id: 'surg-req-3', requestNo: 'SRG20260003', patientId: 'patient-user-3', admissionId: 'ip-demo-3', surgeonUsername: 'doctor_peng', procedureName: '膝关节镜探查术', anesthesiaType: '腰麻', urgency: 'NORMAL', diagnosis: '半月板损伤', plannedDuration: 60, status: 'REQUESTED' as const, roomId: 'or-room-4', scheduledStart: todayAt(3, 9), scheduledEnd: todayAt(3, 10) },
      { id: 'surg-req-4', requestNo: 'SRG20260004', patientId: 'patient-user-4', admissionId: 'ip-demo-4', surgeonUsername: 'doctor_zhou', procedureName: '疝修补术', anesthesiaType: '局麻', urgency: 'NORMAL', diagnosis: '腹股沟疝', plannedDuration: 45, status: 'SCHEDULED' as const, roomId: 'or-room-1', scheduledStart: todayAt(2, 14), scheduledEnd: todayAt(2, 14, 45) },
      { id: 'surg-req-5', requestNo: 'SRG20260005', patientId: 'patient-user-5', admissionId: 'ip-demo-5', surgeonUsername: 'doctor_huang', procedureName: '冠状动脉支架植入术', anesthesiaType: '局麻', urgency: 'URGENT', diagnosis: '不稳定型心绞痛', plannedDuration: 120, status: 'IN_PROGRESS' as const, roomId: 'or-room-2', scheduledStart: todayAt(0, 9), scheduledEnd: todayAt(0, 11), actualStart: todayAt(0, 9, 5) },
      { id: 'surg-req-6', requestNo: 'SRG20260006', patientId: 'patient-user-6', admissionId: 'ip-demo-6', surgeonUsername: 'doctor_sun', procedureName: '胸腔闭式引流术', anesthesiaType: '局麻', urgency: 'URGENT', diagnosis: '气胸', plannedDuration: 30, status: 'CANCELLED' as const, roomId: 'or-room-3', scheduledStart: todayAt(-1, 10), scheduledEnd: todayAt(-1, 10, 30) },
    ]

    for (const req of surgeryRequests) {
      const patientUserId = mappedId(idMaps.userIds, req.patientId)
      const surgeonProfile = outpatientSeedPlan.doctors.find((d) => d.username === req.surgeonUsername)!
      const surgeonId = mappedId(idMaps.doctorProfileIds, surgeonProfile.id)
      await prisma.surgeryRequest.upsert({
        where: { requestNo: req.requestNo },
        create: {
          id: req.id, requestNo: req.requestNo, status: req.status, patientUserId, surgeonId,
          admissionId: req.admissionId, procedureName: req.procedureName, anesthesiaType: req.anesthesiaType,
          urgency: req.urgency, diagnosis: req.diagnosis, plannedDuration: req.plannedDuration, notes: '演示手术申请',
        },
        update: { status: req.status, procedureName: req.procedureName, anesthesiaType: req.anesthesiaType, urgency: req.urgency, diagnosis: req.diagnosis, plannedDuration: req.plannedDuration },
      })
      await prisma.surgerySchedule.upsert({
        where: { id: `surg-sched-${req.id}` },
        create: {
          id: `surg-sched-${req.id}`, requestId: req.id, roomId: req.roomId,
          scheduledStart: req.scheduledStart, scheduledEnd: req.scheduledEnd,
          actualStart: req.actualStart, actualEnd: req.actualEnd,
          status: req.status === 'COMPLETED' ? 'COMPLETED' : req.status === 'IN_PROGRESS' ? 'IN_PROGRESS' : req.status === 'CANCELLED' ? 'CANCELLED' : 'SCHEDULED',
        },
        update: { roomId: req.roomId, scheduledStart: req.scheduledStart, scheduledEnd: req.scheduledEnd, actualStart: req.actualStart, actualEnd: req.actualEnd, status: req.status === 'COMPLETED' ? 'COMPLETED' : req.status === 'IN_PROGRESS' ? 'IN_PROGRESS' : req.status === 'CANCELLED' ? 'CANCELLED' : 'SCHEDULED' },
      })
    }

    // ── Vital Sign Records ─────────────────────────────────────────────────────────────

    const vitalTemp = [36.5, 36.8, 37.1, 36.3, 37.4, 36.6, 36.9, 37.2, 36.4, 37.0, 36.7, 37.5, 36.2, 36.8, 37.3, 36.5, 37.6, 36.1, 36.9, 37.0]
    const vitalPulse = [72, 78, 88, 68, 92, 75, 80, 85, 70, 76, 82, 95, 65, 74, 90, 72, 98, 62, 78, 84]
    const vitalResp = [18, 20, 22, 16, 24, 18, 19, 21, 17, 18, 20, 26, 16, 18, 23, 18, 25, 15, 19, 20]
    const vitalSysBp = [120, 130, 145, 118, 150, 125, 135, 140, 115, 128, 138, 155, 110, 122, 148, 126, 160, 108, 132, 142]
    const vitalDiaBp = [80, 85, 92, 75, 95, 82, 88, 90, 72, 84, 86, 98, 70, 78, 94, 82, 100, 68, 85, 90]
    const vitalSpo2 = [98, 97, 95, 99, 93, 97, 96, 94, 98, 97, 95, 92, 99, 98, 93, 97, 91, 99, 96, 95]
    const vitalPain = [0, 2, 3, 1, 5, 1, 2, 4, 0, 1, 3, 6, 0, 2, 5, 1, 7, 0, 2, 3]
    const vitalNotes = ['生命体征平稳', '体温略高，继续观察', '心率偏快，注意休息', '血压控制良好', '呼吸急促，已通知医生', '血压偏高，调整用药', '血氧偏低，给予吸氧', '疼痛评分升高，关注主诉', '各项指标正常', '夜间查房记录']
    const vitalRecorders = ['邱护士', '王护士', '李护士', '赵护士', '张护士']

    for (let index = 0; index < 20; index += 1) {
      const admissionId = `ip-demo-${(index % 16) + 1}`
      await prisma.vitalSignRecord.upsert({
        where: { id: `vital-demo-${index + 1}` },
        create: {
          id: `vital-demo-${index + 1}`, admissionId,
          recordedAt: todayAt(-Math.floor(index / 4), [6, 10, 14, 22][index % 4]),
          temperature: vitalTemp[index], pulse: vitalPulse[index], respiration: vitalResp[index],
          systolicBp: vitalSysBp[index], diastolicBp: vitalDiaBp[index], oxygenSaturation: vitalSpo2[index],
          painScore: vitalPain[index], notes: vitalNotes[index % vitalNotes.length], recordedBy: vitalRecorders[index % vitalRecorders.length],
        },
        update: {
          temperature: vitalTemp[index], pulse: vitalPulse[index], respiration: vitalResp[index],
          systolicBp: vitalSysBp[index], diastolicBp: vitalDiaBp[index], oxygenSaturation: vitalSpo2[index],
          painScore: vitalPain[index], notes: vitalNotes[index % vitalNotes.length],
        },
      })
    }

    // ── Nursing Assessments ────────────────────────────────────────────────────────────

    const nursingAssessments = [
      { id: 'nass-demo-1', admissionId: 'ip-demo-1', assessmentType: 'ADMISSION', score: null, level: null, findings: '患者入院评估：神志清楚，生命体征平稳，自理能力良好。', measures: '常规护理，二级护理。' },
      { id: 'nass-demo-2', admissionId: 'ip-demo-2', assessmentType: 'FALL_RISK', score: 15, level: 'MEDIUM', findings: '跌倒风险评估：年龄>65岁，服用镇静药物。', measures: '床栏保护，协助下床活动，地面保持干燥。' },
      { id: 'nass-demo-3', admissionId: 'ip-demo-3', assessmentType: 'PRESSURE_ULCER', score: 12, level: 'LOW', findings: '压疮风险评估：Braden评分12分，皮肤完整。', measures: '每2小时翻身一次，使用气垫床。' },
      { id: 'nass-demo-4', admissionId: 'ip-demo-4', assessmentType: 'DAILY', score: null, level: null, findings: '日常护理评估：切口敷料干燥，引流管通畅，无发热。', measures: '继续当前护理方案，观察切口情况。' },
      { id: 'nass-demo-5', admissionId: 'ip-demo-5', assessmentType: 'ADMISSION', score: null, level: null, findings: '入院评估：胸闷气促，双下肢轻度水肿。', measures: '心电监护，低盐饮食，记录出入量。' },
      { id: 'nass-demo-6', admissionId: 'ip-demo-6', assessmentType: 'FALL_RISK', score: 22, level: 'HIGH', findings: '跌倒高风险：活动受限，头晕乏力，夜间频繁如厕。', measures: '床旁放置便器，夜间留灯，专人陪护。' },
      { id: 'nass-demo-7', admissionId: 'ip-demo-7', assessmentType: 'DAILY', score: null, level: null, findings: '日常查房：左侧肢体肌力3级，言语含糊较前好转。', measures: '康复训练，防误吸护理。' },
      { id: 'nass-demo-8', admissionId: 'ip-demo-8', assessmentType: 'PRESSURE_ULCER', score: 18, level: 'HIGH', findings: '压疮高风险：Braden评分18分，术后制动，营养状态差。', measures: '每1小时翻身，加强营养支持，使用泡沫敷料保护骨突处。' },
    ]

    for (const assessment of nursingAssessments) {
      await prisma.nursingAssessment.upsert({
        where: { id: assessment.id },
        create: { id: assessment.id, admissionId: assessment.admissionId, assessmentType: assessment.assessmentType, score: assessment.score, level: assessment.level, findings: assessment.findings, measures: assessment.measures, assessedBy: '邱护士', assessedAt: todayAt(-1, 10) },
        update: { assessmentType: assessment.assessmentType, score: assessment.score, level: assessment.level, findings: assessment.findings, measures: assessment.measures },
      })
    }

    // ── Nursing Executions ─────────────────────────────────────────────────────────────

    const nursingExecutions = [
      { id: 'nexec-demo-1', admissionId: 'ip-demo-1', taskType: 'VITAL_SIGNS', description: '测量体温、脉搏、血压', scheduledAt: todayAt(0, 6), executedAt: todayAt(0, 6, 10), status: 'EXECUTED' },
      { id: 'nexec-demo-2', admissionId: 'ip-demo-1', taskType: 'INFUSION', description: '头孢曲松2g静脉滴注', scheduledAt: todayAt(0, 9), executedAt: todayAt(0, 9, 5), status: 'EXECUTED' },
      { id: 'nexec-demo-3', admissionId: 'ip-demo-2', taskType: 'MEDICATION', description: '口服降压药发放', scheduledAt: todayAt(0, 8), executedAt: todayAt(0, 8, 15), status: 'EXECUTED' },
      { id: 'nexec-demo-4', admissionId: 'ip-demo-3', taskType: 'DRESSING', description: '膝关节切口换药', scheduledAt: todayAt(0, 10), executedAt: null, status: 'PENDING' },
      { id: 'nexec-demo-5', admissionId: 'ip-demo-4', taskType: 'INFUSION', description: '补液治疗1000ml', scheduledAt: todayAt(0, 7), executedAt: todayAt(0, 7, 20), status: 'EXECUTED' },
      { id: 'nexec-demo-6', admissionId: 'ip-demo-5', taskType: 'VITAL_SIGNS', description: '心电监护巡检', scheduledAt: todayAt(0, 14), executedAt: null, status: 'PENDING' },
      { id: 'nexec-demo-7', admissionId: 'ip-demo-6', taskType: 'MEDICATION', description: '雾化吸入治疗', scheduledAt: todayAt(0, 10), executedAt: null, status: 'PENDING' },
      { id: 'nexec-demo-8', admissionId: 'ip-demo-7', taskType: 'DRESSING', description: '骨折术后切口换药', scheduledAt: todayAt(0, 9), executedAt: todayAt(0, 9, 30), status: 'EXECUTED' },
      { id: 'nexec-demo-9', admissionId: 'ip-demo-8', taskType: 'INFUSION', description: '胰岛素皮下注射', scheduledAt: todayAt(0, 17), executedAt: null, status: 'PENDING' },
      { id: 'nexec-demo-10', admissionId: 'ip-demo-9', taskType: 'VITAL_SIGNS', description: '血压监测并记录', scheduledAt: todayAt(0, 12), executedAt: todayAt(0, 12, 5), status: 'EXECUTED' },
      { id: 'nexec-demo-11', admissionId: 'ip-demo-10', taskType: 'MEDICATION', description: '口服药发放（甲状腺素）', scheduledAt: todayAt(0, 7, 30), executedAt: todayAt(0, 7, 35), status: 'EXECUTED' },
      { id: 'nexec-demo-12', admissionId: 'ip-demo-11', taskType: 'INFUSION', description: '利尿剂静脉注射', scheduledAt: todayAt(0, 15), executedAt: null, status: 'SKIPPED' },
    ]

    for (const exec of nursingExecutions) {
      await prisma.nursingExecution.upsert({
        where: { id: exec.id },
        create: { id: exec.id, admissionId: exec.admissionId, orderId: `ip-order-${exec.admissionId.replace('ip-demo-', '')}`, taskType: exec.taskType, description: exec.description, scheduledAt: exec.scheduledAt, executedAt: exec.executedAt, status: exec.status, executedBy: '邱护士', notes: exec.status === 'SKIPPED' ? '患者暂不在病房' : null },
        update: { taskType: exec.taskType, description: exec.description, scheduledAt: exec.scheduledAt, executedAt: exec.executedAt, status: exec.status },
      })
    }

    // ── Consumable Catalog ─────────────────────────────────────────────────────────────

    const consumableCatalog = [
      { id: 'cons-gauze', code: 'CON001', name: '医用纱布块', category: 'DRESSING' as const, spec: '10cm*10cm*8层', unit: '片', unitPrice: 0.80, minStock: 500 },
      { id: 'cons-syringe', code: 'CON002', name: '一次性注射器', category: 'DISPOSABLE' as const, spec: '5ml', unit: '支', unitPrice: 0.45, minStock: 1000 },
      { id: 'cons-gloves', code: 'CON003', name: '一次性医用乳胶手套', category: 'DISPOSABLE' as const, spec: 'M码', unit: '双', unitPrice: 0.60, minStock: 2000 },
      { id: 'cons-bandage', code: 'CON004', name: '弹性绷带', category: 'DRESSING' as const, spec: '7.5cm*4.5m', unit: '卷', unitPrice: 3.50, minStock: 200 },
      { id: 'cons-needle', code: 'CON005', name: '采血针', category: 'DISPOSABLE' as const, spec: '22G', unit: '支', unitPrice: 0.30, minStock: 2000 },
      { id: 'cons-catheter', code: 'CON006', name: '导尿管', category: 'DISPOSABLE' as const, spec: 'Fr16', unit: '根', unitPrice: 12.00, minStock: 100 },
      { id: 'cons-mask', code: 'CON007', name: '医用外科口罩', category: 'DISPOSABLE' as const, spec: '三层', unit: '只', unitPrice: 0.50, minStock: 3000 },
      { id: 'cons-alcohol', code: 'CON008', name: '碘伏棉球', category: 'STERILIZATION' as const, spec: '50粒/瓶', unit: '瓶', unitPrice: 8.50, minStock: 150 },
      { id: 'cons-tube', code: 'CON009', name: '一次性输液器', category: 'DISPOSABLE' as const, spec: '带针头', unit: '套', unitPrice: 1.80, minStock: 1500 },
      { id: 'cons-cotton', code: 'CON010', name: '医用棉签', category: 'DRESSING' as const, spec: '10cm*50支/包', unit: '包', unitPrice: 2.50, minStock: 300 },
    ]

    for (const item of consumableCatalog) {
      await prisma.consumableCatalog.upsert({
        where: { code: item.code },
        create: { id: item.id, code: item.code, name: item.name, category: item.category, spec: item.spec, unit: item.unit, unitPrice: item.unitPrice, minStock: item.minStock },
        update: { name: item.name, category: item.category, spec: item.spec, unit: item.unit, unitPrice: item.unitPrice, minStock: item.minStock, isActive: true },
      })
    }

    // ── Consumable Batches ─────────────────────────────────────────────────────────────

    const consumableBatchQuantities = [2000, 5000, 8000, 1000, 3000, 500, 6000, 800, 4000, 1500]
    const consumableBatchCosts = [0.60, 0.35, 0.45, 2.80, 0.22, 9.50, 0.38, 6.80, 1.40, 2.00]

    for (let index = 0; index < consumableCatalog.length; index += 1) {
      const item = consumableCatalog[index]
      await prisma.consumableBatch.upsert({
        where: { catalogId_batchNo: { catalogId: item.id, batchNo: `CBATCH2026${String(index + 1).padStart(3, '0')}` } },
        create: { id: `cons-batch-${index + 1}`, catalogId: item.id, batchNo: `CBATCH2026${String(index + 1).padStart(3, '0')}`, quantity: consumableBatchQuantities[index], expiresAt: todayAt(index < 5 ? 180 : 365, 0), unitCost: consumableBatchCosts[index], supplierName: '演示供应商' },
        update: { quantity: consumableBatchQuantities[index], expiresAt: todayAt(index < 5 ? 180 : 365, 0), unitCost: consumableBatchCosts[index], isActive: true },
      })
    }

    // ── Shift Reports ──────────────────────────────────────────────────────────────────

    const shiftReports = [
      { id: 'shift-demo-1', wardId: 'ward-ward-a', shiftType: 'DAY', reportDate: todayAt(-1, 0), content: '白班交班：新入院2人，出院1人，在院患者18人。3床患者体温37.8度，已通知医生。其余患者病情平稳。', patientCount: 18, abnormalNotes: '3床体温偏高，需持续监测。', handoverTo: '王护士' },
      { id: 'shift-demo-2', wardId: 'ward-ward-a', shiftType: 'NIGHT', reportDate: todayAt(-1, 0), content: '夜班交班：夜间巡视4次，患者安静。5床夜间血压偏高，已遵医嘱加服降压药。22床术后引流液量正常。', patientCount: 18, abnormalNotes: '5床血压波动，关注晨起血压。', handoverTo: '邱护士' },
      { id: 'shift-demo-3', wardId: 'ward-ward-b', shiftType: 'DAY', reportDate: todayAt(-1, 0), content: '白班交班：手术患者3人，术后生命体征平稳。新入院1人，完成入院评估和健康宣教。', patientCount: 15, abnormalNotes: '无特殊异常。', handoverTo: '李护士' },
      { id: 'shift-demo-4', wardId: 'ward-ward-c', shiftType: 'DAY', reportDate: todayAt(0, 0), content: '白班交班：在院患儿12人，其中发热患儿3人，最高体温38.5度，已物理降温。雾化治疗6人次。', patientCount: 12, abnormalNotes: '2床和5床患儿仍发热，注意观察精神状态。', handoverTo: '赵护士' },
    ]

    for (const report of shiftReports) {
      await prisma.shiftReport.upsert({
        where: { id: report.id },
        create: { id: report.id, wardId: report.wardId, shiftType: report.shiftType, reportDate: report.reportDate, content: report.content, patientCount: report.patientCount, abnormalNotes: report.abnormalNotes, handoverTo: report.handoverTo, createdBy: '邱护士' },
        update: { shiftType: report.shiftType, content: report.content, patientCount: report.patientCount, abnormalNotes: report.abnormalNotes, handoverTo: report.handoverTo },
      })
    }

    console.log('Seed completed:', {
      campuses: outpatientSeedPlan.campuses.length,
      departments: outpatientSeedPlan.departments.length,
      doctors: outpatientSeedPlan.doctors.length,
      patients: outpatientSeedPlan.patientUsers.length,
      schedules: scheduleDoctors.length * 7,
      slots: scheduleDoctors.length * 7 * 4,
      registrations: 100,
      encounters: 60,
      prescriptions: 50,
      drugs: outpatientSeedPlan.drugs.length,
      labItems: hisExpansionSeedPlan.labItems.length,
      imagingItems: hisExpansionSeedPlan.imagingItems.length,
      labRequests: 20,
      imagingRequests: 20,
      inpatientAdmissions: 16,
      auditLogs: 80,
      clinicalTemplates: hisExpansionSeedPlan.clinicalTemplates.length,
      stockBatches: hisExpansionSeedPlan.stockBatches.length,
      insuranceSettlements: 10,
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
