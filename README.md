# BioClass - 生物分类查询系统

🌿 一个直观优雅的生物分类学浏览器，让用户能够像探索生命树一样浏览地球上所有生物的分类层级。

![License](https://img.shields.io/badge/license-MIT-blue.svg)
![Node](https://img.shields.io/badge/node-18%2B-green.svg)
![Python](https://img.shields.io/badge/python-3.10%2B-blue.svg)

## 功能特性

- 🌲 **分类树浏览** - 以树状图形式展示生物分类层级，支持展开/收起
- 🔍 **智能搜索** - 支持中文学名、英文名搜索，快速定位生物位置
- 📋 **详情展示** - 显示完整分类路径、物种描述等信息
- 🔄 **自动同步** - 每日自动从 GBIF 数据源同步最新分类数据

## 技术栈

### 后端
- **FastAPI** - 现代高效的 Python Web 框架
- **SQLite** - 轻量级本地数据库
- **GBIF API** - 全球生物多样性信息网络

### 前端
- **React 18** + TypeScript
- **Vite** - 快速构建工具
- **TailwindCSS** - 原子化 CSS 框架
- **Lucide React** - 图标库

## 项目结构

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
│   └── ...
├── SPEC.md
└── README.md
```

## 快速开始

### 前置要求

- Node.js 18+
- Python 3.10+
- npm 或 yarn

### 安装

```bash
# 克隆仓库
git clone https://github.com/YOUR_USERNAME/bioclass.git
cd bioclass

# 安装后端依赖
cd backend
pip install -r requirements.txt

# 安装前端依赖
cd ../frontend
npm install
```

### 运行

**后端** (端口 8000):

```bash
cd backend
python run.py
```

**前端** (端口 3000):

```bash
cd frontend
npm run dev
```

访问 http://localhost:3000 即可使用。

## 数据同步

系统每日凌晨 3:00 自动从 GBIF API 同步数据。首次启动时会自动执行初始同步。

手动触发同步:

```bash
curl -X POST http://localhost:8000/api/sync
```

查看同步状态:

```bash
curl http://localhost:8000/api/sync/status
```

## API 接口

| 方法 | 路径 | 描述 |
|------|------|------|
| GET | `/api/tree` | 获取根分类节点 |
| GET | `/api/tree/{id}` | 获取指定节点及其子节点 |
| GET | `/api/search?q=` | 搜索生物 |
| GET | `/api/taxon/{id}` | 获取生物详细信息 |
| POST | `/api/sync` | 手动触发数据同步 |
| GET | `/api/sync/status` | 获取同步状态 |

## 数据来源

分类数据来自 [GBIF (Global Biodiversity Information Facility)](https://www.gbif.org/)，遵循 [CC0 1.0 公共领域贡献](https://creativecommons.org/publicdomain/zero/1.0/) 许可证。

## License

MIT License
