# GoEngine CLI 调整与优化方案

> 本方案针对 GoEngine CLI 主体，暂不包含 `render2/`。
>
> 目标：在不破坏现有命令使用方式的前提下，逐步提升 CLI 的稳定性、可测试性、发布能力和长期可维护性。

## 一、总体目标

逐步将项目调整为：

```text
稳定的命令层
    ↓
统一的参数与错误处理
    ↓
可测试的业务服务层
    ↓
Webpack / Vite / Angular / Electron / Service 适配层
    ↓
统一配置、资源和依赖解析
```

重点解决：

1. 命令模块依赖顶层副作用，测试和复用困难。
2. 本地 workspace 模式与 npm 发布模式耦合。
3. 参数、错误、日志和退出码缺少统一规范。
4. 缺少发布态、跨平台和端到端测试。

## 二、实施原则

- 优先修复稳定性问题，再进行目录和抽象调整。
- 保持现有用户命令兼容，内部逐步迁移。
- 每个阶段都应有可验证的结果，避免一次性大重构。
- workspace 开发态和 npm 发布态必须分别验证。
- 业务逻辑尽量使用纯函数或显式参数，减少全局状态和隐式副作用。

## 三、实施阶段

### P0：稳定性基础

目标：不改变现有功能，先建立可靠的验证和错误基础。

任务：

- [ ] 增加单元测试和 CLI 集成测试基础设施。
- [ ] 增加统一错误类型，例如 `CommandError`。
- [ ] 统一命令退出码。
- [ ] 抽取基础 Logger，统一成功、警告、错误和调试输出。
- [ ] 检查 Node 版本要求与构建 target 是否一致。
- [ ] 增加 `npm pack` 后的发布包 smoke test。
- [ ] 验证发布包内 `preset`、配置和静态资源路径。

建议退出码：

| 场景 | 退出码 |
| --- | ---: |
| 未知异常 | 1 |
| 参数错误 | 2 |
| 项目配置错误 | 3 |
| 外部工具执行失败 | 4 |
| 构建失败 | 5 |

验收标准：

- `npm run build` 通过。
- `npm pack` 生成的包可以安装。
- 临时项目可以执行 `goengine --help`、`goengine --version` 和 `goengine create:web`。
- 构建失败时能够返回非零退出码和明确错误信息。

### P1：命令层重构

目标：消除 import 即执行和全局 `process.argv` 修改。

当前部分命令通过模块顶层代码自动执行：

```ts
await runCreateWeb(process.argv.slice(2));
```

统一命令入口：

```ts
export async function run(args: string[]): Promise<void> {
    // 参数解析与业务逻辑
}
```

CLI 顶层负责调用：

```ts
const command = await spec.load();
await command.run(args);
```

迁移范围：

- [ ] `lib/create/web.ts`
- [ ] `lib/create/init.ts`
- [ ] `lib/typecheck/index.ts`
- [ ] `lib/web/*`
- [ ] `lib/angular/*`
- [ ] `lib/electron/*`
- [ ] `lib/service/*`
- [ ] 移除或逐步废弃 `runModule()` 对 `process.argv` 的依赖。

建议新增：

```text
lib/command/
├── context.ts
├── errors.ts
├── result.ts
└── types.ts
```

```ts
export interface CommandContext {
    cwd: string;
    args: string[];
    logger: Logger;
    config: EngineConfig;
}
```

验收标准：

- 命令模块被 import 时不执行实际命令。
- 测试可以直接调用 `run(args)`。
- 业务代码不再直接修改 `process.argv`。
- 业务代码尽量不直接调用 `process.exit()`。

### P2：参数与错误处理统一

目标：让所有公开命令具有一致的参数体验。

建议继续使用 Commander，但统一封装参数定义，避免每个命令重复处理。

建议支持：

