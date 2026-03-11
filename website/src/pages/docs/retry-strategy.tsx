import { SectionHeader, InlineCode } from '../../components/DocsLayout'

export default function RetryStrategy() {
  return (
    <div className="space-y-6">
      <SectionHeader>Retry Strategy</SectionHeader>
      <p className="text-muted-foreground leading-relaxed">
        When <InlineCode>guard()</InlineCode> fails it returns a <InlineCode>retryPrompt</InlineCode> string
        ready to append to your LLM message array. The prompt <strong className="text-foreground">assumes the LLM still has your schema in its conversation context</strong> — it never re-sends the schema, only describes exactly what was wrong with the previous response.
      </p>
      <p className="text-muted-foreground leading-relaxed">
        There are two distinct failure modes, each producing a different prompt:
      </p>
      <div className="space-y-3">
        <div className="rounded-xl border border-border/60 bg-card/30 p-5 text-sm">
          <p className="font-semibold text-foreground mb-1">Parse failure <span className="ml-2 rounded bg-muted px-1.5 py-0.5 font-mono text-[11px] text-muted-foreground">errors: []</span></p>
          <p className="text-xs text-muted-foreground mb-3">The LLM returned something that couldn't be extracted as JSON at all. When the output is short enough to be the complete picture (&le;300 chars), it's echoed verbatim. For longer outputs the snippet is omitted.</p>
          <pre className="overflow-x-auto whitespace-pre-wrap rounded-lg border border-border/40 bg-[oklch(0.13_0.005_286)] p-3.5 font-mono text-[13px] leading-6 text-muted-foreground">
{`// Short output — full text is included:
Your previous response could not be parsed as JSON. Got: \`{name: Alice age: 30}\`. The schema is still in your context — return ONLY valid JSON.

// Long output — snippet omitted:
Your previous response could not be parsed as JSON. The schema is still in your context — return ONLY valid JSON.`}
          </pre>
        </div>
        <div className="rounded-xl border border-border/60 bg-card/30 p-5 text-sm">
          <p className="font-semibold text-foreground mb-1">Validation failure <span className="ml-2 rounded bg-muted px-1.5 py-0.5 font-mono text-[11px] text-muted-foreground">errors: ZodIssue[]</span></p>
          <p className="text-xs text-muted-foreground mb-3">JSON parsed successfully but didn't satisfy the schema. Each broken field is reported with its exact path, expected type, and received type.</p>
          <pre className="overflow-x-auto whitespace-pre-wrap rounded-lg border border-border/40 bg-[oklch(0.13_0.005_286)] p-3.5 font-mono text-[13px] leading-6 text-muted-foreground">
{`Your previous response failed schema validation. Errors: [Path: /age, Expected: number, Received: string]; [Path: /email, Expected: string, Received: undefined]. The schema is still in your context — return ONLY corrected valid JSON.`}
          </pre>
        </div>
      </div>
      <p className="text-muted-foreground leading-relaxed">
        Because the schema is assumed to be in context, the prompt stays minimal — only the specific paths and types that failed are included, never the full schema definition. This saves tokens and avoids inflating your context window on retries.
      </p>
    </div>
  )
}
