function asString(value: unknown): string {
  return typeof value === 'string' ? value : '';
}

export function mergeClaudeCodeResultText(streamedText: unknown, resultText: unknown): string {
  const streamed = asString(streamedText);
  const result = asString(resultText);
  if (!result.trim()) return streamed;
  if (!streamed.trim()) return result;
  if (streamed === result) return streamed;

  const streamedTrimmed = streamed.trim();
  const resultTrimmed = result.trim();
  if (streamedTrimmed.includes(resultTrimmed)) return streamed;
  if (resultTrimmed.includes(streamedTrimmed)) return result;

  return `${streamed.trimEnd()}\n\n${result.trimStart()}`;
}
