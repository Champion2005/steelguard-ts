import { SectionHeader, InlineCode } from '../../components/DocsLayout'
import CodeBlock from '../../components/CodeBlock'

const installCode = `npm install reforge-ai zod`

const installProvidersCode = `# OpenAI / OpenRouter / Groq / Together / Ollama / etc.
npm install reforge-ai zod openai

# Anthropic
npm install reforge-ai zod @anthropic-ai/sdk

# Google Gemini
npm install reforge-ai zod @google/generative-ai`

export default function Installation() {
  return (
    <div className="space-y-6">
      <SectionHeader>Installation</SectionHeader>
      <p className="text-muted-foreground">
        Reforge requires <strong className="text-foreground">Zod</strong> as a peer dependency. Install both:
      </p>
      <CodeBlock code={installCode} lang="bash" />
      <p className="text-muted-foreground">
        To use provider adapters with <InlineCode>forge()</InlineCode>, also install the provider SDK:
      </p>
      <CodeBlock code={installProvidersCode} lang="bash" />
      <p className="text-sm text-muted-foreground/70">
        Works with npm, yarn, pnpm, and bun. Requires Node.js 18+ or any modern edge runtime.
      </p>
    </div>
  )
}
