import type { QuestionContext } from '../../types.js';
import { normalizeQuestionId } from '../../normalize-question-id.js';
import type { MultipleChoiceEmbeddedData } from './types.js';

declare const Qualtrics: {
	SurveyEngine: {
		setJSEmbeddedData(key: string, value: string): void;
		getJSEmbeddedData(key: string): string | undefined;
	};
};

/** Survey Flow field name: `__js_mcq_QID1` */
export function embeddedDataKey(questionId: string): string {
	return 'mcq_' + normalizeQuestionId(questionId);
}

/** Survey Flow field name: `__js_cq_score` */
export function comprehensionScoresEmbeddedDataKey(): string {
	return 'cq_score';
}

function getJSEmbeddedData(qContext: QuestionContext, key: string): string | undefined {
	try {
		if (qContext.getJSEmbeddedData) {
			return qContext.getJSEmbeddedData(key);
		}
		return Qualtrics.SurveyEngine.getJSEmbeddedData(key);
	} catch (error) {
		console.error('Error reading embedded data for __js_%s: %s', key, error);
		return undefined;
	}
}

function setJSEmbeddedData(qContext: QuestionContext, key: string, value: string): void {
	try {
		if (qContext.setJSEmbeddedData) {
			qContext.setJSEmbeddedData(key, value);
			return;
		}
		Qualtrics.SurveyEngine.setJSEmbeddedData(key, value);
	} catch (error) {
		console.error('Error setting embedded data for __js_%s: %s', key, error);
	}
}

function parseComprehensionScoreArray(raw: string | undefined): number[] {
	if (!raw) return [];
	try {
		const parsed: unknown = JSON.parse(raw);
		if (!Array.isArray(parsed)) return [];
		return parsed.filter((value): value is number => typeof value === 'number' && Number.isFinite(value));
	} catch {
		return [];
	}
}

export function loadComprehensionScores(qContext: QuestionContext): number[] {
	const key = comprehensionScoresEmbeddedDataKey();
	return parseComprehensionScoreArray(getJSEmbeddedData(qContext, key));
}

export function appendComprehensionScore(qContext: QuestionContext, score: number): void {
	const key = comprehensionScoresEmbeddedDataKey();
	const scores = loadComprehensionScores(qContext);
	scores.push(score);
	setJSEmbeddedData(qContext, key, JSON.stringify(scores));
}

export function setMultipleChoiceEmbeddedData(
	qContext: QuestionContext,
	questionId: string,
	data: MultipleChoiceEmbeddedData,
): void {
	const key = embeddedDataKey(questionId);
	const value = JSON.stringify(data);
	setJSEmbeddedData(qContext, key, value);
}
