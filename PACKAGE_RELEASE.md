# package/* 本地库与后期全面发布说明

## 一、现状：本地库模式

- `package/` 下共 10 个 workspace 包：`@goengine/{angular,canvas,core,electrobun,electron,react,service,vue,web,webgl}`，版本均为 `0.1.0`，各自是独立 git 仓库。
- `goengine-cli` 主仓库的 `.gitignore` 忽略 `package/`（`# 工作区`），`package/*` 的改动不进入主仓库 git；各包在其自身仓库提交（如 `goengine-electron` 推送到 GitHub）。
- CLI 构建（tsup `noExternal: [/^@goengine\//]`）把 workspace 包源码直接内联进 `dist/`。
- 运行期 webpack / vite / esbuild 从 CLI 自身解析 `@goengine/*`：本地开发是 junction 指向 `package/`，发布安装后回退 `node_modules` 真实目录。
- 用户项目无需安装 `@goengine/*`；**框架依赖（vue / vue-router / react / react-dom / react-router-dom）由用户项目安装并自主消费**，CLI 不再内置（vite 别名指向项目 `node_modules`，生成 tsconfig 仅映射 `@goengine/*`，框架包走标准解析）。
- `goengine typecheck` 为全局命令：类型检查器（`vue-tsc` / `tsc` / `ngc`）由 CLI 依赖内置并提供，用户项目仅需安装框架本体与类型包（React 的 `@types/*`、Angular 的 `@angular/compiler-cli` 等），不额外引入检查工具依赖。
- three.js 相关代码与依赖已从 `goengine-core` / `goengine-webgl` / CLI 根依赖移除；需要 three 的用户项目自行安装。
- matter-js 相关代码与依赖已移除：`goengine-core` 的 matter 场景 / Matter2D 物理节点 / Matter 工具类、`goengine-webgl` 的 Collision2D 一并删除；需要物理引擎的项目自行引入。
- 无独立版本发布流程，版本统一停留在 `0.1.0`。

## 二、后期：全面发布（npm）模式

- 各 `@goengine/*` 独立发布到 npm registry，拥有独立 semver。
- `goengine-cli` 的依赖声明由 `workspace:*` 切换为 registry 版本范围。
- 用户项目可自行 `npm install @goengine/*`，也可继续依赖 CLI 内置。

## 三、流程差异对比

| 维度 | 本地库模式 | 全面发布模式 |
| --- | --- | --- |
| 开发 | 源码在 `package/`，CLI 直接内联 | 各包独立仓库 + 独立构建产物 |
| 构建 | tsup `noExternal` 打进 CLI | 各包独立 build（tsup / tsc）→ `dist/`，配置 `main` / `exports` |
| 依赖声明 | `workspace:*` | `^x.y.z`（registry） |
| 运行期解析 | CLI `node_modules` + 别名 | 优先项目 `node_modules`，其次 CLI |
| 版本 | 统一 `0.1.0`，无发布 | 独立 semver + changelog + tag |
| 发布 | 各自 git 提交 | `npm publish` + CI 自动发布 |
| 用户侧 | 无需安装 | 按需安装 |
| 框架版本 | 由 CLI 锁定 | 各包 peerDependencies 声明 |

## 四、需要调整的改动清单

### 每个 `@goengine/*` 包

1. `package.json` 补齐发布元数据：`main` / `exports` / `types` / `files`、`private: false`；
2. 增加构建脚本，输出 `dist/`（保留源码目录结构，深路径导入如 `@goengine/electron/src/...` 需有对应 `exports` 子路径或保持目录可访问）；
3. 用 `peerDependencies` 声明框架依赖（react / vue / `@angular/*`），版本与 CLI 内置一致；
4. 制定版本策略与 changelog 规范。

### goengine-cli 侧

1. 依赖声明：`workspace:*` → registry 版本范围；
2. tsup 配置：评估移除 `noExternal` 后各包是否 external（决定包体积与版本同步策略）；
3. 运行期解析：webpack / vite / esbuild 的 `resolveGoenginePackage` 与别名需兼容“项目内已安装”场景（优先项目 `node_modules`，其次 CLI）；
4. `install:all`、`electron:out` 的版本来源（如 `@goengine/electron` 的 devDependencies）改为从 registry 版本读取；
5. 深路径导入审查：`@goengine/electron/src/...` 等导入在发布包中是否仍可解析。

## 五、迁移建议（渐进式）

1. 先补齐各包构建与发布元数据（不改变本地模式行为）；
2. 用 npm 私有 registry 或 `npm pack` 本地演练“发布 → 安装”；
3. CLI 侧改造解析优先级（项目 `node_modules` 优先）并全链路测试三种框架；
4. 全部就绪后切换依赖声明并移除 `noExternal`。

## 六、当前边界与风险

- `package/` 改动不进入 goengine-cli 主仓库 git，版本无法统一管理；
- 本地 junction 与发布安装的路径差异（`resolveGoenginePackage` 的开发 / 发布分支）需要持续维护；
- 若长期本地化，建议评估将 workspace 并入主仓库或引入 monorepo 工具（pnpm workspace + changesets），统一版本与发布。
