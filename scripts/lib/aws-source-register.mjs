/** Check object keys before parsing an entire JSON value can discard duplicates. */
export function parseUniqueJson(text) {
  let offset = 0;
  const whitespace = () => { while (offset < text.length && /[\t\n\r ]/.test(text[offset])) offset++; };
  const fail = () => { throw new SyntaxError(`Invalid JSON at offset ${offset}`); };
  const expect = (character) => {
    whitespace();
    if (text[offset] !== character) fail();
    offset++;
  };
  const string = () => {
    whitespace();
    const token = /"(?:[^"\\]|\\[\s\S])*"/y;
    token.lastIndex = offset;
    const match = token.exec(text);
    if (!match) fail();
    offset = token.lastIndex;
    // Decode only this string, so escaped spellings of the same key compare equal.
    return JSON.parse(match[0]);
  };
  const value = (location) => {
    whitespace();
    if (text[offset] === "{") {
      offset++;
      const keys = new Set();
      whitespace();
      if (text[offset] !== "}") {
        while (true) {
          const key = string();
          if (keys.has(key)) throw new SyntaxError(`Duplicate JSON key ${JSON.stringify(key)} in ${location}`);
          keys.add(key);
          expect(":");
          value(`${location}[${JSON.stringify(key)}]`);
          whitespace();
          if (text[offset] !== ",") break;
          offset++;
        }
      }
      expect("}");
    } else if (text[offset] === "[") {
      offset++;
      let index = 0;
      whitespace();
      if (text[offset] !== "]") {
        while (true) {
          value(`${location}[${index++}]`);
          whitespace();
          if (text[offset] !== ",") break;
          offset++;
        }
      }
      expect("]");
    } else if (text[offset] === '"') {
      string();
    } else {
      const token = /(?:-?(?:0|[1-9]\d*)(?:\.\d+)?(?:[eE][+-]?\d+)?|true|false|null)/y;
      token.lastIndex = offset;
      if (!token.exec(text)) fail();
      offset = token.lastIndex;
    }
  };
  value("$");
  whitespace();
  if (offset !== text.length) fail();
  return JSON.parse(text);
}

/** Local shape and reference integrity, not a live AWS URL/freshness check. */
export function parseAwsSourceRegister(text) {
  const register = parseUniqueJson(text);
  const object = (value) => value !== null && typeof value === "object" && !Array.isArray(value);
  const nonempty = (value) => typeof value === "string" && value.trim().length > 0;
  if (!object(register) || !/^\d{4}-\d{2}-\d{2}$/.test(register.reviewDate ?? "")
    || !nonempty(register.purpose) || !object(register.sources) || !Object.keys(register.sources).length
    || !Array.isArray(register.findings)) throw new Error("Invalid AWS source-register shape");
  for (const [id, source] of Object.entries(register.sources)) {
    if (!object(source) || !nonempty(source.title) || !nonempty(source.url)
      || (source.type !== undefined && !nonempty(source.type))) throw new Error(`Invalid AWS source entry: ${id}`);
    const url = new URL(source.url);
    if (url.protocol !== "https:") {
      throw new Error(`Invalid AWS source URL: ${id}`);
    }
  }
  for (const finding of register.findings) {
    if (!object(finding) || !nonempty(finding.id) || !nonempty(finding.title) || !Array.isArray(finding.sourceIds)) {
      throw new Error("Invalid AWS source finding");
    }
    for (const id of finding.sourceIds) {
      if (typeof id !== "string" || !Object.hasOwn(register.sources, id)) throw new Error(`Unresolved AWS source: ${id}`);
    }
  }
  return register;
}
