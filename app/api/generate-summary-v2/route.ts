import { NextResponse } from 'next/server';
import OpenAI from 'openai';
import { db } from '@/lib/db';
import { interviews } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';
import { extractInterviewData, calculateSNAPEligibility } from '@/lib/interview-extractor';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

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

    let completion;
    try {
      // Try GPT-5 first
      completion = await openai.chat.completions.create({
        model: 'gpt-5',
        messages: [
          {
            role: 'system',
            content: systemPrompt,
          },
          {
            role: 'user',
            content: `Analyze this SNAP interview transcript and provide a structured summary:\n\n${transcript}`,
          },
        ],
        response_format: { type: 'json_object' },
        max_completion_tokens: 1500,
      });
    } catch {
      console.log('GPT-5 not available, falling back to GPT-4');
      // Fallback to GPT-4
      completion = await openai.chat.completions.create({
        model: 'gpt-4.1',
        messages: [
          {
            role: 'system',
            content: systemPrompt,
          },
          {
            role: 'user',
            content: `Analyze this SNAP interview transcript and provide a structured summary:\n\n${transcript}`,
          },
        ],
        temperature: 0.3,
        response_format: { type: 'json_object' },
        max_completion_tokens: 1500,
      });
    }

    const aiSummary = JSON.parse(completion.choices[0].message.content || '{}');

    // Combine AI analysis with extracted data
    const enhancedSummary = {
      ...aiSummary,
      extracted_data: extractedData,
      eligibility_calculation: eligibilityResult,
      metadata: {
        session_id: sessionId,
        generated_at: new Date().toISOString(),
        ai_model: completion.model,
        extraction_version: '2.0',
      },
    };

    // Save enhanced summary to database
    await db
      .update(interviews)
      .set({
        summary: JSON.stringify(enhancedSummary),
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