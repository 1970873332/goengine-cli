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

## E3. tsconfig 编辑器映射（扩展）✅

- `create:web` / `init:web` 生成的 tsconfig.json 写入 CLI 仓库**绝对路径**，让编辑器（TS / Volar）解析 `@goengine/*` 源码：
  - `paths`：仅 `@goengine/*` → `<cli>/package/goengine-*`（框架依赖由用户项目与各包自行安装，走标准 node_modules 解析，不再映射）；
  - `typeRoots`：`<cli>/node_modules/@types`；
  - `include`：追加 `<cli>/lib/types/**/*.d.ts`（包源码依赖的全局类型声明）。
- 新增 `init:web` 命令：按 `angular.json` / `Main.tsx` / `Main.ts` 推断项目类型，为当前目录生成或更新 tsconfig.json，并同步 package.json 补齐当前类型缺失的框架依赖（仅添加，不改动已有字段与版本）。
- 依赖前提：CLI 以本地仓库方式提供（`package/` 与 `lib/types/` 存在）；发布为纯 `dist` 安装包时不适用，应改为把 `@goengine/*` 作为项目真实依赖安装。

## E4. 依赖归属调整（扩展）✅

- 移除 goengine-cli 中 all three.js 相关代码与依赖：
  - `goengine-core`：删除 `experimental/object/three/*`、`experimental/util/Three.ts`；`src/component/draw/Scene.ts` 移除 three Stats 性能统计；
  - `goengine-webgl`：删除 `experimental/Resource.ts`、`src/material/node/Mesh.ts`（内部无引用）；
  - 依赖：`three` / `@types/three` 从 `goengine-core`、`goengine-webgl` 与 CLI 根 devDependencies 移除；
  - `GPUCanvasContext`（原由 `@types/three` 连带 `@webgpu/types` 提供）改为在 `lib/types/global.d.ts` 声明。
- 移除 goengine-cli 中 matter-js 相关代码与依赖：
  - `goengine-core`：删除 `experimental/object/matter/Base.ts`、`experimental/util/Matter.ts`、`experimental/object/physics/Index.ts` 与 `nodes/Matter2D.ts`（保留通用且无 matter 依赖的 `physics/Base.ts`）；
  - `goengine-webgl`：删除 `experimental/Collision2D.ts`（仓库内唯一引用 Matter2D 的文件）；
  - 依赖：`matter-js` / `@types/matter-js` 从 `goengine-core`、`goengine-webgl` 的 package.json 移除。
- 用户侧框架依赖不再由 CLI 内置，项目自行安装消费：
  - CLI 根 `dependencies` 移除 `vue` / `vue-router` / `react` / `react-dom` / `react-router-dom`；
  - `@goengine/vue` 的 `vue-router` 由 dependencies 移入 peerDependencies；
  - vite 配置中框架别名改指向项目自身 `node_modules`（`process.cwd()`），`@goengine/*` 仍指向 CLI 工作区；
  - 脚手架为 React 项目补充 `@types/react` / `@types/react-dom` devDependencies。

## E5. git 命令收归内部（扩展）✅

- `goengine git` 从 CLI 全局命令清单（`lib/dispatch.ts`）移除，不再对用户项目暴露；
- `lib/git/*`（clone / pull / push / status 批量管理 package 子仓库）保留给 goengine-cli 自己消费，通过 `npm run git -- <command>` 调用。

## 验证

- `npm run typecheck`、`npm run build` 通过；
- React demo：create:web 不生成 Project.ts；package.json 含 `appId` / `appName`；项目 engine.config.json 覆盖 `web.out.dir` 后构建输出到自定义目录；
- `electron:dev` 自动生成 `preset/Project.ts`（http / localhost / 8080）并继续启动；
- Angular demo：angular.json index = `index.html`，根目录 `index.html` 含 `<app-root>`。
- 预设按需写入：create:web 后无 `index.html` / `preset/`；`web:build` 自动生成 `preset/entries/webpack.html`；`vite:build` 自动生成带标题的 `index.html`；`electron:build` 自动生成两个 electron 入口；Angular 项目仅有 angular.json，`index.html` 由 ng 命令生成。
