import type { QuestionContext } from './types.js';

/** Looped questions are prefixed with `\d+_`. Normalize `1_QID1` → `QID1`. */
export function normalizeQuestionId(questionId: string | undefined | null): string {
	if (!questionId) return '';
	return questionId.replace(/^\d+_/, '');
}

/** Resolve a question id from Qualtrics context, with optional attachment fallback. */
export function resolveQuestionId(qContext: QuestionContext, attachmentQid?: string): string {
	const raw =
		qContext.questionId?.trim() ||
		qContext.getQuestionInfo?.()?.QuestionID?.trim() ||
		attachmentQid?.trim() ||
		'';
	return normalizeQuestionId(raw);
}
