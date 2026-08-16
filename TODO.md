# goengine-cli 遗留问题清单

> 生成日期：2026-08-16
> 同步日期：2026-08-16（逐条标注处理状态）
> 说明：以下为已完成四轮修复（异常处理统一、跨平台问题、隐式问题、命名与字段调整）之后仍待处理的事项。
> 优先级：P0 = 影响可复现/可分发；P1 = 影响工程化/质量；P2 = 细节打磨或待确认。
> 状态标记：`✅ 已处理` / `⚠️ 部分处理` / `⬜ 未处理`

---

## 一、可复现性与工程基建（P0）

### 1. 全新克隆无法开箱即用

- 位置：`.gitignore`（`package`、`webs`、`services` 全部被忽略）
- 问题：新克隆仓库后这 10 个核心包目录根本不存在，必须先手工执行 `npm run git clone` + `install:all`，没有任何引导或提示。
- 建议：README 写清引导步骤；增加预检脚本（检测 `package/*` 是否存在，缺失时给出明确报错与下一步指令）；或考虑 postinstall 自动引导。

- 状态：⬜ 未处理

### 2. package 子仓库未锁定版本

- 位置：`lib/git/repositories.ts`
- 问题：只记录仓库 URL，clone 时拉取默认分支最新提交，不锁定 commit SHA。今天 clone 和明天 clone 的 `@goengine/*` 内容可能不同，构建/发布产物依赖"当时本地状态"，不可复现。
- 建议：给每个仓库增加 `rev`（commit SHA / tag）字段并在 clone 后校验；或改用 pnpm catalogs + 版本发布。

- 状态：⬜ 未处理

### 3. README 空白

- 位置：`README.md`
- 问题：只有一个标题，无项目定位、前置要求（Node >= 24 / pnpm / bun）、搭建步骤、命令表、`engine.config.json` 说明。
- 建议：至少补齐"快速开始"（clone 子仓库 → 安装 → 创建/构建）和命令速查表。

- 状态：⬜ 未处理

### 4. 缺少 LICENSE 文件

- 位置：仓库根目录（`package.json` 声明 `"license": "MIT"`）
- 问题：声明了 MIT 但没有 LICENSE 文件，开源分发不规范。
- 建议：补一份 MIT LICENSE。

- 状态：⬜ 未处理

### 5. 无 CI、无真正的测试、无 Lint

- 位置：`package.json`（`typecheck` 脚本）、仓库根目录
- 问题：
  - `typecheck`（原 `test`）只是 `vue-tsc --noEmit` 类型检查，且只覆盖 Vue 相关文件；
  - 没有任何单元测试；
  - 没有 ESLint；prettier 只有手动 `format` 脚本，无 `--check` 门禁；
  - 仓库无 `.github` CI 配置。
- 建议：为 `lib/utils`、release、git 工具补 Vitest 单测；加 ESLint + `prettier --check`；GitHub Actions 至少跑 Windows + Ubuntu 双平台。

- 状态：⚠️ 部分处理：`test`→`typecheck` 已完成；单元测试 / ESLint / CI 仍缺失
---

## 二、发布与版本管理（P0/P1）

### 6. 版本未联动、元数据为占位

- 位置：根 `package.json` 与 `package/*/package.json`
- 问题：根包与 10 个子包全部是 `0.1.0`，描述全是 "Hello ..."；release 打包（`releases/source_v${version}`）只用根版本号，子包版本不联动，发布物版本语义不可靠。
- 建议：引入 changesets 或 `pnpm -r version` 统一管理版本。

- 状态：⬜ 未处理

### 7. `engine.config.json` 存在拼写错误 `lication`

- 位置：`engine.config.json`（应为 `application`），被 `config/out.electron.ts`、`electrobun.config.ts` 引用
- 建议：统一重命名为 `application` 并同步更新引用处。

