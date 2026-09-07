import {
	mergeQuestionData,
	newMultipleChoiceQuestion,
} from '../../../common/QuestionTypes/MultipleChoiceQuestion/v4/index.js';
import { normalizeQuestionId } from '../../normalize-question-id.js';
import { loadSessionJson, saveSessionJson } from '../../storage.js';
import type { QuestionContext } from '../../types.js';
import { appendComprehensionScore } from './embedded-data.js';
import type { MultipleChoiceItem, MultipleChoiceQuestion, StoredQuestionData } from './types.js';

export function storageKey(qid: string): string {
	return 'mcq_' + normalizeQuestionId(qid);
}

export function loadStoredQuestion(qid: string): StoredQuestionData | null {
	const raw = loadSessionJson(storageKey(qid));
	if (!raw || !Array.isArray(raw.canonicalItems)) return null;
	return raw as unknown as StoredQuestionData;
}

export function saveStoredQuestion(qid: string, data: StoredQuestionData): void {
	saveSessionJson(storageKey(qid), data as unknown as Record<string, unknown>);
}

export function toStoredData(question: MultipleChoiceQuestion): StoredQuestionData {
	return {
		canonicalItems: question.canonicalItems.map((item) => ({
			itemId: item.itemId,
			isSelected: item.isSelected,
			wasSelected: item.wasSelected,
			displayOrder: item.displayOrder,
		})),
	};
}

export function hydrateQuestion(
	attachment: MultipleChoiceQuestion,
	stored: StoredQuestionData | null,
): MultipleChoiceQuestion {
	return newMultipleChoiceQuestion(
		attachment,
		stored as { canonicalItems: MultipleChoiceItem[] } | undefined,
	);
}

/** Hydrate without reordering items — Qualtrics controls display order in the DOM. */
export function hydrateQuestionForQualtrics(
	attachment: MultipleChoiceQuestion,
	stored: StoredQuestionData | null,
): MultipleChoiceQuestion {
	const question: MultipleChoiceQuestion = {
		...attachment,
		canonicalItems: attachment.canonicalItems.map((item) => ({ ...item })),
		userItems: undefined,
	};
	if (stored) {
		mergeQuestionData(question, stored as { canonicalItems: MultipleChoiceItem[] });
	}
	return question;
}

export function updateComprehensionScores(qContext: QuestionContext, score: number): void {
	appendComprehensionScore(qContext, score);
}
