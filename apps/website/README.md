# Keisen Docs

基于 [Docusaurus](https://docusaurus.io/) 的技术文档站：按能力维度讲解 `@keisen-charts/react` / `@keisen-charts/vue`，共性写一次，框架差异用 React / Vue 切换对照；关键页用 Sandpack 从 npm 加载真实图表包。

## 本地预览

在仓库根目录：

```bash
bun run dev:doc
```

默认英文：[http://localhost:3000](http://localhost:3000)。

中文预览：

```bash
bun run dev:doc:zh
```

## 结构

- `docs/` — 默认英文 MDX（Introduction / Guides / API）
- `i18n/zh-Hans/` — 简体中文翻译（文档、主题文案、首页字符串）
- `src/components/` — FrameworkTabs（侧栏）、FrameworkExample、SandpackDemo、FrameworkProvider
- `src/examples/` — 静态代码片段与可运行 Sandpack files

Sandpack 依赖版本见 `src/lib/sandpackConfig.ts` 的 `KEISEN_NPM_VERSION`。
