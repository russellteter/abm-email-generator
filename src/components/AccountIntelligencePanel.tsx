import type { Account } from '@/lib/types';

interface AccountIntelligencePanelProps {
  account: Account;
}

function TierBadge({ tier }: { tier: string }) {
  const isHighTier = tier === 'A+' || tier === 'A';
  return (
    <span
      className={`rounded-full px-3 py-1 text-sm font-medium ${
        isHighTier
          ? 'bg-class-purple text-white'
          : 'bg-gray-200 text-class-navy'
      }`}
    >
      Tier {tier}
    </span>
  );
}

function QuickFactsGrid({ account }: { account: Account }) {
  const facts = [
    { label: 'EHR System', value: account.ehr_system },
    { label: 'Stage', value: account.ehr_stage },
    { label: 'Go-Live Date', value: account.ehr_go_live_date || 'TBD' },
    {
      label: 'Employees',
      value: account.employee_count?.toLocaleString() || 'N/A',
    },
  ];

  // Only add LMS if present and not empty
  if (account.lms && account.lms.trim()) {
    facts.push({ label: 'LMS', value: account.lms });
  }

  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
      {facts.map((fact) => (
        <div key={fact.label}>
          <dt className="text-xs font-medium uppercase tracking-wide text-class-navy/60">
            {fact.label}
          </dt>
          <dd className="mt-1 text-sm font-medium text-class-navy">
            {fact.value}
          </dd>
        </div>
      ))}
    </div>
  );
}

function TextSection({
  title,
  content,
  collapsible = false,
}: {
  title: string;
  content: string;
  collapsible?: boolean;
}) {
  if (!content || !content.trim()) return null;

  const shouldCollapse = collapsible && content.length > 300;

  if (shouldCollapse) {
    return (
      <details className="group">
        <summary className="cursor-pointer list-none">
          <h4 className="inline-flex items-center gap-2 text-sm font-semibold text-class-navy">
            {title}
            <span className="text-xs text-class-navy/50 group-open:hidden">
              (click to expand)
            </span>
            <span className="hidden text-xs text-class-navy/50 group-open:inline">
              (click to collapse)
            </span>
          </h4>
        </summary>
        <p className="mt-2 text-sm leading-relaxed text-class-navy/80">
          {content}
        </p>
      </details>
    );
  }

  return (
    <div>
      <h4 className="text-sm font-semibold text-class-navy">{title}</h4>
      <p className="mt-2 text-sm leading-relaxed text-class-navy/80">
        {content}
      </p>
    </div>
  );
}

export default function AccountIntelligencePanel({
  account,
}: AccountIntelligencePanelProps) {
  return (
    <div className="rounded-lg border border-class-light-purple bg-white p-4">
      {/* Header: Company name + Tier badge */}
      <div className="flex items-center justify-between border-b border-class-light-purple pb-4">
        <h3 className="text-lg font-bold text-class-navy">
          {account.company_name}
        </h3>
        <TierBadge tier={account.tier} />
      </div>

      {/* Quick Facts Grid */}
      <div className="mt-4 rounded-lg bg-class-light-purple/30 p-4">
        <QuickFactsGrid account={account} />
      </div>

      {/* Qualification Summary / Tier Rationale */}
      <div className="mt-6 space-y-4">
        <TextSection
          title="Qualification Summary"
          content={account.tier_rationale}
        />

        {/* Timing Signals - only if non-empty */}
        <TextSection
          title="Timing Signals"
          content={account.timing_signals || account.key_timing_signals}
        />

        {/* Evidence Summary - collapsible for long text */}
        <TextSection
          title="Evidence Summary"
          content={account.evidence_summary}
          collapsible
        />

        {/* Recent News - only if non-empty */}
        <TextSection title="Recent News" content={account.news_summary} />
      </div>
    </div>
  );
}
