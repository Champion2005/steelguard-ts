import { SectionHeader, ConceptCard, InlineCode, ParamRow } from '../../components/DocsLayout'
import CodeBlock from '../../components/CodeBlock'

const guardTelemetry = `const result = guard(raw, schema, {
  semanticResolution: { mode: 'clamp' },
});

if (result.success) {
  console.log(result.telemetry);
  // {
  //   durationMs: 0.9,
  //   status: 'coerced_locally',
  //   coercedPaths: ['/age', '/items/0/quantity']
  // }
}
`

const forgeTelemetry = `const result = await forge(provider, messages, schema, {
  tools,
  maxRetries: 2,
});

console.log(result.telemetry);
// {
//   attempts,
//   totalDurationMs,
//   networkDurationMs,
//   toolExecutionDurationMs,
//   providerHops,
//   attemptDetails,
//   status,
// }
`

const telemetryExport = `const result = await forge(providerChain, messages, schema, {
  onEvent: (event) => {
    if (event.kind === 'finished') {
      console.log('Forge run complete', event);
    }
  },
});

if (result.success) {
  await fetch('/observability/ingest', {
    method: 'POST',
    body: JSON.stringify(result.telemetry),
  });
}
`

export default function TelemetryReferenceV030() {
  return (
    <div className="space-y-8">
      <SectionHeader>Telemetry Reference (v0.3.0)</SectionHeader>
      <p className="text-muted-foreground leading-relaxed">
        Reforge telemetry separates local validation/coercion work from network and tool-loop costs.
        This section documents the new <InlineCode>coerced_locally</InlineCode> status,
        <InlineCode>coercedPaths</InlineCode>, and multi-hop timing fields.
      </p>

      <ConceptCard title="Guard Telemetry Fields">
        <div className="space-y-2 text-sm text-muted-foreground">
          <ParamRow name="durationMs" type="number" desc="Elapsed local wall-clock time for guard()." />
          <ParamRow name="status" type="clean | repaired_natively | coerced_locally | failed" desc="Outcome classification." />
          <ParamRow name="coercedPaths" type="string[]" desc="JSON-pointer-like paths changed during semantic clamp, e.g. /items/0/age." />
        </div>
      </ConceptCard>

      <ConceptCard title="Forge Telemetry Fields">
        <div className="space-y-2 text-sm text-muted-foreground">
          <ParamRow name="attempts" type="number" desc="Total provider calls performed in the run." />
          <ParamRow name="networkDurationMs" type="number" desc="Total provider call time across attempts and tool-loop turns." />
          <ParamRow name="toolExecutionDurationMs" type="number" desc="Local JS tool execution time only." />
          <ParamRow name="providerHops" type="ForgeProviderHop[]" desc="Per-provider call/hop timing and success flags." />
          <ParamRow name="attemptDetails" type="ForgeAttemptDetail[]" desc="Per-attempt guard statuses and durations." />
        </div>
        <p className="mt-3 text-sm text-muted-foreground leading-relaxed">
          In successful runs, <InlineCode>attempts</InlineCode> usually equals the number of
          <InlineCode> attemptDetails</InlineCode> entries. <InlineCode>providerHops</InlineCode> can be larger because
          each tool-loop roundtrip is tracked as another provider hop.
        </p>
      </ConceptCard>

      <ConceptCard title="Example 1: Reading coerced_locally + coercedPaths">
        <CodeBlock code={guardTelemetry} />
      </ConceptCard>

      <ConceptCard title="Example 2: Distinguishing Network vs Tool Costs">
        <CodeBlock code={forgeTelemetry} />
      </ConceptCard>

      <ConceptCard title="Example 3: Exporting Telemetry to Observability">
        <CodeBlock code={telemetryExport} />
      </ConceptCard>
    </div>
  )
}
