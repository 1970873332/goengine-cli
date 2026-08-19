# engine.config.json 配置审查（实施记录）

## A. web.out 结构统一 ✅

- `web.out` 改为 `{ "dir": "dist/web" }`；scaffold / webpack / vite / electron / angular 消费方已同步为 `web.out.dir`。

## B. 移除 html 配置项 ✅

- 删除 `html.{webpack,angular,vite}`；`webpack` 提升为根字段（`webpack: { input, out }`）；
- angular / vite 入口名统一为固定约定 `index.html`（`INDEX_HTML` 常量），脚手架写项目根 `index.html`；
- vite 的 rollup input 与模板、angular.json 的 index、electron 探测候选均同步。

## C. Electron 打包显示名 ✅

- package.json 新增 `appName` 字段（默认等于项目名）；`electron:out` 优先读 `packages.electron.name` → `appName` → `name`。

## D. 项目布局合并 ✅

- `module.ts` 新增 `projectConfig()`：项目存在 engine.config.json 时与 CLI 默认深合并（项目优先），缺失时返回 CLI 默认（默认不写入）；
- 全部运行期消费方改用 `projectConfig()`（webpack / vite / electron / service / scaffold / ssl / file 等）；CLI 构建（tsup）仍用仓库配置。

## E. Project.ts 可选 + electron:dev 按需写入 ✅

- create:web 不再写入 Project.ts；
- `electron:dev` 校验 `application.config` 指向的 Project.ts，缺失时用预设模板 + 默认常量写入后再读取；
- 其他命令缺失时回退默认常量（`defaultProtocol` / `DEFAULT_HOST` / `DEFAULT_PORT`）。

## E2. 预设入口按需写入（扩展）✅

- create:web 默认不再写入任何预设入口（`preset/entries/webpack.html`、`preset/entries/electron/*`、项目根 `index.html`）；
- 新增 `lib/utils/preset.ts`：`ensurePresetEntry`（复制预设入口）与 `ensureIndexHtml`（按模板生成入口页并注入标题）；
- 消费命令接入：
  - `web:build` / `web:serve` → 按需写入 `webpack.input`；
  - `vite:build` / `vite:serve` → 按需写入根 `index.html`（通用模板）；
  - `ng:build` / `ng:serve` → 按需写入根 `index.html`（Angular 模板）；
  - `electron:build` → 按需写入主进程 / 预加载入口模板。

## 验证

- `npm run typecheck`、`npm run build` 通过；
- React demo：create:web 不生成 Project.ts；package.json 含 `appId` / `appName`；项目 engine.config.json 覆盖 `web.out.dir` 后构建输出到自定义目录；
- `electron:dev` 自动生成 `preset/Project.ts`（http / localhost / 8080）并继续启动；
- Angular demo：angular.json index = `index.html`，根目录 `index.html` 含 `<app-root>`。
- 预设按需写入：create:web 后无 `index.html` / `preset/`；`web:build` 自动生成 `preset/entries/webpack.html`；`vite:build` 自动生成带标题的 `index.html`；`electron:build` 自动生成两个 electron 入口；Angular 项目仅有 angular.json，`index.html` 由 ng 命令生成。
