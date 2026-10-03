#!/usr/bin/env node
// Enforces CLAUDE.md LAYERING RULES #1: z-index is never a raw number in
// components; only the tokens in src/styles/tokens.css are allowed.
import { readdirSync, readFileSync, statSync } from 'node:fs'
import { extname, join, relative, resolve } from 'node:path'

const SRC_DIR = resolve(process.cwd(), 'src')
const EXEMPT_FILES = new Set([resolve(SRC_DIR, 'styles/tokens.css')])
const SCANNABLE_EXTENSIONS = new Set(['.ts', '.tsx', '.js', '.jsx', '.css'])

const CHECKS = [
  { pattern: /z-index\s*:\s*\d+/g, message: 'raw numeric `z-index:` declaration' },
  { pattern: /\bz-\[\s*\d+\s*\]/g, message: 'Tailwind arbitrary numeric z value (e.g. z-[9999])' },
  { pattern: /\bzIndex\s*:\s*\d+/g, message: 'inline style `zIndex` numeric literal' },
  {
    pattern: /(?<=["'`\s]|^)z-(?:\d+|auto)\b/g,
    message: "Tailwind's built-in numeric z-index utility (e.g. z-10, z-50, z-auto)",
  },
]

function walk(dir, files = []) {
  for (const entry of readdirSync(dir)) {
    const fullPath = join(dir, entry)
    const info = statSync(fullPath)
    if (info.isDirectory()) {
      walk(fullPath, files)
    } else if (SCANNABLE_EXTENSIONS.has(extname(fullPath))) {
      files.push(fullPath)
    }
  }
  return files
}

function checkFile(filePath) {
  const violations = []
  if (EXEMPT_FILES.has(resolve(filePath))) {
    return violations
  }

  const lines = readFileSync(filePath, 'utf8').split('\n')
  lines.forEach((line, index) => {
    for (const { pattern, message } of CHECKS) {
      pattern.lastIndex = 0
      if (pattern.test(line)) {
        violations.push({ file: filePath, line: index + 1, message })
      }
    }
  })
  return violations
}

function main() {
  const files = walk(SRC_DIR)
  const violations = files.flatMap(checkFile)

  if (violations.length > 0) {
    console.error('z-index check failed:\n')
    for (const { file, line, message } of violations) {
      console.error(`  ${relative(process.cwd(), file)}:${line}  ${message}`)
    }
    console.error(
      '\nTailwind has no config-level switch to remove its bare-number z-index utilities, so this\n' +
        'script is the enforcement: use the z-index tokens (z-raised, z-sticky, z-nav, z-dropdown,\n' +
        'z-overlay, z-modal, z-toast, z-tooltip, z-cursor) defined in src/styles/tokens.css instead.',
    )
    process.exit(1)
  }

  console.log('z-index check passed: no raw numeric z-index found outside src/styles/tokens.css')
}

main()
