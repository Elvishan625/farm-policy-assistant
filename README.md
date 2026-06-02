# 高标准农田AI政策助手 🌾

基于 Dify + DeepSeek 的高标准农田政策智能问答应用。前端为轻量单页应用，支持多轮对话和 PDF/Word 文件上传分析。

## 功能特性

- 🔍 **政策智能问答** — 基于高标准农田政策库精准回答
- 📄 **文件上传分析** — 支持 PDF / Word 文件，基于内容问答
- 💬 **多轮对话** — 持续深入交流，保留对话上下文
- 🎨 **农业风格 UI** — 绿色主题，悬浮球交互
- ⚡ **轻量部署** — 纯静态前端，一键部署到 Vercel / Netlify

## 项目结构

```
农田AI助手/
├── index.html          # 前端主页面
├── style.css           # 样式文件
├── app.js              # 交互逻辑 & Dify API 调用
├── policy-assistant.yml # Dify 工作流 DSL（可导入）
└── README.md           # 本文件
```

## 快速开始

### 1. Dify 工作流部署

1. 登录 [Dify 平台](https://cloud.dify.ai)（或自部署实例）
2. 进入「工作室」→「导入应用」→ 上传 `policy-assistant.yml`
3. 导入后，在「知识库」中创建名为 **高标准农田政策库** 的知识库，上传相关政策文档
4. 在工作流编辑器中：
   - 点击「知识检索」节点 → 关联「高标准农田政策库」
   - 确认 LLM 节点使用的模型提供商（默认 deepseek-chat）
5. 点击「发布」，在「API 访问」页面获取 **API Key**

### 2. 前端部署

#### 方式一：Vercel（推荐）

1. Fork 或上传本项目到 GitHub
2. 打开 [Vercel](https://vercel.com)，导入该仓库
3. 在项目设置中添加环境变量：
   - `DIFY_API_BASE` = `https://api.dify.ai/v1`（或你的 Dify 实例地址）
   - `DIFY_API_KEY` = 你的 Dify App API Key
4. 部署即可，Vercel 会自动分配 `*.vercel.app` 域名

#### 方式二：Netlify

1. 上传项目到 GitHub
2. 在 [Netlify](https://netlify.com) 中导入仓库
3. 在 Site settings → Environment variables 中添加：
   - `DIFY_API_BASE`
   - `DIFY_API_KEY`
4. 触发部署，获得 `*.netlify.app` 域名

#### 方式三：手动部署

1. 修改 `index.html` 底部的 `window.ENV` 配置，替换 API Key：
   ```js
   window.ENV = {
     DIFY_API_BASE: 'https://api.dify.ai/v1',
     DIFY_API_KEY: 'app-xxxxxxxxxxxxx'  // 替换为你的 Key
   };
   ```
2. 将所有文件上传到任意静态服务器即可

### 3. 注入环境变量（Vercel / Netlify）

由于前端通过 `window.ENV` 读取配置，部署时需要注入环境变量。两种方式：

**方式A**：在 `index.html` 的 `<head>` 中使用占位符，部署时替换（适用于 CI）

**方式B**：修改 `app.js`，改为构建时注入：
```js
const API_BASE = '{{DIFY_API_BASE}}' || 'https://api.dify.ai/v1';
const API_KEY = '{{DIFY_API_KEY}}' || '';
```
然后在 Vercel/Netlify 构建命令中使用 `sed` 替换占位符。

**推荐**：直接在 `index.html` 中配置好 `window.ENV`，将仓库设为私有，避免 API Key 泄露。也可使用 Vercel Edge Functions 或 Netlify Functions 做代理隐藏 Key。

## API 调用说明

| 接口 | 方法 | 路径 | 说明 |
|------|------|------|------|
| 文件上传 | POST | `/v1/files/upload` | 上传文件，获取 upload_file_id |
| 对话消息 | POST | `/v1/chat-messages` | 发送对话，支持文件和 conversation_id |

- **认证方式**：Header `Authorization: Bearer ${API_KEY}`
- **响应模式**：`blocking`（同步返回完整回复）

## 技术栈

- **后端**：Dify 工作流 + 知识库 + DeepSeek LLM
- **前端**：纯 HTML/CSS/JS
- **Markdown 渲染**：marked.js (CDN)
- **部署**：Vercel / Netlify（静态托管）

## 注意事项

1. 请勿将 API Key 提交到公开仓库，建议通过环境变量注入
2. Dify 文件上传大小限制默认为 15MB
3. 知识库需要提前在 Dify 中创建并关联到工作流的「知识检索」节点
4. 如需自定义欢迎语和推荐问题，可在 Dify 工作流的「发布」设置中修改

## License

MIT
