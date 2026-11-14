/** next-intl's usePathname supplies locale-free routes. Study pages keep their own theme. */
export function isGapLiftPath(pathname: string): boolean {
  const path = pathname.replace(/\/$/, "") || "/";
  return path === "/" || path === "/methodology" || path === "/assessment-workflow";
}
