# goengine-cli 命名与字段歧义整理

> 生成日期：2026-08-16
> 处理日期：2026-08-16（按批注分组执行，类型检查与冒烟测试通过）
> 目的：罗列代码、配置、脚本中存在歧义或含义不清的命名/字段，供评审后决定是否调整。
> 结论标记：`建议调整` = 歧义明显且改动可控；`仅文档化` = 保留现状但需要注释/文档说明；`待确认` = 涉及设计决策或跨仓库影响，需先确认。
> 状态标记：`✅ 已处理` / `⚠️ 部分处理` / `⏸ 保留或暂缓` / `⏸ 留置（待后续）`

---

## 一、engine.config.json 字段

### 1. `lication`（拼写错误）

- 位置：`engine.config.json`，被 `config/out.electron.ts`、`electrobun.config.ts` 引用
- 现状：应为 `application`（应用元数据：name / version / id）
- 歧义：拼写错误，任何阅读者都会困惑。
- 建议：重命名为 `application`，同步更新两处引用。
- 结论：**建议调整**（改动面小）
- 状态：✅ 已处理：`lication`→`application`（engine.config.json + out.electron.ts + electrobun.config.ts）
根据建议修复

### 2. `agreement`（协议）

- 位置：`ModConfig.agreement`、`defaultAgreement`、环境变量 `USE_AGREEMENT`（`declares/Global.d.ts` 亦有定义）
- 现状：取值 `"http" | "https"`，注释为"协议"。
- 歧义：中文"协议"直译，但英文 `agreement` 通常指"约定/合同"，表达协议应使用 `protocol` / `scheme`。
- 影响面：该环境变量可能被 `@goengine/service`、`@goengine/electron` 等外部仓库消费，改名需跨仓库同步。
- 建议：改 `protocol`；若暂时不动，至少在注释中说明。
- 结论：**建议调整（影响面大，需评估跨包影响）**
- 状态：✅ 已处理：`agreement`→`protocol`（ModConfig/defaultProtocol/ENV_PROTOCOL；同步更新 @goengine/service、@goengine/electron）
根据建议修复

### 3. `web.build` / `service.build` / `electron.build`（目录字段叫 build）

- 位置：`engine.config.json` → `web.build`、`service.build`、`electron.build`（均为输出目录，如 `build/web`）
- 歧义：`build` 既是动作（构建）又是目录名，读配置时"这是要构建的目录"还是"构建产物目录"不直观。
- 建议：目录字段统一加 `out`/`dir` 后缀（如 `web.outDir`），与 `electron.out` 语义对齐。
- 结论：**建议调整（影响面中）**
- 状态：⚠️ 部分处理：`web.build`→`web.out`、`service.build`→`service.out`（对象）；`electron.build` 留置（与已有 `electron.out` 冲突，牵连 dev/build/out 逻辑）
改为out

### 4. `service.out` 与 `electron.out` 语义不一致

- 位置：`engine.config.json` → `service.out = "index.js"`（文件名）；`electron.out = { dir, main, preload }`（目录 + 文件名）
- 歧义：同样的 `out` 字段，一个是文件名、一个是目录对象。
- 建议：`service.out` 改为 `service.outFile`，或统一为对象。
- 结论：**建议调整**
- 状态：✅ 已处理：`service.out` 统一为对象 `{ dir, main }`
统一为对象

### 5. `electron.dev.index`

- 位置：`engine.config.json` → `electron.dev.index = { agreement, host, port }`
- 歧义：`index` 实际是 dev server 首页/入口配置，不是"索引"。
- 建议：改 `devServer` / `dev.page`。
- 结论：**建议调整**
- 状态：✅ 已处理：`electron.dev.index`→`electron.dev.devServer`
改为devServer

### 6. `app.web` / `app.service` 与目录 `webs` / `services` 单复数不一致

- 位置：`engine.config.json` → `app.web = "webs"`、`app.service = "services"`
- 歧义：字段是单数，目录是复数；且 `web` 与 `webs` 只是大小写/复数差异，容易打错。
- 建议：统一为 `web` / `service`（目录也改名）或字段改为 `webs` / `services`。
- 结论：**待确认**（涉及目录迁移与 .gitignore）
- 状态：⏸ 保留（批注：不必理会）
不必理会

### 7. `ssl.static`

