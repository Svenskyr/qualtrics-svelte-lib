import type { QualtricsChoiceInfo, QuestionContext } from './types.js';

export function getChoiceIdsFromContext(qContext: QuestionContext): string[] {
	const fromApi = qContext.getChoices?.();
	if (Array.isArray(fromApi) && fromApi.length > 0) {
		return fromApi.map(String);
	}

	const fromInfo = qContext.getQuestionInfo?.()?.Choices;
	if (fromInfo) {
		return Object.keys(fromInfo);
	}

	return [];
}

export function getChoiceInfo(
	qContext: QuestionContext,
	choiceId: string,
): QualtricsChoiceInfo | undefined {
	return qContext.getQuestionInfo?.()?.Choices?.[choiceId];
}

export function getChoiceText(qContext: QuestionContext, choiceId: string): string {
	return getChoiceInfo(qContext, choiceId)?.Text ?? '';
}

function selectedChoiceValue(qContext: QuestionContext, choiceId: string): string {
	const recodeValue = getChoiceInfo(qContext, choiceId)?.RecodeValue;
	return recodeValue?.trim() ? recodeValue : '1';
}

/** Sync a choice selection to Qualtrics using the Question API. */
export function syncChoiceValue(
	qContext: QuestionContext,
	choiceId: string,
	selected: boolean,
): void {
	const value = selected ? selectedChoiceValue(qContext, choiceId) : '';

	if (qContext.setChoiceValue) {
		qContext.setChoiceValue(choiceId, value);
		return;
	}

	qContext.setChoiceAnswerValue(choiceId, choiceId, value);
}

export function attachQuestionClickListener(
	qContext: QuestionContext,
	handler: (event: Event, element: HTMLElement) => void,
): () => void {
	const previous = qContext.questionclick;
	const wrapped = function (this: QuestionContext, event: Event, element: HTMLElement) {
		previous?.call(this, event, element);
		handler.call(this, event, element);
	};
	qContext.questionclick = wrapped;

	return () => {
		if (qContext.questionclick === wrapped) {
			qContext.questionclick = previous;
		}
	};
}

/**
 * Reliable choice click handling for Qualtrics.
 *
 * `questionclick` is only wired when assigned inside `addOnload`, but svlib is
 * typically enabled from `addOnReady`. Delegate on the choice container so
 * label/input clicks are always observed.
 *
 * Do not also register the same handler on `questionclick` — Qualtrics invokes
 * that hook for the same click, which would process each choice twice.
 */
export function attachChoiceInteractionListeners(
	qContext: QuestionContext,
	handler: (event: Event, element: HTMLElement) => void,
): () => void {
	const deferredHandler = (event: Event, element: HTMLElement) => {
		setTimeout(() => handler(event, element), 0);
	};

	const container = qContext.getChoiceContainer();
	const onContainerClick = (event: Event) => {
		const target = event.target;
		if (!(target instanceof HTMLElement)) return;
		deferredHandler(event, target);
	};
	container.addEventListener('click', onContainerClick);

	return () => {
		container.removeEventListener('click', onContainerClick);
	};
}
