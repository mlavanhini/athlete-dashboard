// Runs once when the Next.js server starts.
// Guards against Node.js 22's experimental --localstorage-file feature
// which creates a partially-initialised localStorage in global scope and
// confuses framework code that uses localStorage presence to detect browsers.
export function register() {
  if (
    typeof globalThis.localStorage !== 'undefined' &&
    typeof (globalThis.localStorage as Storage).getItem !== 'function'
  ) {
    Object.defineProperty(globalThis, 'localStorage', {
      value: undefined,
      writable: true,
      configurable: true,
    })
  }
}
