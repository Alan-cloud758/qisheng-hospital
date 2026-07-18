import type { Express } from 'express'

const swaggerSpec = {
  openapi: '3.0.0',
  info: {
    title: '启胜医院 HIS API',
    version: '1.0.0',
    description: '启胜医院门诊运营管理平台 API 文档',
  },
  servers: [{ url: '/api', description: 'API Server' }],
  components: {
    securitySchemes: {
      bearerAuth: {
        type: 'http',
        scheme: 'bearer',
        bearerFormat: 'opaque',
      },
    },
  },
  paths: {
    '/auth/login': {
      post: {
        tags: ['认证'],
        summary: '用户登录',
        requestBody: {
          content: { 'application/json': { schema: { type: 'object', properties: { username: { type: 'string' }, password: { type: 'string' } }, required: ['username', 'password'] } } },
        },
        responses: {
          '200': { description: '登录成功，返回 token 和用户信息' },
          '401': { description: '用户名或密码错误' },
        },
      },
    },
    '/auth/logout': {
      post: { tags: ['认证'], summary: '退出登录', security: [{ bearerAuth: [] }], responses: { '200': { description: '已退出' } } },
    },
    '/auth/me': {
      get: { tags: ['认证'], summary: '获取当前用户', security: [{ bearerAuth: [] }], responses: { '200': { description: '当前用户信息' } } },
    },
    '/admin/{resource}': {
      get: { tags: ['管理后台'], summary: '通用资源列表（分页）', security: [{ bearerAuth: [] }], parameters: [{ name: 'resource', in: 'path', required: true, schema: { type: 'string' } }, { name: 'page', in: 'query', schema: { type: 'integer' } }, { name: 'pageSize', in: 'query', schema: { type: 'integer' } }, { name: 'keyword', in: 'query', schema: { type: 'string' } }], responses: { '200': { description: '分页列表' } } },
      post: { tags: ['管理后台'], summary: '创建资源', security: [{ bearerAuth: [] }], parameters: [{ name: 'resource', in: 'path', required: true, schema: { type: 'string' } }], responses: { '201': { description: '创建成功' } } },
    },
    '/admin/{resource}/{id}': {
      put: { tags: ['管理后台'], summary: '更新资源', security: [{ bearerAuth: [] }], parameters: [{ name: 'resource', in: 'path', required: true, schema: { type: 'string' } }, { name: 'id', in: 'path', required: true, schema: { type: 'string' } }], responses: { '200': { description: '更新成功' } } },
    },
    '/staff/doctor/queue': {
      get: { tags: ['医生工作台'], summary: '获取今日接诊队列', security: [{ bearerAuth: [] }], responses: { '200': { description: '接诊列表' } } },
    },
    '/staff/cashier/orders': {
      get: { tags: ['收费工作台'], summary: '获取收费订单列表', security: [{ bearerAuth: [] }], responses: { '200': { description: '订单列表' } } },
    },
    '/staff/pharmacy/prescriptions': {
      get: { tags: ['药房工作台'], summary: '获取待处理处方', security: [{ bearerAuth: [] }], responses: { '200': { description: '处方列表' } } },
    },
    '/staff/lab/requests': {
      get: { tags: ['检验工作台'], summary: '获取检验申请', security: [{ bearerAuth: [] }], responses: { '200': { description: '检验申请列表' } } },
    },
    '/staff/radiology/requests': {
      get: { tags: ['影像工作台'], summary: '获取影像申请', security: [{ bearerAuth: [] }], responses: { '200': { description: '影像申请列表' } } },
    },
    '/public/departments': {
      get: { tags: ['公共接口'], summary: '获取科室列表（无需登录）', responses: { '200': { description: '科室列表' } } },
    },
    '/public/schedules': {
      get: { tags: ['公共接口'], summary: '获取排班信息', parameters: [{ name: 'departmentId', in: 'query', schema: { type: 'string' } }], responses: { '200': { description: '排班列表' } } },
    },
  },
}

export function setupSwagger(app: Express) {
  app.get('/api-docs.json', (_req, res) => {
    res.json(swaggerSpec)
  })

  app.get('/api-docs', (_req, res) => {
    res.setHeader('Content-Type', 'text/html')
    res.send(`<!DOCTYPE html>
<html>
<head>
  <title>启胜医院 HIS API 文档</title>
  <link rel="stylesheet" href="https://unpkg.com/swagger-ui-dist@5/swagger-ui.css">
</head>
<body>
  <div id="swagger-ui"></div>
  <script src="https://unpkg.com/swagger-ui-dist@5/swagger-ui-bundle.js"></script>
  <script>
    SwaggerUIBundle({ url: '/api-docs.json', dom_id: '#swagger-ui', presets: [SwaggerUIBundle.presets.apis] })
  </script>
</body>
</html>`)
  })
}
