import { SectionHeader, InlineCode } from '../../components/DocsLayout'
import CodeBlock from '../../components/CodeBlock'

const googleForgeCode = `import { z } from 'zod';
import { forge } from 'reforge-ai';
import { google } from 'reforge-ai/google';
import { GoogleGenerativeAI } from '@google/generative-ai';

const client = new GoogleGenerativeAI(process.env.GOOGLE_API_KEY!);
const provider = google(client, 'gemini-2.0-flash');

const SummarySchema = z.object({
  title:    z.string(),
  summary:  z.string(),
  keywords: z.array(z.string()),
});

const result = await forge(provider, [
  { role: 'user', content: 'Summarize: TypeScript 5.7 adds ...' },
], SummarySchema);`

export default function GoogleGuide() {
  return (
    <div className="space-y-6">
      <SectionHeader>Google Gemini Integration</SectionHeader>
      <p className="text-muted-foreground leading-relaxed">
        Use the Google adapter with the <InlineCode>@google/generative-ai</InlineCode> SDK. It supports all Gemini models including Gemini 2.0 Flash and Pro.
      </p>
      <CodeBlock code={googleForgeCode} />
      <p className="text-sm text-muted-foreground/70">
        The Google adapter automatically maps <InlineCode>assistant</InlineCode> roles to <InlineCode>model</InlineCode> and handles system message extraction for Gemini's API format.
      </p>
    </div>
  )
}
