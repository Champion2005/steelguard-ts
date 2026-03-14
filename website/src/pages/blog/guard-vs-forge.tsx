import BlogLayout, { Heading, SubHeading, Paragraph, InlineCode } from '../../components/BlogLayout'

export default function GuardVsForgePost() {
  return (
    <BlogLayout
      title="When to use Forge vs. Guard: A Guide to Reforge-AI"
      date="March 14, 2026"
      readingTime="5 min read"
    >
      <Paragraph>
        If you're building applications with Large Language Models, you've almost certainly encountered the "JSON parsing problem." LLMs are probabilistic, and no matter how strictly you prompt them, they eventually return malformed output—markdown code blocks, trailing commas, unquoted keys, or truncated JSON.
      </Paragraph>

      <Paragraph>
        <strong>Reforge-AI</strong> was built to solve this natively. But as the library has grown, we now offer two distinct ways to tackle the problem: <InlineCode>guard()</InlineCode> and <InlineCode>forge()</InlineCode>.
      </Paragraph>

      <Paragraph>
        Which one should you use? In this post, we'll break down the capabilities, pros, and cons of each, helping you choose the right tool for your specific architecture.
      </Paragraph>

      <Heading>🏗️ guard(): The Core Repair Engine</Heading>

      <Paragraph>
        The <InlineCode>guard()</InlineCode> function is the beating heart of Reforge. It is a <strong>synchronous, zero-dependency, pure function</strong> that takes a dirty LLM output string and strictly enforces semantic validity via a Zod schema.
      </Paragraph>

      <Paragraph>
        Under the hood, <InlineCode>guard()</InlineCode> extracts JSON from markdown blocks, balances brackets, resolves common syntactical errors (like trailing commas or missing quotes), and coerces types to match your schema.
      </Paragraph>

      <SubHeading>Capabilities</SubHeading>
      <ul className="list-disc pl-6 mb-6 text-gray-300 space-y-2">
        <li><strong>Microsecond Latency:</strong> Executes synchronously in under 5ms.</li>
        <li><strong>Zero Dependencies:</strong> No heavy AST parsers or network dependencies.</li>
        <li><strong>Environment Agnostic:</strong> Runs identically in Node.js, Cloudflare Workers, Vercel Edge, Deno, Bun, and even natively in the Browser.</li>
        <li><strong>Deep Repair:</strong> Fixes structural JSON errors automatically before validation.</li>
      </ul>

      <SubHeading>When to use guard()</SubHeading>
      <Paragraph>
        Use <InlineCode>guard()</InlineCode> when you want <strong>total control over your API calls</strong>, or when you are deeply integrated into a specific framework that already handles the network request (like Vercel AI SDK).
      </Paragraph>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
        <div className="bg-green-900/20 border border-green-500/20 p-6 rounded-lg">
          <h4 className="text-green-400 font-semibold mb-3">Pros</h4>
          <ul className="list-disc pl-4 text-sm text-gray-300 space-y-2">
            <li>Complete architectural freedom. You make the LLM call; Reforge just cleans it up.</li>
            <li>Easily drops into existing codebases.</li>
            <li>Zero network overhead.</li>
            <li>Works perfectly for client-side evaluation or post-processing stored LLM responses.</li>
          </ul>
        </div>
        <div className="bg-red-900/20 border border-red-500/20 p-6 rounded-lg">
          <h4 className="text-red-400 font-semibold mb-3">Cons</h4>
          <ul className="list-disc pl-4 text-sm text-gray-300 space-y-2">
            <li>It cannot retry automatically on LLM semantic hallucination. You have to write the retry loop.</li>
            <li>You have to manage the orchestration of the LLM SDK yourself.</li>
          </ul>
        </div>
      </div>

      <Heading>🚀 forge(): The End-to-End Orchestrator</Heading>

      <Paragraph>
        While <InlineCode>guard()</InlineCode> is the engine, <strong><InlineCode>forge()</InlineCode> is the entire vehicle.</strong>
      </Paragraph>

      <Paragraph>
        The <InlineCode>forge()</InlineCode> function wraps your favorite provider's SDK (OpenAI, Anthropic, Google Gemini, OpenRouter) and handles the entire lifecycle: making the call, parsing the result with <InlineCode>guard()</InlineCode>, and automatically re-prompting the model if validation fails.
      </Paragraph>

      <Paragraph>
        Thanks to our recent <strong>Infrastructure Revamp</strong>, <InlineCode>forge()</InlineCode> now exposes the <strong>full power of the underlying AI providers</strong> with zero compromises.
      </Paragraph>

      <SubHeading>Capabilities</SubHeading>
      <ul className="list-disc pl-6 mb-6 text-gray-300 space-y-2">
        <li><strong>Automatic Multi-Turn Retries:</strong> If the LLM fails to match your schema, <InlineCode>forge()</InlineCode> automatically appends a highly token-efficient retry prompt and calls the model again.</li>
        <li><strong>Provider-Native Option Typing:</strong> 100% strongly-typed passthrough for native SDK features. Receive full TypeScript IntelliSense for OpenAI's <InlineCode>reasoning_effort</InlineCode>, Anthropic's <InlineCode>thinking</InlineCode> blocks, or Google's <InlineCode>safetySettings</InlineCode>.</li>
        <li><strong>Stateful Chat Sessions:</strong> Built-in history management. You can maintain a multi-turn conversation over time without manually appending arrays, and retries happen automatically without polluting the main history context.</li>
        <li><strong>Multimodal Support:</strong> Natively supports passing Vision (images) and Audio contexts in the unified Message format.</li>
        <li><strong>Telemetry & Tokens:</strong> Detailed telemetry tracks not just repair status, but exact duration, attempt counts, and mapped token usage.</li>
      </ul>

      <SubHeading>When to use forge()</SubHeading>
      <Paragraph>
        Use <InlineCode>forge()</InlineCode> when you are building a new feature and want a "fire-and-forget" solution that guarantees structured data comes out the other end.
      </Paragraph>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
        <div className="bg-green-900/20 border border-green-500/20 p-6 rounded-lg">
          <h4 className="text-green-400 font-semibold mb-3">Pros</h4>
          <ul className="list-disc pl-4 text-sm text-gray-300 space-y-2">
            <li>Zero boilerplate: Replaces hundreds of lines of brittle retry loops and SDK integration code.</li>
            <li>Highly Resilient: The auto-retry mechanism drastically increases the success rate of complex schemas.</li>
            <li>Unified API: Switch from OpenAI to Anthropic to Google with a single line of code.</li>
            <li>No Compromises: Full access to provider-specific features.</li>
          </ul>
        </div>
        <div className="bg-red-900/20 border border-red-500/20 p-6 rounded-lg">
          <h4 className="text-red-400 font-semibold mb-3">Cons</h4>
          <ul className="list-disc pl-4 text-sm text-gray-300 space-y-2">
            <li>Opinionated: You are buying into the Reforge way of making API calls.</li>
            <li>Requires Peer Dependencies: You must install the official SDK for your provider (e.g., <InlineCode>openai</InlineCode>).</li>
            <li>Network Bound: A <InlineCode>forge()</InlineCode> call's execution time equals the total provider latencies across all required retries.</li>
          </ul>
        </div>
      </div>

      <Heading>⚖️ The Verdict</Heading>

      <Paragraph>
        <strong>Choose <InlineCode>guard()</InlineCode></strong> if you are building an infrastructure-level tool, deeply integrating with custom fetching logic, streaming raw tokens, or running entirely in the browser. It's the ultimate surgical tool for dirty data.
      </Paragraph>
      <Paragraph>
        <strong>Choose <InlineCode>forge()</InlineCode></strong> if you are building an application and just want guaranteed, validated data from an LLM. Let the library handle the retries, the SDK mapping, and the heavy lifting, while you focus on building your product.
      </Paragraph>
    </BlogLayout>
  )
}
