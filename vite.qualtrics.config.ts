import { defineConfig } from 'vite';

/**
 * Standalone IIFE build for Qualtrics Look & Feel Header.
 * Intentionally no Svelte plugin — the Qualtrics entry is plain TS so the
 * survey header stays small and does not depend on the Svelte runtime.
 * Usage: vite build --config vite.qualtrics.config.ts
 */
export default defineConfig({
	// Qualtrics preprocesses `${...}` as piped text in header HTML. Identifier
	// mangling can rename a class to `$`, producing `class ${field` in output.
	esbuild: {
		minifyIdentifiers: false,
	},
	build: {
		lib: {
			entry: 'src/lib/qualtrics-entry.ts',
			name: 'svlib',
			formats: ['iife'],
			fileName: () => 'svlib.min.js',
		},
		outDir: 'dist-qualtrics',
		emptyOutDir: true,
		cssCodeSplit: false,
		minify: true,
		sourcemap: true,
		rollupOptions: {
			output: {
				inlineDynamicImports: true,
				assetFileNames: 'svlib[extname]',
			},
		},
	},
});
