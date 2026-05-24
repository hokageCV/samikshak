import pc from 'picocolors'
import { marked } from 'marked'
import Renderer from 'marked-terminal'
import { getLLM } from '../llm.js'
import { SYSTEM_PROMPT, COMMIT_SYSTEM_PROMPT, DIFF_SYSTEM_PROMPT, CAVEMAN_ULTRA_PROMPT, buildReviewPrompt } from '../prompts/review.js'
import { page } from '../pager.js'

marked.setOptions({ renderer: new Renderer() })

export const PR_URL_RE = /github\.com\/([^/]+)\/([^/]+)\/pull\/(\d+)/

export function parsePrUrl(url) {
  const m = url.match(PR_URL_RE)
  if (!m) throw new Error('Invalid GitHub PR URL. Expected: https://github.com/owner/repo/pull/123')
  return { owner: m[1], repo: m[2], number: parseInt(m[3], 10) }
}

export async function fetchJson(url) {
  const res = await fetch(url, {
    headers: { 'Accept': 'application/vnd.github.v3+json', 'User-Agent': 'samikshak' }
  })
  if (!res.ok) throw new Error(`GitHub API returned ${res.status} ${res.statusText}`)
  return res.json()
}

export async function fetchPrData(owner, repo, number) {
  const [meta, files] = await Promise.all([
    fetchJson(`https://api.github.com/repos/${owner}/${repo}/pulls/${number}`),
    fetchJson(`https://api.github.com/repos/${owner}/${repo}/pulls/${number}/files`),
  ])
  return { meta, files }
}

export async function fetchRawDiff(owner, repo, number) {
  const res = await fetch(`https://github.com/${owner}/${repo}/pull/${number}.diff`, {
    headers: { 'User-Agent': 'samikshak' }
  })
  if (!res.ok) throw new Error(`Diff fetch returned ${res.status} ${res.statusText}`)
  return res.text()
}

const STATE_COLORS = {
  open: pc.green,
  merged: pc.magenta,
  closed: pc.red,
}

function colorState(state) {
  const fn = STATE_COLORS[state]
  return fn ? fn(state) : state
}

export function formatDiff(diff) {
  return diff.split('\n').map(line => {
    if (line.startsWith('+') && !line.startsWith('+++')) return pc.green(line)
    if (line.startsWith('-') && !line.startsWith('---')) return pc.red(line)
    if (line.startsWith('@@')) return pc.cyan(line)
    if (line.startsWith('diff --git')) return pc.bold(line)
    if (line.startsWith('--- a/')) return pc.red(line)
    if (line.startsWith('+++ b/')) return pc.green(line)
    if (/^(index|new file|deleted file|rename|copy|similarity)/.test(line)) return pc.yellow(line)
    if (line.startsWith(' ')) return pc.dim(line)
    return line
  }).join('\n')
}

export function formatPr({ meta, files, diff }) {
  const separator = '═'.repeat(47)
  const divider = '─'.repeat(47)
  const lines = []

  lines.push(`\n${pc.bold(separator)}`)
  lines.push(` ${pc.bold(`PR #${meta.number}`)} by ${pc.cyan(meta.user.login)} — ${colorState(meta.state)}`)
  lines.push(`${pc.bold(separator)}\n`)
  lines.push(` ${pc.bold(meta.title)}`)
  lines.push(`${divider}`)
  lines.push(` ${meta.body || '(no description)'}`)
  lines.push(`${divider}`)

  const totalAdditions = files.reduce((s, f) => s + f.additions, 0)
  const totalDeletions = files.reduce((s, f) => s + f.deletions, 0)
  lines.push(` ${pc.bold(files.length)} files changed  (${pc.green(`+${totalAdditions}`)} / ${pc.red(`-${totalDeletions}`)})\n`)

  for (const f of files) {
    const statusIcon = f.status === 'added' ? pc.green('+') : f.status === 'removed' ? pc.red('-') : f.status === 'renamed' ? pc.yellow('\u2192') : ' '
    lines.push(`   ${statusIcon} ${pc.yellow(f.filename)}  (${pc.green(`+${f.additions}`)} / ${pc.red(`-${f.deletions}`)})`)
  }

  lines.push(`\n${divider}`)
  lines.push(` ${pc.bold('DIFF')}`)
  lines.push(`${divider}`)
  lines.push(`\n${formatDiff(diff)}`)

  return lines.join('\n')
}

export async function handlePr(rl, url, caveman) {
  if (url) {
    await processUrl(url, caveman)
    return
  }
  return new Promise((resolve) => {
    rl.question('Paste GitHub PR link: ', async (input) => {
      await processUrl(input.trim(), caveman)
      resolve()
    })
  })
}

export async function reviewWithLLM(meta, diff, caveman, type = 'pr') {
  const llm = getLLM()
  const chat = llm.chat().withTemperature(0.3)
  const systemPrompt = caveman
    ? CAVEMAN_ULTRA_PROMPT
    : type === 'commit' ? COMMIT_SYSTEM_PROMPT
    : type === 'diff' ? DIFF_SYSTEM_PROMPT
    : SYSTEM_PROMPT
  chat.system(systemPrompt)
  return chat.ask(buildReviewPrompt(meta, diff, type))
}

export function formatReview(review, caveman) {
  const divider = '═'.repeat(47)
  const footer = caveman ? `\n${pc.dim('Caveman mode — https://skillsllm.com/skill/caveman')}` : ''
  return `\n${pc.bold(divider)}\n ${pc.bold('AI REVIEW')}\n${pc.bold(divider)}\n\n${marked(review.content)}${footer}`
}

async function processUrl(url, caveman) {
  try {
    const { owner, repo, number } = parsePrUrl(url)
    const [data, diff] = await Promise.all([
      fetchPrData(owner, repo, number),
      fetchRawDiff(owner, repo, number),
    ])
    let output = formatPr({ ...data, diff })

    console.log(`\n${pc.dim('Running AI review...')}`)
    const review = await reviewWithLLM(data.meta, diff, caveman)
    output += `\n${formatReview(review, caveman)}`

    await page(output)
  } catch (err) {
    console.error(`\n${pc.red('Error:')} ${err.message}`)
  }
}
