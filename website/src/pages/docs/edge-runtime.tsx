import { SectionHeader, InlineCode } from '../../components/DocsLayout'
import CodeBlock from '../../components/CodeBlock'

const edgeRouteCode = `// app/api/parse/route.ts (Next.js Edge)
import { z } from 'zod';
import { guard } from 'reforge-ai';

export const runtime = 'edge';

const PayloadSchema = z.object({
  action: z.string(),
  data: z.record(z.unknown()),
});

export async function POST(request: Request) {
  const body = await request.text();
  const result = guard(body, PayloadSchema);

  if (result.success) {
    return Response.json({ ok: true, data: result.data });
  }

  return Response.json(
    { ok: false, errors: result.errors },
    { status: 422 },
  );
}`

export default function EdgeRuntime() {
  return (
    <div className="space-y-6">
      <SectionHeader>Edge Runtime</SectionHeader>
      <p className="text-muted-foreground leading-relaxed">
        Reforge uses no Node-specific APIs (<InlineCode>fs</InlineCode>, <InlineCode>path</InlineCode>, <InlineCode>Buffer</InlineCode>), so it works natively in edge runtimes. Here's an example Next.js Edge API route:
      </p>
      <CodeBlock code={edgeRouteCode} />
      <p className="text-muted-foreground leading-relaxed text-sm">
        This also works identically in Cloudflare Workers, Vercel Edge Functions, and Deno Deploy.
      </p>
    </div>
  )
}
