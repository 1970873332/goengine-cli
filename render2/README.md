# render2 — GoEngine WebGL 渲染器 v2

本目录是优化后的 **render2 渲染器完整源码**（基于 `goengine-webgl` 几轮 P0-P3 优化整理而来），内部依赖已改为相对路径，可直接被示例项目引用。

> **仓库状态说明**：`goengine-webgl` 仓库已回退到提交 `9baebb1`（优化前），
> 其后的所有提交历史已删除；四轮优化改动**全部整理在本目录**，不再存在于仓库历史中。

## 目录结构

- `src/`：渲染器完整源码（32 个文件，与 `package/goengine-webgl/src/` 同构）
- `diff/`：14 个被修改文件相对基准 `9baebb1`（优化前）的逐文件 diff，以及 `all.diff` 合并 diff
- `package.json`：包描述（`@goengine/render2`）

> `src/` 中的内部 import 已从 `@goengine/webgl/src/...` 改为相对路径；
> `@goengine/core/...` 依赖仍按示例项目的路径别名解析。

## 引用方式

示例场景（如 `webgl-exmaple/views/Render2Scene.tsx`）通过相对路径引用：

```ts
import WebglRenderer from "../../goengine-cli/render2/src/render/Webgl";
import GLMap from "../../goengine-cli/render2/src/map/GL";
import PerspectiveCamera from "../../goengine-cli/render2/src/camera/Perspective";
```

## 改动文件清单（14 个）

## 改动文件清单（14 个）

| 文件 | 主要改动 |
| --- | --- |
| `src/render/Webgl.ts` | 渲染主流程：render list、矩阵/纹理缓存、uniform 类型、视锥剔除、dispose |
| `src/cache/Buffer.ts` | 重构为 VAO binding states + buffer 局部更新 |
| `src/cache/State.ts` | per-program 状态：uniform 缺失集、视图矩阵帧缓存、纹理绑定表 |
| `src/cache/Texture.ts` | 1×1 默认纹理、上传状态恢复、dispose |
| `src/cache/Shader.ts` | 着色器源码规则（完整源码 / 片段自动补前缀）、dispose |
| `src/cache/Program.ts` | 新增 dispose |
| `src/camera/Frustum.ts` | 新增：视锥体（Gribb-Hartmann 6 平面提取 + 包围球相交） |
| `src/node/Base.ts` | 节点新增 `renderOrder` |
| `src/node/common/Mesh.ts` | 新增 `frustumCulled` |
| `src/map/GL.ts` | resize 同步 viewport |
| `src/glsl/vertex/base.vert` | 改为纯声明前缀（去掉 main） |
| `src/glsl/vertex/default.vert` | 完整默认顶点着色器（声明 + main） |
| `src/glsl/fragment/base.frag` | 纯声明前缀 + `u_color`/`u_opacity` |
| `src/glsl/fragment/default.frag` | 完整默认片元着色器 + `u_color`/`u_opacity` |

## 各轮改动摘要

### R1（提交 430dab8）正确性修复

- 着色器拼接规则：`ShaderMaterial` 自定义源码兼容"完整着色器（含 `#version`）"与"main 函数体片段"两种写法，片段自动用 `BASE_*` 前缀补声明
- 默认材质不再渲染全黑：片元着色器接入 `u_color` / `u_opacity`，渲染器上传材质颜色与透明度
- `setupUniform` 补齐 Float / Int / Vec2-4 / Mat2-4 / Sampler2D 类型
- 纹理未加载时用 1×1 白色默认纹理兜底
- `GLMap.resize` 同步 `gl.viewport`；`drawElements` 按索引类型选择 Uint16/Uint32
- 渲染时跳过 `visible=false` 节点；缺失 uniform 每个程序只警告一次
- attribute 启用/禁用按程序记录，避免残留指针

### R2（提交 3148259）渲染流程优化

