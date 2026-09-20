# GoEngine package 发布与迁移方案

> 本方案专门针对 package/* 下的 @goengine/* 包。当前阶段允许 CLI 与依赖包共同开发并使用深层源码引用；正式发布后，应逐步转向稳定的包级 API、明确的 exports、独立版本和可验证的 npm 安装流程。

## 1. 当前模式与目标模式

### 当前：workspace 开发模式

- 各包通过 workspace:* 相互依赖。
- CLI 可以直接解析 package/*/src。
- 包内部和 CLI 中存在较多深层路径导入。
- CLI 构建时可以将 @goengine/* 源码内联到 dist。
- 各包版本暂时统一为 0.1.0。

### 目标：正式发布模式

- 每个包拥有可安装的 dist、类型声明和 exports。
- 包之间使用正式 semver 版本范围，而不是 workspace:*。
- 用户项目通过稳定入口消费包。
- CLI 与 GoEngine 包可以独立发布和升级。
- 深层源码路径不再作为公共 API。
- 每个 npm 包都能在干净临时目录中独立安装和运行。

## 2. 总体迁移原则

1. 先建立稳定包边界，再减少深层引用。
2. 深层引用在开发阶段可以继续存在，但必须逐步收敛到内部路径或公开入口。
3. 公共 API 与内部实现路径分离。
4. package.json 的 exports 作为最终可访问边界。
5. 发布前必须验证真实 npm 包，而不是只验证 workspace。
6. 包版本、依赖版本和 CLI 版本需要建立明确关系。
7. 兼容性优先于一次性大规模重命名。

## 3. 包分层与依赖方向

### 基础层

@goengine/core

- 通用数据结构、数学和基础工具、核心运行时能力。
- 不依赖 React、Vue、Angular、Electron。
- 保持较低依赖数量，优先稳定公共类型和基础函数。

### 平台层

@goengine/web、@goengine/canvas、@goengine/webgl

依赖方向：

    webgl → core
    canvas → core + web
    web → core

- 不反向依赖 React、Vue 或 Angular。
- 浏览器环境相关依赖必须明确标注。

### 框架适配层

@goengine/react、@goengine/vue、@goengine/angular

依赖方向：

    框架适配层 → 平台层 → 基础层

- 基础层不能反向依赖框架层。
- 框架本体应由 peerDependencies 提供。

### 运行时与工具层

@goengine/service、@goengine/electron、@goengine/electrobun

- 可以拥有较重依赖。
- 不应被基础 Web 包隐式依赖。
- 明确区分浏览器、Node 和 Electron 运行环境。

## 4. package.json 标准化

每个正式发布包至少应补齐：

- name、version、description、license、type。
- main、types、exports。
- files、scripts。
- dependencies、peerDependencies、devDependencies。

发布包中不得残留：

- workspace:*。
- 开发机绝对路径。
- 临时构建目录。
- 不应公开的源码文件。
- 未声明的深层入口。

## 5. exports 设计

### 根入口优先

每个包应建立 src/index.ts，并显式导出公共 API：

    export { default as Vector3 } from "./math/Vector3";
    export { default as Scene } from "./scene/Scene";

推荐消费方式：

    import { Vector3, Scene } from "@goengine/core";

不再把以下形式作为公共 API：

    import Vector3 from "@goengine/core/src/math/Vector3";

### 稳定子路径

大型包可以提供有限的稳定子路径，例如 @goengine/service/server。只公开有长期维护意愿的子路径；内部目录不应自动全部暴露。

## 6. 深层引用迁移策略

### 阶段一：建立入口，不改变实现

- 为每个包增加 src/index.ts。
- 根入口先转发现有实现。
- 暂时不要求立即重构内部目录。

### 阶段二：迁移 CLI、模板和示例

将 @goengine/service/src/manager/server/common/HTTPS 逐步替换为 @goengine/service 或 @goengine/service/server。

优先迁移 CLI 公开命令、模板项目、官方示例和发布验证项目。

### 阶段三：限制新增深层引用

- CI 检查新增的 @goengine/*/src/ 导入。
- 旧路径进入 deprecated 兼容期。
- 最终通过 exports 让未声明路径不可访问。

## 7. 独立构建策略

每个包应独立生成 dist/index.js、dist/index.d.ts 和 sourcemap。

推荐统一使用 tsup 或等价工具，要求：

- ESM 输出。
- 生成 d.ts。
- 生成 sourcemap。
- 清理旧 dist。
- 保留 tree-shaking 能力。

如果提供子路径，dist 结构必须与 exports 一一对应。

## 8. 依赖归属策略

### 框架依赖

React、Vue、Angular 本体放在适配包的 peerDependencies；本包开发所需版本放在 devDependencies。

### 运行时依赖

- 包运行时必需的依赖放 dependencies。
- 仅构建、测试和类型检查使用的依赖放 devDependencies。
- 宿主应用必须提供的依赖放 peerDependencies。
- 不要为了方便把所有依赖打进包中。

### Electron

明确区分 CLI 构建依赖、用户 Electron 应用依赖和 Electron Builder 依赖，避免所有用户项目被动安装桌面端工具链。

## 9. 版本策略

