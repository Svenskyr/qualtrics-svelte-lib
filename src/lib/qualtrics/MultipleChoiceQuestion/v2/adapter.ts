import {
	areAllTrueItemsSelected,
	selectItem,
} from '../../../common/QuestionTypes/MultipleChoiceQuestion/v4/index.js';
import {
	attachChoiceInteractionListeners,
	getChoiceIdsFromContext,
	getChoiceText,
	syncChoiceValue,
} from '../../choice-api.js';
import { choiceIdFromInputId } from '../../choice-id.js';
import { resolveQuestionId } from '../../normalize-question-id.js';
import type { QuestionContext } from '../../types.js';
import { computeScoreOnCorrectSelection } from './score.js';
import { hydrateQuestionForQualtrics } from './persistence.js';
import type {
	ChoiceCorrectness,
	MultipleChoiceItem,
	MultipleChoiceQuestion,
	StoredQuestionData,
} from './types.js';

function getChoiceInputs(qContext: QuestionContext): HTMLInputElement[] {
	const container = qContext.getChoiceContainer();
	const selector = "input[type='radio'], input[type='checkbox']";
	const inContainer = Array.from(container.querySelectorAll<HTMLInputElement>(selector));
	if (inContainer.length > 0) return inContainer;

	const questionRoot = qContext.getQuestionContainer?.();
	if (questionRoot) {
		return Array.from(questionRoot.querySelectorAll<HTMLInputElement>(selector));
	}

	return inContainer;
}

function detectInputType(inputs: HTMLInputElement[]): 'radio' | 'checkbox' {
	return inputs[0]?.type === 'checkbox' ? 'checkbox' : 'radio';
}

function resolveInput(event: Event, element?: HTMLElement): HTMLInputElement | null {
	const target = element ?? (event.target as HTMLElement | null);
	if (!target) return null;
	if (target.tagName === 'INPUT') return target as HTMLInputElement;
	return (target.closest?.('input') as HTMLInputElement | null) ?? null;
}

function isChoiceCorrect(itemId: string, correctChoices: number[]): boolean {
	return correctChoices.some((choice) => String(choice) === itemId);
}

function resolveItemTruth(
	attachment: MultipleChoiceQuestion,
	fromAttachment: MultipleChoiceItem | undefined,
): boolean | null | undefined {
	if (!attachment.showFeedback) return fromAttachment?.isTrue;
	if (fromAttachment?.isTrue === true) return true;
	return false;
}

function deriveCorrectness(
	item: MultipleChoiceItem,
	question: MultipleChoiceQuestion,
): ChoiceCorrectness {
	if (!question.showFeedback) return 'hidden';
	if (item.isTrue === true && item.isSelected) return 'correct';
	if (item.isTrue === false && item.isSelected) return 'incorrect';
	if (item.isTrue === false && item.wasSelected && !item.isSelected) return 'incorrect';
	return 'hidden';
}

function buildCanonicalItems(
	qContext: QuestionContext,
	attachment: MultipleChoiceQuestion,
	inputs: HTMLInputElement[],
): MultipleChoiceItem[] {
	const attachmentMap = new Map(attachment.canonicalItems.map((item) => [item.itemId, item]));

	return inputs.map((input, index) => {
		const itemId = choiceIdFromInputId(input.id);
		const fromAttachment = attachmentMap.get(itemId);
		return {
			itemId,
			itemText: fromAttachment?.itemText || getChoiceText(qContext, itemId),
			isTrue: resolveItemTruth(attachment, fromAttachment),
			displayOrder: fromAttachment?.displayOrder ?? index + 1,
			isSelected: false,
			wasSelected: false,
		};
	});
}

function buildAttachment(
	qContext: QuestionContext,
	attachment: MultipleChoiceQuestion,
	inputs: HTMLInputElement[],
): MultipleChoiceQuestion {
	return {
		...attachment,
		qid: resolveQuestionId(qContext, attachment.qid),
		questionText:
			attachment.questionText || qContext.getQuestionInfo?.()?.QuestionText || '',
		inputType: attachment.inputType || detectInputType(inputs),
		canonicalItems: buildCanonicalItems(qContext, attachment, inputs),
		userItems: undefined,
		allowUserItems: false,
	};
}

