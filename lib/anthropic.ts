import Anthropic from '@anthropic-ai/sdk';
import { env } from './cf';

export const ANTHROPIC_MODEL = 'claude-sonnet-4-6' as const;

export function anthropic(): Anthropic {
  // Pass globalThis.fetch explicitly so the SDK uses the Workers-
  // native fetch instead of trying to auto-detect a Node http client
  // (which fails on Workers with "Connection error").
  return new Anthropic({
    apiKey: env().ANTHROPIC_API_KEY,
    fetch: globalThis.fetch.bind(globalThis),
  });
}

// Wrapper that defaults to the project model and enables prompt caching on the
// system prompt. Per `claude-api` skill: send a `cache_control` breakpoint on
// the LAST block of every cacheable section so the prefix gets cached.
export type CachedSystemBlock = {
  type: 'text';
  text: string;
  cache_control?: { type: 'ephemeral' };
};

export function cachedSystem(text: string): CachedSystemBlock[] {
  return [{ type: 'text', text, cache_control: { type: 'ephemeral' } }];
}
