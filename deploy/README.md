# 启胜医院部署说明

## 基础服务

- Node.js 20 或更新版本。
- MySQL 或 MariaDB。
- Redis 可选，第一阶段默认可关闭。

## 后端环境变量

后端环境变量位于 `backend/.env`，可从 `backend/.env.example` 复制：

```dotenv
NODE_ENV=production
PORT=3000
AUTH_SECRET=replace-with-at-least-32-characters
DATABASE_URL=mysql://user:password@host:3306/qisheng_hospital
REDIS_ENABLED=false
REDIS_URL=redis://localhost:6379
```

## 数据库初始化

```bash
cd backend
npm run db:push
npm run db:seed
```

## 构建

```bash
npm run build
```

构建产物：

- 后端：`backend/dist/`
- Web 管理端：`frontend/dist/`
- 小程序：`miniapp/unpackage/`

## 运行

```bash
cd backend
npm run start
```

生产环境需要将 Web 管理端静态文件交给 Nginx、对象存储或其他静态站点服务，并把 `/api` 反向代理到后端服务。
