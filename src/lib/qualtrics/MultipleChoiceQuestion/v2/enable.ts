import { resolveQuestionId } from '../../normalize-question-id.js';
import type { QuestionContext } from '../../types.js';
import { buildAttachmentFromCorrectChoices } from './adapter.js';
import { MultipleChoiceController } from './controller.js';
import type { MultipleChoiceQuestion } from './types.js';

const controllersByQuestion = new Map<string, MultipleChoiceController>();

function instanceKey(qContext: QuestionContext, attachment?: MultipleChoiceQuestion): string {
	return resolveQuestionId(qContext, attachment?.qid);
}

/**
 * Enhance a native Qualtrics MC question using v4 MultipleChoiceQuestion data shapes.
 * Call from question JS: `svlib.enableMultipleChoiceQuestion(this, attachment);`
 */
export function enableMultipleChoiceQuestion(
	qContext: QuestionContext,
	attachment: MultipleChoiceQuestion,
): void {
	try {
		const key = instanceKey(qContext, attachment);
		controllersByQuestion.get(key)?.destroy();
		controllersByQuestion.delete(key);

		if (!qContext?.getChoiceContainer) {
			throw new Error(
				'svlib.enableMultipleChoiceQuestion: qContext is missing getChoiceContainer()',
			);
		}

		const choiceContainer = qContext.getChoiceContainer();
		if (!choiceContainer) {
			throw new Error(
				'svlib.enableMultipleChoiceQuestion: getChoiceContainer() returned null/undefined',
			);
		}

		const controller = new MultipleChoiceController(qContext, attachment);
		controller.init();
		controllersByQuestion.set(key, controller);
	} catch (error) {
		console.error('[svlib] enableMultipleChoiceQuestion failed:', error);
		throw error;
	}
}

export function disableMultipleChoiceQuestion(qContext: QuestionContext): void {
	const key = resolveQuestionId(qContext);
	const existing = controllersByQuestion.get(key);
	if (!existing) return;
	existing.destroy();
	controllersByQuestion.delete(key);
}

/**
 * Backward-compatible v1 API — builds a v4 attachment and delegates to v2.
 * Call from question JS: `svlib.enableComprehensionQuestion(this, [1]);`
 */
export function enableComprehensionQuestion(
	qContext: QuestionContext,
	correctChoices: number[] = [],
	requiredChoices?: number[],
): void {
	const required = requiredChoices ?? correctChoices;
	const attachment = buildAttachmentFromCorrectChoices(qContext, correctChoices, required);
	enableMultipleChoiceQuestion(qContext, attachment);
}

export function disableComprehensionQuestion(qContext: QuestionContext): void {
	disableMultipleChoiceQuestion(qContext);
}
