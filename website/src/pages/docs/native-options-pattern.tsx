import { SectionHeader, ConceptCard, InlineCode } from '../../components/DocsLayout'
import CodeBlock from '../../components/CodeBlock'

const openaiNative = `import OpenAI from 'openai';
import { openaiCompatible } from 'reforge-ai/openai-compatible';

const provider = openaiCompatible(new OpenAI(), 'gpt-4o');

await forge(provider, messages, schema, {
  providerOptions: {
    temperature: 0.2,
    top_p: 0.95,
    response_format: { type: 'json_object' },
  },
});
`

const anthropicNative = `import Anthropic from '@anthropic-ai/sdk';
import { anthropic } from 'reforge-ai/anthropic';

const provider = anthropic(new Anthropic(), 'claude-sonnet-4-20250514');

await forge(provider, messages, schema, {
  providerOptions: {
    max_tokens: 1500,
    temperature: 0.1,
    top_p: 0.9,
    top_k: 40,
  },
});
`

const mutateByAttempt = `await forge(provider, messages, schema, {
  retryPolicy: {
    maxRetries: 3,
    mutateProviderOptions: (attempt, base) => ({
      ...(base ?? {}),
      temperature: attempt >= 2 ? 0 : 0.2,
    }),
  },
  providerOptions: { temperature: 0.2 },
});
`

export default function NativeOptionsPattern() {
  return (
    <div className="space-y-8">
      <SectionHeader>TNativeOptions Pattern</SectionHeader>
      <p className="text-muted-foreground leading-relaxed">
        Reforge adapters expose strongly-typed native option pass-through. You send provider-native
        SDK options directly via <InlineCode>providerOptions</InlineCode> without a lossy abstraction layer.
      </p>

      <ConceptCard title="Why It Matters">
        <ul className="list-disc space-y-2 pl-6 text-sm text-muted-foreground">
          <li>No vendor lock-in wrapper for core model parameters.</li>
          <li>Compile-time safety from adapter-specific option types.</li>
          <li>Retry policy can mutate native options attempt-by-attempt.</li>
        </ul>
        <p className="mt-3 text-sm text-muted-foreground leading-relaxed">
          <InlineCode>mutateProviderOptions</InlineCode> receives the attempt number and current base options,
          and should return the full options object for that attempt. A common pattern is
          <InlineCode>{`{ ...(base ?? {}), override }`}</InlineCode> to preserve existing keys.
        </p>
      </ConceptCard>

      <ConceptCard title="Example 1: OpenAI-Compatible Native Options">
        <CodeBlock code={openaiNative} />
      </ConceptCard>

      <ConceptCard title="Example 2: Anthropic Native Options">
        <CodeBlock code={anthropicNative} />
      </ConceptCard>

      <ConceptCard title="Example 3: Attempt-Scoped Native Option Mutation">
        <CodeBlock code={mutateByAttempt} />
      </ConceptCard>
    </div>
  )
}
