/**
 * Qualtrics Look & Feel header scripts are often evaluated in a non-global
 * scope, so `var svlib = …` from an IIFE may not become `window.svlib`.
 * Always assign the public API onto `window` explicitly.
 */
export function publishSvlibGlobal(api: Window['svlib']): void {
	(globalThis as typeof globalThis & { svlib?: Window['svlib'] }).svlib = api;
	if (typeof window !== 'undefined') {
		window.svlib = api;
	}
}