- 状态：✅ 已处理：`lication`→`application`（engine.config.json + 引用同步）

### 8. 还不是真正可分发的 CLI

- 位置：根 `package.json`
- 问题：`"private": true`、无 `bin` 字段、无统一入口（命令都散在 npm scripts 里），`@goengine/cli` 目前无法被安装/调用。
- 建议：若定位是 CLI，用 commander（已是依赖）做统一入口 `lib/index.ts` 并声明 `bin`；否则明确它是"项目脚手架工具箱"而非发布物。

- 状态：⬜ 未处理

### 9. 构建产物按时间戳累积，无清理策略

- 位置：`config/webpack.ts`、`config/vite.ts`、`config/out.electron.ts`（输出目录均为 `xxx ${Date.now()}`，如 `dist/web <时间戳>`）
- 问题：每次构建都会产生新目录，旧产物永远不清理；release 打包（`release:compose` / `release:project`）会把 `dist/`、`build/electron` 下所有历史产物一并拷贝，越积越大。
- 建议：构建前清理目标目录，或 release 只拷贝最新产物。

- 状态：⬜ 未处理（输出目录已改 `dist/web`、`dist/service`，时间戳累积问题仍在）

### 10. 提交信息无规范

- 位置：git 历史（全部为"调整架构 / 清理 / 格式化仓库"）
- 问题：无法从历史定位变更，也没有 changelog 基础。
- 建议：后续提交采用 Conventional Commits（feat/fix/refactor/...），并考虑生成 CHANGELOG。

- 状态：⬜ 未处理
---

## 三、依赖与工具链（P1）

### 11. 根 devDependencies 过重

- 位置：根 `package.json`
- 问题：webpack 全家桶 + vite + tsup + Angular CLI + electron-builder + electrobun 全部堆在根包，安装体积大、职责不清。
- 建议：按 workspace 包下沉各自构建链，根包只保留编排工具。

- 状态：⬜ 未处理

### 12. `--shamefully-hoist` 削弱 pnpm 隔离

- 位置：`lib/install.ts`
- 问题：`pnpm install --shamefully-hoist` 把所有依赖提升到根 node_modules，破坏 pnpm 的隔离特性。
- 建议：去掉该选项，若 Angular 等工具需要再单独配置 `public-hoist-pattern`。

- 状态：⬜ 未处理

### 13. npm / pnpm / bun 三套运行方式并存

- 位置：`package.json` scripts、`lib/install.ts`、`lib/bun/*`
- 问题：`install.ts` 会全局安装 pnpm；scripts 里同时用 `npx`、`tsx`、`bun`；`lib/bun/run.ts` 用正则把命令重写成 bun 形式，多一层解析脆弱性。
- 建议：固定一个主运行时（建议 node + tsx），bun 相关脚本降级为可选。

- 状态：⬜ 未处理

### 14. `ncu` 无审查直接升级全部依赖

- 位置：`package.json`（`"ncu": "ncu -u"`）
- 建议：升级前先 `ncu`（dry-run）人工确认，或配合 changesets 记录升级。

- 状态：⬜ 未处理
---

## 四、脚本与工具细节（P1/P2）

### 15. `npm run format` 缺省参数会直接报错

- 位置：`package.json`（`"format": "tsx lib/release/format.ts"`）、`lib/release/format.ts`
- 问题：`format.ts` 的 commander 要求必填 `<directory>`，实测无参数运行时直接 `error: missing required argument 'directory'`，退出码 1。
- 建议：给默认值（如 `package`），或把用法写进 README / 命令帮助。

- 状态：✅ 已处理：默认目录 `.`，`npm run format` 可直接运行

### 16. `obtainProjectConfig` 静默吞错

- 位置：`lib/utils/obtain/file.ts`
- 问题：`catch { return {}; }` 把所有错误（包括 `Project.ts` 语法错误）静默当成"空配置"，排错困难。
- 建议：catch 中记录错误（至少 debug 级别输出），或区分"文件缺失（可回退）"与"解析失败（应报错）"。

