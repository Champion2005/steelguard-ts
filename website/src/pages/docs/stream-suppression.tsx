import { SectionHeader, ConceptCard, InlineCode } from '../../components/DocsLayout'
import CodeBlock from '../../components/CodeBlock'

const basicChunk = `import { forge } from 'reforge-ai';

const chunks: string[] = [];

const res = await forge(provider, messages, schema, {
  onChunk: (text) => {
    chunks.push(text);
  },
});

console.log(chunks.join(''));
`

const uiSuppression = `import { forge } from 'reforge-ai';

const appendToChat = (text: string) => {
  // render plain assistant text only
};

await forge(provider, messages, schema, {
  onChunk: (text) => {
    // Reforge suppresses internal tool JSON chatter before this callback.
    appendToChat(text);
  },
  tools: {
    lookupCustomer: {
      schema: z.object({ id: z.string() }),
      execute: ({ id }) => ({ id, plan: 'enterprise' }),
    },
  },
});
`

const analyticsChunk = `import { forge } from 'reforge-ai';

const streamed = await forge(provider, messages, schema, {
  onChunk: (text) => {
    metrics.count('forge.chunk.bytes', text.length);
    metrics.event('forge.chunk.preview', { preview: text.slice(0, 80) });
  },
  onEvent: (event) => {
    if (event.kind === 'provider_response') {
      metrics.event('forge.provider.response', event);
    }
  },
});
`

export default function StreamSuppression() {
  return (
    <div className="space-y-8">
      <SectionHeader>Streaming with onChunk and Tool Noise Suppression</SectionHeader>
      <p className="text-muted-foreground leading-relaxed">
        Use <InlineCode>onChunk</InlineCode> to stream assistant output to your UI while Reforge executes
        tool loops in the background. Tool-call payloads and intermediate machine JSON are suppressed
        from end-user chunks so your chat UI stays readable.
      </p>

      <ConceptCard title="Behavior Contract">
        <ul className="list-disc space-y-2 pl-6 text-sm text-muted-foreground">
          <li><InlineCode>onChunk</InlineCode> runs when provider text is available for user-facing output.</li>
          <li>Tool-call argument JSON and tool result envelopes are not emitted to user UI chunks.</li>
          <li>Use <InlineCode>onEvent</InlineCode> if you need low-level orchestration telemetry.</li>
        </ul>
        <p className="mt-3 text-sm text-muted-foreground leading-relaxed">
          Valid <InlineCode>onEvent.kind</InlineCode> values are <InlineCode>attempt_start</InlineCode>,
          <InlineCode>provider_response</InlineCode>, <InlineCode>guard_success</InlineCode>,
          <InlineCode>guard_failure</InlineCode>, <InlineCode>retry_scheduled</InlineCode>, and
          <InlineCode>finished</InlineCode>.
        </p>
      </ConceptCard>

      <ConceptCard title="Example 1: Basic Chunk Capture">
        <CodeBlock code={basicChunk} />
      </ConceptCard>

      <ConceptCard title="Example 2: Frontend Chat Rendering Without Tool Noise">
        <CodeBlock code={uiSuppression} />
      </ConceptCard>

      <ConceptCard title="Example 3: Pair onChunk with Structured Events">
        <CodeBlock code={analyticsChunk} />
      </ConceptCard>
    </div>
  )
}
