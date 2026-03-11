import { SectionHeader, InlineCode } from '../../components/DocsLayout'
import CodeBlock from '../../components/CodeBlock'

const openRouterCode = `import { z } from 'zod';
import { forge } from 'reforge-ai';
import { openaiCompatible } from 'reforge-ai/openai-compatible';
import OpenAI from 'openai';

// Same adapter — just a different baseURL
const client = new OpenAI({
  baseURL: 'https://openrouter.ai/api/v1',
  apiKey: process.env.OPENROUTER_API_KEY,
});
const provider = openaiCompatible(client, 'anthropic/claude-sonnet-4-20250514');

const result = await forge(provider, messages, schema);`

const groqCode = `import OpenAI from 'openai';
import { openaiCompatible } from 'reforge-ai/openai-compatible';

const client = new OpenAI({
  baseURL: 'https://api.groq.com/openai/v1',
  apiKey: process.env.GROQ_API_KEY,
});
const provider = openaiCompatible(client, 'llama-3.3-70b-versatile');`

const ollamaCode = `import OpenAI from 'openai';
import { openaiCompatible } from 'reforge-ai/openai-compatible';

const client = new OpenAI({
  baseURL: 'http://localhost:11434/v1',
  apiKey: 'ollama', // Ollama doesn't need a real key
});
const provider = openaiCompatible(client, 'llama3.2');`

export default function OpenRouterGuide() {
  return (
    <div className="space-y-6">
      <SectionHeader>OpenRouter / Compatible Providers</SectionHeader>
      <p className="text-muted-foreground leading-relaxed">
        Any OpenAI-compatible API works with the same adapter — just change the <InlineCode>baseURL</InlineCode>. This covers OpenRouter, Groq, Together, Fireworks, Ollama, LM Studio, and more.
      </p>

      <h3 className="text-base font-semibold text-foreground">OpenRouter</h3>
      <CodeBlock code={openRouterCode} />

      <h3 className="text-base font-semibold text-foreground">Groq</h3>
      <CodeBlock code={groqCode} />

      <h3 className="text-base font-semibold text-foreground">Ollama (local)</h3>
      <CodeBlock code={ollamaCode} />

      <p className="text-sm text-muted-foreground/70">
        The pattern is always the same: create an OpenAI client with a custom <InlineCode>baseURL</InlineCode>, then wrap it with <InlineCode>openaiCompatible()</InlineCode>. Reforge never touches your credentials.
      </p>
    </div>
  )
}