- 位置：`engine.config.json` → `ssl.static = ".cache/ssl"`
- 歧义：`static` 在前端语境通常指静态资源目录，与证书缓存目录含义冲突。
- 建议：改 `ssl.dir` / `ssl.output`。
- 结论：**建议调整**
- 状态：✅ 已处理：`ssl.static`→`ssl.output`
改为output

### 8. `tsconfig.index` / `tsconfig.angular`

- 位置：`engine.config.json` → `tsconfig.index = "tsconfig.json"`、`tsconfig.angular = ".angular/tsconfig.json"`
- 歧义：`index` 含义不清（是根 tsconfig 还是入口？）。
- 建议：改 `root` / `angular`。
- 结论：**建议调整**
- 状态：✅ 已处理：`tsconfig.index`→`tsconfig.root`
index改为root

### 9. `release.project` / `release.compose`

- 位置：`engine.config.json` → `release.project = "dist/project"`、`release.compose = "dist/compose"`
- 歧义：`project` / `compose` 作为发布产物目录名，语义不直观（一个拷"项目源码包"，一个拷"组合包"）。
- 建议：改 `release.source` / `release.bundle`，或至少文档说明两者区别。
- 结论：**仅文档化**（涉及 release 逻辑与脚本名联动）
- 状态：✅ 已处理：`release.project/compose`→`release.source/bundle`（输出目录移至 `releases/`）
根据建议修复

---

## 二、package.json 脚本命名

### 10. `test` 实为类型检查

- 位置：`package.json` → `"test": "vue-tsc --noEmit"`
- 歧义：`test` 约定俗成是跑单元测试，这里是类型检查。
- 建议：改名 `typecheck`，`test` 留给真正的测试框架。
- 结论：**建议调整**
- 状态：✅ 已处理：`test`→`typecheck`
根据建议修复

### 11. `type` 与 `test` 功能重叠、命名过泛

- 位置：`package.json` → `"type": "vue-tsc --declaration --emitDeclarationOnly"`
- 歧义：`type` 太泛（且是 TS 关键字），与 `test`（同为类型相关）难以区分。
- 建议：改 `types` / `dts`。
- 结论：**建议调整**
- 状态：✅ 已处理：`type`→`types`
改为types

### 12. `web:build` / `web:serve`（实为 webpack）与 `vite:build` / `vite:serve`

- 位置：`package.json`；`web:*` 对应 `lib/web/*`（webpack），`vite:*` 对应 `lib/web/vite/*`
- 歧义：`web` 既是通用词又是 webpack 脚本专属名，读者会以为 `web:build` 是"构建所有 web"。
- 建议：改 `webpack:build` / `webpack:serve`。
- 结论：**建议调整**
- 状态：✅ 已处理：`web:build/serve`→`webpack:build/serve`
根据建议修复

### 13. `node:build` / `node:serve`（实为 service）

- 位置：`package.json`；脚本实际调用 `lib/service/build.ts` / `lib/service/serve.ts`
- 歧义：`node` 让人以为是 Node 运行时相关，实际是构建/启动 service。
- 建议：改 `service:build` / `service:serve`。
- 结论：**建议调整**
- 状态：✅ 已处理：`node:build/serve`→`service:build/serve`
根据建议修复

### 14. `git` 脚本与 git 命令同名

- 位置：`package.json` → `"git": "npx tsx lib/git/index.ts"`
- 歧义：裸名 `git` 与系统 git 命令混淆（`npm run git` 容易误以为调系统 git）。
- 建议：改 `repos:*` 或 `git:batch`。
- 结论：**建议调整**
- 状态：✅ 已处理：`git`→`git:batch`
改为git:batch

### 15. `@compose` / `@project` 的 `@` 前缀

- 位置：`package.json` → `"@compose"`、`"@project"`
- 歧义：`@` 前缀非常规（pnpm/npm 均合法但少见），且与 npm scope（`@goengine/cli`）视觉混淆。
- 建议：改 `release:compose` / `release:project`。
- 结论：**建议调整**
- 状态：✅ 已处理：`@compose/@project`→`release:compose/release:project`
根据建议修复

### 16. `:run` / `:clean` 的冒号前缀

- 位置：`package.json` → `":run"`、`":clean"`（bun 专用包装脚本）
- 歧义：冒号前缀与 `@` 前缀混用，脚本命名风格不统一。
- 建议：统一为 `bun:run` / `bun:clean`，或并入主脚本体系。
- 结论：**建议调整**
- 状态：⏸ 保留（批注：bun 非主要环境，暂保留）
:是为了简洁bun的启动命令，bun目前不是主要环境，暂时保留