- `--name demo`
- `--name=demo`
- 缺少参数时给出明确提示
- 参数类型和取值校验
- 统一 `--help`
- 统一 `--verbose`
- 统一 `--quiet`
- 统一 `--dry-run`
- 统一 `--cwd <dir>`
- 统一 `--config <file>`

建议新增：

```text
lib/args/
├── common.ts
├── create.ts
└── types.ts
```

验收标准：

- 所有公开命令的参数错误格式一致。
- `--cwd` 可以指定项目目录。
- `--config` 可以指定配置文件。
- CI 环境下不会意外进入交互式输入。

### P3：配置系统重构

目标：建立稳定、可校验、可扩展的配置加载机制。

配置优先级：

```text
内置默认配置
    ↓
项目 engine.config.json
    ↓
环境变量
    ↓
命令行参数
```

建议新增：

```text
lib/config/
├── defaults.ts
├── loader.ts
├── merge.ts
├── schema.ts
└── module.ts
```

重点校验：

- 输出目录
- 端口范围
- Webpack/Vite/Electron 配置
- `application.entry`
- Electron 输入和输出文件
- Service 输出配置

建议加入配置版本：

```json
{
    "version": 1
}
```

验收标准：

- 配置只加载一次，并通过命令上下文传递。
- 配置错误在进入底层构建工具前被发现。
- 配置结构未来变更时可以执行迁移。

### P4：本地 workspace 与发布模式解耦

目标：让本地开发模式和 npm 安装后的 CLI 都能够正常工作。

当前部分逻辑依赖 `package/`、`lib/types/`、workspace 包源码和本地绝对路径。

建议新增：

```text
lib/runtime/
├── mode.ts
├── package-resolver.ts
├── asset-resolver.ts
└── type-resolver.ts
```

运行模式：

```ts
type RuntimeMode = "workspace" | "published";
```

统一包解析优先级：

```text
用户项目 node_modules/@goengine/*
    ↓
CLI 自身 node_modules/@goengine/*
    ↓
本地 workspace package/*
```

逐步减少深路径导入：

```ts
import { HTTPSServerManager } from "@goengine/service";
```

如确实需要子路径，应通过 `package.json.exports` 明确声明。

验收标准：

- workspace 模式构建通过。
- `npm pack` 后安装到临时项目可以运行。
- 用户项目不依赖 CLI 仓库绝对路径。
- GoEngine 包的解析策略在 Vite、Webpack、esbuild 和 tsconfig 中一致。

### P5：脚手架和项目识别优化

目标：减少项目类型推断的不确定性，提高创建和初始化的安全性。

建议在生成的 `engine.config.json` 中加入：

```json
{
    "project": {
        "type": "react"
    }
}
```

识别优先级：

```text
命令参数
    ↓
engine.config.json
    ↓
package.json
    ↓
angular.json / 文件特征
    ↓
提示用户明确指定
```

建议逐步支持：

```bash
goengine create:web --name demo --type react --dir ./examples --package-manager pnpm --install
```

文件写入安全：

- [ ] 写入前检查目标文件是否已修改。
- [ ] 支持 `--force`。
- [ ] 支持配置文件备份。
- [ ] 支持 `--dry-run` 输出变更摘要。
- [ ] `init:web` 默认不覆盖用户已有字段和版本。

### P6：构建流程统一

目标：减少 Webpack、Vite、Angular、Electron、Service 命令之间的重复逻辑。

建议抽取公共流程：

```text
加载命令上下文
    ↓
加载并校验配置
    ↓
识别项目
    ↓
确保预设文件
    ↓
清理输出目录
    ↓
创建工具配置
    ↓
执行构建
    ↓
输出结果摘要
```

建议新增：

```text
lib/build/
├── context.ts
├── clean.ts
├── assets.ts
└── summary.ts
```

### P7：日志和 CI 体验

目标：让 CLI 在本地终端和 CI 环境中都可预测地运行。

建议 Logger 支持：

```ts
logger.info()
logger.success()
logger.warn()
logger.error()
logger.debug()
```

建议行为：

