# 梯度实验室

每份教材都是一个可独立运行的机器学习实验。入门第一课《让机器从例子里找规律》从柑橘分拣讲起。另有独立的单神经元模板演示。两者均支持 MDX 对照阅读和本地实验记录。

[在线课程目录](https://everfir.github.io/ml-learning/) · [第一课：让机器从例子里找规律](https://everfir.github.io/ml-learning/fruit-sorting/) · [单神经元演示](https://everfir.github.io/ml-learning/neuron/)

## GitHub Pages 发布

推送到 `main` 后，GitHub Actions 执行仓库检查，并用 `pnpm build:pages` 将站点构建到 `dist-pages/`。每课使用独立的 `/<仓库名>/<实验 ID>/` 地址，飞书可以直接分享课程或章节的完整链接。课程目录和应用名称取自每课的 `lesson.json`。

在线版使用 Vite 的代码分割与 `build.chunkImportMap`。浏览器需要支持原生 import maps 和 `import.meta.resolve`。Workbox 在首次联网打开后缓存当前课程；缓存完成后可以断网重新打开同一地址。课程内容更新时，关闭旧课程标签再打开即可使用已经下载的新版本。实验草稿和快照继续存入当前浏览器的 IndexedDB。

## 开始使用

使用 Node.js 22.13+ 和 pnpm 10。项目级 `.npmrc` 已配置 npmmirror。

```sh
pnpm install --frozen-lockfile
pnpm dev fruit-sorting
pnpm build fruit-sorting
pnpm check
```

以上命令打开和打包入门第一课。`pnpm dev neuron` 可打开单神经元演示，也是省略实验 ID 时的默认入口。双击 `dist/fruit-sorting/index.html` 即可离线使用，也可将这一个文件重命名后分享。文件大小指未压缩的实际交付体积。接收平台需要允许运行 HTML 内联 JavaScript。

## 新增教材

```sh
pnpm new gradient-descent
pnpm dev gradient-descent
pnpm build gradient-descent
```

编辑生成的 `src/experiments/gradient-descent/`，在 `lesson.json` 填写课程名称。每课有五份同名 MDX，顺序由共享壳层固定。默认打开工作台。

| 章节文件           | 作者要回答的问题                             |
| ------------------ | -------------------------------------------- |
| `introduction.mdx` | 为什么值得做这个实验？读者能先做出什么预测？ |
| `theory.mdx`       | 涉及哪些概念、公式和假设？                   |
| `workbench.mdx`    | 调节什么、观察什么、怎样读图？               |
| `records.mdx`      | 记录包含什么，怎样载入并比较？               |
| `appendix.mdx`     | 在哪里查符号、阅读原始论文或教材？           |

工作台和实验记录的交互部分由 React 入口传给 LabShell，各自的 MDX 通过「翻阅资料」在资料侧栏阅读。阅读页和资料侧栏都使用 `documents.ts` 登记的同一份源码。外部参考文献由读者点击后在新标签打开。

### 给正文和资料侧栏定位

段落用 `<Heading id="weights">输入、权重与偏置</Heading>` 标记。地址格式是 `#/<实验>/<正文章节>[/段落]?guide=<讲解章节>[/段落]`，HTTP 和本地 HTML 均可使用。例如 `#/neuron/workbench?guide=theory/weights` 会保留工作台并打开权重讲解。标题旁的链接可复制当前段落地址。

React 控件使用 `guideHref("theory", "weights")` 生成对照链接。在 MDX 中使用 `<Jump section="theory" anchor="weights">权重</Jump>`，链接在发起阅读的一侧跳转。Lint 检查五份文件、重复段落 ID 和 MDX Jump 目标。

`pnpm build` 对所有实验逐个调用 Vite。单项构建仅刷新对应的 `dist/<id>/`。依赖图从一个入口出发，所有运行所需资源内联。构建脚本检查输出目录内只有一个 HTML 文件。产物的 CSP 阻止运行期网络连接。修改共享代码会更新使用它的实验；每份离线文件都带有自己所需的共享代码副本。

## 共享能力

| 路径                                   | 用途                                                                          |
| -------------------------------------- | ----------------------------------------------------------------------------- |
| `src/shared/LabShell.tsx`、`theme.css` | 页头、实验标题、页面宽度、面板、排版、颜色和窄屏布局                          |
| `src/shared/GuidePanel.tsx`            | 布局层右侧阅读器，支持五份 MDX 切换、段落定位与打开正文                       |
| `src/shared/ui/`                       | 本地维护的 shadcn/ui Button、ChartContainer 及样式合并函数                    |
| `src/shared/charts/LinePlot.tsx`       | 数值型曲线、可选工作点、坐标范围和刻度，可传入 step/loss 点列                 |
| `src/shared/storage.ts`                | 按构建时实验 ID 分库，事务提交后才报告写入成功                                |
| `src/shared/ml/tensor.ts`              | 按实验选用 TF.js CPU 后端。返回的运行时支持 tidy、显式 dispose 和 memory 统计 |

单个神经元的前向计算只需标量运算。首课直接计算 z = wx + b 和 a = f(z)，曲线横轴是 z。后续训练型实验可使用 TF.js，记录训练耗时、损失和张量规模。TF.js 的张量统计有后端适用范围；整机 CPU/GPU 利用率无法由这个接口给出。训练循环、取消、网络结构检查器与大型模型的资源策略留到首个有相应需求的实验确定。

## 存储与分发边界

草稿恢复最后一次写入的参数。点击「保存记录」才会创建可载入的独立快照。并行打开时各快照使用独立键，草稿共用同一个键。记录按来源、浏览器和实验 ID 隔离。分享 HTML 会分享教材，接收者从自己的本地记录开始。

不同浏览器对 file URL 及沙箱嵌入页的存储策略有差异。页面会在 IndexedDB 不可用时提示并继续计算。移动文件、清理浏览器数据或改换平台后，原记录的可用性无法保证。需要稳定的存储来源时可使用固定静态站点地址。记录随文件迁移需要单独的数据导入导出协议。

## 仓库检查

`pnpm lint` 执行 Biome 源码和格式检查、Stylelint 样式检查、MDX 编译和 remark 规则，再检查共享层与实验的导入边界。`pnpm typecheck` 执行严格 TypeScript 检查；MDX 中的组件调用由 MDX 编译和实际运行验证。

`pnpm check` 加上数值测试、TF.js CPU 张量释放测试、全量构建和隔离回归。隔离测试在临时目录生成第二个实验，引入 TF.js 和私有样式，再比较首课 HTML 的 SHA-256，并验证跨实验导入会失败。可单独运行 `pnpm test:isolation`。

视觉和作者约定见 [AGENTS.md](AGENTS.md)。后续如接入在线答疑，需要另行定义联网入口、凭证和允许发送的上下文，离线版本可沿用现有正文定位。
