import { sanitizeTemplateParam } from '../template-params';
import {
  shouldApplyStatus,
  statusesReplaceableBy,
} from '../whatsapp-message.entity';
import {
  SERVICE_WINDOW_MS,
  isServiceWindowOpen,
} from '../whatsapp-contact.entity';

describe('sanitizeTemplateParam', () => {
  it('removes newlines and tabs, collapses 4+ spaces and trims', () => {
    expect(sanitizeTemplateParam('  Samsung\nGalaxy\tA53     Negro  ')).toBe(
      'Samsung Galaxy A53 Negro',
    );
  });

  it('keeps up to 3 consecutive spaces', () => {
    expect(sanitizeTemplateParam('a   b')).toBe('a   b');
  });

  it('falls back when empty or only whitespace', () => {
    expect(sanitizeTemplateParam('', 'equipo')).toBe('equipo');
    expect(sanitizeTemplateParam(' \n\t ', 'equipo')).toBe('equipo');
    expect(sanitizeTemplateParam(undefined)).toBe('-');
  });

  it('truncates to 1024 characters', () => {
    expect(sanitizeTemplateParam('x'.repeat(2000))).toHaveLength(1024);
  });
});

describe('message status ordering', () => {
  it('only moves forward and lets failed always apply', () => {
    expect(shouldApplyStatus('sent', 'delivered')).toBe(true);
    expect(shouldApplyStatus('delivered', 'read')).toBe(true);
    expect(shouldApplyStatus('read', 'delivered')).toBe(false);
    expect(shouldApplyStatus('delivered', 'sent')).toBe(false);
    expect(shouldApplyStatus('read', 'read')).toBe(false);
    expect(shouldApplyStatus('read', 'failed')).toBe(true);
    expect(shouldApplyStatus('failed', 'read')).toBe(false);
  });

  it('lists the statuses a given status may replace', () => {
    expect(statusesReplaceableBy('read')).toEqual(['sent', 'delivered']);
    expect(statusesReplaceableBy('sent')).toEqual([]);
    expect(statusesReplaceableBy('failed')).toEqual([
      'sent',
      'delivered',
      'read',
      'failed',
    ]);
  });
});

describe('isServiceWindowOpen', () => {
  const now = new Date('2026-10-10T12:00:00Z');

  it('is open under 24 h, closed at or past 24 h or without inbound', () => {
    expect(isServiceWindowOpen(undefined, now)).toBe(false);
    expect(isServiceWindowOpen(new Date(now.getTime() - 1000), now)).toBe(true);
    expect(
      isServiceWindowOpen(new Date(now.getTime() - SERVICE_WINDOW_MS + 1), now),
    ).toBe(true);
    expect(
      isServiceWindowOpen(new Date(now.getTime() - SERVICE_WINDOW_MS), now),
    ).toBe(false);
  });
});