建议采用独立 semver，而不是所有包永久强制同版本。

建议分组：

- core / web / canvas / webgl：可以同步或近似同步。
- react / vue / angular：独立版本。
- electron / service / electrobun：独立版本。

版本规则：

- patch：兼容性修复。
- minor：增加兼容 API 或功能。
- major：删除、重命名或改变既有 API。

建议引入 Changesets 或等价工具，统一处理跨包修改、版本升级和 changelog。

## 10. CLI 与正式包的关系

正式发布后，CLI 不应假设开发仓库的 package/ 目录存在。

解析优先级建议为：

    用户项目 node_modules/@goengine/*
        ↓
    CLI 自身 node_modules/@goengine/*
        ↓
    workspace package/*，仅用于本地开发

Webpack、Vite、esbuild、tsconfig 和 CLI 运行时应共享同一套解析函数，例如 resolveGoenginePackage(name, options)。

长期建议 CLI 使用正式包版本；短期可以继续内联部分包，但必须保证发布包不依赖本地绝对路径，且不会产生重复框架实例。

## 11. 发布流程

    修改源码 → typecheck / test / build → 创建 changeset → 生成版本和 changelog
    → 构建所有包 → 检查 npm pack 内容 → 发布 npm → 创建 git tag → 安装验证

建议根级脚本包括：

- packages:typecheck：递归类型检查。
- packages:test：递归测试。
- packages:build：递归构建。
- packages:pack：递归生成 tarball。
- release:check：发布前完整检查。

## 12. 发布前检查清单

### 包结构

- [ ] 每个包有 src/index.ts。
- [ ] 每个包有 main、types 和 exports。
- [ ] files 只包含必要文件。
- [ ] npm pack --dry-run 内容正确。
- [ ] 包内没有 workspace 协议残留。
- [ ] 包内没有开发机绝对路径。

### API

- [ ] 公共 API 已从根入口导出。
- [ ] 深层引用已替换或标记为内部 API。
- [ ] TypeScript 声明文件可以正常解析。
- [ ] ESM import 可以正常使用。
- [ ] 所需子路径已在 exports 中声明。

### 依赖与运行

- [ ] peerDependencies 完整。
- [ ] runtime dependencies 没有错误地放进 devDependencies。
- [ ] React/Vue/Angular 版本兼容性已验证。
- [ ] 不会重复加载多个框架实例。
- [ ] 在干净临时目录安装 tarball 成功。
- [ ] npm、pnpm、Windows 路径和 CI 非交互运行均已验证。

## 13. 兼容过渡期

过渡期可以保留部分深层导入和旧入口，但必须遵守：

- 不新增更多 @goengine/*/src/ 公共引用。
- 不在用户文档中记录内部目录结构。
- 不让模板项目依赖开发仓库绝对路径。
- 删除旧入口前提供迁移说明。
- 对旧路径输出 deprecated 提示。

建议至少保留一个 minor 版本或一个明确迁移周期，再删除旧路径。

## 14. 推荐迁移阶段

### 阶段 A：包元数据

- [ ] 补齐 main、types、exports、files。
- [ ] 增加独立 build/typecheck 脚本。
- [ ] 统一 README、许可证和 changelog。
- [ ] 明确三类依赖归属。

### 阶段 B：公共入口

- [ ] 为每个包增加 src/index.ts。
- [ ] 导出第一批稳定 API。
- [ ] 建立必要的稳定子路径。
- [ ] CLI 和示例开始使用包级入口。

### 阶段 C：独立构建

- [ ] 每个包可独立生成 dist。
- [ ] d.ts 生成成功。
- [ ] npm pack --dry-run 内容正确。
- [ ] 临时项目可安装本地 tarball 并运行。

### 阶段 D：深层引用迁移

- [ ] 迁移 CLI 内部引用。
- [ ] 迁移模板、示例和文档。
- [ ] 添加禁止新增深层引用的检查。
- [ ] 对旧路径增加 deprecated 兼容层。

### 阶段 E：自动发布

- [ ] 引入 Changesets 或等价方案。
- [ ] 建立版本和 changelog 流程。
- [ ] 建立 npm 发布 CI。
- [ ] 建立发布后安装验证。
- [ ] 发布稳定版本并记录迁移指南。

## 15. 重点风险

- 循环依赖：基础层不能依赖上层，定期检查依赖图。
- 框架重复实例：通过 peerDependencies 和解析策略避免重复加载。
- 类型声明泄漏内部路径：发布前检查生成的 .d.ts。
- 浏览器与 Node 环境混用：明确 core、web、service 的运行环境。
- CLI 内联与 npm 依赖重复：每个包必须明确是 external 还是 bundled。

## 16. 最终建议

正式发布前优先完成：

1. 为每个 @goengine/* 包建立稳定的 src/index.ts 和 exports。
2. 建立独立构建、类型声明和 npm pack 验证流程。
3. 将 CLI、模板和文档中的深层引用迁移到包级入口，并阻止新增深层公共引用。

当前开发阶段可以继续使用深层引用以提高迭代速度；但从现在开始，新增代码应尽量使用未来的公共入口，从而降低正式发布时的迁移成本。
