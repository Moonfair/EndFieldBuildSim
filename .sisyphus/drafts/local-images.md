# Draft: 将CDN图片下载到本地

## Requirements (confirmed)

### 用户需求
- 将外部CDN图片（bbs.hycdn.cn）下载到本地
- 修改数据收集流程和Web应用以使用本地图片路径
- 保留外部URL作为fallback（可选）

### 当前状态分析

**图片来源**:
- 域名: `https://bbs.hycdn.cn/image/{YYYY}/{MM}/{DD}/{USER_ID}/{HASH}.png`
- 总数: 254张主图片（65设备 + 189物品）

**数据文件结构**:
1. `data/type5_devices.json` - 65个设备 (itemId, name, image)
2. `data/type6_items.json` - 189个物品 (itemId, name, image)
3. `data/item_lookup.json` - 254个item的查找表
4. `data/item_details/{itemId}.json` - 详细信息，包含 `data.item.brief.cover`

**Web应用结构**:
- `web/public/data/` - 存放JSON数据
- `web/public/placeholder.png` - 图片加载失败时的占位符
- Vite base路径: dev时为`/`, build时为`/EndFieldBuildSim/`

**图片使用位置**:
1. `ItemCard.tsx` - 使用 `item.image` (from CatalogItem)
2. `DetailPage.tsx` - 使用 `item.brief?.cover` (from ItemData)
3. `SynthesisTable.tsx` - 使用 `item.image` (from itemLookup[id])

**类型定义**:
- `catalog.ts`: `CatalogItem.image: string`
- `detail.ts`: `ItemBrief.cover: string`

## Technical Decisions

### 图片下载方案
- **推荐**: Python requests库 + ThreadPoolExecutor并发下载
- **命名**: `{itemId}.png` (简单可靠)
- **目录**: `data/images/items/`
- **断点续传**: 已存在的文件跳过

### 图片路径策略
- **新增字段**: `localImage` 或直接修改 `image` 字段
- **Web应用引用**: `/images/items/{itemId}.png`
- **Fallback**: 保留原始外部URL（可选）

### Web资源复制
- 需要将 `data/images/` 复制到 `web/public/images/`
- 或在构建流程中自动同步

## Research Findings

**项目结构验证**:
- ✅ web/public/ 目录存在
- ✅ Vite配置: `base: command === 'build' ? '/EndFieldBuildSim/' : '/'`
- ✅ ItemImage组件有error fallback机制 (placeholder.png)
- ✅ 支持lazy loading
- ✅ web/public/data/ 目录包含复制的JSON数据

**图片URL分布**:
- item_lookup.json: 254个外部URL
- type5_devices.json: 65个外部URL  
- type6_items.json: 189个外部URL
- web/public/data/item_lookup.json: 254个外部URL（web应用使用）
- web/public/data/item_details/*.json: cover字段也是外部URL

**完整的图片流程**:
```
Zonai API → fetch.py → data/*.json → web/public/data/*.json → React组件 → bbs.hycdn.cn
```

**关键发现**:
1. 数据存在于两个位置: `data/` 和 `web/public/data/`
2. web应用只使用 `web/public/data/` 下的数据
3. item_details中的cover和item_lookup中的image是相同的图片
4. 没有发现avatar等其他图片类型在使用中

## User Decisions (CONFIRMED)

1. **图片路径字段策略**: **方案B - 直接替换**
   - 将JSON中的 `image` 字段直接替换为本地路径 `/images/items/{itemId}.png`
   - 不保留原URL，不新增字段
   - TypeScript类型定义保持不变（仍为string）

2. **下载目录**: **直接到 web/public/images/items/**
   - 图片直接下载到 `web/public/images/items/`
   - 无需额外复制步骤
   - data/目录不存储图片

3. **item_details更新**: **Yes - 同步更新**
   - 更新 `item_lookup.json` 中的 `image` 字段
   - 更新 `item_details/{itemId}.json` 中的 `brief.cover` 字段
   - 保持数据一致性

4. **GitHub Pages路径**: **Yes - 使用getImagePath()工具函数**
   - 创建 `web/src/utils/imageUrl.ts`
   - 实现 `getImagePath(localPath: string): string` 函数
   - 根据环境动态添加base路径
   - ItemImage组件调用此函数

## Self-Analysis Gap Check

### Identified Gaps and Resolutions

1. **data/ 目录的 JSON 文件是否也需要更新？**
   - 项目有 `data/` 和 `web/public/data/` 两套数据
   - 用户只提到更新 web/public/data/ 下的文件
   - **决定**: 只更新 web/public/data/，data/ 目录保持原样（作为原始数据备份）

2. **下载失败的图片如何处理？**
   - 用户要求"下载失败时有明确错误日志"
   - **决定**: 脚本记录失败列表，ItemImage.tsx 已有 fallback 到 placeholder.png

3. **图片格式验证？**
   - 是否需要验证下载的文件确实是有效图片？
   - **决定**: 验证 Content-Type 和文件头，跳过无效文件

4. **并发数量？**
   - 用户提到"10-20 workers"
   - **决定**: 使用 10 个并发 workers（保守选择，避免被CDN限流）

5. **getImagePath 函数如何获取 base path？**
   - Vite 提供 `import.meta.env.BASE_URL`
   - **决定**: 使用此环境变量

6. **哪些组件需要修改？**
   - ItemImage.tsx 是核心组件
   - 但 ItemCard, DetailPage, SynthesisTable 都通过 ItemImage 显示图片
   - **决定**: 只需修改 ItemImage.tsx，其他组件自动受益

## Scope Boundaries

### INCLUDE
- 创建Python图片下载脚本
- 下载254张主图片
- 更新JSON数据文件（item_lookup.json, type5/type6）
- 修改TypeScript类型定义
- 修改React组件使用本地路径
- 处理base路径（GitHub Pages部署）

### EXCLUDE (待确认)
- item_details/*.json 中的cover更新
- avatar图片下载
- 其他类型的图片资源
