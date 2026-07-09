# 启胜医院平台骨架设计

## 背景

启胜医院是一个新建的医院医疗系统项目。项目工程形态类比 `美贸商城`，但不复制商城业务代码。新系统采用干净的新仓库，从医院业务模型出发搭建后端、Web 管理端、小程序患者端和文档部署结构。

参考项目 `美贸商城` 的技术栈与组织方式：

- 后端：Express 5、TypeScript、Prisma、MySQL/MariaDB、Redis、Zod、Vitest、Supertest
- Web 前端：Vue 3、Vite、Element Plus、Pinia、Vue Router、Vitest、Vue Test Utils
- 小程序：uni-app、Vue、Pinia、TypeScript、Vitest、vue-tsc
- 根目录脚本聚合三端命令，但不使用根级 npm workspace
- Git 远端采用 GitHub `origin` 和 Gitee `gitee` 双远端

默认新项目信息：

- 项目目录：`C:\Users\32086\Desktop\启胜医院`
- npm 包名：`qisheng-hospital`
- GitHub：`https://github.com/Alan-cloud758/qisheng-hospital.git`
- Gitee：`https://gitee.com/li-zhuo-xuan/qisheng-hospital.git`

## 总体目标

第一期建设“完整平台骨架”，而不是一次性写完所有医院深水区业务。完成后系统应能启动、登录、展示基础数据，并跑通患者预约挂号到后台查看、医生待就诊、收费模拟订单的闭环。

第一期明确包含：

- 后端 API 服务、健康检查、数据库就绪检查
- Web 管理端登录、角色菜单、基础业务页面
- 小程序患者端首页、科室医生、预约挂号、我的预约
- 用户、角色、权限、组织、科室、医生、患者、排班、号源、挂号、支付等核心模型
- 演示数据与测试框架
- GitHub/Gitee 双远端配置

第一期明确不包含完整医保、住院、LIS、PACS、电子病历质控、真实支付、真实处方流转和第三方医院接口。这些能力在骨架稳定后作为后续模块扩展。

## 架构

项目目录对齐 `美贸商城`：

```text
qisheng-hospital/
  backend/
  frontend/
  miniapp/
  docs/
  deploy/
  package.json
  README.md
```

### 后端

`backend/` 是医院平台 API 服务：

- 使用 Express 5 组织 HTTP 路由
- 使用 Prisma 访问 MySQL/MariaDB
- 使用 Redis 支撑缓存、限流和后续验证码/会话类能力
- 使用 Zod 做请求参数校验
- 使用 Helmet、CORS、rate limit 等基础安全中间件
- 使用 Vitest + Supertest 做接口测试

后端路由按使用场景拆分：

- `/api/auth/*`：登录、当前用户、退出
- `/api/admin/*`：管理员后台
- `/api/staff/*`：医生、护士、收费、药房等员工工作台
- `/api/mini/*`：小程序患者端
- `/api/public/*`：公开科室、医生、公告
- `/healthz`：进程存活检查
- `/readyz`：数据库就绪检查

### Web 管理端

`frontend/` 是医院 Web 管理端：

- Vue 3 + Vite
- Element Plus 作为管理后台 UI 组件库
- Pinia 管理登录用户、权限菜单、基础字典和页面状态
- Vue Router 做后台、医生工作台、收费工作台等页面分区

界面风格应偏业务系统：清晰、稳定、信息密度适中，不做营销页式布局。

### 小程序

`miniapp/` 是患者端：

- uni-app + Vue + Pinia
- 支持 H5 和微信小程序构建
- 第一阶段服务预约挂号闭环

## 业务模块

第一期模块边界如下：

### 系统与权限

- 账号
- 登录鉴权
- 角色
- 权限
- 菜单
- 操作审计

角色至少包含：

- 平台管理员
- 医院管理员
- 医生
- 护士
- 收费员
- 药房人员
- 患者

### 医院组织

- 院区
- 科室
- 诊室
- 医生档案
- 医生职称
- 医生执业信息
- 医生擅长方向

### 患者中心

- 患者档案
- 就诊人
- 联系方式
- 基础健康信息
- 历史预约
- 历史就诊记录入口

### 排班挂号

- 医生排班
- 号源
- 预约挂号
- 取消预约
- 挂号状态流转

核心状态建议：

- `AVAILABLE`：可预约
- `LOCKED`：短暂锁定
- `BOOKED`：已预约
- `CANCELLED`：已取消
- `CHECKED_IN`：已签到
- `IN_VISIT`：就诊中
- `COMPLETED`：已完成
- `NO_SHOW`：爽约

### 门诊就诊

- 就诊记录
- 病历摘要
- 诊断
- 医嘱雏形
- 处方入口

第一期只实现基础结构和医生待就诊列表，不做复杂电子病历质控。

