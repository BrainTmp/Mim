// quartz/plugins/transformers/typst-svg.ts
import { QuartzTransformerPlugin } from "../types"
import { visit } from "unist-util-visit"
import { spawnSync } from "node:child_process"
import fs from "fs"
import path from "path"
import os from "os"
import crypto from "crypto"

type Options = {
  inline?: boolean
  outDir?: string
  typstArgs?: string[]
  templateDir?: string
  templateDefaultName?: string
}

const DEFAULT_OPTIONS: Required<Pick<Options, "inline" | "outDir" | "typstArgs" | "templateDir" | "templateDefaultName">> = {
  inline: false,
  outDir: path.join("static", "typst-svg"),
  typstArgs: ["compile", "--format", "svg"],
  templateDir: "quartz/static/typst-svg/",
  templateDefaultName: "svg.typ"
}

export const TypstSvg: QuartzTransformerPlugin<Partial<Options>> = (opts) => {
  const cfg = { ...DEFAULT_OPTIONS, ...(opts ?? {}) }
  const absoluteOutDir = path.resolve(process.cwd(), path.join("public", cfg.outDir))

  return {
    name: "TypstSvg",
    markdownPlugins() {
      return [
        () => {
          return (tree: any) => {
            visit(tree, "code", (node: any, index?: number, parent?: any) => {
              if (!node || node.type !== "code") return
              const lang = (node.lang || "").toLowerCase().trim()
              if (lang !== "typst_svg") return

              const source = String(node.value ?? "")
              const hasher = crypto.createHash("sha1")
              hasher.update(source)
              hasher.update(JSON.stringify(cfg))
              const hash = hasher.digest("hex").slice(0, 12)
              const filename = `${hash}.svg`
              const outPath = path.join(absoluteOutDir, filename)
              const publicSrc = path.posix.join("/", cfg.outDir, filename)

              let svgContent: string | null = null

              if (!cfg.inline && fs.existsSync(outPath)) {
                try {
                  svgContent = fs.readFileSync(outPath, "utf-8")
                } catch {
                  svgContent = null
                }
              }

              if (svgContent === null) {
                // ✅ 使用临时目录写入 input.typ
                const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), "typst-"))
                const inputFile = path.join(tmpDir, "input.typ")

                // 如果指定了 templateDir，则复制模板文件
                let template = "ss"
                let templatePath = ""

                if (cfg.templateDir) {
                  templatePath = path.join(cfg.templateDir, cfg.templateDefaultName ?? "svg.typ")
                  templatePath = path.resolve(process.cwd(), templatePath)
                }

                if (fs.existsSync(templatePath)) {
                  try {
                    template = fs.readFileSync(templatePath, "utf-8")
                  } catch (e) {
                    console.warn(`[TypstSvg] ⚠️ Failed to read template: ${templatePath}\n${e}`)
                  }
                }
                
                const finalTypstSource = template.includes("{{code}}")
                  ? template.replace("{{code}}", source)
                  : `${template}\n${source}`

                fs.writeFileSync(inputFile, finalTypstSource, "utf-8")

                // typst compile
                const args = [...cfg.typstArgs, inputFile, "-"]
                const proc = spawnSync("typst", args, {
                  encoding: "utf-8",
                  maxBuffer: 10 * 1024 * 1024,
                })

                // cleanup
                fs.rmSync(tmpDir, { recursive: true, force: true })

                if (proc.error) {
                  console.warn(`[TypstSvg] ❌ spawn error: ${proc.error}`)
                  parent.children[index!] = {
                    type: "html",
                    value: `<div class="typst-error"><pre>Typst spawn error: ${escapeHtml(
                      String(proc.error)
                    )}</pre></div>`,
                  }
                  return
                }

                if (proc.status !== 0 || !proc.stdout) {
                  console.warn(
                    `[TypstSvg] ❌ compile failed (exit code ${proc.status})\n${proc.stderr || "Unknown error"}`,
                  )
                  parent.children[index!] = {
                    type: "html",
                    value: `<div class="typst-error"><strong>Typst compile failed</strong><pre>${escapeHtml(
                      String(proc.stderr ?? "Unknown error")
                    )}</pre></div>`,
                  }
                  return
                }

                svgContent = proc.stdout

                if (!cfg.inline) {
                  fs.mkdirSync(path.dirname(outPath), { recursive: true })
                  fs.writeFileSync(outPath, svgContent, "utf-8")
                }
              }

              // Replace the Markdown node with the SVG
              parent.children[index!] = cfg.inline
                ? {
                    type: "html",
                    value: svgContent!,
                  }
                : {
                    type: "html",
                    value: `<div class="typst-svg-container" style="text-align:center;"><img src="${publicSrc}" alt="typst diagram" loading="lazy" /></div>`,
                  }
            })
          }
        },
      ]
    },
    htmlPlugins() {
      return []
    },
    externalResources() {
      return {}
    },
  }
}

function escapeHtml(s: string) {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;")
}
