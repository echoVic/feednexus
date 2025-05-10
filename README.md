# FeedNexus

一个基于 Next.js 和 RSSHub 的 Web RSS 阅读器，参考 Feedly 设计，支持用户注册、订阅管理、文章阅读和收藏等功能。

## 功能特点

- 响应式设计，支持桌面和移动设备
- 用户注册和登录系统
- RSS 源分组和文件夹管理
- 支持添加自定义 RSS 源和 RSSHub 路径
- 文章列表和详情阅读
- 收藏和标记已读功能
- 明暗主题切换（即将支持）

## 技术栈

- **前端框架**：Next.js 15 (App Router)
- **样式**：Tailwind CSS + shadcn/ui 组件库
- **状态管理**：React Hooks
- **认证**：NextAuth.js
- **数据库**：Prisma ORM + SQLite（可扩展到 PostgreSQL）
- **RSS 解析**：RSSHub 库
- **部署**：Vercel

## 本地开发

### 环境要求

- Node.js 18+
- npm 或 yarn

### 安装步骤

1. 克隆项目

```bash
git clone <repository-url>
cd rss-reader
```

2. 安装依赖

```bash
npm install
```

3. 创建 `.env` 文件并添加以下内容

```
DATABASE_URL="file:./dev.db"
NEXTAUTH_URL=http://localhost:3000
NEXTAUTH_SECRET=your-nextauth-secret
```

4. 初始化数据库和示例数据

```bash
npm run setup
```

5. 启动开发服务器

```bash
npm run dev
```

6. 访问 [http://localhost:3000](http://localhost:3000) 查看应用

### 测试账号

- 邮箱：test@example.com
- 密码：password123

## 部署到 Vercel

1. 在 Vercel 上创建新项目并关联 Git 仓库

2. 添加环境变量：
   - `DATABASE_URL`：Vercel Postgres 或其他数据库 URL
   - `NEXTAUTH_URL`：部署后的网站 URL
   - `NEXTAUTH_SECRET`：用于加密会话的密钥

3. 部署项目

4. 运行数据库迁移和种子脚本（可以通过 Vercel CLI 或在部署后的环境中执行）

## 项目结构

```
/src
  /app                 # Next.js App Router 页面
    /(auth)            # 认证相关页面
    /(dashboard)       # 仪表盘和阅读器页面
    /api               # API 路由
  /components          # React 组件
    /auth              # 认证相关组件
    /dashboard         # 仪表盘和阅读器组件
    /ui                # UI 组件 (shadcn/ui)
  /lib                 # 工具函数和库
    /rss              # RSS 解析和处理
  /types               # TypeScript 类型定义
/prisma                # Prisma 模型和迁移
```

## 许可证

MIT