### 收费支付

- 费用项目
- 支付订单
- 模拟支付
- 支付状态展示

第一期不接真实支付渠道。

### 药房处方

- 药品目录
- 处方单
- 处方明细
- 审核/发药状态预留

第一期以模型和页面入口为主，后续补完整处方流转。

### 运营后台

- 仪表盘
- 数据概览
- 公告
- 基础配置
- 字典维护

## 核心数据模型

第一期 Prisma 模型围绕以下实体建立：

- `User`
- `Role`
- `Permission`
- `UserRole`
- `RolePermission`
- `Menu`
- `AuditLog`
- `HospitalCampus`
- `Department`
- `ClinicRoom`
- `DoctorProfile`
- `PatientProfile`
- `VisitMember`
- `DoctorSchedule`
- `AppointmentSlot`
- `Registration`
- `Encounter`
- `MedicalRecord`
- `Diagnosis`
- `FeeItem`
- `PaymentOrder`
- `DrugCatalog`
- `Prescription`
- `PrescriptionItem`
- `Announcement`

关键关系：

- 一个用户可以拥有多个角色
- 一个医生档案关联一个员工账号，并归属科室
- 一个患者账号可以管理多个就诊人
- 一个医生排班生成多个号源
- 一个挂号记录关联患者、就诊人、医生、科室、号源和支付订单
- 一个就诊记录由挂号记录产生，并关联病历、诊断、处方
- 所有关键写操作进入审计日志

## 页面结构

### Web 管理端

第一期页面：

- 登录页
- 平台总览
- 系统管理：账号、角色、权限、菜单、审计日志
- 医院组织：院区、科室、诊室、医生档案
- 患者中心：患者档案、就诊人、历史就诊入口
- 排班挂号：排班维护、号源管理、预约列表
- 门诊工作台：医生看诊列表、病历摘要、诊断、处方入口
- 收费工作台：待支付订单、模拟收款、支付记录
- 药房工作台：处方列表、审核/发药状态预留
- 运营配置：公告、费用项目、药品目录、基础字典

### 小程序

第一期页面：

- 首页
- 科室列表
- 科室详情
- 医生列表
- 医生详情
- 预约挂号确认
- 我的预约
- 就诊人管理
- 个人资料
- 支付结果

## 演示数据

第一期种子数据应包含：

- 管理员账号
- 医生账号
- 收费员账号
- 药房账号
- 患者账号
- 2 个院区
- 多个科室和诊室
- 多名医生档案
- 一周医生排班和号源
- 示例患者和就诊人
- 示例预约挂号记录
- 示例费用项目
- 示例支付订单
- 示例药品目录
- 示例处方草稿
- 仪表盘统计需要的数据

## 测试策略

### 后端

使用 Vitest + Supertest，覆盖：

- 健康检查
- 登录鉴权
- 权限菜单
- 科室医生查询
- 排班号源查询
- 预约挂号
- 取消预约
- 模拟支付状态
- 后台基础资料维护

### Web 前端

使用 Vitest + Vue Test Utils，覆盖：

- 路由守卫
- 登录状态
- 菜单渲染
- 平台总览渲染
- 科室/医生/排班页面基础渲染
- 关键 Pinia store

### 小程序

使用 Vitest，覆盖：

- 预约流程状态
- 就诊人选择
- 号源展示
- API 封装
- 页面工具函数

### 验证命令

根目录聚合命令：

```bash
npm run backend:test
npm run frontend:test
npm run miniapp:typecheck
npm run test
npm run lint
npm run build
```

各端目录命令对齐 `美贸商城` 的使用习惯：

```bash
cd backend
npm run dev
npm run build
npm run test
npm run lint
npm run db:push
npm run db:seed

cd ../frontend
npm run dev
npm run build
npm run test
npm run lint

cd ../miniapp
npm run dev:h5
npm run dev:mp-weixin
npm run build:h5
npm run build:mp-weixin
npm run typecheck
```

## 交付标准

第一期完成时应满足：

- 新仓库初始化完成
- GitHub/Gitee 双远端配置完成
- 三端工程可安装依赖
- 后端可启动并提供健康检查
- 数据库模型可推送
- 种子数据可导入
- Web 管理端可登录并展示菜单和基础页面
- 小程序可进入患者端流程
- 患者能选择科室、医生和号源完成预约
- 后台能查看预约
- 医生能看到待就诊
- 收费员能看到模拟支付订单
- 核心测试通过

## 后续扩展路线

骨架稳定后按优先级扩展：

1. 完整门诊电子病历
2. 处方审核与药房发药
3. 检验检查申请与结果
4. 住院管理
5. 医保结算
6. 真实支付
7. 微信订阅消息
8. 影像/PACS 对接
9. LIS 对接
10. 数据分析与院长驾驶舱

