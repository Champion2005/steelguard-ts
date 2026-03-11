import { SectionHeader, ParamRow } from '../../components/DocsLayout'
import CodeBlock from '../../components/CodeBlock'

const forgeApiTypes = `// ── Provider Layer: forge() ──
async function forge<T extends z.ZodTypeAny>(
  provider: ReforgeProvider,
  messages: Message[],
  schema: T,
  options?: ForgeOptions
): Promise<ForgeResult<z.infer<T>>>

interface ReforgeProvider {
  call(messages: Message[], options?: ProviderCallOptions): Promise<string>;
}

interface Message {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

interface ForgeOptions {
  maxRetries?: number;         // Default: 3
  providerOptions?: ProviderCallOptions;
}

interface ProviderCallOptions {
  temperature?: number;
  maxTokens?: number;
  [key: string]: unknown;      // Pass-through for provider-specific options
}

type ForgeResult<T> = ForgeSuccess<T> | ForgeFailure;

interface ForgeSuccess<T> {
  success: true;
  data: T;
  telemetry: ForgeTelemetry;
  isRepaired: boolean;
}

interface ForgeFailure {
  success: false;
  errors: ZodIssue[];
  telemetry: ForgeTelemetry;
}

interface ForgeTelemetry extends TelemetryData {
  attempts: number;
  totalDurationMs: number;
}

// ── Adapter factories ──
function openaiCompatible(client: OpenAIClient, model: string): ReforgeProvider;
function anthropic(client: AnthropicClient, model: string): ReforgeProvider;
function google(client: GoogleClient, model: string): ReforgeProvider;`

export default function ApiForge() {
  return (
    <div className="space-y-6">
      <SectionHeader>API Reference — forge() & Providers</SectionHeader>
      <p className="text-muted-foreground">
        The async orchestrator and provider adapter types.
      </p>
      <CodeBlock code={forgeApiTypes} />

      <div className="mt-8 space-y-5">
        <div className="rounded-xl border border-border/60 bg-card/30 p-6">
          <h3 className="text-base font-semibold text-foreground">
            <code className="rounded-md bg-primary/10 px-2 py-0.5 font-mono text-sm text-primary">forge(provider, messages, schema, options?)</code>
          </h3>
          <div className="mt-4 space-y-2.5 text-sm text-muted-foreground">
            <ParamRow name="provider" type="ReforgeProvider" desc="An adapter wrapping your LLM SDK." />
            <ParamRow name="messages" type="Message[]" desc="The conversation messages to send." />
            <ParamRow name="schema" type="z.ZodTypeAny" desc="The Zod schema to validate against." />
            <ParamRow name="options" type="ForgeOptions" desc="Optional: maxRetries (default 3), providerOptions." />
            <ParamRow name="Returns" type="Promise<ForgeResult<T>>" desc="Discriminated union with telemetry including attempts and totalDurationMs." />
          </div>
        </div>

        <div className="rounded-xl border border-border/60 bg-card/30 p-6">
          <h3 className="text-base font-semibold text-foreground">
            <code className="rounded-md bg-primary/10 px-2 py-0.5 font-mono text-sm text-primary">ForgeTelemetry</code>
          </h3>
          <div className="mt-4 space-y-2.5 text-sm text-muted-foreground">
            <ParamRow name="durationMs" type="number" desc="Duration of the last guard() call." />
            <ParamRow name="status" type="string" desc="Status of the last guard() call." />
            <ParamRow name="attempts" type="number" desc="Total LLM calls made (1 = first try succeeded)." />
            <ParamRow name="totalDurationMs" type="number" desc="Wall-clock time for the entire forge() call." />
          </div>
        </div>
      </div>
    </div>
  )
}
