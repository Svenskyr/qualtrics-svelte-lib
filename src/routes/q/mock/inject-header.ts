/**
 * Parse Qualtrics Look & Feel header HTML and execute its scripts / styles.
 * `{@html}` does not run `<script>` tags, so we inject real script elements.
 * DOMParser also relocates `<style>`/`<link>` into the parsed document's
 * `<head>`, so those must be copied explicitly (body-only cloning misses them).
 *
 * Returns a dispose function that removes injected nodes.
 */
export async function injectHeaderHtml(html: string): Promise<() => void> {
	const trimmed = html.trim();
	if (!trimmed) {
		return () => {};
	}

	const doc = new DOMParser().parseFromString(trimmed, 'text/html');
	const injected: HTMLElement[] = [];

	// Styles/links land in parsed <head>; inject them into the live document.
	for (const source of doc.head.querySelectorAll('style, link')) {
		const clone = source.cloneNode(true) as HTMLElement;
		document.head.appendChild(clone);
		injected.push(clone);
	}

	const nodes = [
		...doc.head.querySelectorAll('script'),
		...doc.body.querySelectorAll('script'),
	];

	for (const source of nodes) {
		const script = document.createElement('script');

		for (const { name, value } of source.attributes) {
			script.setAttribute(name, value);
		}

		if (source.src) {
			await new Promise<void>((resolve, reject) => {
				script.onload = () => resolve();
				script.onerror = () =>
					reject(new Error(`Failed to load header script: ${source.src}`));
				document.head.appendChild(script);
				injected.push(script);
			});
		} else {
			script.textContent = source.textContent;
			document.head.appendChild(script);
			injected.push(script);
		}
	}

	// Non-script header markup (rare) — append body children except scripts/styles
	for (const child of [...doc.body.children]) {
		if (child.tagName === 'SCRIPT' || child.tagName === 'STYLE') continue;
		const clone = child.cloneNode(true) as HTMLElement;
		document.body.prepend(clone);
		injected.push(clone);
	}

	return () => {
		for (const el of injected) {
			el.remove();
		}
	};
}
