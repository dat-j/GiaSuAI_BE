import { Injectable } from '@nestjs/common';

type Mode = 'fast' | 'accurate' | 'explain_more';

const MODEL_MAP: Record<Mode, { free: string; premium: string }> = {
  fast: {
    free: 'gemini-2.0-flash-lite',
    premium: 'gemini-2.0-flash',
  },
  accurate: {
    free: 'gemini-2.0-flash',
    premium: 'gemini-2.0-flash',   // claude-sonnet-4-6 in sprint 3
  },
  explain_more: {
    free: 'gemini-2.0-flash',
    premium: 'gemini-2.0-flash',   // claude-sonnet-4-6 in sprint 3
  },
};

@Injectable()
export class ModelRouterService {
  resolve(mode: Mode, isPremium: boolean): string {
    const tier = isPremium ? 'premium' : 'free';
    return MODEL_MAP[mode]?.[tier] ?? 'gemini-2.0-flash-lite';
  }

  estimateCostUsd(model: string, inputTokens: number, outputTokens: number): number {
    const rates: Record<string, { in: number; out: number }> = {
      'gemini-2.0-flash-lite': { in: 0.000000075, out: 0.0000003 },
      'gemini-2.0-flash':      { in: 0.00000015,  out: 0.0000006 },
    };
    const rate = rates[model] ?? { in: 0.00000015, out: 0.0000006 };
    return inputTokens * rate.in + outputTokens * rate.out;
  }
}