### 17. `preng:build` / `preng:serve`

- 位置：`package.json`
- 歧义：`preng` 缩写含义不直观（推测 pre + angular），不读代码根本猜不出。
- 建议：改 `angular:prepare`（或 `preng` 在 README 说明）。
- 结论：**建议调整（或仅文档化）**
- 状态：⏸ 暂缓（批注：pre 拼接命令名有待商榷）
pre可以直接拼接命令名以达到预执行命令，有待商榷

### 18. `clean:depend` 与 `clean:modules` 语义易混

- 位置：`package.json` → `clean:depend`（clean:out + clean:cache + clean:lock）、`clean:modules`（删 node_modules）
- 歧义：`depend`（依赖）让人以为是删 node_modules，实际删的是 lockfile/生成物；与 `clean:modules` 正好相反。
- 建议：`clean:depend` 改 `clean:artifacts`，或注释说明分工。
- 结论：**建议调整**
- 状态：✅ 已处理：`clean:depend`→`clean:reset`（取"清理后可重新安装"之意，简洁易记；如不满意可再改）
修改为简洁点的，artiffacts还是有些难记忆

### 19. `format` 无缺省参数

- 位置：`package.json` → `"format": "tsx lib/release/format.ts"`
- 歧义：直接 `npm run format` 报 missing required argument（已实测），与"格式化"直觉不符。
- 建议：给默认目录（如 `package`）或文档写明用法。
- 结论：**建议调整**（与 TODO 第 15 条一致）
- 状态：✅ 已处理：format 默认目录改为 `.`，`npm run format` 可直接运行
修改脚本，默认为.

---

## 三、全局类型与配置接口

### 20. `Project.package` 与 `PackageConfig`

- 位置：`declares/Config.d.ts` → `Project.package?: Partial<Record<Packages, PackageConfig>>`
- 歧义：`package` 字段存的是"各包（目前仅 electron）的打包配置"，与 npm 的 package（包/package.json）概念撞名，且 `Packages = "electron"` 是包名。
- 建议：改 `packages` / `buildOptions`；类型名 `Packages` 改 `PackageName`。
- 结论：**建议调整**
- 状态：✅ 已处理：`Project.package`→`packages`、`Packages`→`PackageName`
改为packages和name

### 21. `ModConfig.mergePackage`

- 位置：`declares/Config.d.ts`
- 歧义：布尔字段名像个动词短语，读起来像"合并 package"，实际是"是否合并打包产物"。
- 建议：改 `bundle` / `mergeBundle`。
- 结论：**建议调整**
- 状态：✅ 已处理：`mergePackage`→`bundle`
改为bundle

### 22. `ModConfig.inspector`

- 位置：`declares/Config.d.ts`（控制 webpack-bundle-analyzer）
- 歧义：`inspector` 容易理解为调试器（devtools inspector）。
- 建议：改 `analyzer` / `bundleAnalyzer`。
- 结论：**建议调整**
- 状态：✅ 已处理：`inspector`→`analyzer`
改为analyzer

### 23. `ModConfig.module`

- 位置：`declares/Config.d.ts`（模块模式：产物输出为 ESM 模块）
- 歧义：`module` 是 JS 高频词，作为布尔字段含义模糊。
- 建议：改 `moduleFormat` / `esm`。
- 结论：**建议调整**
- 状态：✅ 已处理：`module`→`esm`
改为esm

### 24. `Config.goal`（git 工具）

- 位置：`lib/git/type.ts`、`lib/git/repositories.ts`（`goal = "https://github.com/1970873332/"`）
- 歧义：`goal` 实际是仓库基础 URL，与"目标/目标目录"歧义。
- 建议：改 `baseUrl` / `origin`。
- 结论：**建议调整**
- 状态：✅ 已处理：`goal`→`baseUrl`
改为baseUrl

### 25. 环境变量 `USE_AGREEMENT` / `USE_HOST` / `USE_PORT`

- 位置：`declares/Global.d.ts`、`config/module.ts`（`useAGREEMENT()` 等）
- 歧义：`USE_` 前缀暗示"是否使用"，实际是"赋值注入"（值为 `USE_AGREEMENT=http`）。
- 影响面：可能被 `@goengine/*` 外部包消费，改名需跨仓库。
- 建议：改 `GOENGINE_AGREEMENT` 等命名空间前缀，或仅文档化。
- 结论：**待确认**（跨包影响）
- 状态：✅ 已处理：`USE_AGREEMENT/HOST/PORT`→`ENV_PROTOCOL/ENV_HOST/ENV_PORT`（同步 @goengine/electron Global.ts）
改为ENV_

