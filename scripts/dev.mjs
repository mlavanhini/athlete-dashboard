#!/usr/bin/env node
/**
 * Strips --localstorage-file from NODE_OPTIONS before starting Next.js.
 * Node.js 22 exposes this experimental flag (sometimes with an invalid path),
 * which places a broken `localStorage` in global scope and crashes Next.js SSR.
 */
import { spawn } from 'child_process'
import { resolve, dirname } from 'path'
import { fileURLToPath } from 'url'

const __dirname = dirname(fileURLToPath(import.meta.url))
const nextBin = resolve(__dirname, '../node_modules/.bin/next')

const cleanNodeOptions = (process.env.NODE_OPTIONS ?? '')
  .split(/\s+/)
  .filter(flag => !flag.startsWith('--localstorage-file'))
  .join(' ')
  .trim()

const port = process.argv[2] ?? '4317'
const cmd = process.argv[3] ?? 'dev'

const child = spawn(
  nextBin,
  cmd === 'dev' ? ['dev', '-p', port] : ['start', '-p', port],
  {
    stdio: 'inherit',
    env: { ...process.env, NODE_OPTIONS: cleanNodeOptions },
  }
)

child.on('exit', code => process.exit(code ?? 0))
