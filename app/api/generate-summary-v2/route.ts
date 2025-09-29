/**
 * Enhanced Summary Generation Endpoint (v2)
 *
 * This is the CURRENT/RECOMMENDED endpoint for generating interview summaries.
 *
 * Features:
 * - Structured data extraction via extractInterviewData()
 * - SNAP eligibility calculations via calculateSNAPEligibility()
 * - Enhanced summary format optimized for UI components
 * - Combines AI analysis with rule-based extraction
 * - Proper typing for downstream consumption
 *
 * Used by: hooks/useCompletion.ts
 *
 * Returns enhanced summary with sections:
 * - household (size, composition, members)
 * - income (sources, amounts, totals)
 * - expenses (rent, utilities, medical, etc.)
 * - eligibility_assessment (likely_eligible, estimated_benefit, confidence_score)
 * - flags (urgent needs, verification required)
 * - metadata (session_id, model used, timestamps)
 */

import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { interviews } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';
import { extractInterviewData, calculateSNAPEligibility } from '@/lib/interview-extractor';
import { chatWithFallback } from '@/lib/openai-util';

export async function POST(request: Request) {
  try {
    const { sessionId, transcript } = await request.json();

    if (!sessionId || !transcript) {
      return NextResponse.json(
        { error: 'Session ID and transcript are required' },
        { status: 400 }
      );
    }

    // Extract structured data from transcript
    const extractedData = extractInterviewData(transcript);
    const eligibilityResult = calculateSNAPEligibility(extractedData);

    // Use GPT-5 for enhanced summary generation with structured extraction
    const systemPrompt = `You are an expert SNAP benefits case worker analyzing an interview transcript.
    Extract and organize all relevant information into a structured summary.
    
    Focus on:
    1. Household composition (size, ages, special circumstances)
    2. All income sources and amounts
    3. Monthly expenses (rent, utilities, medical, childcare)
    4. Assets and resources
    5. Eligibility factors and red flags
    6. Required documentation and follow-up items
    
    Return a comprehensive JSON summary with these sections:
    - household (members, composition details)
    - income (all sources, amounts, frequency)
    - expenses (itemized monthly costs)
    - eligibility (assessment, qualifying factors, concerns)
    - documentation_needed (list of required documents)
    - case_notes (important observations, inconsistencies, follow-up needed)
    - recommendation (approve/deny/pending with reasoning)`;

    const { content: aiContent, modelUsed } = await chatWithFallback({
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: `Analyze this SNAP interview transcript and provide a structured summary:\n\n${transcript}` },
      ],
      responseFormat: { type: 'json_object' },
      temperature: 0.3,
      maxCompletionTokens: 1500,
    });

    const aiSummary = JSON.parse(aiContent || '{}');

    // Combine AI analysis with extracted data, ensuring proper structure for UI components
    const enhancedSummary = {
      ...aiSummary,
      // Map extracted data to the format expected by UI components
      household: {
        size: extractedData.household?.size || 0,
        composition_notes: extractedData.household?.hasElderly ? 'Household includes elderly member(s)' : 
                          extractedData.household?.hasDisabled ? 'Household includes disabled member(s)' : 'No special notes',
        members: extractedData.household?.members || [],
        ...aiSummary.household,
      },
      income: {
        total_monthly: extractedData.income?.totalMonthly || 0,
        verification_needed: false,
        sources: extractedData.income?.sources || [],
        ...aiSummary.income,
      },
      expenses: {
        rent: extractedData.expenses?.rent || 0,
        utilities: extractedData.expenses?.utilities || 0,
        medical: extractedData.expenses?.medical || 0,
        total_deductions: extractedData.expenses?.totalMonthly || 0,
        ...aiSummary.expenses,
      },
      eligibility_assessment: {
        likely_eligible: eligibilityResult.isEligible ? 'Yes' : 'No',
        expedited_qualifying: extractedData.flags?.expeditedProcessing ? 'Yes' : 'No',
        confidence_score: eligibilityResult.isEligible ? 85 : 0,
        estimated_benefit: eligibilityResult.estimatedBenefit || 0,
        reasons: eligibilityResult.reasons || [],
        ...aiSummary.eligibility_assessment,
      },
      flags: {
        urgent_needs: extractedData.flags?.urgentNeeds || [],
        verification_required: extractedData.flags?.needsDocumentVerification || [],
        ...aiSummary.flags,
      },
      // Keep metadata and raw extracted data for reference
      extracted_data: extractedData,
      eligibility_calculation: eligibilityResult,
      metadata: {
        session_id: sessionId,
        generated_at: new Date().toISOString(),
        ai_model: modelUsed,
        extraction_version: '2.0',
      },
    };

    // Save enhanced summary to database (store as JSON object, not string)
    await db
      .update(interviews)
      .set({
        summary: enhancedSummary as unknown as Record<string, unknown>,
        status: 'completed',
        completedAt: new Date(),
      })
      .where(eq(interviews.sessionId, sessionId));

    return NextResponse.json({
      summary: enhancedSummary,
      sessionId,
    });
  } catch (error) {
    console.error('Error generating enhanced summary:', error);
    return NextResponse.json(
      { error: 'Failed to generate summary' },
      { status: 500 }
    );
  }
}