- 状态：⬜ 未处理

### 17. `bunRunCommand`（原 `useBun`）相关正则改写脆弱

- 位置：`lib/bun/run.ts`
- 问题：用正则从脚本里提取 `KEY=value` 环境变量（`(\w+)=([^\s]+)`）并替换 `tsx`/`npx`/`rimraf`，值含空格或复杂命令时解析错误；`process.argv.slice(2).pop()` 取最后一个参数，`bun :run npm run dev` 这类多段命令只会拿到最后一段。
- 建议：bun 路径要么改成显式参数传递，要么明确约定"必须整体作为一个参数传入"。

- 状态：⬜ 未处理

### 18. prettier 调用仍依赖 shell + npx

- 位置：`lib/release/format.ts`
- 问题：`spawn("npx", ["prettier", "--write", pattern], { shell: true })`，pattern 是带内嵌引号的整串 glob；当前 Windows/Linux 实测可用，但依赖 cmd/sh 的引号解析，属于脆弱写法；且逐目录串行 spawn。
- 建议：改为 prettier 程序化 API + fast-glob（已是依赖）遍历文件，彻底去掉 shell。

- 状态：⬜ 未处理

### 19. `IPUtils.ip()`（原 `host`）可能返回 `undefined`

- 位置：`lib/utils/ip.ts`（配合 `config/module.ts` 的 `chii()`）
- 问题：找不到 192.168.* 的 IPv4 地址时返回 undefined，chii 服务地址会变成 `undefined://...`。
- 建议：加兜底（回退到 `127.0.0.1` 或遍历所有非内部地址）。

- 状态：⬜ 未处理

### 20. 批量 `git push --force` 无确认

- 位置：`lib/git/index.ts`、`lib/git/lib/push.ts`
- 问题：`--force` 只有一句警告日志，没有二次确认，误操作风险高。
- 建议：force push 前用 inquirer 要求输入确认（如仓库名）或输入 `YES`。

- 状态：⬜ 未处理

### 21. `repositories.ts` 硬编码个人 GitHub 账号

- 位置：`lib/git/repositories.ts`
- 问题：`baseUrl`（原 `goal`）与仓库列表写死 `https://github.com/1970873332/`，开源/共享前需要参数化。
- 建议：改为环境变量 / 配置文件读取，仓库列表支持外部覆盖。

- 状态：⬜ 未处理（`goal`→`baseUrl` 已改名，但 URL 仍硬编码）

### 22. `.pnpm-store` 未被 .gitignore 覆盖

- 位置：仓库根目录（`.pnpm-store/`）
- 问题：当前 git 未跟踪它（未被报告），但 .gitignore 规则没有覆盖，属于"裸奔"状态，容易在其它环境/工具下被误提交。
- 建议：显式加入 `.gitignore`。

- 状态：⬜ 未处理

### 23. `create:web` 生成的项目没有 package.json

- 位置：`preset/HelloReact|HelloVue|HelloAngular`、`lib/create/web.ts`
- 问题：新建项目只有源码，依赖靠根 workspace 统一管理；是否是刻意设计需要文档化，否则新用户会困惑（`webs/canvas-example` 这种手写示例反而有 package.json，行为不一致）。
- 建议：确认设计意图后补文档，或在模板中带上最小 package.json。

- 状态：⬜ 未处理

### 24. compose/project 的 copy 拦截器写法

- 位置：`lib/release/compose.ts`、`lib/release/project.ts`（`throw void 0` 跳过拷贝）
- 问题：用抛异常做流程控制，可读性差（`lib/utils/fs.ts` 拦截器第二参数已统一为完整目标路径，本项剩余问题为 compose/project 的流程控制写法）。
- 建议：保持行为的同时补注释说明，或重构为回调返回 boolean 的跳过机制。

