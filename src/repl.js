import * as readline from 'node:readline'

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
  prompt: 'samikshak> '
})

rl.prompt()

rl.on('line', (line) => {
  const trimmed = line.trim()
  if (trimmed === 'exit' || trimmed === 'quit') {
    rl.close()
    return
  }
  console.log(trimmed)
  rl.prompt()
})

rl.on('close', () => {
  console.log('\nbye.')
  process.exit(0)
})
