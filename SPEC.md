# BioClass - 生物分类查询系统

## 1. Concept & Vision

一个直观优雅的生物分类学浏览器，让用户能够像探索生命树一样浏览地球上所有生物的分类层级。界面风格融合自然科学与现代数据可视化，以深色背景象征自然界的神秘感，配合生物发光的柔和绿光效果，营造出"在显微镜下观察生命"的沉浸式体验。

## 2. Design Language

### Aesthetic Direction
**自然实验室 (Nature Lab)** — 深色背景配合生物荧光色调，数据可视化风格，类似DNA电泳凝胶与显微镜视野的融合。

### Color Palette
- Primary: `#00D9A5` (生物绿光)
- Secondary: `#0A4F44` (深绿)
- Accent: `#7B68EE` (进化紫)
- Background: `#0D1117` (深空黑)
- Surface: `#161B22` (面板灰)
- Text Primary: `#E6EDF3`
- Text Secondary: `#8B949E`
- Border: `#30363D`
- Highlight: `#FFD700` (搜索高亮金)

### Typography
- Headings: **"Outfit"**, sans-serif — 现代几何感
- Body: **"IBM Plex Sans"**, sans-serif — 科学感可读性
- Monospace (学名): **"JetBrains Mono"**, monospace

### Motion Philosophy
- 树节点展开/收起: 200ms ease-out 弹性动画
- 搜索高亮: 脉冲发光动画 (glow pulse)
- 页面加载: 根节点先出现，叶子节点依次淡入 (stagger 30ms)
- 搜索结果跳转: 平滑滚动 + 节点展开动画链

## 3. Layout & Structure

```
┌─────────────────────────────────────────────────────────────┐
│  🌿 BioClass                              [搜索框 🔍]        │
├───────────────────────┬─────────────────────────────────────┤
│                       │                                     │
│   生物分类树           │     选中生物详情面板                 │
│   (可折叠展开)         │     - 中文名 / 英文名                │
│                       │     - 学名 (斜体)                    │
│   ● 动物界             │     - 分类层级路径                   │
│     ├─ 节肢动物门       │     - 分布区域                      │
│     │  └─ 昆虫纲        │     - 科/属/种描述                  │
│     └─ 脊索动物门       │                                   │
│        └─ 哺乳纲        │                                   │
│                       │                                     │
└───────────────────────┴─────────────────────────────────────┘
```

- 左侧: 可滚动的分类树 (宽度 40%)
- 右侧: 选中生物详情卡片 (宽度 60%)
- Header: Logo + 全局搜索框
- 响应式: 移动端树和详情上下布局

## 4. Features & Interactions

### 核心功能

**分类树浏览**
- 默认展示 Kingdom → Phylum → Class 三级
- 点击节点展开/收起子节点
- 展开时显示直接子节点数量 badge
- 懒加载: 点击展开时才请求子节点数据

**生物搜索**
- 输入框支持中文学名、英文名搜索
- 搜索节流: 300ms
- 结果展示: 下拉候选列表 (最多10条)
- 点击结果 → 树自动展开到该生物位置并高亮
- 高亮状态持续3秒后渐隐

**详情面板**
- 显示完整分类路径 (界→门→纲→目→科→属→种)
- 显示该生物的层级、描述信息
- 无选中时显示引导文案

### 数据更新
- 后端每日凌晨3点自动从GBIF API同步数据
- 支持手动触发同步接口
- 同步记录日志

## 5. Component Inventory

### TreeNode
- Default: 灰色文字，文件夹图标
- Hover: 背景 `#21262D`，轻微放大
- Expanded: 展开箭头旋转90°
- Selected: 左侧3px绿色边框，背景 `#0A4F44`
- Loading: 展开图标变为旋转loading
- HasChildren: 显示子节点数量badge

### SearchBox
- Default: 半透明背景，placeholder "搜索生物名称..."
- Focused: 绿色边框发光
- HasResults: 下拉候选列表
- NoResults: 显示"未找到相关生物"
- Loading: 右侧 spinner

### DetailCard
- 包含: 物种图标、名称、学名、分类路径breadcrumb
- 分类路径可点击，点击跳转到对应树节点

### SyncButton (Admin)
- 显示最后同步时间
- 点击触发同步，显示进度

## 6. Technical Approach

### 技术栈
- **Frontend**: React 18 + Vite + TailwindCSS
- **Backend**: Python FastAPI
- **Database**: SQLite (生物分类数据量适中)
- **Data Source**: GBIF (Global Biodiversity Information Facility) API

### 项目结构
```
bioclass/
├── backend/
│   ├── app/
│   │   ├── main.py          # FastAPI 入口
│   │   ├── models.py         # Pydantic 模型
│   │   ├── database.py       # SQLite 操作
│   │   ├── gbif_fetcher.py   # GBIF API 抓取
│   │   └── scheduler.py      # 定时任务
│   ├── requirements.txt
│   └── run.py
├── frontend/
│   ├── src/
│   │   ├── App.tsx
│   │   ├── components/
│   │   │   ├── TaxonomyTree.tsx
│   │   │   ├── TreeNode.tsx
│   │   │   ├── SearchBox.tsx
│   │   │   └── DetailCard.tsx
│   │   ├── api/
│   │   │   └── index.ts
│   │   └── main.tsx
│   ├── package.json
│   ├── tailwind.config.js
│   └── vite.config.ts
└── README.md
```

### API 设计

**GET /api/tree/{taxon_id}**
- 获取指定分类节点及其直接子节点
- Response: `{ id, name, rank, children_count, children: [...] }`

**GET /api/search?q={query}**
- 搜索生物
- Response: `[{ id, name, scientific_name, rank, full_path }]`

**GET /api/taxon/{id}**
- 获取生物详细信息
- Response: `{ id, name, scientific_name, rank, path: [...], description }`

**POST /api/sync** (管理接口)
- 触发手动数据同步
- Response: `{ status: "started", message }`

**GET /api/sync/status**
- 获取最后同步状态
- Response: `{ last_sync, record_count, status }`

### Data Model

**taxon** (分类单元表)
```sql
CREATE TABLE taxon (
    id INTEGER PRIMARY KEY,
    gbif_id INTEGER UNIQUE,
    name TEXT NOT NULL,
    scientific_name TEXT,
    rank TEXT,  -- KINGDOM, PHYLUM, CLASS, ORDER, FAMILY, GENUS, SPECIES
    parent_id INTEGER REFERENCES taxon(id),
    path TEXT,  -- 完整路径: 1/2/3/4
    depth INTEGER,
    description TEXT,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX idx_parent ON taxon(parent_id);
CREATE INDEX idx_name ON taxon(name);
CREATE INDEX idx_rank ON taxon(rank);
```

### GBIF 数据同步策略
1. 使用 GBIF Species API (https://api.gbif.org/v1/species/{id})
2. 从"Animalia"和"Plantae"两个根节点开始递归
3. 每日增量同步: 只抓取新增或变化的分类
4. 层级限制: 只同步到 GENUS 层级 (避免SPECIES过多)
5. 同步时使用 etag/If-Modified-Since 避免重复下载

### 搜索实现
- 使用 SQLite FTS5 (全文搜索)
- 索引 name 和 scientific_name 字段
- 前缀匹配: `name LIKE 'query%'`

## 7. GitHub Repository

- Repository name: `bioclass`
- Public repository
- Include: README.md, SPEC.md, LICENSE (MIT)
