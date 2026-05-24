import pc from 'picocolors'
import { page } from '../pager.js'
import { ensureGitRepo, getWorkingDiff, getDiffBetween } from './git.js'
import { reviewWithLLM, formatReview } from './pr.js'

function formatDiffMeta(description) {
  const separator = '═'.repeat(47)
  const lines = []
  lines.push(`\n${pc.bold(separator)}`)
  lines.push(` ${pc.bold('Local Changes')}`)
  lines.push(`${pc.bold(separator)}\n`)
  lines.push(` ${description}`)
  return lines.join('\n')
}

export async function handleDiff(rl, args, caveman) {
  try {
    ensureGitRepo()

    let diff, description
    const trimmed = (args || '').trim()

    if (trimmed === '--staged') {
      diff = getWorkingDiff(true)
      description = 'Staged changes (git diff --staged)'
    } else if (trimmed.includes('..')) {
      const parts = trimmed.split('..').map(s => s.trim())
      diff = getDiffBetween(parts[0], parts[1] || 'HEAD')
      description = `Diff between ${trimmed}`
    } else if (trimmed) {
      diff = getDiffBetween(trimmed, 'HEAD')
      description = `Diff between ${trimmed} and HEAD`
    } else {
      diff = getWorkingDiff(false)
      description = 'Unstaged changes (git diff)'
    }

    if (!diff) {
      console.log(`\n${pc.yellow('No changes to review')}`)
      return
    }

    let output = formatDiffMeta(description)
    console.log(`\n${pc.dim('Running AI review...')}`)
    const review = await reviewWithLLM({ description }, diff, caveman, 'diff')
    output += `\n${formatReview(review, caveman)}`

    await page(output)
  } catch (err) {
    console.error(`\n${pc.red('Error:')} ${err.message}`)
  }
}
