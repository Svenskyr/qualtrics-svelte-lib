import type { QualtricsQuestionInfo, QuestionContext as QualtricsQuestionContext } from '../../../lib/qualtrics/types.js';

/** Callback signature for Qualtrics question JS hooks (`this` = question context). */
export type QuestionCallback = (this: QualtricsQuestionContext) => void;

export type QuestionContext = QualtricsQuestionContext & {
	getQuestionInfo(): QualtricsQuestionInfo;
	getChoices(): Array<string | number>;
};

export interface NextButtonControls {
	enable(): void;
	disable(): void;
	click(): void;
}

export interface CreateQuestionContextOptions {
	questionId: string;
	choiceContainer: HTMLElement;
	questionContainer?: HTMLElement;
	questionText?: string;
	choices?: QualtricsQuestionInfo['Choices'];
	nextButton: NextButtonControls;
}

export interface SurveyEngine {
	addOnload(callback: QuestionCallback): void;
	addOnReady(callback: QuestionCallback): void;
	addOnUnload(callback: QuestionCallback): void;
	/**
	 * In real Qualtrics, `setJSEmbeddedData("foo", v)` writes Survey Flow field `__js_foo`.
	 * Passing an already-prefixed key doubles the prefix. This mock stores values under the
	 * key you pass (no Survey Flow emulation).
	 */
	setJSEmbeddedData(key: string, value: string): void;
	getJSEmbeddedData(key: string): string | undefined;
	/** Harness-only: associate subsequent addOn* registrations with this question. */
	beginQuestionRegistration(ctx: QuestionContext): void;
	endQuestionRegistration(): void;
	runPageLifecycle(): void;
	teardown(): void;
}

export interface QualtricsGlobal {
	SurveyEngine: SurveyEngine;
}
