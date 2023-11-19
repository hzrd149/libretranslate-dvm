const SPACER = "__";
export function createTokens(str: string, regexp: RegExp, tokens: Map<number, string>, start: number = 0) {
  let idx = start;
  let modified = str;
  let match: RegExpMatchArray;
  while ((match = modified.match(regexp))) {
    if (match.index === undefined) break;
    const id = idx++;
    tokens.set(id, match[0]);

    modified = modified.slice(0, match.index) + SPACER + id + SPACER + modified.slice(match.index + match[0].length);
  }
  return modified;
}

export function replaceTokens(str: string, tokens: Map<number, string>) {
  let modified = str;
  for (const [id, text] of tokens) {
    modified = modified.replace(SPACER + id + SPACER, text);
  }
  return modified;
}
