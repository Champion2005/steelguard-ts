import { SectionHeader, ConceptCard } from '../../components/DocsLayout'
import CodeBlock from '../../components/CodeBlock'

const openRouterExample = `const provider = openrouter(client, 'anthropic/claude-sonnet-4-20250514');

await forge(provider, messages, schema, {
  providerOptions: {
    models: ['anthropic/claude-sonnet-4-20250514', 'openai/gpt-4o-mini'],
    route: 'fallback',
    httpReferer: 'https://reforge-ai.dev',
    xTitle: 'Reforge Production',
  },
});
`

const groqExample = `const provider = groq(client, 'llama-3.3-70b-versatile');

await forge(provider, messages, schema, {
  providerOptions: {
    temperature: 0,
    systemPromptBehavior: 'prepend_to_user',
  },
});
`

const anthropicGoogleExample = `const claude = anthropic(anthropicClient, 'claude-sonnet-4-20250514');
const gemini = google(geminiClient, 'gemini-2.0-flash');

await forge(claude, [
  {
    role: 'system',
    content: [{ type: 'text', text: 'Classify documents.' }, { type: 'text', text: 'Cache this block', cache_control: { type: 'ephemeral' } } as any],
  },
  ...messages,
], schema, {
  providerOptions: { max_tokens: 1200 },
});

await forge(gemini, messages, schema, {
  providerOptions: {
    safetySettings: [{ category: 'HARM_CATEGORY_DANGEROUS_CONTENT', threshold: 'BLOCK_ONLY_HIGH' }],
    generationConfig: { temperature: 0.1 },
  },
});
`

export default function AdapterSpecifics() {
  return (
    <div className="space-y-8">
      <SectionHeader>Adapter-Specific Behaviors</SectionHeader>
      <p className="text-muted-foreground leading-relaxed">
        Reforge exposes adapter nuances that matter in production. This page highlights OpenRouter routing headers,
        Groq system-prompt handling, Anthropic cache-control block support, and Gemini safety-setting pass-through.
      </p>

      <ConceptCard title="Behavior Notes">
        <ul className="list-disc space-y-2 pl-6 text-sm text-muted-foreground">
          <li>OpenRouter: <code>httpReferer</code> and <code>xTitle</code> map to required routing headers.</li>
          <li>Groq: <code>systemPromptBehavior</code> supports <code>default</code> and <code>prepend_to_user</code>.</li>
          <li>Anthropic: text blocks can include <code>cache_control</code> metadata.</li>
          <li>Gemini: universal messages are transformed into Gemini <code>parts</code>, including function call/response parts for tools.</li>
        </ul>
      </ConceptCard>

      <ConceptCard title="Example 1: OpenRouter Routing + Headers">
        <CodeBlock code={openRouterExample} />
      </ConceptCard>

      <ConceptCard title="Example 2: Groq systemPromptBehavior">
        <CodeBlock code={groqExample} />
      </ConceptCard>

      <ConceptCard title="Example 3: Anthropic cache_control + Gemini safetySettings">
        <CodeBlock code={anthropicGoogleExample} />
      </ConceptCard>
    </div>
  )
}
