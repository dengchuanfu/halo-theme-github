# Halo Theme GitHub

一款仿 GitHub 个人主页风格的 [Halo 2](https://www.halo.run/) 主题，由 Monster 基于官方 [`theme-vite-starter`](https://github.com/halo-dev/theme-vite-starter) 开发。

主题将博客内容组织成类似 GitHub Profile 的界面，支持响应式布局、动态贡献图、站点动态、文章搜索，以及友链、瞬间、图库、留言板等 Halo 内容页面。

## 功能说明

- GitHub 风格的顶部栏、个人资料区、菜单标签和内容卡片。
- 首页展示最新文章、年度贡献图和站点动态。
- 贡献图汇总文章、瞬间、标签、分类和图库的发布或创建记录，支持切换年份、按日期筛选动态。
- 支持文章列表、文章详情、独立页面、分类、标签和分页。
- 内置站内搜索，可搜索已发布的文章和独立页面；支持点击搜索框或按 `/` 唤起，按 `Esc` 关闭。
- 自动读取 Halo 的主菜单，支持为不同菜单路径配置 Iconify 图标，并自动高亮当前菜单。
- 支持显示文章数、评论数和访问量。
- 适配 Halo 友链、瞬间和图库页面。
- 提供带评论飘屏效果的留言板自定义模板。
- 适配 Personal Assets 插件的个人资产页面。
- 支持自定义页面背景色、强调色、友链默认头像和站点页脚。
- 支持桌面端和移动端响应式布局。

## 环境要求

- Halo：`>= 2.0.0`
- 推荐使用最新稳定版 Halo 2
- 从源码构建时需要 Node.js 20+、Corepack 和 pnpm 10

## 安装主题

### 使用发行包

1. 从仓库的 [Releases](https://github.com/dengchuanfu/halo-theme-github/releases) 页面下载最新的 `halo-theme-github-版本号.zip`。
2. 登录 Halo Console，进入「外观」->「主题」。
3. 点击「安装主题」并上传下载的 zip 文件。
4. 安装完成后启用 `GitHub` 主题。

### 从源码构建

```bash
git clone https://github.com/dengchuanfu/halo-theme-github.git
cd halo-theme-github
corepack enable
pnpm install
pnpm build
```

构建完成后，主题安装包生成在 `dist/` 目录中。将 zip 文件上传到 Halo Console 即可安装。

## 基础配置

进入 Halo Console 的「外观」->「主题」->「GitHub」->「设置」，按需配置以下内容。

### 基础设置

| 配置项       | 说明                                             | 默认值        |
| ------------ | ------------------------------------------------ | ------------- |
| 标题         | 顶部 Logo 右侧的站点标题，同时用于页面标题和页脚 | `monster`     |
| 名称         | 个人资料区头像下方的加粗名称                     | `Monster`     |
| 描述         | 名称下方的简介或用户名                           | `dengchuanfu` |
| 所在地       | 个人资料区显示的所在地                           | `ShenZhen`    |
| 公司 / 学校  | 个人资料区显示的组织信息                         | `EasySpeed`   |
| 邮箱         | 个人资料区显示的联系邮箱；留空不显示             | 空            |
| 显示网站统计 | 显示文章总数、评论总数和访问量                   | 关闭          |
| 状态 Emoji   | 显示在头像右下角的状态图标                       | `😊`          |

个人资料头像和顶部 Logo 使用 Halo 的站点 Logo，请在 Console 的「设置」->「基本设置」中上传。

### 菜单与图标

主题读取 Halo 的主菜单。请先进入「外观」->「菜单」，创建或编辑主菜单并添加需要展示的菜单项。

主题预置了以下路径的图标配置：

| 菜单     | 建议路径              | 默认图标               |
| -------- | --------------------- | ---------------------- |
| 首页     | `/`                   | `line-md:home`         |
| 文章     | `/archives`           | `octicon:repo-16`      |
| 默认分类 | `/categories/default` | `octicon:bookmark-16`  |
| 关于     | `/about`              | `octicon:person-16`    |
| 友链     | `/links`              | `ri:links-line`        |
| 图库     | `/photos`             | `lineicons:photos`     |
| 瞬间     | `/moments`            | `mingcute:moment-line` |
| 留言板   | `/message`            | `tabler:message`       |

在「图标配置」中可以修改这些默认值。其他菜单可通过「其他菜单栏自定义图标」添加路径与 Iconify 图标名称，例如：

| 菜单路径 | Iconify 图标       |
| -------- | ------------------ |
| `/tools` | `octicon:tools-16` |

图标名称可在 [Iconify](https://icon-sets.iconify.design/) 查询。路径没有匹配规则时，主题使用「未匹配菜单默认图标」。

### 样式设置

| 配置项       | 说明                                       | 默认值    |
| ------------ | ------------------------------------------ | --------- |
| 背景颜色     | 页面整体背景色                             | `#ffffff` |
| 强调色       | 链接、选中状态等元素的主题色               | `#0969da` |
| 友链默认头像 | 友链没有 Logo 或 Logo 加载失败时使用的图片 | 空        |

### 关于设置

`/about` 页面会自动使用主题的关于页布局。在「关于设置」中可配置：

- 左侧资料头像、名称、签名，以及右侧 README 内容中的个人标签。
- 关于本站、站点统计、建站历程和各模块显示开关。
- 技能与认证的名称、Iconify 图标和进度。
- 约定标题、描述、起止日期，页面会自动计算进度。
- 联系方式的名称、链接和 Iconify 图标。

关于本站留空时，主题会优先显示 Halo 关于页的正文内容。

### 底部设置

| 配置项        | 说明                                                           |
| ------------- | -------------------------------------------------------------- |
| ICP 备案编号  | 填写完整备案编号，主题自动链接到工信部备案查询页               |
| 公安备案编号  | 填写完整公安备案编号，主题自动链接到公安备案查询页             |
| 云服务商名称  | 显示在“本站由 XX 提供服务”中                                   |
| 云服务商 Logo | 可选；上传后使用 Logo 代替服务商名称，建议使用透明背景横版图片 |
| 云服务商链接  | 点击服务商名称或 Logo 后打开的地址                             |

未填写的备案或服务商内容不会显示。Halo 后台设置的页脚内容也会通过主题的 `<halo:footer />` 一并显示。

## 内容页面配置

### 文章、分类和标签

主题原生支持 Halo 的文章、独立页面、分类和标签，无需额外插件。常用菜单路径如下：

- 文章归档：`/archives`
- 分类列表：`/categories`
- 标签列表：`/tags`
- 独立页面：使用页面发布后生成的固定链接

首页贡献图通过 Halo API 读取公开内容。如果某类内容不存在或对应扩展未安装，会跳过该类数据，不影响文章内容展示。

### 留言板

1. 在 Halo Console 进入「内容」->「页面」，新建一个页面。
2. 开启该页面的评论功能。
3. 在页面的「模板」中选择「留言板」。
4. 发布页面，并将它的固定链接加入主菜单。

留言板会读取该页面已审核且未隐藏的评论，以飘屏方式展示，并每 30 秒检查一次新留言。评论区是否可用取决于 Halo 的评论系统和该页面的评论设置。

### 友链

安装并启用 Halo 官方「链接管理」插件，添加链接分组和链接后访问 `/links`。主题会按分组展示友链，并使用「样式」中的友链默认头像处理缺失或加载失败的 Logo。

### 瞬间

安装并启用 Halo 官方「瞬间」插件后，可使用：

- 瞬间列表：`/moments`
- 瞬间详情：由插件自动生成

主题支持瞬间标签筛选、图片/视频/音频等媒体内容、点赞与评论统计以及详情评论区。

### 图库

安装并启用 Halo 官方「图库管理」插件后访问 `/photos`。主题支持图库分组筛选、响应式图片网格和分页。

### 个人资产

安装并启用 [Personal Assets](https://github.com/dengchuanfu/personalassets) 插件后访问 `/personalassets`。主题内置了与 GitHub 风格一致的资产页面模板，资产数据和页面标题等设置由插件管理。

## 开发

安装依赖：

```bash
corepack enable
pnpm install
```

监听源码变化并持续构建：

```bash
pnpm dev
```

检查代码并自动修复可修复的问题：

```bash
pnpm check
```

执行类型检查、生产构建并生成主题 zip 包：

```bash
pnpm build
```

主题源码位于 `src/`，开发构建产物由 Vite 写入 `templates/`。

仓库中的 `scripts/dev-theme.sh` 和 `scripts/dev-halo.sh` 用于作者本地工作区联调。其中 `dev-halo.sh` 依赖主题仓库同级的 Halo 源码、本地 JDK 21 和指定 Gradle 环境，其他开发环境建议按 [Halo 主题开发文档](https://docs.halo.run/developer-guide/theme/prepare) 配置。

## 许可

本项目使用 [GPL-3.0 License](LICENSE)。

## 相关链接

- 作者网站：<https://ffbf.top>
- 源码仓库：<https://github.com/dengchuanfu/halo-theme-github>
- 问题反馈：<https://github.com/dengchuanfu/halo-theme-github/issues>
