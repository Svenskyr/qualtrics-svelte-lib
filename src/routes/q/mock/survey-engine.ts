import type {
	QuestionCallback,
	QuestionContext,
	SurveyEngine,
} from './types.js';

interface BoundCallback {
	ctx: QuestionContext;
	callback: QuestionCallback;
}

/**
 * In-memory Qualtrics.SurveyEngine mock for the /q harness.
 */
export function createSurveyEngine(): SurveyEngine {
	const embeddedData = new Map<string, string>();
	const onload: BoundCallback[] = [];
	const onready: BoundCallback[] = [];
	const onunload: BoundCallback[] = [];

	let registering: QuestionContext | null = null;
	let lifecycleStarted = false;

	function requireRegistering(): QuestionContext {
		if (!registering) {
			throw new Error(
				'Qualtrics.SurveyEngine.addOn* called outside beginQuestionRegistration()',
			);
		}
		return registering;
	}

	function enqueue(list: BoundCallback[], callback: QuestionCallback): void {
		const ctx = requireRegistering();
		list.push({ ctx, callback });
	}

	const engine: SurveyEngine = {
		addOnload(callback: QuestionCallback) {
			enqueue(onload, callback);
		},

		addOnReady(callback: QuestionCallback) {
			enqueue(onready, callback);
		},

		addOnUnload(callback: QuestionCallback) {
			enqueue(onunload, callback);
		},

		setJSEmbeddedData(key: string, value: string) {
			embeddedData.set(key, value);
		},

		getJSEmbeddedData(key: string) {
			return embeddedData.get(key);
		},

		beginQuestionRegistration(ctx: QuestionContext) {
			if (registering) {
				throw new Error(
					'Nested beginQuestionRegistration: call endQuestionRegistration() first',
				);
			}
			registering = ctx;
		},

		endQuestionRegistration() {
			registering = null;
		},

		runPageLifecycle() {
			if (lifecycleStarted) return;
			lifecycleStarted = true;

			for (const { ctx, callback } of onload) {
				callback.call(ctx);
			}
			for (const { ctx, callback } of onready) {
				callback.call(ctx);
			}
		},

		teardown() {
			for (const { ctx, callback } of [...onunload].reverse()) {
				try {
					callback.call(ctx);
				} catch (err) {
					console.error('Qualtrics addOnUnload error:', err);
				}
			}
			onload.length = 0;
			onready.length = 0;
			onunload.length = 0;
			embeddedData.clear();
			registering = null;
			lifecycleStarted = false;

			if (window.Qualtrics?.SurveyEngine === engine) {
				delete window.Qualtrics;
			}
		},
	};

	return engine;
}

/** Install `window.Qualtrics.SurveyEngine` and return the engine instance. */
export function installQualtricsMock(): SurveyEngine {
	const engine = createSurveyEngine();
	window.Qualtrics = { SurveyEngine: engine };
	return engine;
}
