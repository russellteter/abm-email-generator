/**
 * Streaming API route for email generation
 *
 * POST /api/generate-emails
 *
 * Accepts GenerateRequest body with account and contact data.
 * Streams Claude's response for 3-email SDR sequence.
 */

import { anthropic } from '@ai-sdk/anthropic';
import { generateText, streamText } from 'ai';
import { NextResponse } from 'next/server';
import {
  safeValidateRequest,
  buildSystemPrompt,
  buildUserPrompt,
} from '@/lib/email-generator';

// Set to true to use non-streaming for debugging
const DEBUG_MODE = false;

export const runtime = 'nodejs';
export const maxDuration = 60; // Allow up to 60s for generation

export async function POST(req: Request) {
  try {
    // Parse request body
    const body = await req.json();

    // Validate request against schema
    const validation = safeValidateRequest(body);
    if (!validation.success) {
      const flatErrors = validation.error.flatten();
      console.error('Validation failed:', JSON.stringify(flatErrors, null, 2));
      console.error('Request body was:', JSON.stringify(body, null, 2));
      return NextResponse.json(
        {
          error: 'Invalid request body',
          details: flatErrors,
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

    // Log generation request
    console.log('Starting email generation for:', account.company_name, contact.full_name);
    console.log('Using model:', modelId);

    if (DEBUG_MODE) {
      // Non-streaming mode for debugging
      try {
        const result = await generateText({
          model: anthropic(modelId),
          system: systemPrompt,
          messages: [{ role: 'user', content: userPrompt }],
          maxOutputTokens: 4000,
          temperature,
        });

        console.log('Generation complete. Response length:', result.text?.length ?? 0);
        console.log('Finish reason:', result.finishReason);

        if (!result.text || result.text.length === 0) {
          console.error('ERROR: Empty response from Claude');
          return NextResponse.json(
            { error: 'Empty response from AI model' },
            { status: 500 }
          );
        }

        // Return the text directly as the response body
        return new Response(result.text, {
          headers: { 'Content-Type': 'text/plain' },
        });
      } catch (genError) {
        console.error('Generation error:', genError);
        return NextResponse.json(
          { error: 'Generation failed', details: String(genError) },
          { status: 500 }
        );
      }
    }

    // Streaming mode (production)
    const result = streamText({
      model: anthropic(modelId),
      system: systemPrompt,
      messages: [{ role: 'user', content: userPrompt }],
      maxOutputTokens: 4000,
      temperature,
    });

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