export class QualtricsMcqAdapter {
	readonly question: MultipleChoiceQuestion;
	readonly inputs: HTMLInputElement[];
	readonly inputByItemId: Map<string, HTMLInputElement>;
	readonly correctnessByItemId = new Map<string, ChoiceCorrectness>();

	private readonly qContext: QuestionContext;

	constructor(
		qContext: QuestionContext,
		attachment: MultipleChoiceQuestion,
		stored: StoredQuestionData | null,
	) {
		this.qContext = qContext;
		this.inputs = getChoiceInputs(qContext);
		this.inputByItemId = new Map(
			this.inputs.map((input) => [choiceIdFromInputId(input.id), input]),
		);
		const resolvedAttachment = buildAttachment(qContext, attachment, this.inputs);
		this.question = hydrateQuestionForQualtrics(resolvedAttachment, stored);
	}

	syncDomFromQuestion(): void {
		const allTrueSelected = areAllTrueItemsSelected(this.question);

		for (const item of this.question.canonicalItems) {
			const input = this.inputByItemId.get(item.itemId);
			if (!input) continue;

			input.checked = item.isSelected ?? false;
			syncChoiceValue(this.qContext, item.itemId, input.checked);
			this.syncChoiceSelectedClass(input);

			const correctness = deriveCorrectness(item, this.question);
			this.correctnessByItemId.set(item.itemId, correctness);
			input.setAttribute('data-correctness', correctness);

			let disabled = false;
			if (this.question.showFeedback) {
				if (correctness === 'correct') {
					disabled = true;
				} else if (correctness === 'incorrect') {
					if (input.type === 'radio') {
						disabled = true;
					} else if (!item.isSelected) {
						disabled = true;
					}
				} else if (allTrueSelected) {
					const isSelectedIncorrect = item.isTrue === false && item.isSelected;
					disabled = !isSelectedIncorrect;
				}
			}

			input.disabled = disabled;
			this.syncChoiceDisabledAttr(input);
		}
	}

	handleClick(event: Event, element?: HTMLElement): { score: number | null } {
		const input = resolveInput(event, element);
		if (!input) return { score: null };

		const itemId = choiceIdFromInputId(input.id);
		const item = this.question.canonicalItems.find((i) => i.itemId === itemId);
		if (!item) return { score: null };

		const isCorrectItem = item.isTrue === true;
		selectItem(this.question, itemId, input.checked);
		this.syncDomFromQuestion();

		if (input.checked && isCorrectItem) {
			return { score: computeScoreOnCorrectSelection(this.question, this.correctnessByItemId) };
		}
		return { score: null };
	}

	attachClickListener(handler: (event: Event, element: HTMLElement) => void): () => void {
		return attachChoiceInteractionListeners(this.qContext, handler);
	}

	private syncChoiceSelectedClass(input: HTMLInputElement): void {
		const choiceEl = input.closest('.choice');
		if (!choiceEl) return;
		choiceEl.classList.toggle('selected', input.checked);
	}

	private syncChoiceDisabledAttr(input: HTMLInputElement): void {
		const choiceEl = input.closest('.choice');
		if (!choiceEl) return;
		if (input.disabled) {
			choiceEl.setAttribute('data-choice-disabled', 'disabled');
		} else {
			choiceEl.removeAttribute('data-choice-disabled');
		}
	}
}

export function buildAttachmentFromCorrectChoices(
	qContext: QuestionContext,
	correctChoices: number[],
	requiredChoices: number[],
): MultipleChoiceQuestion {
	const inputs = getChoiceInputs(qContext);
	const choiceIds =
		inputs.length > 0
			? inputs.map((input) => choiceIdFromInputId(input.id))
			: getChoiceIdsFromContext(qContext);

	const hasFeedback = correctChoices.length > 0;

	return {
		qid: resolveQuestionId(qContext),
		questionText: qContext.getQuestionInfo?.()?.QuestionText ?? '',
		inputType: detectInputType(inputs),
		required: requiredChoices.length > 0 ? 'all' : 'none',
		showFeedback: hasFeedback,
		canonicalItems: choiceIds.map((itemId, index) => ({
			itemId,
			itemText: getChoiceText(qContext, itemId),
			isTrue: hasFeedback ? isChoiceCorrect(itemId, correctChoices) : undefined,
			displayOrder: index + 1,
		})),
	};
}
