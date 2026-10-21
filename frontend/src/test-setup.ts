/*
 * Runs once per test worker, and spec files share a worker (non-isolated, like Karma): nothing here may
 * depend on running before each test. Per-test state is reset by each spec, see `useFrenchTexts` and
 * `useCleanStorage`.
 */

/* jsdom does not scroll: the jumps to the top on a tab or offer change become no-ops. */
window.scrollTo = () => undefined;
Element.prototype.scrollTo = () => undefined;
