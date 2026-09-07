import type { QuestionContext, SurveyEngine } from './types.js';

/**
 * Register a question's JS with the mock SurveyEngine, then load the script
 * so its top-level `Qualtrics.SurveyEngine.addOn*` calls bind to `ctx`.
 */
export async function runQuestionScript(
	engine: SurveyEngine,
	ctx: QuestionContext,
	scriptUrl: string,
): Promise<void> {
	engine.beginQuestionRegistration(ctx);

	try {
		await new Promise<void>((resolve, reject) => {
			const script = document.createElement('script');
			script.src = scriptUrl;
			script.async = false;
			script.onload = () => {
				script.remove();
				resolve();
			};
			script.onerror = () => {
				script.remove();
				reject(new Error(`Failed to load question script: ${scriptUrl}`));
			};
			document.head.appendChild(script);
		});
	} finally {
		engine.endQuestionRegistration();
	}
}
