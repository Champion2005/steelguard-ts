import { SectionHeader, InlineCode } from '../../components/DocsLayout'

export default function ProviderAdapters() {
  return (
    <div className="space-y-6">
      <SectionHeader>Provider Adapters</SectionHeader>
      <p className="text-muted-foreground leading-relaxed">
        Reforge ships three built-in adapters. Each wraps the respective SDK's chat completion call and extracts the text content from the response. You pass your own pre-configured client — Reforge never manages credentials.
      </p>
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-border/60">
              <th className="pb-3 text-left font-semibold text-foreground">Adapter</th>
              <th className="pb-3 text-left font-semibold text-foreground">Import</th>
              <th className="pb-3 text-left font-semibold text-foreground">Covers</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border/30 text-muted-foreground">
            <tr>
              <td className="py-2.5"><InlineCode>openaiCompatible()</InlineCode></td>
              <td className="py-2.5 font-mono text-xs">reforge-ai/openai-compatible</td>
              <td className="py-2.5">OpenAI, OpenRouter, Groq, Together, Fireworks, Ollama, LM Studio, vLLM</td>
            </tr>
            <tr>
              <td className="py-2.5"><InlineCode>anthropic()</InlineCode></td>
              <td className="py-2.5 font-mono text-xs">reforge-ai/anthropic</td>
              <td className="py-2.5">Anthropic Claude</td>
            </tr>
            <tr>
              <td className="py-2.5"><InlineCode>google()</InlineCode></td>
              <td className="py-2.5 font-mono text-xs">reforge-ai/google</td>
              <td className="py-2.5">Google Gemini, Vertex AI</td>
            </tr>
          </tbody>
        </table>
      </div>
      <p className="text-sm text-muted-foreground/70">
        The <InlineCode>openaiCompatible()</InlineCode> adapter works with ANY OpenAI-compatible provider because you pass a pre-configured client with custom <InlineCode>baseURL</InlineCode>. Reforge never manages credentials.
      </p>
    </div>
  )
}
