# 启胜医院

启胜医院是一个多端医院医疗平台示例项目，工程形态类比 `美贸商城`，但业务模型从医院场景重新设计。

## 项目结构

- `backend/`：Express + Prisma 后端服务，提供鉴权、医院组织、排班挂号、患者端、员工工作台和健康检查 API。
- `frontend/`：Vue 3 + Vite Web 管理端，面向管理员、医生、收费员、药房等工作人员。
- `miniapp/`：uni-app 患者端，面向 H5 和微信小程序。
- `docs/`：设计文档和实施计划。
- `deploy/`：部署说明和环境准备资料。

## 技术栈

- 后端：Express 5、TypeScript、Prisma、MySQL/MariaDB、Redis、Zod、Vitest、Supertest。
- Web 前端：Vue 3、Vite、Element Plus、Pinia、Vue Router、Vitest、Vue Test Utils。
- 小程序：uni-app、Vue、Pinia、TypeScript、Vitest、vue-tsc。

## 远端仓库

- GitHub：`https://github.com/Alan-cloud758/qisheng-hospital.git`
- Gitee：`https://gitee.com/li-zhuo-xuan/qisheng-hospital.git`

## 本地准备

根目录不使用 npm workspace，需要分别进入三端安装依赖：

```bash
cd backend
npm install

cd ../frontend
npm install

cd ../miniapp
npm install
```

Backend local services:

Copy `backend/.env.example` to `backend/.env`, set a real `DATABASE_URL`, then initialize Prisma and seed demo data:

```bash
cd backend
copy .env.example .env
npm run prisma:generate
npm run db:push
npm run db:seed
```

Seeded demo accounts all use password `Qisheng@123`:

- `admin`: platform administrator
- `doctor_chen`: doctor workspace
- `cashier_lin`: cashier workspace
- `pharmacy_wu`: pharmacy workspace
- `patient_demo`: patient miniapp flow

后端复制环境变量：

```bash
cd backend
copy .env.example .env
```

关键环境变量：

- `AUTH_SECRET`：登录令牌签名密钥，至少 32 个字符。
- `DATABASE_URL`：MySQL/MariaDB 连接串。
- `REDIS_ENABLED` / `REDIS_URL`：Redis 缓存、限流和后续会话能力配置。

## 常用命令

根目录聚合命令：

```bash
npm run backend:dev
npm run frontend:dev
npm run miniapp:dev:h5
npm run test
npm run lint
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

Web 前端：

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
npm run typecheck
```

## 启动顺序

1. 启动 MySQL/MariaDB，并确保 `backend/.env` 中的 `DATABASE_URL` 可连接。
2. 在 `backend/` 运行 `npm run db:push` 和 `npm run db:seed` 初始化数据。
3. 在 `backend/` 运行 `npm run dev` 启动 API，默认端口 `3000`。
4. 在 `frontend/` 运行 `npm run dev` 启动 Web 管理端，默认端口 `5173`。
5. 小程序开发时在 `miniapp/` 运行对应的 `dev:*` 命令。

## 第一阶段闭环

第一阶段目标是跑通患者端选择科室、医生和号源完成预约，后台查看预约，医生看到待就诊，收费员看到模拟支付订单的完整平台骨架。
