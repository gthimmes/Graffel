// Maps app routes to the help articles most relevant on that page —
// surfaced as "Suggested for this page" when the help panel opens.
//
// Graffel is a single-canvas app, so there are only two real "routes": the
// editor at / and the read-only share view at /v/{token}. (Drill-down levels
// live in the URL hash, not the path.)

const ROUTE_HELP: Array<{ pattern: RegExp; articles: string[] }> = [
  { pattern: /^\/v\//, articles: ['share-links', 'drilldown', 'walkthrough-mode'] },
  { pattern: /^\/$/, articles: ['first-diagram', 'drawing-connectors', 'keyboard-shortcuts', 'drilldown'] },
]

export function helpArticlesFor(pathname: string): string[] {
  return ROUTE_HELP.find((r) => r.pattern.test(pathname))?.articles ?? ['first-diagram']
}

// Exported for tests: every article id referenced by the map.
export function allMappedArticleIds(): string[] {
  return [...new Set(ROUTE_HELP.flatMap((r) => r.articles))]
}
