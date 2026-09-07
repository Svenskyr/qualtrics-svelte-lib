#!/usr/bin/env node
/**
 * Convert saved Qualtrics JavaScript Question API HTML snapshot to markdown.
 *
 * Source: reference/Qualtrics JS Question API/82bd4d5c331f1-qualtrics-java-script-question-api-class.html
 * Output: docs/qualtrics-javascript-question-api.md
 */

import { readFileSync, writeFileSync, mkdirSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, '..');

const HTML_PATH = join(
	ROOT,
	'reference/Qualtrics JS Question API/82bd4d5c331f1-qualtrics-java-script-question-api-class.html',
);
const OUT_PATH = join(ROOT, 'docs/qualtrics-javascript-question-api.md');
const SOURCE_URL =
	'https://api.qualtrics.com/82bd4d5c331f1-qualtrics-java-script-question-api-class';

const SURVEY_ENGINE_METHODS = new Set([
	'addEmbeddedData',
	'addOnload',
	'addOnReady',
	'addOnPageSubmit',
	'addOnUnload',
	'getJSEmbeddedData',
	'setEmbeddedData',
	'setJSEmbeddedData',
]);

/** @param {string} html */
function extractArticleContent(html) {
	const marker = 'sl-elements-article-content';
	const start = html.indexOf(marker);
	if (start === -1) throw new Error('Could not find article content in HTML');
	const contentStart = html.indexOf('>', start) + 1;
	const contentEnd = html.indexOf('sl-markdown-viewer-toc', contentStart);
	if (contentEnd === -1) throw new Error('Could not find end of article content');
	return html.slice(contentStart, contentEnd);
}

/** @param {string} text */
function decodeEntities(text) {
	return text
		.replace(/&amp;/g, '&')
		.replace(/&lt;/g, '<')
		.replace(/&gt;/g, '>')
		.replace(/&nbsp;/g, ' ')
		.replace(/[\u2018\u2019]/g, "'")
		.replace(/[\u201C\u201D]/g, '"');
}

/** @param {string} text */
function cleanArtifacts(text) {
	return text
		.replace(/<h[1-6](?:\s[^>]*)?$/g, '')
		.replace(/<h[1-6]\s*$/g, '')
		.replace(/\s+$/g, '')
		.trim();
}

/** @param {string} html */
function inlineHtmlToMarkdown(html) {
	let s = html;
	s = s.replace(/<a[^>]*href="([^"]*)"[^>]*>([\s\S]*?)<\/a>/g, (_, href, text) => {
		const label = text.replace(/<[^>]+>/g, '').trim();
		return `[${label}](${href})`;
	});
	s = s.replace(/<code[^>]*>([^<]*)<\/code>/g, '`$1`');
	s = s.replace(/<strong>([^<]*)<\/strong>/g, '**$1**');
	s = s.replace(/<em>([^<]*)<\/em>/g, '*$1*');
	s = s.replace(/<[^>]+>/g, '');
	return decodeEntities(s.replace(/\s+/g, ' ').trim());
}

/** @param {string} preHtml */
function extractCodeBlock(preHtml) {
	const langMatch = preHtml.match(/language-([\w-]+)/);
	const lang = langMatch?.[1] === 'js' ? 'javascript' : langMatch?.[1] ?? 'javascript';

	const lines = [...preHtml.matchAll(/<div class="sl-flex-1[^"]*">([\s\S]*?)<\/div>/g)];
	let code = '';
	for (const [, lineHtml] of lines) {
		code += lineHtml.replace(/<[^>]+>/g, '') + '\n';
	}
	if (!code.trim()) {
		code = preHtml.replace(/<[^>]+>/g, '\n');
	}
	return { lang, code: decodeEntities(code.trimEnd()) };
}

/** @param {string} blockHtml */
function extractCallouts(blockHtml) {
	const callouts = [];
	const re = /<blockquote[^>]*class="[^"]*sl-callout[^"]*"[^>]*>([\s\S]*?)<\/blockquote>/g;
	for (const match of blockHtml.matchAll(re)) {
		const inner = match[1];
		const title = h4Title(inner.match(/<h4[^>]*>[\s\S]*?<\/h4>/)?.[0] ?? inner);
		let body = inner;
		const h4Match = inner.match(/<h4[^>]*>[\s\S]*?<\/h4>/);
		if (h4Match) body = inner.slice(h4Match.index + h4Match[0].length);
		body = body.replace(/<a[^>]*href="([^"]*)"[^>]*>([\s\S]*?)<\/a>/g, '[$2]($1)');
		body = body.replace(/<code[^>]*>([^<]*)<\/code>/g, '`$1`');
		body = body.replace(/<[^>]+>/g, ' ');
		body = decodeEntities(body.replace(/\s+/g, ' ').trim());
		callouts.push({ title, body });
	}
	return callouts;
}

