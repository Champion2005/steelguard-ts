import { SectionHeader } from '../../components/DocsLayout'
import CodeBlock from '../../components/CodeBlock'

const anthropicForgeCode = `import { z } from 'zod';
import { forge } from 'reforge-ai';
import { anthropic } from 'reforge-ai/anthropic';
import Anthropic from '@anthropic-ai/sdk';

const client = new Anthropic();
const provider = anthropic(client, 'claude-sonnet-4-20250514');

const EventSchema = z.object({
  title:     z.string(),
  date:      z.string(),
  attendees: z.array(z.string()),
});

const result = await forge(provider, [
  { role: 'user', content: 'Parse this: Team standup on March 15 with Alice, Bob, Carol' },
], EventSchema);`

export default function AnthropicGuide() {
  return (
    <div className="space-y-6">
      <SectionHeader>Anthropic Integration</SectionHeader>
      <p className="text-muted-foreground leading-relaxed">
        Use the dedicated Anthropic adapter with Claude models. The adapter handles Anthropic's unique API format — including extracting system messages and managing the <code className="rounded-md border border-border/40 bg-muted/50 px-1.5 py-0.5 font-mono text-[13px] text-foreground/85">max_tokens</code> requirement automatically.
      </p>
      <CodeBlock code={anthropicForgeCode} />
      <p className="text-sm text-muted-foreground/70">
        The Anthropic adapter defaults to 4096 max tokens if not specified in provider options. System messages are automatically extracted and passed as Anthropic's <code className="rounded-md border border-border/40 bg-muted/50 px-1 py-0.5 font-mono text-[11px] text-foreground/70">system</code> parameter.
      </p>
    </div>
  )
}
