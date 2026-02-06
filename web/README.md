# EndFieldBuildSim Web 应用

终结阵线（Endfield）游戏装备与物品数据库的交互式 Web 应用程序。

## 🚀 快速开始

### 开发环境运行

```bash
cd web
npm install
npm run dev
```

访问：http://localhost:5173/

### 管理界面运行

用于管理自定义物品和配方数据：

```bash
cd web
npm run dev:admin
```

访问：http://localhost:5174/#/admin

详细使用说明请参考 [MANAGE_DATA.md](MANAGE_DATA.md)

### 生产构建

```bash
cd web
npm run build
```

构建文件输出到 `web/dist/` 目录。

---

## 📚 相关文档

- **[README.md](../README.md)** - 主项目指南与数据收集流程
- **[AGENTS.md](../AGENTS.md)** - 开发者指南与代码规范
- **[DEPLOYMENT.md](../DEPLOYMENT.md)** - GitHub Pages 部署指南
- **[WEB_APP_COMPLETION.md](../WEB_APP_COMPLETION.md)** - Web 应用实现报告
- **[MANAGE_DATA.md](MANAGE_DATA.md)** - 自定义数据管理指南

---

## 🎯 核心功能

### 🔍 物品搜索
- **模糊搜索**：使用 Fuse.js 实现的智能搜索
- **实时过滤**：边输入边显示结果
- **254个物品**：65个装置 + 189个材料物品
- **响应式布局**：
  - 手机端：2列网格
  - 平板：3-4列
  - 桌面端：5-6列

### 📋 物品详情
- **完整信息**：名称、类型、子类型、描述
- **大图展示**：高清物品图片，懒加载优化
- **富文本文档**：支持格式化、颜色、对齐方式
- **内联链接**：点击文档中的物品引用直接跳转
- **返回导航**：一键返回搜索页面

### 🛠️ 合成配方（Synthesis Tables）
- **79个配方**：查看物品的合成原料与产出
- **可交互表格**：点击材料物品跳转到详情页
- **配方结构**：
  - 原料区（Material）：需要消耗的物品
  - 产出区（Product）：可以生产的物品

### ⚙️ 装置生产（Device Production）
- **装置专属配方**：65个装置的生产数据
- **生产表格**：展示装置的原料需求与产出
- **效率计算**：根据基础材料计算最优生产方案

### 🧪 制造模拟器（Manufacturing Simulator）
- **基础材料选择器**：选择可用的原始材料
- **可视化面板**：显示材料流转关系
- **生产计划表**：
  - **材料配方表**：中间材料的合成步骤
  - **产品配方表**：目标产品的生产配方
- **数量计算**：自动计算所需材料数量
- **制造时长**：显示生产所需时间

### 🎨 富文本渲染
- **文本块（TextBlock）**：左/中/右对齐
- **粗体与颜色**：支持自定义样式
- **列表**：有序列表与无序列表
- **分隔线**：视觉区域分隔
- **物品引用（Entry）**：内联物品链接，显示数量
- **嵌套结构**：列表内可包含文本块

### 🔧 数据管理（Admin）
- **自定义物品**：新增游戏中未收录的物品
- **编辑配方**：修改现有配方数据
- **数据覆盖**：自定义数据优先于API数据
- **对比显示**：
  - API原始数据（只读）
  - 自定义数据（可编辑）
  - 合并结果（最终显示）
- **视觉标识**：
  - 🟢 新增物品：绿色粗体
  - 🟡 已修改：原值删除线 + 新值粗体
  - ⚪ 原始数据：黑色正常显示

---

## 📁 项目结构

