import { SectionHeader } from '../../components/DocsLayout'

export default function Environments() {
  return (
    <div className="space-y-6">
      <SectionHeader>Environment Compatibility</SectionHeader>
      <p className="text-muted-foreground leading-relaxed">
        Reforge uses only standard JavaScript APIs. No Node-specific modules, no polyfills required.
      </p>
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-border/60">
              <th className="pb-3 text-left font-semibold text-foreground">Runtime</th>
              <th className="pb-3 text-left font-semibold text-foreground">Status</th>
              <th className="pb-3 text-left font-semibold text-foreground">Notes</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border/30 text-muted-foreground">
            <tr><td className="py-2.5">Node.js 18+</td><td className="py-2.5 text-green-400">✓ Supported</td><td className="py-2.5">CJS + ESM</td></tr>
            <tr><td className="py-2.5">Bun</td><td className="py-2.5 text-green-400">✓ Supported</td><td className="py-2.5">Native ESM</td></tr>
            <tr><td className="py-2.5">Deno</td><td className="py-2.5 text-green-400">✓ Supported</td><td className="py-2.5">Via npm: specifier</td></tr>
            <tr><td className="py-2.5">Cloudflare Workers</td><td className="py-2.5 text-green-400">✓ Supported</td><td className="py-2.5">No Node APIs used</td></tr>
            <tr><td className="py-2.5">Vercel Edge</td><td className="py-2.5 text-green-400">✓ Supported</td><td className="py-2.5">Edge-compatible</td></tr>
            <tr><td className="py-2.5">Browser</td><td className="py-2.5 text-green-400">✓ Supported</td><td className="py-2.5">ESM bundle, tree-shakeable</td></tr>
          </tbody>
        </table>
      </div>
      <p className="text-sm text-muted-foreground/70">
        Reforge outputs both CJS and ESM via tsup. TypeScript definitions are included. The bundle is tree-shakeable and has zero side effects.
      </p>
    </div>
  )
}
