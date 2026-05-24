import { spawn } from 'node:child_process'

export function page(content) {
  return new Promise((resolve) => {
    const pager = process.env.PAGER || 'less'
    const args = pager === 'less' ? ['-R'] : []
    const proc = spawn(pager, args, { stdio: ['pipe', 'inherit', 'inherit'] })
    proc.on('error', () => {
      console.log(content)
      resolve()
    })
    proc.on('exit', (code) => {
      resolve()
    })
    proc.stdin.write(content)
    proc.stdin.end()
  })
}
