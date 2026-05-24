import pc from 'picocolors'
import { page } from '../pager.js'
import { ensureGitRepo, listRecentCommits, getCommitMeta, getCommitDiff } from './git.js'
import { reviewWithLLM, formatReview, formatDiff } from './pr.js'

function formatCommit(meta, diff) {
  const separator = '═'.repeat(47)
  const divider = '─'.repeat(47)
  const lines = []

  lines.push(`\n${pc.bold(separator)}`)
  lines.push(` ${pc.bold(`Commit ${meta.hash}`)} by ${pc.cyan(meta.author)}`)
  lines.push(`${pc.bold(separator)}\n`)
  lines.push(` ${pc.bold(meta.message)}`)
  if (meta.body) {
    lines.push(`${divider}`)
    lines.push(` ${meta.body}`)
  }
  lines.push(`\n${divider}`)
  lines.push(` ${pc.bold('DIFF')}`)
  lines.push(`${divider}`)
  lines.push(`\n${formatDiff(diff)}`)

  return lines.join('\n')
}

async function processRef(ref, caveman) {
  const diff = getCommitDiff(ref)
  if (!diff) {
    throw new Error(`No diff found for ${ref}`)
  }
  const meta = getCommitMeta(ref)
  let output = formatCommit(meta, diff)

  console.log(`\n${pc.dim('Running AI review...')}`)
  const review = await reviewWithLLM(meta, diff, caveman, 'commit')
  output += `\n${formatReview(review, caveman)}`

  await page(output)
}

export async function handleCommit(rl, ref, caveman) {
  try {
    ensureGitRepo()

    if (!ref) {
      const commits = listRecentCommits(10)
      if (commits.length === 0) {
        console.log(`${pc.red('No commits found')}`)
        return
      }
      return new Promise((resolve) => {
        console.log(`\n${pc.bold('Recent commits:')}\n`)
        commits.forEach((c, i) => {
          console.log(`  ${pc.cyan(`${i + 1}.`)} ${pc.yellow(c.hash)} ${c.message}`)
        })
        console.log()
        rl.question('Select commit (1-10) or paste hash: ', async (input) => {
          const trimmed = input.trim()
          const num = parseInt(trimmed, 10)
          if (num >= 1 && num <= commits.length) {
            try { await processRef(commits[num - 1].hash, caveman) }
            catch (err) { console.error(`\n${pc.red('Error:')} ${err.message}`) }
          } else if (trimmed) {
            try { await processRef(trimmed, caveman) }
            catch (err) { console.error(`\n${pc.red('Error:')} ${err.message}`) }
          }
          resolve()
        })
      })
    }

    await processRef(ref, caveman)
  } catch (err) {
    console.error(`\n${pc.red('Error:')} ${err.message}`)
  }
}