- 状态：⚠️ 部分处理：`fs.ts` 拦截器第二参数已统一；compose/project 的 `throw void 0` 流程控制保留

### 25. 前置条件无检测

- 位置：`lib/install.ts`、`lib/git/index.ts`
- 问题：`package.json` 声明 Node >= 24 / bun >= 1.3，但只有 git 有 `checkGit()` 检测；bun 是否存在、Node 版本是否达标均无检查。
- 建议：install 阶段统一做环境检测并给出清晰提示。

- 状态：⬜ 未处理
---

## 五、待确认的设计决策（P2）

### 26. git 批量工具固定串行

- 位置：`lib/git/repositories.ts`（`parallel: 1`）
- 问题：代码已支持并发（`runWithConcurrency`），但配置固定为 1；确认是有意串行还是想默认并行。

- 状态：⬜ 未处理

### 27. 构建输出目录含空格

- 位置：`config/webpack.ts`、`config/vite.ts`、`config/out.electron.ts`（输出如 `dist/web <时间戳>`）
- 问题：输出路径含空格，对 webpack/vite/electron-builder 无碍，但任何后续用 shell 拼接消费这些路径的脚本都需要引号。
- 建议：保留现状但统一约定（或用无空格时间戳/单独目录）。

- 状态：⬜ 未处理

### 28. `.gitignore` 中 `public/*/` 仅忽略子目录

- 位置：`.gitignore`
- 问题：`public` 顶层文件仍会跟踪（当前只有 favicon.ico）；确认是否需要忽略整个 public。

- 状态：⬜ 未处理
---

## 已完成（此前三轮，不再列入待办）

- 异常处理统一：`lib/utils/Error.ts` + 20 个入口脚本接入 `registerErrorHandlers()`
- 跨平台问题：`clean:depend` 的 `&` → `&&`；shell 拼接路径统一加引号；`clean/modules.ts`、`bun/clean.ts` 改用 rimraf 程序化 API；`electron/dev.ts` bun 分支显式传参；`format.ts` 的 Windows 路径分隔符
- 隐式问题：`copyFile` 补 `await`；`git --help` 识别与退出码；消除 `throw console.error/warn`、`throw void 0`；`useBun()` 改用 `process.execPath` 判断；`vite build` / `electronBuild` 补 `await`；dev server 启动失败退出

## 已完成（第四轮：命名与字段调整，2026-08-16）

- 配置字段：`lication`→`application`、`agreement`→`protocol`、`web.build`→`web.out`、`service.*` 统一为 `out` 对象、`electron.dev.index`→`devServer`、`ssl.static`→`output`、`tsconfig.index`→`root`、`release.*`→`source/bundle`（移至 `releases/`）
- 脚本命名：`test`→`typecheck`、`type`→`types`、`web:*`→`webpack:*`、`node:*`→`service:*`、`git`→`git:batch`、`@compose/@project`→`release:*`、`clean:depend`→`clean:reset`；`format` 默认目录 `.`
- 类型与函数：`Project.package`→`packages`、`mergePackage`→`bundle`、`inspector`→`analyzer`、`module`→`esm`、`goal`→`baseUrl`、`USE_*`→`ENV_*`、`useX`→`envX`/`bunRunCommand`、`normalPath`→`resolvePath`、`SSLUtils.obtain`→`ensure`、删除 `obtainFilePathTransKey`、`selectTarget`→`selectEntryFile`（对象返回）、`IPUtils.host`→`ip`、`json`→`configFilename`
- 目录与文件：`declares/`→`types/`、`temporary/`→`experimental/`（跨 3 个外部仓库）、lib/utils 统一小写；入口统一 `Main.ts` + Select 大小写不敏感 + angular app.component 校验
- 其他：取消 webpack/vite 构建后额外创建 static 目录；`lib/web/build.ts` 修复 `obtainProjectConfig` 传参错误
