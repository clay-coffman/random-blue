import Anthropic from '@anthropic-ai/sdk';
import { env } from './cf';

export const ANTHROPIC_MODEL = 'claude-opus-4-7' as const;

export function anthropic(): Anthropic {
  return new Anthropic({ apiKey: env().ANTHROPIC_API_KEY });
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
