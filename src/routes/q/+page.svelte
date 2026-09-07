<script lang="ts">
	import { onMount } from 'svelte';
	import MockMcQuestion from './MockMcQuestion.svelte';
	import headerHtml from './header.html?raw';
	import questionScriptUrl from './question.js?url';
	import './mock-survey.css';
	import { installQualtricsMock } from './mock/survey-engine.js';
	import { createQuestionContext } from './mock/question-context.js';
	import { injectHeaderHtml } from './mock/inject-header.js';
	import { runQuestionScript } from './mock/run-question-script.js';
	import type { SurveyEngine } from './mock/types.js';

	const questionId = 'QID1';
	const questionText = 'Which option best describes your experience?';
	const choices = [
		{ id: '1', text: 'Very satisfied' },
		{ id: '2', text: 'Satisfied' },
		{ id: '3', text: 'Neutral' },
		{ id: '4', text: 'Dissatisfied' },
	];

	let questionContainer: HTMLElement | undefined = $state();
	let choiceContainer: HTMLElement | undefined = $state();
	let nextDisabled = $state(false);
	let nextButtonEl: HTMLButtonElement | undefined = $state();

	let statusMessage = $state('Initializing…');

	onMount(() => {
		let disposed = false;
		let disposeHeader: (() => void) | undefined;
		let engine: SurveyEngine | undefined;

		async function boot() {
			engine = installQualtricsMock();
			disposeHeader = await injectHeaderHtml(headerHtml);
			if (disposed) return;

			// Wait a microtask so bind:this refs are definitely set
			await Promise.resolve();
			if (disposed || !questionContainer || !choiceContainer) {
				statusMessage = 'Question containers missing';
				return;
			}

			const ctx = createQuestionContext({
				questionId,
				choiceContainer,
				questionText,
				choices: Object.fromEntries(
					choices.map((c) => [
						c.id,
						{
							Text: c.text,
							RecodeValue: c.id,
							VariableName: '',
							Exclusive: false,
						},
					]),
				),
				nextButton: {
					enable: () => {
						nextDisabled = false;
					},
					disable: () => {
						nextDisabled = true;
					},
					click: () => {
						nextButtonEl?.click();
					},
				},
			});

			await runQuestionScript(engine, ctx, questionScriptUrl);
			if (disposed) return;

			engine.runPageLifecycle();
			statusMessage = 'Ready';
		}

		boot().catch((err) => {
			console.error(err);
			statusMessage = err instanceof Error ? err.message : String(err);
		});

		return () => {
			disposed = true;
			disposeHeader?.();
			engine?.teardown();
		};
	});

	function handleNext() {
		statusMessage = 'Next clicked (end of mock page)';
	}

	function handleBack() {
		statusMessage = 'Back clicked (no previous page in mock)';
	}
</script>

<div class="q-mock-page">
	<h1>Qualtrics Mockup</h1>
	<p class="q-mock-subtitle">Component test harness — {statusMessage}</p>

	<div class="q-mock-questions">
		<MockMcQuestion
			{questionId}
			{questionText}
			{choices}
			bind:questionContainer
			bind:choiceContainer
		/>
	</div>

	<nav class="q-mock-nav">
		<button type="button" id="PreviousButton" onclick={handleBack}>Back</button>
		<button
			type="button"
			id="NextButton"
			bind:this={nextButtonEl}
			disabled={nextDisabled}
			onclick={handleNext}
		>
			Next
		</button>
	</nav>
</div>