/** @param {ReturnType<typeof extractCallouts>} callouts */
function calloutsToMarkdown(callouts) {
	return callouts
		.map(({ title, body }) => {
			if (/deprecated/i.test(title)) {
				return `> **Deprecated:** ${body}`;
			}
			return `> **${title}:** ${body}`;
		})
		.join('\n\n');
}

/** @param {string} h4Html */
function h4Title(h4Html) {
	const inner = h4Html.replace(/<\/?h4[^>]*>/g, '');
	return inlineHtmlToMarkdown(inner.replace(/<a[^>]*>|<\/a>/g, ''));
}

/** @param {string} blockHtml */
function extractCodeMarkdown(blockHtml) {
	const blocks = [];
	for (const match of blockHtml.matchAll(/<pre[^>]*>([\s\S]*?)<\/pre>/g)) {
		const { lang, code } = extractCodeBlock(match[0]);
		if (code.trim()) blocks.push('```' + lang + '\n' + code + '\n```');
	}
	return blocks;
}

/** @param {string} h4Html @param {string} [bodyHtml] */
function h4AdmonitionToMarkdown(h4Html, bodyHtml = '') {
	const title = h4Title(h4Html);
	const body = bodyHtml ? inlineHtmlToMarkdown(bodyHtml) : '';
	if (/deprecated/i.test(title)) {
		return `> **Deprecated:** ${body}`;
	}
	return `> **${title}:** ${body}`;
}

/** @param {string} blockHtml @param {{ skipSignature?: boolean }} [options] */
function blockToMarkdown(blockHtml, options = {}) {
	let html = blockHtml;
	if (options.skipSignature) {
		html = html.replace(/<p>\s*<code[^>]*>[^<]+<\/code>[\s\S]*?<\/p>/, '');
	}

	const tokenRe =
		/<blockquote[^>]*class="[^"]*sl-callout[^"]*"[^>]*>[\s\S]*?<\/blockquote>|<pre[^>]*>[\s\S]*?<\/pre>|<h4[^>]*>[\s\S]*?<\/h4>|<ul>[\s\S]*?<\/ul>|<p>[\s\S]*?<\/p>/g;
	const tokens = [...html.matchAll(tokenRe)].map((m) => m[0]);

	const parts = [];
	let pendingExample = false;

	for (let i = 0; i < tokens.length; i++) {
		const token = tokens[i];

		if (token.startsWith('<blockquote')) {
			parts.push(calloutsToMarkdown(extractCallouts(token)));
			pendingExample = false;
			continue;
		}

		if (token.startsWith('<pre')) {
			const codeMd = extractCodeMarkdown(token).join('\n\n');
			if (pendingExample) {
				parts.push(codeMd);
				pendingExample = false;
			} else {
				parts.push(`Example:\n\n${codeMd}`);
			}
			continue;
		}

		if (token.startsWith('<h4')) {
			const next = tokens[i + 1];
			const bodyHtml =
				next?.startsWith('<p>') && !next.includes('<code') ? next.replace(/^<p>|<\/p>$/g, '') : '';
			if (bodyHtml) i += 1;
			parts.push(h4AdmonitionToMarkdown(token, bodyHtml));
			pendingExample = false;
			continue;
		}

		if (token.startsWith('<ul>')) {
			const items = [...token.matchAll(/<li>([\s\S]*?)<\/li>/g)].map((m) =>
				inlineHtmlToMarkdown(m[1]),
			);
			if (items.length) parts.push(items.map((item) => `- ${item}`).join('\n'));
			pendingExample = false;
			continue;
		}

		if (token.startsWith('<p>')) {
			const text = inlineHtmlToMarkdown(token.replace(/^<p>|<\/p>$/g, ''));
			if (!text) continue;
			if (text === 'Example:') {
				pendingExample = true;
				continue;
			}
			if (/^The `(?:add|set)EmbeddedData\(\)` method is deprecated/.test(text)) continue;
			parts.push(text);
			pendingExample = false;
		}
	}

	return cleanArtifacts(parts.join('\n\n'));
}

