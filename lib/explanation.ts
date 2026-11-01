/** Only authored local chapter/section links are supported in explanations. */
export function parseRelatedConcept(line: string): { label: string; href: string } | null {
  const match = /^Related concept: \[([^\]\n]+)\]\((\/notes\/[a-z0-9-]+#[a-z0-9-]+)\)$/.exec(line);
  return match ? { label: match[1], href: match[2] } : null;
}
