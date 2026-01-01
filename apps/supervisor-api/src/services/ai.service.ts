/**
 * AI Service - Claude API Integration
 */

import { AIResponse } from '../types/index.js';

const ANTHROPIC_API_URL = 'https://api.anthropic.com/v1/messages';

/**
 * Send a message to Claude API
 * @param prompt - The prompt to send
 * @param systemPrompt - Optional system prompt
 * @returns AI response
 */
export async function sendToAI(
  prompt: string,
  systemPrompt?: string
): Promise<AIResponse> {
  const apiKey = process.env.ANTHROPIC_API_KEY;

  if (!apiKey || apiKey === 'sk-ant-...') {
    console.log('[AI] No API key configured, using mock response');
    return mockAIResponse(prompt);
  }

  try {
    const response = await fetch(ANTHROPIC_API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': apiKey,
        'anthropic-version': '2023-06-01'
      },
      body: JSON.stringify({
        model: 'claude-sonnet-4-20250514',
        max_tokens: 4096,
        system: systemPrompt || 'You are VGrok, a professional coding assistant. Be concise and provide working code.',
        messages: [
          { role: 'user', content: prompt }
        ]
      })
    });

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`Claude API error: ${response.status} - ${error}`);
    }

    const data = await response.json();

    return {
      content: data.content[0]?.text || '',
      model: data.model,
      usage: {
        inputTokens: data.usage?.input_tokens || 0,
        outputTokens: data.usage?.output_tokens || 0
      }
    };
  } catch (error) {
    console.error('[AI] Error calling Claude API:', error);
    throw error;
  }
}

/**
 * Mock AI response for testing without API key
 */
function mockAIResponse(prompt: string): AIResponse {
  const responses: Record<string, string> = {
    default: `// VGrok Mock Response
// Task: ${prompt.substring(0, 100)}...

console.log('VGrok task completed');

// To enable real AI responses:
// 1. Add ANTHROPIC_API_KEY to .env
// 2. Restart the API server
`
  };

  return {
    content: responses.default,
    model: 'mock-model',
    usage: { inputTokens: 0, outputTokens: 0 }
  };
}

/**
 * Generate code based on description
 */
export async function generateCode(description: string, context?: string): Promise<string> {
  const prompt = `Generate code for the following task:

${description}

${context ? `Context:\n${context}` : ''}

Provide clean, production-ready code with comments.`;

  const response = await sendToAI(prompt);
  return response.content;
}

/**
 * Review code and provide feedback
 */
export async function reviewCode(code: string): Promise<string> {
  const prompt = `Review the following code and provide feedback:

\`\`\`
${code}
\`\`\`

Focus on:
1. Bugs and issues
2. Security vulnerabilities
3. Performance improvements
4. Best practices`;

  const response = await sendToAI(prompt);
  return response.content;
}