- `renderScene` 改为两阶段：收集 opaque/transparent render list，复用列表避免每帧分配
- 不透明按材质分组（减少程序切换）并近到远排序；透明画家排序远到近
- 视图/投影矩阵每个程序每帧只上传一次，模型矩阵仍每节点上传
- 场景遍历改为直接递归 `Map`，缓存 attribute keys 与 uniform entries

### R3（提交 ea09b31）VAO / 纹理缓存 / 资源释放

- `BufferCache` 重构：VAO 按（几何体 + 程序）缓存，缓冲按几何体共享；每帧只 `bindVertexArray`
- 几何体数据变化（restructure 替换 array）时对同一缓冲 `bufferSubData` / `bufferData` 局部更新
- 纹理绑定按程序缓存 uniform → unit，全局记录单元当前纹理，避免重复 `activeTexture` / `bindTexture`
- `uniform1i` 仅在单元变化时上传；各缓存新增 `dispose()`，`destroy()` 真正释放 GPU 资源

### R4（提交 eaea6aa，已撤销提交但改动保留）视锥剔除 + renderOrder

- 新增 `Frustum`：视图投影矩阵提取 6 平面（注意顺序为**投影 × 视图**），包围球相交测试
- 几何体包围球按 position 数据源缓存，数据变化自动重算；世界包围球按世界缩放放大半径
- `collectNode` 对视锥外 Mesh 跳过渲染（`mesh.frustumCulled = false` 可关闭）
- 节点新增 `renderOrder`，不透明/透明列表均优先按它排序

> 注：仓库已整体回退到 `9baebb1`，四轮改动仅存在于本目录（`src/` 为最终源码，
> `diff/` 为逐文件与合并 diff），示例项目通过相对路径引用 `render2/src` 渲染。

## three.js 架构对齐（改造进度）

### ✅ Phase 1 — 渲染管线架构（已实现）

- `render(scene, camera)` 入口（`renderScene` 保留为兼容别名）
- `RenderList`（`src/render/RenderList.ts`，对应 three.js `WebGLRenderList`）：
  条目携带 `groupOrder / renderOrder / z / group / materialOrder`，
  排序器与 three.js 同口径（opaque 近到远、transparent 远到近）
- `projectNode` 投影收集（对应 `WebGLRenderer.projectObject`）：
  可见性 → 图层（`Layers`）→ 视锥剔除 → 深度
- 深度改用视图投影后的 clip z（与 three.js 排序口径一致）
- 节点 / 相机新增 `layers` 位掩码（对应 three.js `Layers`）
- `info` 统计（对应 `WebGLInfo`）：`calls / triangles / frame`，每帧清零

### ✅ Phase 2 — 材质体系与 WebGLState（已实现）

- `GLState`（`src/state/GLState.ts`，对应 three.js `WebGLState`）：
  混合 / 深度测试 / 深度写入 / 深度函数 / 颜色通道 / 剔除 / 正面绕序 / 视口的
  缓存状态机，变化时才调用 GL
- 材质新增 `depthFunc`（对应 `Material.depthFunc`）与 `colorWrite`
  （对应 `Material.colorWrite`），渲染模式应用接入 GLState
- 新增 `MeshBasicMaterial`（`src/material/node/MeshBasic.ts`，
  对应 three.js `MeshBasicMaterial`）：`color` + `map`（无贴图时采样默认
  1x1 白色纹理），默认着色器支持贴图采样（`u_map` × `u_color` × `u_opacity`）
- 纹理采样 uniform 绑定抽成 `bindTextureUniform`（按程序缓存 unit），
  与 `ShaderMaterial` 的 sampler 路径共用
- 示例场景 `Render2Scene` 地面改用 `MeshBasicMaterial` 验证新路径

### ⏳ 后续 Phase

- Phase 3：更多内置材质（`MeshLambertMaterial` / `MeshNormalMaterial`）、
  `WebGLMaterials` 材质属性刷新、`WebGLUniforms` 值缓存
- Phase 4：`scene.background` / fog、多材质 group、instancing、shadow map
