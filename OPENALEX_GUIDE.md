# OpenAlex 学术检索功能使用说明

## 功能概述

OpenAlex 学术检索功能已成功集成到 Home.vue 页面，提供完整的学术文章搜索、筛选和数据可视化功能。

## 文件结构

```
src/
├── api/
│   └── openalex.api.js              # OpenAlex API 封装
├── components/
│   ├── OpenAlex.vue                  # 主搜索组件
│   ├── OpenAlexStatistics.vue        # 数据可视化组件
│   └── TagDistributionChart.vue      # 标签分布图（已更新为南丁格尔玫瑰图）
└── views/
    └── Home.vue                      # 主页（已集成 OpenAlex）
```

## 核心功能

### 1. **学术文章搜索** (OpenAlex.vue)

#### 基础搜索
- 关键词搜索
- 支持布尔运算符：AND、OR、NOT
- 示例：`machine learning AND (neural networks OR deep learning)`

#### 高级筛选
- **年份范围**：指定起始和结束年份
- **引用数范围**：筛选特定引用数区间的文章
- **开放获取状态**：筛选开放获取或非开放获取文章
- **文章类型**：期刊文章、书籍章节、会议论文、学位论文、预印本

#### 排序选项
- **相关性排序**：根据搜索关键词的相关性
- **引用数排序**：按被引用次数
- **发表日期排序**：按发表时间

#### 搜索结果展示
每篇文章显示：
- 标题（可点击跳转到 DOI 链接）
- 作者列表（最多显示 3 位，超过显示"等 N 位作者"）
- 发表年份
- 引用数
- 开放获取状态
- 文章类型
- 摘要（如有，最多 300 字符）
- 来源期刊/会议名称

#### 分页功能
- 每页显示 25 篇文章
- 支持多页浏览
- 页面切换时自动滚动到顶部

### 2. **数据可视化** (OpenAlexStatistics.vue)

#### 统计卡片
显示 4 个关键指标：
- 总文章数
- 开放获取文章数
- 平均引用数
- 年份跨度

#### 可视化图表（使用 ECharts）

**年份分布柱状图**
- 展示搜索结果在各年份的分布
- 直观了解研究趋势

**开放获取状态饼图**
- 显示开放获取 vs 非开放获取的比例
- 环形图设计，美观直观

**引用数分布图**
- 将引用数分为 5 个区间：0-10、11-50、51-100、101-500、500+
- 柱状图展示各区间文章数量

## API 使用说明

### openalex.api.js

提供 3 个核心函数：

#### 1. searchWorks(params)
搜索学术文章的主函数

**参数：**
```javascript
{
  search: '',           // 搜索关键词
  page: 1,              // 页码
  perPage: 25,          // 每页数量（最大 200）
  sortBy: 'relevance_score',  // 排序字段
  sortOrder: 'desc',    // 排序方向
  fromYear: null,       // 起始年份
  toYear: null,         // 结束年份
  openAccess: '',       // 'true' 或 'false'
  minCitations: null,   // 最小引用数
  maxCitations: null,   // 最大引用数
  type: ''              // 文章类型
}
```

**示例：**
```javascript
import { searchWorks } from '@/api/openalex.api'

const response = await searchWorks({
  search: 'machine learning',
  fromYear: 2020,
  toYear: 2024,
  openAccess: 'true',
  minCitations: 10,
  sortBy: 'cited_by_count',
  sortOrder: 'desc'
})

const results = response.data.results
const totalCount = response.data.meta.count
```

#### 2. getWorkByDoi(doi)
根据 DOI 获取单篇文章详情

#### 3. getWorkById(id)
根据 OpenAlex ID 获取单篇文章详情

## 如何使用

### 启动项目

```bash
# 安装依赖（如果还没有）
npm install

# 启动开发服务器
npm run dev
```

### 使用步骤

1. **访问 Home 页面**
   - 打开浏览器访问开发服务器地址（通常是 `http://localhost:5173`）
   - Home 页面会显示 OpenAlex 学术检索组件

2. **执行搜索**
   - 在搜索框中输入关键词
   - （可选）点击"高级筛选"设置筛选条件
   - 点击"搜索"按钮或按 Enter 键

3. **查看结果**
   - 浏览文章列表
   - 点击文章标题访问原文（如有 DOI）
   - 使用分页器浏览更多结果

4. **查看数据分析**
   - 搜索完成后，页面下方会自动显示数据可视化组件
   - 查看统计卡片和图表
   - 点击刷新按钮重新渲染图表

## 主题支持

所有组件完全支持项目的 light/dark 主题切换：
- 使用 Vuetify 主题系统
- 图表颜色自动适配主题
- 使用 `glass-card` 样式保持视觉一致性

## API 限制

OpenAlex API 限制：
- **免费使用**，无需 API key
- **每日限额**：100,000 请求/用户
- **无需认证**，可直接从浏览器调用
- **CORS 友好**

## 性能优化建议

### 已实现的优化
- ✅ 组件按需加载
- ✅ 图表自动响应窗口大小调整
- ✅ 主题切换时自动重绘图表
- ✅ 分页减少一次性加载的数据量

### 未来可以添加的优化
- 🔄 搜索输入防抖（debounce）
- 🔄 结果缓存（避免重复请求）
- 🔄 虚拟滚动（处理大量结果）
- 🔄 骨架屏加载状态

## 故障排查

### 常见问题

**1. 搜索无结果**
- 检查关键词拼写
- 尝试更宽松的筛选条件
- 使用布尔运算符组合关键词

**2. API 请求失败**
- 检查网络连接
- 确认 OpenAlex API 服务是否正常
- 查看浏览器控制台的错误信息

**3. 图表不显示**
- 确保已执行过搜索
- 检查浏览器控制台是否有 ECharts 相关错误
- 尝试调整浏览器窗口大小触发重绘

**4. 主题切换后样式异常**
- 刷新页面
- 检查 Vuetify 主题配置

## 技术栈

- **Vue 3** - 组合式 API
- **Vuetify 3** - UI 组件库
- **ECharts** - 数据可视化
- **Axios** - HTTP 客户端
- **OpenAlex API** - 学术数据源

## 相关资源

- [OpenAlex 官方文档](https://docs.openalex.org/)
- [OpenAlex API 搜索指南](https://docs.openalex.org/api-entities/works/search-works)
- [Vuetify 3 文档](https://vuetifyjs.com/)
- [ECharts 文档](https://echarts.apache.org/)

## 下一步改进建议

1. **添加搜索历史记录**
   - 使用 localStorage 保存搜索历史
   - 提供快速重新搜索功能

2. **文章收藏功能**
   - 允许用户标记感兴趣的文章
   - 集成到后端数据库（需要后端支持）

3. **导出功能**
   - 导出搜索结果为 CSV/BibTeX
   - 生成引用格式

4. **更多可视化**
   - 作者合作网络图
   - 研究领域分布
   - 时间线趋势图

5. **搜索建议**
   - 基于输入的自动补全
   - 相关主题推荐

---

**开发时间**：2026-01-10
**开发者**：Claude Sonnet 4.5
