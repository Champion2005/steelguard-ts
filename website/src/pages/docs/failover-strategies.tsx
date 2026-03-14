import { SectionHeader, ConceptCard } from '../../components/DocsLayout'
import CodeBlock from '../../components/CodeBlock'

const providerChain = `const result = await forge([
  anthropic(clientA, 'claude-sonnet-4-20250514'),
  openrouter(clientB, 'openai/gpt-4o-mini'),
  groq(clientC, 'llama-3.3-70b-versatile'),
], messages, schema, {
  maxRetries: 2,
});
`

const intrinsicFailover = `try {
  const res = await forge([primary, fallback], messages, schema);
} catch (e) {
  // Non-network exceptions are re-thrown.
}

// Network-like failures (429/500/503/timeouts/rate-limit patterns)
// trigger immediate provider switch when fallback exists.
`

const semanticRetryIsolation = `const result = await forge([primary, fallback], messages, schema, {
  guardOptions: {
    semanticResolution: { mode: 'retry' },
  },
  maxRetries: 3,
});

// Semantic/schema failures consume retry budget on active provider.
// They do not trigger provider fallback by themselves.
`

const retryBudgetExample = `const result = await forge([primary, fallback], messages, schema, {
  maxRetries: 3,
});

// If provider[0] returns semantic validation failures,
// retries continue on provider[0] until budget exhausted.
// If provider[0] throws intrinsic network error mid-flow,
// forge switches to provider[1] immediately and keeps progressing.
`

export default function FailoverStrategies() {
  return (
    <div className="space-y-8">
      <SectionHeader>Failover Strategies and Priority Rules</SectionHeader>
      <p className="text-muted-foreground leading-relaxed">
        Reforge separates intrinsic transport failures from semantic failures. Provider failover is
        reserved for intrinsic network problems (429/500/503/timeouts). Semantic validation problems
        stay on the current provider and use retry prompts.
      </p>

      <ConceptCard title="Priority Rules">
        <ul className="list-disc space-y-2 pl-6 text-sm text-muted-foreground">
          <li>Intrinsic network failure: advance to next provider in chain immediately.</li>
          <li>Semantic failure: append retry prompt and retry same provider.</li>
          <li>Tool-loop network failure: can also trigger fallback mid-loop.</li>
        </ul>
      </ConceptCard>

      <ConceptCard title="Example 1: Ordered Provider Chain">
        <CodeBlock code={providerChain} />
      </ConceptCard>

      <ConceptCard title="Example 2: Intrinsic Failure Triggering Fallback">
        <CodeBlock code={intrinsicFailover} />
      </ConceptCard>

      <ConceptCard title="Example 3: Semantic Retry Isolation on Active Provider">
        <CodeBlock code={semanticRetryIsolation} />
      </ConceptCard>

      <ConceptCard title="Example 4: Retry Budget Interaction">
        <CodeBlock code={retryBudgetExample} />
      </ConceptCard>
    </div>
  )
}
