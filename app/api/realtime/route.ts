
export const runtime = 'nodejs';

// This endpoint acts as a proxy for the OpenAI Realtime API
export async function GET() {
  const apiKey = process.env.OPENAI_API_KEY;
  
  if (!apiKey) {
    return new Response('API key not configured', { status: 500 });
  }

  // For WebSocket upgrade, we need to handle this differently
  // In Next.js App Router, WebSocket support is limited
  // Return connection info for client-side connection
  return new Response(
    JSON.stringify({
      url: 'wss://api.openai.com/v1/realtime',
      model: 'gpt-4o-realtime-preview-2024-12-17',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'OpenAI-Beta': 'realtime=v1'
      }
    }),
    {
      headers: {
        'Content-Type': 'application/json',
      },
    }
  );
}