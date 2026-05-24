import pc from 'picocolors'

const PROVIDER_KEY_MAP = {
  openai:     { key: 'OPENAI_API_KEY',     label: 'OpenAI' },
  anthropic:  { key: 'ANTHROPIC_API_KEY',  label: 'Anthropic' },
  deepseek:   { key: 'DEEPSEEK_API_KEY',   label: 'DeepSeek' },
  gemini:     { key: 'GEMINI_API_KEY',     label: 'Gemini' },
  ollama:     { key: null,                 label: 'Ollama' },
  openrouter: { key: 'OPENROUTER_API_KEY', label: 'OpenRouter' },
  mistral:    { key: 'MISTRAL_API_KEY',    label: 'Mistral' },
  xai:        { key: 'XAI_API_KEY',        label: 'xAI' },
}

function maskKey(val) {
  if (!val) return pc.dim('not set')
  if (val.length < 8) return val.slice(0, 4) + '****'
  return val.slice(0, 4) + '****' + val.slice(-4)
}

function showCurrent() {
  const provider = process.env.NODELLM_PROVIDER

  if (!provider) {
    console.log(`\n  ${pc.red('No provider configured.')}`)
    console.log(`  Set it in .env:\n`)
    for (const [p, info] of Object.entries(PROVIDER_KEY_MAP)) {
      const keyPart = info.key ? ` + ${info.key}=...` : pc.green(' (no API key needed)')
      console.log(`    ${pc.bold(p.padEnd(12))}${keyPart}`)
    }
    return
  }

  const info = PROVIDER_KEY_MAP[provider]
  console.log(`\n  ${pc.bold('Provider:')} ${pc.cyan(provider)}`)
  if (info) {
    if (info.key) {
      const val = process.env[info.key]
      console.log(`  ${pc.bold('API Key:')}  ${maskKey(val)}`)
    } else {
      console.log(`  ${pc.green('✓ No API key needed (local)')}`)
    }
  }
}

function showProviderHelp(name) {
  const info = PROVIDER_KEY_MAP[name]
  if (!info) {
    console.log(`\n  Unknown provider "${name}". Available: ${Object.keys(PROVIDER_KEY_MAP).join(', ')}`)
    return
  }

  console.log(`\n  ${pc.bold(info.label)} setup:`)
  if (info.key) {
    console.log(`    NODELLM_PROVIDER=${name}`)
    console.log(`    ${info.key}=...`)
  } else {
    console.log(`    NODELLM_PROVIDER=${name}`)
    console.log(`    ${pc.green('(runs locally, no API key)')}`)
  }
}

export function handleProvider(arg) {
  if (arg) {
    showProviderHelp(arg)
  } else {
    showCurrent()
  }
}
