import { SectionHeader, ConceptCard, InlineCode } from '../../components/DocsLayout'
import CodeBlock from '../../components/CodeBlock'

const toolDef = `import { z } from 'zod';

const tools = {
  getWeather: {
    description: 'Get weather by city',
    schema: z.object({ city: z.string().min(1) }),
    execute: async ({ city }) => {
      const data = await weatherClient.fetch(city);
      return { city, tempC: data.tempC, condition: data.condition };
    },
  },
};
`

const timeoutExample = `await forge(provider, messages, schema, {
  tools,
  toolTimeoutMs: 3000,
  maxAgentIterations: 5,
});

// If execute() exceeds 3000ms, forge injects a tool error response
// back into the loop instead of crashing your app.
`

const exceptionSafe = `const tools = {
  riskyTransform: {
    schema: z.object({ payload: z.string() }),
    execute: ({ payload }) => {
      if (payload.includes('panic')) throw new Error('transform failed');
      return { ok: true };
    },
  },
};

const res = await forge(provider, messages, schema, { tools });
// Tool failures become model-visible tool errors inside the loop.
// The orchestrator continues deterministically until success or limit.
`

export default function CustomTools() {
  return (
    <div className="space-y-8">
      <SectionHeader>Custom Tools and ReforgeTool</SectionHeader>
      <p className="text-muted-foreground leading-relaxed">
        A <InlineCode>ReforgeTool</InlineCode> is a local function with typed arguments validated by Zod.
        Register tools under <InlineCode>forge(..., {`{ tools }`})</InlineCode> and Reforge handles loop wiring,
        timeout guards, and safe error propagation to the model.
      </p>

      <ConceptCard title="ReforgeTool Contract">
        <ul className="list-disc space-y-2 pl-6 text-sm text-muted-foreground">
          <li><InlineCode>description</InlineCode>: optional natural-language hint that helps model tool selection.</li>
          <li><InlineCode>schema</InlineCode>: input contract for model-emitted arguments.</li>
          <li><InlineCode>execute(args)</InlineCode>: sync or async callback; return string or object.</li>
          <li>Execution failures are converted into tool-error responses; full loop behavior is documented in Deterministic Tool Loops.</li>
        </ul>
      </ConceptCard>

      <ConceptCard title="Example 1: Minimal Tool Registration">
        <CodeBlock code={toolDef} />
      </ConceptCard>

      <ConceptCard title="Example 2: Timeout Boundaries">
        <CodeBlock code={timeoutExample} />
      </ConceptCard>

      <ConceptCard title="Example 3: Exception-Safe Tool Failure Handling">
        <CodeBlock code={exceptionSafe} />
      </ConceptCard>
    </div>
  )
}
