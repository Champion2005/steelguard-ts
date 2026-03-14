import { SectionHeader, ConceptCard, InlineCode } from '../../components/DocsLayout'
import CodeBlock from '../../components/CodeBlock'

const clampExample = `import { z } from 'zod';
import { guard } from 'reforge-ai';

const User = z.object({
  name: z.string(),
  age: z.number().min(18).max(100),
  tier: z.enum(['free', 'pro', 'enterprise']),
});

const raw = JSON.stringify({ name: 'Casey', age: 154, tier: 'vip' });

const res = guard(raw, User, {
  semanticResolution: { mode: 'clamp' },
});

if (res.success) {
  console.log(res.data);
  // { name: 'Casey', age: 100, tier: 'free' }
  console.log(res.telemetry.status); // coerced_locally
}`

const strictExample = `import { z } from 'zod';
import { guard } from 'reforge-ai';

const User = z.object({
  name: z.string(),
  age: z.number().min(18).max(100),
  tier: z.enum(['free', 'pro', 'enterprise']),
});

const raw = JSON.stringify({ name: 'Casey', age: 154, tier: 'vip' });

const res = guard(raw, User, {
  semanticResolution: { mode: 'retry' },
});

if (!res.success) {
  console.log(res.retryPrompt);
  console.log(res.errors.map((e) => e.code));
  // ["too_big", "invalid_enum_value"]
}`

const customResolverExample = `import { z } from 'zod';
import { guard } from 'reforge-ai';

const Order = z.object({
  priority: z.enum(['low', 'medium', 'high']),
  score: z.number().min(0).max(1),
});

const raw = '{"priority":"urgent","score":99}';

const res = guard(raw, Order, {
  semanticResolution: {
    mode: 'clamp',
    resolver: ({ issue, currentValue, path }) => {
      const pointer = '/' + path.join('/');
      if (issue.code === 'invalid_enum_value' && pointer === '/priority') return 'high';
      if (issue.code === 'too_big' && pointer === '/score') return 1;
      return currentValue;
    },
  },
});

if (res.success) console.log(res.data); // { priority: 'high', score: 1 }
`

export default function SemanticClampVsStrict() {
  return (
    <div className="space-y-8">
      <SectionHeader>Clamp vs Strict Semantic Resolution</SectionHeader>
      <p className="text-muted-foreground leading-relaxed">
        Reforge first repairs JSON syntax, then validates against your schema. When validation fails,
        <InlineCode>semanticResolution.mode</InlineCode> controls whether failures become a retry prompt
        (<InlineCode>retry</InlineCode>) or a local semantic fix pass (<InlineCode>clamp</InlineCode>).
      </p>

      <ConceptCard title="How Clamp Handles Zod Issue Types">
        <ul className="list-disc space-y-2 pl-6 text-sm text-muted-foreground">
          <li><InlineCode>too_small</InlineCode>: raises number to min (or min + epsilon when exclusive).</li>
          <li><InlineCode>too_big</InlineCode>: lowers number to max (or max - epsilon when exclusive).</li>
          <li><InlineCode>invalid_enum_value</InlineCode>: selects first enum option unless overridden.</li>
          <li><InlineCode>invalid_type</InlineCode>: falls back to type-safe defaults where possible.</li>
          <li><InlineCode>custom</InlineCode>: can be resolved via path defaults or custom resolver.</li>
        </ul>
      </ConceptCard>

      <ConceptCard title="Example 1: Clamp Out-of-Bounds + Enum Drift">
        <CodeBlock code={clampExample} />
      </ConceptCard>

      <ConceptCard title="Example 2: Strict Mode Forces LLM Retry">
        <CodeBlock code={strictExample} />
      </ConceptCard>

      <ConceptCard title="Example 3: Custom Resolver for Business Rules">
        <CodeBlock code={customResolverExample} />
      </ConceptCard>
    </div>
  )
}
