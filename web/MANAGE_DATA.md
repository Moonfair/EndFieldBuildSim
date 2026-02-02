# 管理自定义数据 - 完整使用指南

## 启动管理界面

```bash
cd web
npm run dev:admin
```

访问管理页面：`http://localhost:5174/#/admin`

## 新功能：API数据与自定义数据对比

### 数据展示逻辑

管理页面现在同时显示：
1. **API原始数据** - 来自 `item_lookup.json` 和 `recipe_database.json`（只读）
2. **自定义数据** - 来自 `custom/` 目录（可编辑）
3. **合并结果** - 自定义数据覆盖API数据时显示

### 显示规则

| 状态 | 名称显示 | 图片显示 | 子类型显示 | 标签 |
|------|---------|---------|-----------|------|
| **纯API数据** | 黑色 | 原路径 | 原类型 | - |
| **自定义修改** | 灰色删除线（API）<br>黑色粗体（自定义） | API路径 / 无修改 | API类型 / 修改 | "已修改" |
| **纯自定义数据** | 绿色粗体 | 自定义路径 | 自定义类型 | "新增" |

## 功能说明

### 1. 物品管理

#### 新增物品
1. 点击 "+ 新增物品" 按钮
2. 仅填写自定义字段：
   - **物品ID** - 唯一标识符
   - **名称** - 物品显示名称
   - **图片路径** - 图片URL
   - **子类型** - 设备或物品类型
3. 点击 "保存"
4. 状态显示："新增"

#### 编辑物品（从API数据编辑）
1. 在列表中找到要编辑的物品（会显示"已修改"标签）
2. 点击 "编辑" 按钮
3. 编辑界面会显示：
   - **灰色文字** = API原始值
   - **黑色文字** = 自定义值（未修改则显示API数据）
4. 修改后保存
5. 列表显示：原始值删除线显示，新值粗体显示

#### 重置到API
1. 点击 "重置" 按钮
2. 确认删除自定义数据
3. 自动恢复使用API数据（不删除API原始文件）

### 2. 配方管理

#### 新增/编辑配方
- 功能与之前相同
- 可动态添加/删除原料和产物

#### 重置到API
1. 点击 "重置" 按钮
2. 确认删除自定义数据
3. 自动恢复使用API数据

## 使用场景示例

### 场景1：覆盖物品名称
1. 访问管理页面，切换到 "Items" 标签
2. 找到物品 "204"（荞花种子）
3. 点击 "编辑"
4. 编辑界面显示：
   - 名称: 灰色文字 "荞花种子" = API原始值
5. 修改为 "测试种子名称"
6. 保存
7. 列表显示：~~荞花种子~~（删除线） + **测试种子名称**（粗体）

### 场景2：新增自定义物品
1. 点击 "+ 新增物品"
2. 物品ID: `custom_test_001`
3. 名称: 实验物品A
4. 保存后显示绿色粗体文字
5. 状态标签："新增"

### 场景3：恢复到API数据
1. 在物品列表找到已修改的条目
2. 点击 "重置"
3. 确认删除自定义数据
4. 列表自动更新为API原始显示

### 场景4：查看所有数据（API + 自定义）
管理页面会显示：
- 所有API数据（无自定义数据时显示原始）
- 自定义数据（覆盖API数据）
- 比较视图（编辑时显示）

## 技术原理

### API端点对比

#### 之前的实现（仅返回自定义数据）
```json
GET /api/custom/items
{
  "items": { "204": {...}, "999": {...} }
}
```

#### 新实现（返回API+自定义对比）
```json
GET /api/custom/items
{
  "items": {
    "204": {
      "api": { "name": "荞花种子", "image": "..." },
      "custom": { "name": "测试种子名称", "image": "..." },
      "isCustom": false
    },
    "custom_001": {
      "api": null,
      "custom": { "name": "实验物品A" },
      "isCustom": true
    }
  },
  "apiData": { /* 完整的API数据 */ },
  "customData": { /* 完整的自定义数据 */ }
}
```

#### 单个物品对比
```json
GET /api/custom/items/204
{
  "custom": { "name": "测试种子名称" },
  "api": { "name": "荞花种子", ... },
  "isCustom": false
}
```

### 数据合并逻辑

```javascript
// 伪代码
function mergeItemData(apiItems, customItems) {
  merged = {}
  
  // 1. 添加所有API数据
  for (id, item in apiItems) {
    merged[id] = {
      api: item,              // API原始数据
      custom: customItems[id],  null if no custom
      isCustom: false        // 是否仅存在自定义数据
    }
  }
  
  // 2. 添加纯自定义数据
  for (id, item in customItems) {
    if (!apiItems[id]) {
      merged[id] = {
        api: null,
        custom: item,
        isCustom: true
      }
    }
  }
  
  return merged
}
```

### 编辑保存逻辑

```javascript
// 编辑时只保存自定义字段，保留结构分离
POST /api/custom/items/204
{
  "name": "测试种子名称",    // 只保存自定义字段
  "image": "/custom.png"    // 其他API字段保持由API提供
}

// 运行时合并：
item.name = custom.name || api.name
item.image = custom.image || api.image
```

## API接口列表

| 方法 | 端点 | 说明 |
|------|------|------|
| GET | `/api/custom/items` | 获取合并后的所有物品数据（包含API对比） |
| GET | `/api/custom/items/:id` | 获取单个物品的API和自定义数据对比 |
| POST | `/api/custom/items/:id` | 添加/编辑自定义物品 |
| DELETE | `/api/custom/items/:id` | 删除自定义数据（恢复API） |
| GET | `/api/custom/recipes` | 获取所有自定义配方 |
| POST | `/api/custom/recipes/:id` | 添加/编辑自定义配方 |
| DELETE | `/api/custom/recipes/:id` | 删除自定义配方 |

## 文件结构
```
web/public/data/
├── item_lookup.json         # API数据（只读）
├── recipe_database.json      # API数据（只读）
└── custom/                   # 自定义数据（可编辑）
    ├── items.json            # 物品自定义数据
    ├── recipes.json          # 配方自定义数据
    └── .gitkeep
```

## 注意事项

1. **显示优化**: 列表同时显示API和自定义数据，方便对比
2. **编辑友好**: 编辑界面显示API原始值（灰色），自定义值（黑色）
3. **数据分离**: API文件是只读的，不会被自定义数据覆盖
4. **自动合并**: 浏览前端自动合并显示，无需手动处理
5. **状态标签**: 立即识别数据来源（新增/已修改/纯API）
