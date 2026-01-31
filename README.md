# EndFieldBuildSim

**Data collection and web application for Endfield game wiki/database.**

## 🌐 Web Application

Browse the collected data with our React web app:

- **Development**: See [web/README.md](web/README.md)
- **Deployment**: See [DEPLOYMENT.md](DEPLOYMENT.md)
- **Live Demo**: `https://yourusername.github.io/EndFieldBuildSim/` (after deployment)

## 📚 Documentation Index

- **[AGENTS.md](AGENTS.md)** - Developer guide with project structure, code style, and development workflow
- **[DEPLOYMENT.md](DEPLOYMENT.md)** - Comprehensive guide for GitHub Pages deployment
- **[WEB_APP_COMPLETION.md](WEB_APP_COMPLETION.md)** - Web app implementation report and completion status
- **[data/DATA_SUMMARY.md](data/DATA_SUMMARY.md)** - Data collection statistics and file structure overview
- **[data/DEVICE_PRODUCTION_REPORT.md](data/DEVICE_PRODUCTION_REPORT.md)** - Device production capabilities and statistics (Chinese)

**Features**:
- 🔍 Search 254 items with fuzzy matching
- 📊 View synthesis tables and crafting requirements
- 📝 Rich text descriptions with item links
- 📱 Responsive design for mobile and desktop

---

## 📦 数据收集指南

## 快速开始

### 第一步：获取物品目录

运行Python脚本获取所有物品的基本信息（ID、名称、图片）：

```bash
python data/fetch.py
```

**输出文件：**
- `data/type5_devices.json` - 65个设备
- `data/type6_items.json` - 189个物品
- `data/item_details/` - 空目录（待填充）

---

### 第二步：获取物品详情

**推荐方法：使用 Playwright 自动化（完全自动，无需手动认证）**

```bash
python3 data/fetch_details_browser.py
```

**功能说明**：
- ✅ **完全自动化**：无需手动获取认证头
- ✅ **浏览器模拟**：使用真实浏览器访问，自动处理认证和签名
- ✅ **零失败率**：经过254个物品测试，100%成功
- ✅ **断点续传**：已下载的文件自动跳过
- ✅ **进度显示**：`[123/254] 370 ✓`

**工作原理**：
- 脚本访问 `https://wiki.skland.com/endfield/detail?gameEntryId={itemId}`
- 浏览器自动触发 `/wiki/item/info` API调用
- 浏览器自动处理签名和token刷新
- 拦截API响应并保存到 `data/item_details/{itemId}.json`

**预计耗时**：约1-2分钟（254个物品 × 0.2秒延迟）

**测试模式**（先测试3个物品）：
```bash
python3 data/fetch_details_browser.py --test
```

**详细模式**（查看调试信息）：
```bash
python3 data/fetch_details_browser.py --verbose
```

---

**备选方法：手动认证脚本（如果Playwright不可用）**

如果无法使用Playwright，可以使用手动认证的bash脚本：

<details>
<summary>点击展开手动认证方法</summary>

#### 2.1 获取认证头

1. **打开浏览器**访问 https://wiki.skland.com/
2. **按F12**打开开发者工具
3. **切换到Network标签**
4. **刷新页面**
5. **找到任意** `zonai.skland.com` 的请求（例如 `/wiki/item/catalog`）
6. **右键点击** → Copy → Copy as cURL (bash)
7. **从cURL命令中找到以下三个header：**
   - `timestamp: 1769691754`
   - `sign: f179b3c52c4be7ec4cdd...`
   - `dId: B0GeZ6O6F8+MTxNvDmbz...`

#### 2.2 编辑脚本

打开 `data/fetch_all_details.sh`，找到以下行：

```bash
TIMESTAMP="YOUR_TIMESTAMP_HERE"
SIGN="YOUR_SIGN_HERE"
DID="YOUR_DID_HERE"
```

替换为刚才复制的值：

```bash
TIMESTAMP="1769691754"
SIGN="f179b3c52c4be7ec4cdd..."
DID="B0GeZ6O6F8+MTxNvDmbz..."
```

#### 2.3 运行脚本

```bash
bash data/fetch_all_details.sh
```

**⚠️ 注意**：认证headers会在30-60秒后过期，需要在过期前完成所有请求。

</details>

---

### 第三步：提取合成设备表格

从物品详情中提取"合成设备"相关的表格数据，简化为结构化JSON。

```bash
python3 data/extract_synthesis_tables.py
```

**功能：**
- 自动扫描 `data/item_details/` 目录中的所有JSON文件
- 查找包含"合成设备"文本的文档块
- 提取表格结构（table kind）
- 简化单元格内容：
  - `text`类型：只保留文本字符串
  - `entry`类型：只保留id和count
- 输出到 `data/synthesis_tables/` 目录

**输出示例 (synthesis_tables/193.json):**
```json
{
  "itemId": "193",
  "name": "紫晶纤维",
  "tables": [
    {
      "rows": 7,
      "columns": 3,
      "headers": [
        [{"type": "text", "text": "合成设备"}],
        [{"type": "text", "text": "原料需求"}],
        [{"type": "text", "text": "合成产物"}]
      ],
      "data": [
        [
          [{"type": "entry", "id": "53", "count": "0"}],
          [{"type": "entry", "id": "49", "count": "1"}],
          []
        ]
      ]
    }
  ]
}
```