/** @param {string} name */
function methodBaseName(name) {
	const cleaned = name.replace(/\s+/g, ' ').trim();
	if (cleaned.includes('getInstance')) return 'getInstance';
	const m = cleaned.match(/^([a-zA-Z][a-zA-Z0-9_]*)/);
	return m?.[1] ?? cleaned;
}

/** @param {string} heading */
function slugify(heading) {
	return heading
		.toLowerCase()
		.replace(/[^\w\s-]/g, '')
		.replace(/\s+/g, '-')
		.replace(/-+/g, '-')
		.trim();
}

/** @param {string} name */
function isSurveyEngineMethod(name) {
	if (name.includes('QuestionData.getInstance') || name.includes('getInstance')) return true;
	return SURVEY_ENGINE_METHODS.has(methodBaseName(name));
}

/** @param {string} content */
function splitSections(content) {
	const h1End = content.indexOf('</h1>') + 5;
	const nseStart = content.indexOf('id="major-new-survey-taking-experience-differences"');
	const methodsStart = content.indexOf('id="methods"');
	const propsStart = content.indexOf('id="properties"');

	const intro = content.slice(h1End, nseStart);
	const nse = content.slice(nseStart, methodsStart);
	const methods = content.slice(methodsStart, propsStart);
	const properties = content.slice(propsStart);

	return { intro, nse, methods, properties };
}

/** @param {string} sectionHtml */
function sectionHtmlToMarkdown(sectionHtml) {
	let s = sectionHtml;
	s = s.replace(/<h[1-6][^>]*>[\s\S]*?<\/h[1-6]>/g, '');
	return blockToMarkdown(s);
}

/** @param {string} methodsHtml */
function parseMethods(methodsHtml) {
	const body = methodsHtml.replace(/<h2[^>]*>[\s\S]*?<\/h2>/, '');

	const signatureRe = /<p>\s*<code[^>]*>([a-zA-Z][^<]+)<\/code>(?:\s*([^<]*?))?<\/p>/g;
	const matches = [...body.matchAll(signatureRe)].filter((m) => {
		const name = m[1].trim();
		return !name.includes('Deprecated') && !name.startsWith('Bypass');
	});

	/** @type {{ name: string; html: string }[]} */
	const entries = [];
	for (let i = 0; i < matches.length; i++) {
		const start = matches[i].index;
		const end = i + 1 < matches.length ? matches[i + 1].index : body.length;
		entries.push({
			name: matches[i][2]?.trim()
				? `${matches[i][1].trim()} ${matches[i][2].trim()}`
				: matches[i][1].trim(),
			html: body.slice(start, end),
		});
	}

	return { entries };
}

/** @param {string} propertiesHtml */
function parseProperties(propertiesHtml) {
	const body = propertiesHtml.replace(/<h2[^>]*>[\s\S]*?<\/h2>/, '');
	const parts = body.split(/<hr\s*\/?>/).filter((p) => p.trim());

	return parts
		.map((part) => {
			const codeMatch = part.match(/<code[^>]*>([^<]+)<\/code>/);
			const name = codeMatch?.[1]?.trim() ?? 'Property';
			return { name, markdown: blockToMarkdown(part) };
		})
		.filter(({ name, markdown }) => {
			if (/©\s*\d{4}\s*Qualtrics/i.test(markdown)) return false;
			if (name === 'Property' && !markdown) return false;
			return true;
		});
}

