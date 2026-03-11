import { SectionHeader } from '../../components/DocsLayout'

export default function ReportingIssues() {
  return (
    <div className="space-y-6">
      <SectionHeader>Reporting Issues</SectionHeader>
      <p className="text-muted-foreground leading-relaxed">
        Found a bug? Have a feature request? We'd love to hear from you.
      </p>
      <div className="space-y-3">
        <div className="rounded-xl border border-border/60 bg-card/30 p-5">
          <h3 className="text-sm font-semibold text-foreground">Bug Reports</h3>
          <p className="mt-2 text-sm text-muted-foreground leading-relaxed">
            Open an issue at{' '}
            <a href="https://github.com/Champion2005/reforge/issues/new?template=bug_report.yml" target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">
              github.com/Champion2005/reforge/issues
            </a>
            . Include the raw LLM output string, your Zod schema, and the unexpected result. This helps us reproduce and fix the issue quickly.
          </p>
        </div>
        <div className="rounded-xl border border-border/60 bg-card/30 p-5">
          <h3 className="text-sm font-semibold text-foreground">Feature Requests</h3>
          <p className="mt-2 text-sm text-muted-foreground leading-relaxed">
            Have an idea for a new feature? Open an issue with the{' '}
            <a href="https://github.com/Champion2005/reforge/issues/new?template=feature_request.yml" target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">
              feature request template
            </a>
            . Describe the use case and how you'd expect the API to work.
          </p>
        </div>
        <div className="rounded-xl border border-border/60 bg-card/30 p-5">
          <h3 className="text-sm font-semibold text-foreground">Contributing</h3>
          <p className="mt-2 text-sm text-muted-foreground leading-relaxed">
            Want to contribute code? See the{' '}
            <a href="https://github.com/Champion2005/reforge/blob/master/CONTRIBUTING.md" target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">
              Contributing Guide
            </a>
            {' '}for setup instructions, coding standards, and PR workflow.
          </p>
        </div>
      </div>
    </div>
  )
}
