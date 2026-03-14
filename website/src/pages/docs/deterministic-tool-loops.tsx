import { SectionHeader, ConceptCard, InlineCode } from '../../components/DocsLayout'
import CodeBlock from '../../components/CodeBlock'

const loopExample = `const result = await forge(provider, messages, schema, {
  tools,
  maxAgentIterations: 5,
  onEvent: (event) => {
    if (event.kind === 'attempt_start') console.log('attempt', event.attempt);
    if (event.kind === 'provider_response') console.log('response length', event.rawLength);
  },
});
`

const circuitBreakerExample = `await forge(provider, messages, schema, {
  tools,
  maxAgentIterations: 2,
});

// If model keeps emitting tool_calls endlessly,
// forge throws: maxAgentIterations (2) exceeded
`

const toolCrashFeedback = `const tools = {
  readDb: {
    schema: z.object({ id: z.string() }),
    execute: async () => {
      throw new Error('database unavailable');
    },
  },
};

await forge(provider, messages, schema, { tools });
// Model receives: "Tool readDb failed with message: database unavailable"
// and can recover in subsequent loop turn.
`

export default function DeterministicToolLoops() {
  return (
    <div className="space-y-8">
      <SectionHeader>Deterministic Tool Execution Loops</SectionHeader>
      <p className="text-muted-foreground leading-relaxed">
        Reforge executes tool loops inside a deterministic while-loop with explicit limits.
        It parses <InlineCode>tool_calls</InlineCode>, validates args, executes callbacks, injects tool responses,
        and re-calls the provider until no tool call remains or the circuit breaker trips.
      </p>

      <ConceptCard title="Loop Guarantees">
        <ul className="list-disc space-y-2 pl-6 text-sm text-muted-foreground">
          <li>Arguments are validated before execution using each tool schema.</li>
          <li>Unhandled tool errors are converted into model-visible tool responses.</li>
          <li><InlineCode>maxAgentIterations</InlineCode> prevents infinite loops.</li>
        </ul>
      </ConceptCard>

      <ConceptCard title="Example 1: Instrumented Agent Loop">
        <CodeBlock code={loopExample} />
      </ConceptCard>

      <ConceptCard title="Example 2: Circuit Breaker with maxAgentIterations">
        <CodeBlock code={circuitBreakerExample} />
      </ConceptCard>

      <ConceptCard title="Example 3: Tool Crash Feedback into the Loop">
        <CodeBlock code={toolCrashFeedback} />
      </ConceptCard>
    </div>
  )
}
