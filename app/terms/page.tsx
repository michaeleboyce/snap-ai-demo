import AppShell from '@/components/app-shell';

export default function TermsPage() {
  return (
    <AppShell>
      <div className="max-w-3xl">
        <h1 className="text-3xl font-bold text-gray-900 mb-4">Approved Terms & Disclosures</h1>
        <div className="bg-white rounded-lg border shadow-sm p-6 space-y-4 text-gray-800">
          <p>
            By proceeding with the AI-assisted interview, you acknowledge and agree to the following:
          </p>
          <ol className="list-decimal pl-6 space-y-2">
            <li>
              AI Assistant Disclosure: You understand that you will be interacting with an artificial intelligence
              system designed to conduct SNAP eligibility interviews. This AI assistant is not a human but follows
              State of Fake State guidelines.
            </li>
            <li>
              Recording & Quality Assurance: Your interview may be recorded and transcribed to ensure quality and
              accuracy.
            </li>
            <li>
              Human Review: All information collected will be reviewed by qualified state staff who make the final
              eligibility determination. The AI does not make decisions about your benefits.
            </li>
            <li>
              Data Privacy: Your personal information will be protected according to state and federal privacy laws.
              Information will not be shared except as required for benefit administration.
            </li>
            <li>
              Voluntary Participation: Using the AI assistant is voluntary. You may request a traditional interview
              with a human caseworker at any time.
            </li>
            <li>
              Accuracy of Information: You agree to provide accurate and complete information. Providing false
              information may affect your eligibility and could result in penalties.
            </li>
          </ol>
        </div>
      </div>
    </AppShell>
  );
}


