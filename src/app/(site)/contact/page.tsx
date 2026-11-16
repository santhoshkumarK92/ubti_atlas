import { getCompany, getIndustries } from '@/lib/repo';
import { LeadForm } from '@/components/site/LeadForm';

export const metadata = { title: 'Request a demo' };

export default async function Contact() {
  const [company, industries] = await Promise.all([getCompany(), getIndustries()]);
  return (
    <section className="frame row grid md:grid-cols-[1fr_1.4fr]">
      <div className="p-6 md:p-10">
        <div className="eyebrow mb-4">Request a demo</div>
        <h1 className="h-display text-5xl md:text-6xl">Let&apos;s bring the AI<br /><span className="text-muted/60">to your data</span></h1>
        <p className="mt-5 max-w-sm text-sm text-muted">Tell us which systems you run and what you&apos;d like to automate. We&apos;ll come back with the closest ready-made agents and a short demo.</p>
        <div className="mt-8 space-y-1 text-sm">
          {company.contactEmail && <div><a className="link" href={`mailto:${company.contactEmail}`}>{company.contactEmail}</a></div>}
          {company.offices.map((o) => <div key={o} className="text-muted">{o}</div>)}
        </div>
      </div>
      <div className="border-t border-line p-6 md:border-l md:border-t-0 md:p-10">
        <LeadForm source="contact" industries={industries} />
      </div>
    </section>
  );
}