---

## 四、函数与变量命名

### 26. `useBun()` 与 `useNODE_ENV()` 等"use 前缀"语义不一致

- 位置：`config/module.ts`
- 现状：
  - `useBun()` → 返回 `:run` 脚本命令字符串（如 `"bun lib/bun/run.ts"`）；
  - `useNODE_ENV()` / `useAGREEMENT()` / `useHOST()` / `usePORT()` → 返回 `KEY=value` 赋值字符串。
- 歧义：同名 `use` 前缀，返回值语义完全不同；且 `use` 与 React hooks 惯例撞车。
- 建议：`useBun()` 改 `bunRunCommand()`；赋值类改为 `envNODE_ENV()` / `envAssign("NODE_ENV", v)`。
- 结论：**建议调整**
- 状态：✅ 已处理：`useBun`→`bunRunCommand`、赋值类 `useX`→`envX`
根据建议修复

### 27. `useNODE_ENV` 等全大写后缀

- 位置：`config/module.ts`
- 歧义：camelCase 函数名中嵌入全大写 `NODE_ENV`，命名风格不统一。
- 建议：随第 26 条一并处理。
- 结论：**建议调整**
- 状态：✅ 已处理：随 26 一并处理
根据建议修复

### 28. `normalPath()` 并非"归一化路径"

