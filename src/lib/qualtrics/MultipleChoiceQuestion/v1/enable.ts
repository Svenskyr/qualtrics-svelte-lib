import { resolveQuestionId } from '../../normalize-question-id.js';
import type { QuestionContext } from '../../types.js';
import { ComprehensionController } from './controller.js';

const controllersByQuestion = new Map<string, ComprehensionController>();

function instanceKey(qContext: QuestionContext): string {
	return resolveQuestionId(qContext);
}

/**
 * Enhance a native Qualtrics MC question with comprehension feedback / Next gating.
 * Call from question JS: `svlib.enableComprehensionQuestion(this, [1]);`
 *
 * Uses the plain TS controller (no Svelte mount) so the Qualtrics IIFE stays
 * small and does not depend on the Svelte runtime in the survey header.
 */
export function enableComprehensionQuestion(
	qContext: QuestionContext,
	correctChoices: number[] = [],
	requiredChoices?: number[],
): void {
	try {
		const key = instanceKey(qContext);
		const existing = controllersByQuestion.get(key);
		existing?.destroy();
		controllersByQuestion.delete(key);

		if (!qContext?.getChoiceContainer) {
			throw new Error(
				'svlib.enableComprehensionQuestion: qContext is missing getChoiceContainer()',
			);
		}

		const choiceContainer = qContext.getChoiceContainer();
		if (!choiceContainer) {
			throw new Error(
				'svlib.enableComprehensionQuestion: getChoiceContainer() returned null/undefined',
			);
		}

		const controller = new ComprehensionController(
			qContext,
			correctChoices,
			requiredChoices ?? correctChoices,
		);
		controller.init();
		controllersByQuestion.set(key, controller);
	} catch (error) {
		console.error('[svlib] enableComprehensionQuestion failed:', error);
		throw error;
	}
}

export function disableComprehensionQuestion(qContext: QuestionContext): void {
	const key = instanceKey(qContext);
	const existing = controllersByQuestion.get(key);
	if (!existing) return;
	existing.destroy();
	controllersByQuestion.delete(key);
}
