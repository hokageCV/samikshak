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

function displayPr({ meta, files, diff }) {
  const separator = '═'.repeat(47)
  const divider = '─'.repeat(47)

  console.log(`\n${separator}`)
  console.log(` PR #${meta.number} by ${meta.user.login} — ${meta.state}`)
  console.log(`${separator}\n`)
  console.log(` ${meta.title}`)
  console.log(`${divider}`)
  console.log(` ${meta.body || '(no description)'}`)
  console.log(`${divider}`)

  const totalAdditions = files.reduce((s, f) => s + f.additions, 0)
  const totalDeletions = files.reduce((s, f) => s + f.deletions, 0)
  console.log(` ${files.length} files changed  (+${totalAdditions} / -${totalDeletions})\n`)

  for (const f of files) {
    const statusIcon = f.status === 'added' ? '+' : f.status === 'removed' ? '-' : f.status === 'renamed' ? '→' : ' '
    console.log(`   ${statusIcon} ${f.filename}  (+${f.additions} / -${f.deletions})`)
  }

  console.log(`\n${divider}`)
  console.log(' DIFF')
  console.log(`${divider}`)
  console.log(`\n${diff}`)
}

export async function handlePr(rl, url) {
  if (url) {
    await processUrl(url)
    return
  }
  return new Promise((resolve) => {
    rl.question('Paste GitHub PR link: ', async (input) => {
      await processUrl(input.trim())
      resolve()
    })
  })
}

async function processUrl(url) {
  try {
    const { owner, repo, number } = parsePrUrl(url)
    const [data, diff] = await Promise.all([
      fetchPrData(owner, repo, number),
      fetchRawDiff(owner, repo, number),
    ])
    displayPr({ ...data, diff })
  } catch (err) {
    console.error(`\nError: ${err.message}`)
  }
}
