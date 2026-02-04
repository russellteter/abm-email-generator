/**
 * Streaming API route for email generation
 *
 * POST /api/generate-emails
 *
 * Accepts GenerateRequest body with account and contact data.
 * Streams Claude's response for 3-email SDR sequence.
 */

import { anthropic } from '@ai-sdk/anthropic';
import { streamText } from 'ai';
import { NextResponse } from 'next/server';
import {
  safeValidateRequest,
  buildSystemPrompt,
  buildUserPrompt,
} from '@/lib/email-generator';

export const runtime = 'nodejs';
export const maxDuration = 60; // Allow up to 60s for generation

export async function POST(req: Request) {
  try {
    // Parse request body
    const body = await req.json();

    // Validate request against schema
    const validation = safeValidateRequest(body);
    if (!validation.success) {
      return NextResponse.json(
        {
          error: 'Invalid request body',
          details: validation.error.flatten(),
        },
        { status: 400 }
      );
    }

    const { account, contact, config } = validation.data;

    // Build prompts
    const systemPrompt = buildSystemPrompt();
    const userPrompt = buildUserPrompt(account, contact);

    // Get model from config or use default
    const modelId = config?.model ?? 'claude-sonnet-4-20250514';
    const temperature = config?.temperature ?? 0.7;

    // Stream response from Claude
    const result = streamText({
      model: anthropic(modelId),
      system: systemPrompt,
      messages: [{ role: 'user', content: userPrompt }],
      maxOutputTokens: 4000,
      temperature,
    });

    // Return streaming response
    return result.toTextStreamResponse();
  } catch (error) {
    console.error('Email generation error:', error);

    // Handle specific error types
    if (error instanceof SyntaxError) {
      return NextResponse.json(
        { error: 'Invalid JSON in request body' },
        { status: 400 }
      );
    }

    // Check for API key issues
    if (error instanceof Error && error.message.includes('API key')) {
      return NextResponse.json(
        { error: 'API key configuration error' },
        { status: 500 }
      );
    }

    // Generic server error
    return NextResponse.json(
      { error: 'Email generation failed', message: String(error) },
      { status: 500 }
    );
  }
}