/** @param {string} heading @param {number} level */
function heading(heading, level) {
	return `${'#'.repeat(level)} ${heading}`;
}

/** @param {{ name: string; html: string }[]} entries */
function renderMethodSection(entries) {
	return entries
		.map(({ name, html }) => {
			const md = blockToMarkdown(html, { skipSignature: true });
			return `${heading(name, 3)}\n\n${md}`;
		})
		.join('\n\n---\n\n');
}

function buildToc(sections) {
	const lines = ['## Table of Contents', ''];
	for (const { title, level, anchor } of sections) {
		const indent = '  '.repeat(Math.max(0, level - 2));
		lines.push(`${indent}- [${title}](#${anchor})`);
	}
	return lines.join('\n');
}

function main() {
	const html = readFileSync(HTML_PATH, 'utf8');
	const content = extractArticleContent(html);
	const { intro, nse, methods, properties } = splitSections(content);
	const { entries: methodEntries } = parseMethods(methods);
	const propertyEntries = parseProperties(properties);

	const surveyEngine = methodEntries.filter((e) => isSurveyEngineMethod(e.name));
	const questionMethods = methodEntries.filter((e) => !isSurveyEngineMethod(e.name));

	const tocSections = [
		{ title: 'Overview', level: 2, anchor: 'overview' },
		{
			title: 'Major New Survey Taking Experience Differences',
			level: 2,
			anchor: 'major-new-survey-taking-experience-differences',
		},
		{ title: 'Qualtrics.SurveyEngine Methods', level: 2, anchor: 'qualtricssurveyengine-methods' },
		...surveyEngine.map((e) => ({
			title: e.name,
			level: 3,
			anchor: slugify(e.name),
		})),
		{
			title: 'Question Methods (this in addOnload callbacks)',
			level: 2,
			anchor: 'question-methods-this-in-addonload-callbacks',
		},
		...questionMethods.map((e) => ({
			title: e.name,
			level: 3,
			anchor: slugify(e.name),
		})),
		{ title: 'Properties', level: 2, anchor: 'properties' },
		...propertyEntries.map((e) => ({
			title: e.name,
			level: 3,
			anchor: slugify(e.name),
		})),
	];

	const out = [
		'# Qualtrics JavaScript Question API Class',
		'',
		`> Source: Qualtrics API docs (snapshot). Original: ${SOURCE_URL}`,
		'',
		buildToc(tocSections),
		'',
		heading('Overview', 2),
		'',
		sectionHtmlToMarkdown(intro),
		'',
		heading('Major New Survey Taking Experience Differences', 2),
		'',
		sectionHtmlToMarkdown(nse),
		'',
		heading('Qualtrics.SurveyEngine Methods', 2),
		'',
		renderMethodSection(surveyEngine),
		'',
		heading('Question Methods (this in addOnload callbacks)', 2),
		'',
		renderMethodSection(questionMethods),
		'',
		heading('Properties', 2),
		'',
		propertyEntries
			.map(({ name, markdown }) => `${heading(name, 3)}\n\n${markdown}`)
			.join('\n\n---\n\n'),
		'',
	].join('\n');

	mkdirSync(dirname(OUT_PATH), { recursive: true });
	writeFileSync(OUT_PATH, out, 'utf8');

	console.log(`Wrote ${OUT_PATH}`);
	console.log(`  SurveyEngine methods: ${surveyEngine.length}`);
	console.log(`  Question methods: ${questionMethods.length}`);
	console.log(`  Properties: ${propertyEntries.length}`);
	console.log(`  Total methods: ${methodEntries.length}`);
	console.log(`  Code blocks: ${(out.match(/```/g) ?? []).length / 2}`);
	console.log(`  Deprecated callouts: ${(out.match(/\*\*Deprecated:\*\*/g) ?? []).length}`);
}

main();
