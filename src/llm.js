import 'dotenv/config'
import { createLLM } from '@node-llm/core'

let _llm = null

export function getLLM() {
  if (_llm) return _llm

  const provider = process.env.NODELLM_PROVIDER
  if (!provider) {
    throw new Error(
      'NODELLM_PROVIDER not set. Configure in .env:\n' +
      '\n' +
      '  OpenAI:     NODELLM_PROVIDER=openai     + OPENAI_API_KEY=sk-...\n' +
      '  Anthropic:  NODELLM_PROVIDER=anthropic  + ANTHROPIC_API_KEY=sk-ant-...\n' +
      '  DeepSeek:   NODELLM_PROVIDER=deepseek   + DEEPSEEK_API_KEY=sk-...\n' +
      '  Gemini:     NODELLM_PROVIDER=gemini     + GEMINI_API_KEY=...\n' +
      '  Ollama:     NODELLM_PROVIDER=ollama     (local, no API key needed)'
    )
  }

  _llm = createLLM({ provider })
  return _llm
}
