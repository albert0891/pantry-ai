import { describe, expect, it } from 'vitest';
import { buildVoicePrompt } from '../itemAssistant';

describe('buildVoicePrompt', () => {
  it("anchors relative dates to the user's today, with its weekday", () => {
    expect(buildVoicePrompt('Milk expires tomorrow', '2026-11-04')).toContain(
      'Assume today is Wednesday, 2026-11-04.',
    );
  });
});
