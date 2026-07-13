# SAJ C&I Energy Storage Design Tool

SAJ 工商业储能智能配置与技术方案生成网站。

## 功能

- 工商业储能项目需求录入与智能产品选型
- CHS2、CHS3、CM2 配置及 BOM 推荐
- AC 耦合场景 CM2 选型
- 配置安全校验与版本锁定
- 可编辑的产品、规则与内容资产管理
- 基于所选内容素材生成完整技术方案 PDF

## 本地运行

要求 Node.js 22.13 或更高版本，并使用 pnpm 安装依赖。

```bash
pnpm install
pnpm dev
```

生产构建：

```bash
pnpm build
```

默认访问地址为 `http://localhost:3000/`。

## 技术栈

- React 19
- Next.js / vinext
- TypeScript
- jsPDF 与 html2canvas

