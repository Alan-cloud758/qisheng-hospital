# 启胜医院

启胜医院是一个多端门诊医疗平台示例项目，包含：

- `backend/`：Express 5 + TypeScript + Prisma + MySQL/MariaDB API。
- `frontend/`：Vue 3 + Vite + Element Plus Web 管理端。
- `miniapp/`：uni-app 患者端，支持 H5 和微信小程序构建。
- `docs/`：设计文档和实施计划。
- `deploy/`：部署说明。

## 已覆盖业务模块

- 系统管理：账号、角色、菜单、审计日志。
- 医院组织：院区、科室、诊室、医生档案。
- 患者中心：患者档案、就诊人、就诊记录。
- 排班挂号：医生排班、号源、预约、签到、取消。
- 医生工作台：待接诊队列、开始接诊、病历、诊断、医嘱、处方、完成就诊。
- 收费工作台：待支付订单、模拟收费、支付记录、费用项目。
- 药房工作台：处方列表、审核、发药、药品目录。
- 运营配置：公告、数据字典、平台总览。
- 患者端：首页、科室、医生号源、预约确认、我的预约、就诊人、就诊记录。

## 本地准备

根目录不使用 npm workspace，需要分别安装依赖：

```bash
cd backend
npm install

cd ../frontend
npm install

cd ../miniapp
npm install
```

复制后端环境变量：

```bash
cd backend
copy .env.example .env
```

设置 `backend/.env` 中的 `DATABASE_URL`，然后初始化数据库和样例数据：

```bash
npm run prisma:generate
npm run db:push
npm run db:seed
```

`db:seed` 是幂等的，可重复运行。它会写入大量门诊演示数据，包括 3 个院区、16 个科室、24 位医生、16 个患者账号、300+ 个号源、30 条挂号、20 条处方、30+ 条审计日志、药品、费用项目、公告和数据字典。
同时也会写入住院、医保、LIS、PACS 扩展演示数据，包括病区床位、住院记录、医保档案与结算、检验申请与报告、影像申请与报告。

## 演示账号

所有演示账号密码均为：

```text
Qisheng@123
```

- `admin`：平台管理员。
- `doctor_chen`：医生工作台。
- `cashier_lin`：收费工作台。
- `pharmacy_wu`：药房工作台。
- `nurse_qiu`：护士工作台、分诊队列与住院流程辅助。
- `lab_tech`：LIS 检验技师工作台。
- `radiology_tech`：PACS 放射技师工作台。
- `inpatient_admin`：住院管理员。
- `patient_demo`：患者端演示账号。

## 完整门诊演示流程

1. 运行 `backend` 数据库初始化和 `db:seed`。
2. 启动后端：`npm run backend:dev`。
3. 启动管理端：`npm run frontend:dev`，使用 `admin` 登录查看各模块数据。
4. 患者端使用 `patient_demo` 自动演示登录，选择科室、医生和号源提交预约。
5. 管理端在“预约签到”中对 `BOOKED` 记录签到。
6. 医生账号在“医生工作台”开始接诊并完成门诊。
7. 收费员账号在“收费工作台”执行模拟收费。
8. 药房账号在“药房工作台”审核处方并发药。
9. 患者端在“我的预约”和“就诊记录”查看状态。

## HIS 扩展示范流程

### 住院入院到出院

1. 使用 `inpatient_admin` 或 `nurse_qiu` 在管理端查看病区、床位和待入院记录。
2. 为演示住院单分配床位，推进到已入院状态。
3. 使用医生账号补充住院医嘱、费用和出院申请。
4. 返回住院管理页面确认出院流程、床位释放和费用汇总。

### 医保模拟结算

1. 使用 `cashier_lin` 打开医保结算相关记录。
2. 查看演示医保档案、医保映射和预结算结果。
3. 执行模拟结算、撤销或退款冲抵流程，核对 provider 日志。

### LIS 检验申请到报告

1. 使用医生账号在门诊或住院场景发起检验申请。
2. 使用 `lab_tech` 查看申请、采样、录入结果并发布报告。
3. 在患者端或管理端查看检验报告状态。

### PACS 影像申请到报告

1. 使用医生账号发起影像检查申请。
2. 使用 `radiology_tech` 完成预约、检查、报告录入和审核。
3. 在管理端查看影像报告以及 mock viewer 链接。

## Mock Provider 说明

- 支付、退款流程使用本地 mock 支付 provider，不接入真实微信、支付宝或银行渠道。
- 医保结算使用本地 mock 医保 provider，不接入真实医保平台。
- LIS 检验流程使用本地 mock LIS provider，不接入真实设备或第三方检验系统。
- PACS 影像流程使用本地 mock PACS provider，不接入真实 DICOM 服务或检查设备。

## 常用命令

根目录聚合命令：

```bash
npm run backend:dev
npm run frontend:dev
npm run miniapp:dev:h5
npm run lint
npm run test
npm run build
```

后端：

```bash
cd backend
npm run dev
npm run build
npm run test
npm run lint
npm run db:push
npm run db:seed
```

Web 管理端：

```bash
cd frontend
npm run dev
npm run build
npm run test
npm run lint
```

小程序：

```bash
cd miniapp
npm run dev:h5
npm run dev:mp-weixin
npm run build:h5
npm run build:mp-weixin
npm run test
npm run typecheck
```
