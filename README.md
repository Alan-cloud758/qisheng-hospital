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

## 演示账号

所有演示账号密码均为：

```text
Qisheng@123
```

- `admin`：平台管理员。
- `doctor_chen`：医生工作台。
- `cashier_lin`：收费工作台。
- `pharmacy_wu`：药房工作台。
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
