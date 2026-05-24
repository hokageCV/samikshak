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
    const url = trimmed === 'pr' ? null : trimmed.slice(3).trim()
    await handlePr(rl, url)
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
