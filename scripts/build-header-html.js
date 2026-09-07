import { copyFileSync, existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const distDir = join(root, 'dist-qualtrics');
const jsPath = join(distDir, 'svlib.min.js');
const cssPath = join(distDir, 'svlib.css');
const cssSourceFallback = join(
	root,
	'src/lib/qualtrics/MultipleChoiceQuestion/v2/comprehension.css',
);
const outHtml = join(distDir, 'svlib.min.html');
const mockHeader = join(root, 'src/routes/q/header.html');

if (!existsSync(jsPath)) {
	console.error(`Missing ${jsPath}. Run the Vite Qualtrics build first.`);
	process.exit(1);
}

// Strip sourceMappingURL — the map is not hosted inside Qualtrics header HTML.
const jsContent = readFileSync(jsPath, 'utf8')
	.replace(/\n?\/\/# sourceMappingURL=.*$/m, '')
	.trimEnd();

if (jsContent.includes('${')) {
	console.error(
		'Qualtrics header JS must not contain "${" — Qualtrics treats it as piped text and breaks the script.',
	);
	process.exit(1);
}
const cssFile = existsSync(cssPath) ? cssPath : cssSourceFallback;
const cssContent = existsSync(cssFile) ? readFileSync(cssFile, 'utf8').trimEnd() : '';
if (cssContent && !existsSync(cssPath)) {
	writeFileSync(cssPath, cssContent + '\n');
}

const html = [
	`<script type="text/javascript">`,
	jsContent,
	`</script>`,
	...(cssContent
		? [
				`<!-- Optional: paste the <style> block into Look & Feel → Style → Custom CSS instead if the header strips styles. -->`,
				`<style type="text/css">`,
				cssContent,
				`</style>`,
			]
		: []),
	'',
].join('\n');

mkdirSync(distDir, { recursive: true });
writeFileSync(outHtml, html);
copyFileSync(outHtml, mockHeader);

console.log(`Wrote ${outHtml}`);
console.log(`Synced ${mockHeader}`);