- 本地环境显示颜色和进度信息。
- `CI=true` 时关闭交互式提示。
- `--verbose` 输出详细解析过程。
- `--quiet` 减少普通日志。
- `--json` 为后续自动化集成预留机器可读输出。

## 四、测试方案

### 1. 单元测试

重点覆盖：

- `mergeConfig`
- `projectConfig`
- `validateProjectName`
- `detectProjectType`
- `injectHtml`
- `injectProjectTs`
- `tsconfigJson`
- `projectPackageJson`
- GoEngine 包解析器

### 2. 文件系统测试

使用临时目录验证：

- React/Vue/Angular 项目生成。
- 已存在目录不会被覆盖。
- `init:web` 保留已有依赖版本。
- 入口文件按需生成。
- 自定义输出目录生效。
- `engine.config.json` 深合并生效。

### 3. CLI 集成测试

至少覆盖：

```bash
goengine --help
goengine --version
goengine create:web ...
goengine typecheck
goengine vite:build
```

检查退出码、stdout/stderr、生成文件、构建产物和错误提示。

### 4. 发布态测试

建议增加自动化流程：

```bash
npm run build
npm pack
npm install ./goengine-cli-*.tgz
```

然后在临时项目执行：

```bash
goengine create:web ...
goengine vite:build
```

## 五、建议的目标目录

不建议一次性移动全部文件，可以增量建立新层：

```text
lib/
├── cli.ts
├── command/
├── args/
├── config/
├── runtime/
├── project/
├── build/
├── commands/
├── adapters/
└── utils/
```

- `commands/`：命令入口和参数到业务调用的转换。
- `project/`：项目识别、脚手架和模板。
- `build/`：跨工具的公共构建流程。
- `adapters/`：Webpack、Vite、Angular、Electron、esbuild 适配。
- `runtime/`：workspace/published 模式和包解析。

## 六、推荐实施顺序

### 第一轮

- [ ] 建立测试框架。
- [ ] 增加发布包 smoke test。
- [ ] 抽取统一错误处理。
- [ ] 抽取 Logger。
- [ ] 检查 Node 版本与构建 target。

### 第二轮

- [ ] 将一个简单命令改造为显式 `run(args)`。
- [ ] 验证迁移模式后，再迁移全部命令。
- [ ] 移除 `process.argv` 重写。
- [ ] 统一退出码。

### 第三轮

- [ ] 统一参数解析。
- [ ] 增加 `--cwd`、`--config`、`--verbose`、`--dry-run`。
- [ ] 支持 CI 非交互模式。

### 第四轮

- [ ] 配置 schema 校验。
- [ ] 配置版本字段。
- [ ] 统一 GoEngine 包解析器。
- [ ] 区分 workspace 与 published 模式。

### 第五轮

- [ ] 增加项目类型显式配置。
- [ ] 完善脚手架选项和文件写入保护。
- [ ] 统一构建流程和结果摘要。
- [ ] 补齐跨平台、发布态和端到端测试。

## 七、阶段性完成标准

### 基础稳定

- 命令可重复执行。
- 错误可以被 CI 正确识别。
- 发布包能够在临时目录独立运行。

### 架构稳定

- 命令不依赖 import 副作用。
- 配置和包解析逻辑集中管理。
- Webpack/Vite/Angular/Electron/Service 共用基础上下文。

### 发布稳定

- CLI 不依赖开发仓库绝对路径。
- `@goengine/*` 包有明确的解析和版本策略。
- npm 包安装后能够创建、构建和类型检查项目。

## 八、当前最建议优先处理的三件事

1. 将命令从“import 即执行”改为显式 `run(args)`。
2. 抽取统一的 workspace/published 包解析器。
3. 建立 `npm pack` 后真实安装运行的 smoke test。

这三项完成后，现有 React、Vue、Angular、Webpack、Vite、Electron 和 Service 功能可以在不改变用户使用方式的前提下获得明显的稳定性提升。

