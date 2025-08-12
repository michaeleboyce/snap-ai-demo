import AppShell from '@/components/app-shell';
import Link from 'next/link';

export default function AboutPage() {
  return (
    <AppShell>
      <div className="max-w-3xl">
        <h1 className="text-3xl font-bold text-gray-900 mb-3">About this Project</h1>
        <p className="text-gray-700 mb-6">
          This is a proof-of-concept SNAP Interview Assistant built by US Digital Response in partnership with
          the Connecticut Department of Social Services. It demonstrates how conversational AI can help conduct
          structured eligibility interviews while preserving human-in-the-loop decision making.
        </p>

        <div className="space-y-6">
          <section className="bg-white rounded-lg border shadow-sm p-5">
            <h2 className="text-xl font-semibold text-gray-900 mb-2">Goals</h2>
            <ul className="list-disc pl-6 text-gray-700 space-y-1">
              <li>Reduce interview-related error rates</li>
              <li>Improve administrative efficiency</li>
              <li>Maintain program integrity and compliance</li>
              <li>Preserve human review and oversight</li>
            </ul>
          </section>

          <section className="bg-white rounded-lg border shadow-sm p-5">
            <h2 className="text-xl font-semibold text-gray-900 mb-2">How it Works</h2>
            <p className="text-gray-700 mb-3">
              Applicants can complete an interview by voice or text. The system tracks coverage of required
              sections (household, income, expenses, assets), saves checkpoints, and generates a structured
              summary for staff review.
            </p>
            <div className="flex gap-2">
              <Link href="/interview" className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 text-sm">
                Start Interview
              </Link>
              <Link href="/interview-history" className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 text-sm">
                View History
              </Link>
            </div>
          </section>

          <section className="bg-white rounded-lg border shadow-sm p-5">
            <h2 className="text-xl font-semibold text-gray-900 mb-2">Responsible AI</h2>
            <ul className="list-disc pl-6 text-gray-700 space-y-1">
              <li>Human-in-the-loop review for all determinations</li>
              <li>Clear disclosure and consent prior to interview</li>
              <li>Opt-out available at any time</li>
              <li>Audit trail of conversations</li>
            </ul>
          </section>

          <section className="bg-white rounded-lg border shadow-sm p-5">
            <h2 className="text-xl font-semibold text-gray-900 mb-2">Contact</h2>
            <p className="text-gray-700">
              For assistance, please visit the{' '}
              <Link href="/contact-human" className="text-blue-700 underline">Contact Human</Link> page.
            </p>
          </section>
        </div>
      </div>
    </AppShell>
  );
}


