import { execSync } from 'node:child_process'

export function getRepoRoot() {
  try {
    return execSync('git rev-parse --show-toplevel', { encoding: 'utf8' }).trim()
  } catch {
    throw new Error('Not a git repository')
  }
}

export function ensureGitRepo() {
  getRepoRoot()
}

export function listRecentCommits(count = 10) {
  const output = execSync(
    `git log --oneline --abbrev-commit -${count}`,
    { encoding: 'utf8' }
  ).trim()
  if (!output) return []
  return output.split('\n').filter(Boolean).map(line => {
    const [hash, ...rest] = line.split(' ')
    return { hash, message: rest.join(' ') }
  })
}

export function getCommitMeta(ref) {
  const output = execSync(
    `git log -1 --format="%H||%s||%an||%b" ${ref}`,
    { encoding: 'utf8' }
  ).trim()
  const parts = output.split('||')
  if (!parts[0]) throw new Error(`Unknown ref: ${ref}`)
  return {
    hash: parts[0].substring(0, 7),
    message: parts[1] || '',
    author: parts[2] || '',
    body: parts[3] || '',
  }
}

export function getCommitDiff(ref) {
  return execSync(`git show ${ref} --format="" --`, { encoding: 'utf8' }).trim()
}

export function getDiffBetween(ref1, ref2) {
  return execSync(`git diff ${ref1}..${ref2}`, { encoding: 'utf8' }).trim()
}

export function getWorkingDiff(staged = false) {
  return execSync(`git diff ${staged ? '--staged' : ''}`, { encoding: 'utf8' }).trim()
}
