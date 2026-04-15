import type { StressSignal } from '@/lib/types';

export function detectStressSignals(message: string): StressSignal {
  const lower = message.toLowerCase();

  // Financial stress — high
  if (
    /can't afford|cannot afford|missing payments?|missed (a )?payment|late on|in collections?|behind on (my )?payments?|can't make|cannot make (my )?payment/.test(
      lower
    )
  ) {
    return { detected: true, level: 'high', type: 'financial' };
  }

  // Emotional stress — high
  if (
    /i('m| am) (really |so |extremely )?(overwhelmed|panicking|scared|terrified)|don't know what to do|do not know what to do|feel (so |really )?(lost|hopeless|desperate)/.test(
      lower
    )
  ) {
    return { detected: true, level: 'high', type: 'emotional' };
  }

  // Overwhelm — moderate
  if (
    /overwhelmed|don't know where to start|do not know where to start|don't know how|do not know how|feel (so |really )?stuck/.test(
      lower
    )
  ) {
    return { detected: true, level: 'moderate', type: 'overwhelm' };
  }

  // Emotional stress — mild
  if (
    /stressed (about|with)|anxious (about|over)|nervous (about|over)|worried (about|over)|freaking out/.test(
      lower
    )
  ) {
    return { detected: true, level: 'mild', type: 'emotional' };
  }

  return { detected: false, level: 'mild', type: 'emotional' };
}
