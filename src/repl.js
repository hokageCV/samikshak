import * as readline from 'node:readline'
import { handlePr } from './commands/pr.js'
import { handleProvider } from './commands/provider.js'

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
  prompt: 'samikshak> '
})

rl.prompt()

rl.on('line', async (line) => {
  const trimmed = line.trim()
  if (trimmed === 'exit' || trimmed === 'quit') {
    rl.close()
    return
  }

  if (trimmed === 'pr' || trimmed.startsWith('pr ')) {
    rl.pause()
    const caveman = /--caveman|--cm/.test(trimmed)
    const url = trimmed === 'pr' || /^pr\s*(--caveman|--cm)\s*$/.test(trimmed)
      ? null
      : trimmed.replace(/--caveman|--cm/g, '').replace(/^pr\s*/, '').trim() || null
    await handlePr(rl, url, caveman)
    rl.prompt()
    rl.resume()
    return
  }

  if (trimmed === 'provider' || trimmed.startsWith('provider ')) {
    const arg = trimmed === 'provider' ? null : trimmed.slice(9).trim()
    handleProvider(arg)
    rl.prompt()
    return
  }

  console.log(trimmed)
  rl.prompt()
})

rl.on('close', () => {
  console.log('\nbye.')
  process.exit(0)
})