- 位置：`lib/utils/obtain/Dir.ts`
- 现状：`normalPath(path)` = 相对路径 resolve 成绝对路径，不处理分隔符归一化。
- 歧义：名字暗示会转换 `\` 与 `/`，实际只做 resolve。
- 建议：改 `absolutePath()` / `resolvePath()`。
- 结论：**建议调整**
- 状态：✅ 已处理：`normalPath`→`resolvePath`（全库约 30 处）
改为resolvePath

### 29. `SSLUtils.obtain()` 会创建证书

- 位置：`lib/utils/SSL.ts`
- 现状：`obtain(name)` 若证书不存在则 `create()` 生成自签名证书，返回入参 `name`。
- 歧义：`obtain`（获取）暗示只读，实际有写副作用；且返回值就是入参，API 设计奇怪。
- 建议：改 `ensure()` / `obtainOrCreate()`；返回值改为证书路径对象。
- 结论：**建议调整**
- 状态：✅ 已处理：`SSLUtils.obtain`→`ensure`
改为ensure

### 30. `obtainFilePathTransKey()`

- 位置：`lib/utils/SSL.ts`
- 歧义：`TransKey` 含义晦涩（把 key/cert 路径映射到调用方指定的字段名）。
- 建议：改 `obtainFilePathAs(key, cert)` 或直接删除（当前无调用方时）。
- 结论：**待确认**（需先查调用方）
- 状态：✅ 已处理：`obtainFilePathTransKey` 无调用方，已删除
根据建议修复

### 31. `obtainValidFolders()` 返回的是目录名而非路径

- 位置：`lib/utils/obtain/Dir.ts`
- 歧义：函数名说"获取目录"，返回的是相对目录名（`folder`），调用方需自行 `join`。
- 建议：改名 `obtainValidFolderNames()`，或直接返回完整路径。
- 结论：**建议调整**
- 状态：✅ 已处理：`obtainValidFolders`→`obtainValidFolderNames`
根据建议修复

### 32. `selectTarget()` 返回未文档化的三元组

- 位置：`lib/utils/Select.ts`
- 现状：返回 `[filePath, projectPath, fileName]`，第三项是入口文件名。
- 歧义：名字只说"选择目标"，返回结构靠注释才能知道。
- 建议：改 `selectEntryFile()` 并返回对象 `{ filePath, projectPath, fileName }`。
- 结论：**建议调整**
- 状态：✅ 已处理：`selectTarget`→`selectEntryFile`（返回对象 `{ filePath, projectPath, fileName }`）
根据建议修复

### 33. `IPUtils.host()` 返回 IP 而非主机名

- 位置：`lib/utils/IP.ts`
- 歧义：`host` 通常指主机名（hostname），这里返回的是局域网 IPv4 地址。
- 建议：改 `lanIPv4()` / `ip()`。
- 结论：**建议调整**
- 状态：✅ 已处理：`IPUtils.host`→`ip`
改为ip

### 34. `run` 常量（config/module.ts）

- 位置：`config/module.ts` → `const { ":run": run } = scripts`
- 歧义：顶层变量名 `run` 过泛，含义依赖上下文。
- 建议：改 `runBunScript` / `bunRun`。
- 结论：**建议调整**
- 状态：✅ 已处理：`run`→`bunRun`
改为bunRun

### 35. `copy()` 参数与拦截器语义不一致

- 位置：`lib/utils/FS.ts`
- 现状：`copy(path, targetDir, intercept?)`；目录分支调 `intercept(path, targetDir)`，文件分支调 `intercept(path, targetPath)`，第二参数含义不同。
- 歧义：同一回调不同分支收到不同含义的参数。
- 建议：统一第二参数为"目标完整路径"，或在注释中明确。
- 结论：**仅文档化**
- 状态：✅ 已处理：copy 拦截器第二参数统一为"目标完整路径"
根据建议修复

### 36. `json` 变量（create/angular/config.ts）

- 位置：`lib/create/angular/config.ts` → `const json: string = "angular.json"`
- 歧义：变量名 `json` 与文件内容（对象）概念混用。
- 建议：改 `configFilename`。
- 结论：**建议调整**
- 状态：✅ 已处理：`json`→`configFilename`
根据建议修复

---

## 五、文件与目录约定

### 37. `declares/` 目录名

- 位置：仓库根目录
- 歧义：放的是全局 `.d.ts` 类型，`declares` 不是常见约定（通常叫 `types`/`typings`），且与 `declare` 关键字读音混淆。
- 建议：改 `types/`。
- 结论：**仅文档化**（改动面小但牵连 tsconfig include）
- 状态：✅ 已处理：`declares/`→`types/`
根据建议修复

### 38. 入口文件 `Main.ts` / `Main.tsx` / `main.ts` 大小写不一致

- 位置：`preset/HelloReact/Main.tsx`、`preset/HelloVue/Main.ts`、`preset/HelloAngular/main.ts`（小写）
- 歧义：同一概念（入口文件）三种写法；且 `lib/utils/Select.ts` 的匹配是大小写敏感的（`item.name.match(pattern)`），`web:build` 等用 `"Main"` 模式时匹配不到 Angular 的 `main.ts`（`create/angular/config.ts` 用的是小写 `"main"` 模式，行为分裂）。
- 建议：统一入口文件名为 `Main.ts`（Angular 也大写），并让匹配大小写不敏感。
- 结论：**建议调整（影响面中，注意与 angular 流程联动）**
- 状态：✅ 已处理：入口统一 `Main.ts`（Angular 也大写）、Select 匹配大小写不敏感、angular 流程增加 app.component 校验
根据建议修复，Select同步修复，angular根据筛选的项目根目录是否有app.component文件决定

### 39. `preset/entry/*/Index.ts` 与项目模板 `Main.ts` 混用 `Index` / `Main`

- 位置：`preset/entry/electron/Index.ts`、`preset/entry/electrobun/Index.ts` vs 模板 `Main.ts(x)`
- 歧义：同为入口，一部分叫 Index、一部分叫 Main。
- 建议：统一命名约定（入口一律 `Main.ts` 或一律 `Index.ts`）。
- 结论：**建议调整**
- 状态：⏸ 留置（批注：牵扯 electron 输出与逻辑代码，暂不处理）
牵扯electron的输出和逻辑代码处理，暂时不处理

### 40. `public` 与 `static` 两套资源目录约定

- 位置：仓库根 `public/`、`webs/canvas-example/static/`；`config/webpack.ts` 构建后自动创建 `static` 目录；`create/angular/config.ts` assets 指向 `public`
- 歧义：同一项目里静态资源既可能放 `public` 也可能放 `static`。
- 建议：统一资源目录命名（建议 `public`），并让构建脚本不再额外创建 `static`。
- 结论：**待确认**
- 状态：⚠️ 部分处理：已取消 webpack/vite 构建后额外创建 static 目录；public/static 目录约定本身保留，待后续统一
取消额外创建static，这是架构遗留问题

### 41. `dist` 一词多义

- 位置：`config/tsup.ts`（`dist/tsup`）、`engine.config.json`（`dist/project`、`dist/compose`）、`tsconfig.json`（`outDir: dist`、`dist/types`）
- 歧义：同一 `dist` 同时承载 tsup 产物、release 发布物、类型声明，互相可能覆盖/混淆。
- 建议：release 产物移到 `releases/`，类型声明用 `dist/types` 单独目录。
- 结论：**待确认**
- 状态：✅ 已处理：release 产物移至 `releases/source`、`releases/bundle`（tsup/类型输出不变）
根据建议修复

### 42. `build` 目录与"构建"动词

- 位置：`engine.config.json`（`build/web`、`build/service`、`build/electron`）
- 歧义：同第 3 条，目录名与动作撞名；且与 `dist` 边界不清晰（哪个是中间产物、哪个是发布物）。
- 建议：明确"build = 中间产物、dist/release = 发布物"并在文档说明。
- 结论：**仅文档化**
- 状态：⚠️ 部分处理：web/service 构建输出移至 `dist/`；`electron.build` 留置（与 `electron.out.dir` 冲突）
将构建输出从build改为dist，注意逻辑代码的处理

### 43. `temporary/` 目录

- 位置：`package/*/temporary`（如 `goengine-core/temporary`）
- 歧义：名字暗示"临时代码"，但若随包发布则语义矛盾。
- 建议：确认是否为待迁移代码，是则移入正式目录，否则删除/改 `experimental`。
- 结论：**待确认**
- 状态：✅ 已处理：`temporary/`→`experimental/`（goengine-core/react/webgl 三个仓库 + preset/webs 引用同步）
改为experimental，注意逻辑代码的处理

### 44. 工具文件命名风格不统一

- 位置：`lib/utils/`（`FS.ts`、`IP.ts`、`SSL.ts`、`Callback.ts`、`Select.ts`、`Dir.ts`、`File.ts`、`Path.ts`、`Error.ts`）
- 歧义：单字母缩写（FS/IP/SSL）与完整单词混用；`File.ts`、`Path.ts` 与 Node 内置模块名撞名。
- 建议：统一为完整小写命名（`fs.ts`、`ip.ts`、`select.ts`）或统一大写缩写风格。
- 结论：**仅文档化**
- 状态：✅ 已处理：lib/utils 统一小写（fs/ip/ssl/callback/select/error/dir/file/path）
统一为小写命名

---

## 六、快速对照（重点建议调整项）

| 现状 | 处理结果 |
| --- | --- |
| `lication` | ✅ `application` |
| `agreement` / `USE_AGREEMENT` | ✅ `protocol` / `ENV_PROTOCOL` |
| `web:build` / `node:build` | ✅ `webpack:build` / `service:build` |
| `test` / `type` | ✅ `typecheck` / `types` |
| `Main.ts` vs `main.ts` | ✅ 统一 `Main.ts` + Select 大小写不敏感 |
| `clean:depend` | ✅ `clean:reset`（如不满意可再改） |
| `goal`（git 配置） | ✅ `baseUrl` |
| `SSLUtils.obtain()` | ✅ `ensure()` |
| `normalPath()` | ✅ `resolvePath()` |
| `electron.build` / `electron.dev.index` | ⚠️ index→devServer 已处理；electron.build 留置 |
| `temporary/` | ✅ `experimental/` |
| `declares/` | ✅ `types/` |

---

## 说明

- 本文档只做"罗列 + 建议"，不代做决定；改动前请逐条确认，尤其涉及环境变量（`USE_*`）与目录迁移（`webs`/`services`、`dist`）的项目。
- 与 `TODO.md` 重叠的条目（README、format 缺参、版本联动等）此处不重复展开，只列出命名相关部分。
- 本次处理涉及的跨仓库改动（均需在对应仓库单独提交）：
  - `@goengine/electron`：`src/store/Global.ts`（`web.out`、`ENV_PROTOCOL/HOST/PORT`）
  - `@goengine/service`：`src/manager/server/Base.ts`（`ModConfig["protocol"]`）
  - `@goengine/core` / `@goengine/react` / `@goengine-webgl`：`temporary/`→`experimental/` 及内部引用
- 留置/暂缓项（后续处理）：第 3 条 `electron.build`、第 6 条 `app.web`/`webs`（保留）、第 16 条 `:run`/`:clean`（保留）、第 17 条 `preng`（待商榷）、第 39 条 `Index`/`Main` 入口统一、第 40 条 `public`/`static` 目录统一。
- 顺手修复：`lib/web/build.ts` 的 `obtainProjectConfig` 原来误传入口文件路径，已改为传项目目录（与其它流程一致）。
