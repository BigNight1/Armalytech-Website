import Input from './Input.jsx';

/**
 * Numeric input built on `Input`. Kept as a thin wrapper (rather than
 * `<input type="number">` directly) so feature code has one place to add
 * money/quantity parsing rules later.
 */
export default function NumberInput({ step = 'any', min, ...rest }) {
  return <Input type="number" step={step} min={min} inputMode="decimal" {...rest} />;
}
