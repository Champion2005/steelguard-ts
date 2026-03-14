import { SectionHeader, ConceptCard, InlineCode } from '../../components/DocsLayout'
import CodeBlock from '../../components/CodeBlock'

const multimodal = `import type { Message } from 'reforge-ai';

const messages: Message[] = [
  {
    role: 'user',
    content: [
      { type: 'text', text: 'Classify this image and extract sku metadata.' },
      {
        type: 'image_url',
        image_url: { url: 'https://cdn.example.com/items/sku-882.jpg', detail: 'high' },
      },
    ],
  },
];
`

const base64Image = `import { readFileSync } from 'node:fs';

const bytes = readFileSync('./invoice.png');
const b64 = bytes.toString('base64');

const messages: Message[] = [{
  role: 'user',
  content: [
    { type: 'text', text: 'Extract invoice totals from this image.' },
    { type: 'image_url', image_url: { url: 'data:image/png;base64,' + b64 } },
  ],
}];
`

const toolHistory = `const messages: Message[] = [
  {
    role: 'assistant',
    content: 'I will query inventory.',
    toolCalls: [{ id: 'call-1', name: 'lookupInventory', arguments: '{"sku":"SKU-1"}' }],
  },
  {
    role: 'tool',
    content: '{"sku":"SKU-1","stock":12}',
    toolResponse: {
      toolCallId: 'call-1',
      name: 'lookupInventory',
      content: '{"sku":"SKU-1","stock":12}',
    },
  },
];
`

const providerNormalize = `const result = await forge(provider, messages, schema);

// Reforge normalizes this universal message format to each adapter:
// - OpenAI-compatible chat payloads
// - Anthropic content blocks + tool_use/tool_result
// - Gemini parts/functionCall/functionResponse
`

export default function MessageStandard() {
  return (
    <div className="space-y-8">
      <SectionHeader>Universal Message Standard</SectionHeader>
      <p className="text-muted-foreground leading-relaxed">
        Reforge uses one cross-provider <InlineCode>Message</InlineCode> shape for plain text,
        multimodal blocks, and tool-call history. Adapters map this format to native API payloads.
      </p>

      <ConceptCard title="Core Message Fields">
        <ul className="list-disc space-y-2 pl-6 text-sm text-muted-foreground">
          <li><InlineCode>role</InlineCode>: system, user, assistant, or tool.</li>
          <li><InlineCode>content</InlineCode>: string or content-block array (text/image_url).</li>
          <li><InlineCode>toolCalls</InlineCode> and <InlineCode>toolResponse</InlineCode>: normalized tool history.</li>
        </ul>
        <p className="mt-3 text-sm text-muted-foreground leading-relaxed">
          Reforge adapters translate this structure into provider-native formats. Examples:
          Anthropic text/tool blocks, Gemini parts/function calls, and OpenAI-compatible chat payloads.
        </p>
      </ConceptCard>

      <ConceptCard title="Example 1: Multi-Modal Content Blocks">
        <CodeBlock code={multimodal} />
      </ConceptCard>

      <ConceptCard title="Example 2: Tool Invocation History">
        <CodeBlock code={toolHistory} />
      </ConceptCard>

      <ConceptCard title="Example 3: Base64 Data URI Image Block">
        <CodeBlock code={base64Image} />
      </ConceptCard>

      <ConceptCard title="Example 4: Adapter Normalization Flow">
        <CodeBlock code={providerNormalize} />
      </ConceptCard>
    </div>
  )
}