**单文件处理：**
```bash
python3 data/extract_synthesis_tables.py data/item_details/193.json output.json
```

---

### 第四步：提取设备生产表格

通过反向索引生成设备生产能力表格，显示每个设备能生产哪些物品。

```bash
python3 data/extract_device_productions.py
```

**功能：**
- 反向索引 `data/synthesis_tables/` 目录中的所有合成表格
- 统计每个设备能生产的所有物品
- 包含完整的原料→产物配方信息
- 输出到 `data/device_production_tables/` 目录

**输出示例 (device_production_tables/53.json):**
```json
{
  "deviceId": "53",
  "deviceName": "精炼炉",
  "recipeCount": 36,
  "recipes": [
    {
      "materials": [
        {
          "id": "379",
          "name": "荞花粉末",
          "count": "1"
        }
      ],
      "products": [
        {
          "id": "195",
          "name": "碳粉末",
          "count": "1"
        }
      ]
    }
  ]
}
```

**统计报告：**
- 查看详细统计报告: `data/DEVICE_PRODUCTION_REPORT.md`
- 报告包含：设备排名、配方数量、产物种类、示例配方等

---

## 输出文件结构

```
data/
├── type5_devices.json              # 65个设备的基本信息
├── type6_items.json                # 189个物品的基本信息
├── item_details/                   # 254个详细信息JSON文件
│   ├── 985.json
│   ├── 924.json
│   ├── ...
│   └── 161.json
├── synthesis_tables/               # 79个物品的合成表格
│   ├── 193.json
│   ├── ...
│   └── xxx.json
├── device_production_tables/       # 14个设备的生产表格（新增）
│   ├── 53.json                     # 精炼炉
│   ├── 54.json                     # 粉碎机
│   ├── ...
│   └── 752.json                    # 天有洪炉
└── DEVICE_PRODUCTION_REPORT.md     # 设备生产能力统计报告（新增）
```

### 文件格式

**catalog文件 (type5_devices.json, type6_items.json):**
```json
[
  {
    "itemId": "985",
    "name": "速成陈酿",
    "image": "https://bbs.hycdn.cn/image/2025/12/31/203953/745294dc380810360b92b499c495dd54.png"
  },
  ...
]
```

**详情文件 (item_details/985.json):**
```json
{
  "code": 0,
  "message": "OK",
  "timestamp": "1769691754",
  "data": {
    "item": {
      "itemId": "985",
      "name": "速成陈酿",
      "document": {
        "documentMap": { ... },
        "blockMap": { ... }
      },
      ...
    }
  }
}
```

---

## 常见问题

### Q: 遇到 401 错误怎么办？
A: **401错误表示认证headers已过期**。解决方法：
1. 按照"第二步 2.1"重新从浏览器获取最新的认证头（timestamp、sign、dId）
2. 编辑 `data/fetch_all_details.sh`，更新这三个值
3. 重新运行脚本（已下载的文件会自动跳过）

**注意**：每次运行脚本前都需要获取新的认证头，这是API的安全限制。

### Q: 认证头会过期吗？
A: 是的，约30-60秒后过期。但脚本执行很快（254个物品约1-2分钟），通常能在过期前完成。

### Q: 能用Playwright自动化获取吗？
A: **不能完全自动化**。原因：
- `/wiki/item/info` API使用**per-request签名**（签名包含URL路径+参数+timestamp）
- 从 `/wiki/item/catalog` 获取的签名无法用于 `/wiki/item/info`
- 网站页面不调用 `/wiki/item/info` API，而是用其他方式加载数据
- 签名算法未公开，无法在本地计算

**结论**：必须从浏览器手动获取认证头，这是目前唯一可行的方法。

### Q: 可以并发下载吗？
A: 不建议。API可能有速率限制，脚本已包含0.2秒延迟。

### Q: 脚本中断了怎么办？
A: 直接重新运行，已下载的文件会自动跳过。

### Q: 没有安装jq怎么办？
A: 脚本会自动使用grep+sed备用方案，功能完全相同。

---

## 技术细节

### API端点

- **目录API**: `https://zonai.skland.com/web/v1/wiki/item/catalog?typeMainId=1&typeSubId={5|6}`
- **详情API**: `https://zonai.skland.com/web/v1/wiki/item/info?id={itemId}`

### 认证机制

API使用per-request签名认证：
- `timestamp`: 当前Unix时间戳
- `sign`: MD5哈希（由URL、参数、timestamp计算）
- `dId`: 设备ID（Base64编码）

签名与请求路径绑定，无法重用。

---

## 文件说明

| 文件 | 用途 |
|------|------|
| `data/fetch.py` | 获取物品目录（自动化，无需认证头） |
| `data/fetch_details_browser.py` | **批量获取物品详情（推荐方式，完全自动化）** ⭐ |
| `data/fetch_all_details.sh` | 批量获取物品详情（备用方式，需手动填入认证头） |
| `data/extract_synthesis_tables.py` | 提取物品合成表格（处理item_details目录） |
| `data/extract_device_productions.py` | **提取设备生产表格（通过反向索引）** ⭐ |

---

**最后更新**: 2026-01-30
