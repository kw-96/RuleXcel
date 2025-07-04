# RuleXcel - 智能Excel/CSV批量处理工具

## 📋 项目概述

RuleXcel是一个纯前端的Excel/CSV文件批量处理工具，使用原生JavaScript开发。它提供了可视化的数据处理规则编辑器，让用户无需编程即可完成复杂的数据处理任务。

### ✨ 核心特性

- **🚀 纯前端处理** - 数据不上传服务器，保护隐私安全
- **📊 可视化规则** - 无代码操作，降低使用门槛  
- **📁 多格式支持** - 支持Excel(.xlsx/.xls)和CSV文件
- **⚡ 高性能处理** - 基于Arquero数据处理引擎
- **📱 响应式设计** - 适配桌面端和移动端
- **🎯 智能操作** - 提供快捷操作和批量处理功能

## 🏗️ 技术架构

### 核心技术栈
- **前端框架**: 原生JavaScript (ES6+)
- **UI组件**: daisyUI + TailwindCSS
- **数据处理**: Arquero数据查询引擎
- **文件解析**: SheetJS (xlsx.js)
- **规则引擎**: JSONLogic + 自定义DSL

### 项目结构
```
RuleXcel/
├── index.html              # 主页面
├── src/
│   ├── js/
│   │   ├── core/           # 核心功能模块
│   │   │   ├── fileParser.js      # 文件解析器
│   │   │   ├── dataProcessor.js   # 数据处理器
│   │   │   ├── ruleEngine.js      # 可视化规则引擎
│   │   │   └── exporter.js        # 文件导出器
│   │   ├── ui/             # UI组件模块
│   │   │   ├── dataPreview.js     # 数据预览组件
│   │   │   ├── progressManager.js # 进度管理器
│   │   │   └── quickActions.js    # 快捷操作组件
│   │   ├── utils/          # 工具函数模块
│   │   │   ├── validator.js       # 数据验证工具
│   │   │   ├── formatter.js       # 格式化工具
│   │   │   └── logger.js          # 日志工具
│   │   └── main.js         # 主应用入口
│   └── css/
│       ├── main.css        # 主样式文件
│       └── components/     # 组件样式
├── libs/                   # 第三方库
└── logs/                   # 开发日志
```

## 🔧 功能模块

### 1. 文件解析器 (fileParser.js)
- 支持Excel(.xlsx, .xls)和CSV文件解析
- 智能编码检测(UTF-8/GBK)
- 文件大小限制(最大10MB)
- 多工作表支持
- 数据格式化和清理

### 2. 可视化规则引擎 (ruleEngine.js)
- **筛选规则**: 可视化条件编辑器
- **排序规则**: 多列排序，拖拽调整优先级
- **合并规则**: 文件合并、Sheet合并、列关联合并
- **规则模板**: 保存/加载常用规则模板

### 3. 数据预览组件 (dataPreview.js)
- 分页显示大数据集
- 多文件/多工作表切换
- 原始数据vs处理结果对比
- 数据统计信息显示

### 4. 快捷操作功能 (quickActions.js)
- **筛选本月数据**: 自动检测日期列，筛选当月数据
- **提取优质资源位**: 基于评分/点击率等指标筛选
- **删除重复数据**: 根据指定列去重
- **按时间排序**: 智能检测时间列进行排序
- **生成数据摘要**: 详细的数据统计分析

### 5. 数据导出器 (exporter.js)
- Excel格式导出(.xlsx)
- CSV格式导出(UTF-8编码)
- 对比数据导出(双工作表)
- 自定义文件名和格式

## 🎯 使用方法

### 基本操作流程

1. **上传文件**
   - 拖拽文件到上传区域，或点击选择文件
   - 支持同时上传多个文件
   - 自动解析并显示统计信息

2. **数据预览**
   - 查看文件内容和数据结构
   - 切换不同文件或工作表
   - 设置每页显示行数

3. **应用处理规则**
   - **快捷操作**: 使用预设的快捷按钮
   - **自定义规则**: 通过可视化编辑器设置筛选、排序、合并规则

4. **导出结果**
   - 选择导出格式(Excel/CSV)
   - 下载处理后的数据文件

### 快捷操作示例

#### 筛选本月数据
```
1. 点击"筛选本月数据"按钮
2. 系统自动检测日期列
3. 筛选出当月的数据记录
4. 在预览区域查看结果
```

#### 提取优质资源位
```
1. 点击"提取优质资源位"按钮
2. 系统根据预设指标筛选高质量数据
3. 支持评分、点击率、转化率等多种指标
4. 导出优质资源位数据
```

### 可视化规则编辑

#### 筛选规则设置
1. 选择要筛选的列
2. 选择操作符(等于、大于、包含等)
3. 输入筛选值或选择另一列
4. 设置多条件的逻辑关系(AND/OR)

#### 排序规则设置
1. 添加排序列
2. 选择排序方向(升序/降序)
3. 拖拽调整排序优先级

#### 合并规则设置
1. 选择合并类型(文件合并/Sheet合并/列关联)
2. 配置合并参数
3. 预览合并结果

## 📊 性能特性

- **大文件支持**: 最大支持10MB文件，10万行数据
- **分页显示**: 避免大数据集造成页面卡顿
- **异步处理**: 所有IO操作异步执行
- **内存优化**: 及时释放不用的数据引用
- **进度显示**: 4步骤可视化处理进度

## 🔒 安全特性

- **本地处理**: 所有数据处理在浏览器端完成
- **无服务器**: 文件不上传到任何服务器
- **隐私保护**: 用户数据始终在本地环境
- **无依赖**: 无需安装任何软件或插件

## 🌟 项目优势

### 1. 降低使用门槛
- 可视化操作界面，无需编程知识
- 拖拽上传，操作简单直观
- 智能提示和错误处理

### 2. 提高工作效率
- 批量处理多个文件
- 快捷操作模板化常用任务
- 规则模板复用

### 3. 保证数据安全
- 纯前端处理，数据不离开本地
- 无网络传输，避免泄露风险
- 开源透明，可验证安全性

### 4. 扩展性强
- 模块化架构，易于扩展新功能
- 插件化设计，支持自定义操作
- 规则引擎可配置，满足不同需求

## 📱 兼容性

- **浏览器**: Chrome 90+, Firefox 88+, Safari 14+, Edge 90+
- **设备**: 桌面端、平板、手机
- **系统**: Windows, macOS, Linux, iOS, Android

## 🚀 部署方式

### 本地运行
```bash
# 克隆项目
git clone <repository-url>

# 进入项目目录
cd RuleXcel

# 启动本地服务器(推荐使用Live Server)
# 或直接用浏览器打开 index.html
```

### GitHub Pages部署
1. 推送代码到GitHub仓库
2. 在仓库设置中启用GitHub Pages
3. 选择source为main分支
4. 访问生成的URL即可使用

## 📝 开发日志

项目采用严格的开发日志记录制度，每次修改都记录在`logs/`目录中：
- 修改时间和内容
- 功能完成情况
- 技术决策说明
- 问题解决过程

## 🤝 贡献指南

1. Fork本项目
2. 创建功能分支
3. 提交修改并添加测试
4. 发起Pull Request
5. 等待代码审查

## 📄 许可证

本项目采用MIT许可证，详见LICENSE文件。

---

**RuleXcel** - 让数据处理变得简单高效！🎉 