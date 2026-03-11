import { SectionHeader } from '../../components/DocsLayout'

export default function Performance() {
  return (
    <div className="space-y-6">
      <SectionHeader>Performance</SectionHeader>
      <p className="text-muted-foreground leading-relaxed">
        Reforge is designed for <strong className="text-foreground">&lt; 5ms</strong> end-to-end on a 2KB input. The entire pipeline is:
      </p>
      <div className="grid gap-3 sm:grid-cols-2">
        {[
          { label: 'Synchronous', desc: 'No async, no network, no I/O' },
          { label: 'Pure', desc: 'No global state mutation' },
          { label: 'O(n)', desc: 'Linear time relative to input length' },
          { label: 'Never throws', desc: 'All error paths return typed results' },
        ].map((item) => (
          <div key={item.label} className="rounded-lg border border-border/40 bg-card/30 p-4">
            <p className="text-sm font-semibold text-foreground">{item.label}</p>
            <p className="mt-1 text-xs text-muted-foreground">{item.desc}</p>
          </div>
        ))}
      </div>
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-border/60">
              <th className="pb-3 text-left font-semibold text-foreground">Operation</th>
              <th className="pb-3 text-left font-semibold text-foreground">Typical Time</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border/30 text-muted-foreground">
            <tr><td className="py-2.5">Clean JSON (fast path)</td><td className="py-2.5">&lt; 0.1ms</td></tr>
            <tr><td className="py-2.5">Markdown extraction + parse</td><td className="py-2.5">&lt; 0.5ms</td></tr>
            <tr><td className="py-2.5">Full heuristic repair</td><td className="py-2.5">&lt; 2ms</td></tr>
            <tr><td className="py-2.5">Repair + Zod validation</td><td className="py-2.5">&lt; 5ms</td></tr>
            <tr><td className="py-2.5">LLM network retry (comparison)</td><td className="py-2.5">1,000 - 3,000ms</td></tr>
          </tbody>
        </table>
      </div>
    </div>
  )
}
