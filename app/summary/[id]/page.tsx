import { db } from '@/lib/db';
import { interviews } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';
import Link from 'next/link';
import AppShell from '@/components/app-shell';
import { Clock } from 'lucide-react';
import SummaryHeader from '@/components/summary/Header';
import Eligibility from '@/components/summary/Eligibility';
import Household from '@/components/summary/Household';
import Income from '@/components/summary/Income';
import Expenses from '@/components/summary/Expenses';
import Flags from '@/components/summary/Flags';
import CaseworkerNotes from '@/components/summary/CaseworkerNotes';

async function getInterview(sessionId: string) {
  const result = await db.select()
    .from(interviews)
    .where(eq(interviews.sessionId, sessionId))
    .limit(1);
  
  return result[0];
}

export default async function SummaryPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const interview = await getInterview(id);

  if (!interview) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-4">Interview Not Found</h1>
          <Link href="/" className="text-blue-600 hover:underline">
            Return to Home
          </Link>
        </div>
      </div>
    );
  }

  const summary = interview.summary as any;

  return (
    <AppShell rightSlot={<div className="bg-emerald-100 text-emerald-800 px-3 py-1 rounded-full text-xs font-semibold">AI Generated Summary</div>}>
        <Link href="/" className="inline-flex items-center gap-2 text-blue-700 hover:underline mb-6">
        ← Back to Home
        </Link>

        <div className="bg-white rounded-2xl shadow-sm ring-1 ring-slate-900/5 p-8">
        <SummaryHeader sessionId={id} completedAt={interview.completedAt as any} />

          {summary ? (
            <div className="space-y-6">
            <Eligibility data={summary.eligibility_assessment} />
            <Household data={summary.household} />
            <Income data={summary.income} />
            <Expenses data={summary.expenses} />
            <Flags data={summary.flags} />
            <CaseworkerNotes notes={summary.caseworker_notes} />

              <div className="flex justify-center gap-4 pt-6 border-t">
                <button className="px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 font-semibold">
                  Approve Application
                </button>
                <button className="px-6 py-3 bg-orange-600 text-white rounded-lg hover:bg-orange-700 font-semibold">
                  Request Additional Info
                </button>
                <button className="px-6 py-3 bg-gray-600 text-white rounded-lg hover:bg-gray-700 font-semibold">
                  Save for Later Review
                </button>
              </div>
            </div>
          ) : (
            <div className="text-center py-12">
              <Clock className="w-16 h-16 text-gray-400 mx-auto mb-4" />
              <p className="text-xl text-gray-600">Processing interview summary...</p>
              <p className="text-sm text-gray-500 mt-2">Please refresh this page in a moment</p>
            </div>
          )}
        </div>
        
        <div className="mt-8 bg-blue-50 rounded-xl p-4 ring-1 ring-blue-200">
          <p className="text-sm text-blue-800">
            <strong>Note:</strong> This is an AI-generated summary for demonstration purposes. 
            In production, caseworkers maintain full decision-making authority and must verify all information 
            before making eligibility determinations.
          </p>
        </div>
    </AppShell>
  );
}