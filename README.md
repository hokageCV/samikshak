# Samikshak - Code reviewer

AI-powered pull request reviewer for your terminal.

## Setup

```bash
cp .env.example .env
```

Edit `.env` and set your provider with the matching API key.

### Provider configs

**OpenAI**
```
NODELLM_PROVIDER=openai
OPENAI_API_KEY=sk-...
```

**Ollama** (local, no API key)
```
NODELLM_PROVIDER=ollama
```

Supported providers: `openai`, `anthropic`, `deepseek`, `gemini`, `ollama`, `openrouter`, `mistral`, `xai`

## Usage

```bash
node bin/samikshak.js
```

Then type `pr https://github.com/owner/repo/pull/123` to review a PR.

## Plan

### MVP

- [x] cli input for user to give the pull request link
- [x] agent fetches the diff
- [x] agent reviews the code

### Extra

- [ ] commit diffs instead of PR links
- [ ] user can give some guidelines for the review
- [ ] user can interact with code and ask questions about it
- [ ] review depth (summary vs line-level feedback)
- [ ] token cost tracking
- [ ] preserve review history

