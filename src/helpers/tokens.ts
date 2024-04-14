export function createTokens(str: string, regexp: RegExp, tokens: Map<string, string>, start: number = 0) {
  let idx = 1;
  let modified = str;
  let match: RegExpMatchArray | null;
  while ((match = modified.match(regexp))) {
    if (match.index === undefined) break;
    const id = start + "/" + idx++;
    tokens.set(id, match[0]);

    modified = modified.slice(0, match.index) + id + modified.slice(match.index + match[0].length);
  }
  return modified;
}

export function replaceTokens(str: string, tokens: Map<string, string>) {
  let modified = str;
  for (const [id, text] of tokens) {
    modified = modified.replace(id, text);
  }
  return modified;
}