```
web/
├── public/
│   ├── data/                           # JSON 数据文件
│   │   ├── item_lookup.json            # 254个物品目录
│   │   ├── recipe_database.json        # 配方数据库
│   │   ├── item_details/               # 254个物品详情文件
│   │   ├── synthesis_tables/           # 79个合成表
│   │   ├── device_production_tables/   # 65个装置生产表
│   │   └── custom/                      # 自定义数据目录
│   │       ├── items.json              # 自定义物品
│   │       └── recipes.json            # 自定义配方
│   └── placeholder.png                 # 占位图片
│
├── src/
│   ├── components/                     # React 组件
│   │   ├── admin/                      # 管理界面组件
│   │   ├── ui/                         # UI基础组件
│   │   ├── BaseMaterialSelector.tsx   # 基础材料选择器
│   │   ├── DeviceProductionTable.tsx  # 装置生产表
│   │   ├── DocumentRenderer.tsx       # 富文本渲染器
│   │   ├── ItemCard.tsx               # 物品卡片
│   │   ├── ItemImage.tsx              # 懒加载图片
│   │   ├── Layout.tsx                 # 页面布局
│   │   ├── ManufacturingSimulator.tsx # 制造模拟器
│   │   ├── MaterialRecipeTable.tsx    # 材料配方表
│   │   ├── PlanVisualizer.tsx         # 生产计划可视化
│   │   ├── ProductRecipeTable.tsx     # 产品配方表
│   │   └── SynthesisTable.tsx         # 合成表
│   │
│   ├── pages/                          # 路由页面
│   │   ├── AdminPage.tsx              # 管理页面
│   │   ├── DetailPage.tsx             # 物品详情页
│   │   ├── DeviceDetailPage.tsx       # 装置详情页
│   │   ├── NotFoundPage.tsx           # 404页面
│   │   └── SearchPage.tsx             # 搜索页面
│   │
│   ├── types/                          # TypeScript 类型定义
│   │   ├── catalog.ts                 # 目录类型
│   │   ├── detail.ts                  # 详情类型
│   │   ├── document.ts                # 文档块类型
│   │   ├── synthesis.ts               # 合成表类型
│   │   └── index.ts                   # 类型导出
│   │
│   ├── hooks/                          # 自定义 Hooks
│   ├── utils/                          # 工具函数
│   ├── lib/                            # 第三方库配置
│   ├── App.tsx                         # 路由配置
│   ├── main.tsx                        # React 入口
│   └── index.css                       # Tailwind 指令
│
├── server/                             # 开发服务器
│   └── admin-server.ts                # 管理界面后端
│
├── scripts/                            # 构建脚本
│
├── vite.config.ts                      # Vite 配置
├── tailwind.config.js                  # Tailwind 配置
├── tsconfig.json                       # TypeScript 配置
├── package.json                        # 依赖管理
├── README.md                           # 本文档
└── MANAGE_DATA.md                      # 数据管理指南
```

---

## 🛠️ 技术栈

| 类别 | 技术 |
|------|------|
| **框架** | React 19.2 + TypeScript 5.9 |
| **路由** | React Router 7（HashRouter for GitHub Pages） |
| **样式** | Tailwind CSS 4.1 + PostCSS |
| **搜索** | Fuse.js 7.1（模糊搜索） |
| **构建** | Vite 7.2 |
| **后端** | Express 5.2（管理界面） |
| **其他** | class-variance-authority, clsx, tailwind-merge |

---

## 📊 数据统计

- **物品总数**：254个
  - 装置（Device）：65个
  - 材料（Item）：189个
- **合成配方**：79个
- **装置生产配方**：65个
- **自定义数据**：支持无限扩展
- **总数据文件**：398+ 个 JSON 文件

---

## 🎨 设计特性

### 响应式设计
- ✅ 移动端优化（320px+）
- ✅ 平板适配（768px+）
- ✅ 桌面端优化（1024px+）

### 性能优化
- 🚀 图片懒加载（Intersection Observer）
- 🚀 路由代码分割
- 🚀 搜索防抖（Fuse.js）
- 🚀 Placeholder 占位图（避免布局抖动）

### 用户体验
- 🎯 实时搜索反馈
- 🎯 面包屑导航
- 🎯 交互式物品链接
- 🎯 清晰的视觉层次
- 🎯 错误提示（404页面）

---

## 🚢 部署指南

### GitHub Pages 自动部署
项目已配置 GitHub Actions 自动部署。每次推送到主分支时：
1. 自动运行构建
2. 部署到 GitHub Pages
3. 访问：`https://<username>.github.io/EndFieldBuildSim/`

详细部署说明请参考 [DEPLOYMENT.md](../DEPLOYMENT.md)

---

## 📝 开发说明

### 命令速查

| 命令 | 说明 |
|------|------|
| `npm run dev` | 启动开发服务器（用户界面） |
| `npm run dev:admin` | 启动管理界面（用户界面 + 管理后端） |
| `npm run build` | 生产构建 |
| `npm run preview` | 预览构建结果 |
| `npm run lint` | 运行 ESLint 检查 |

### 添加新功能

1. **新增组件**：在 `src/components/` 创建 `.tsx` 文件
2. **新增页面**：在 `src/pages/` 创建路由页面
3. **新增类型**：在 `src/types/` 定义 TypeScript 类型
4. **更新路由**：在 `App.tsx` 添加路由配置

### 代码规范

- **TypeScript**：严格类型检查
- **React**：函数式组件 + Hooks
- **样式**：Tailwind CSS 优先
- **命名**：
  - 组件：`PascalCase`
  - 函数：`camelCase`
  - 文件：与组件名一致

---

## 🐛 已知问题

### 图片加载
- 部分物品图片可能缺失（显示 placeholder）
- 外部图片链接可能受网络影响

### 浏览器兼容
- 推荐使用现代浏览器（Chrome/Firefox/Safari 最新版）
- IE 不支持

---

## 📄 许可证

本项目为数据收集与展示工具，数据来源于终结阵线（Endfield）官方。仅供学习交流使用。

---

## 🙏 致谢

- **终结阵线官方**：提供游戏数据 API
- **Zonai API**：数据来源
- **React 生态系统**：优秀的开发工具

---

**最后更新**：2026年2月6日  
**版本**：2.0.0
