/** Choice metadata from Qualtrics.SurveyEngine.QuestionInfo.Choices. */
export interface QualtricsChoiceInfo {
	RecodeValue: string;
	VariableName: string;
	Text: string;
	Exclusive: boolean;
}

/** Question metadata from getQuestionInfo(). */
export interface QualtricsQuestionInfo {
	QuestionID: string;
	QuestionText: string;
	QuestionType: string;
	Choices: Record<string, QualtricsChoiceInfo>;
}

/** Minimal Qualtrics question context used by svlib enhancers. */
export interface QuestionContext {
	questionId?: string;
	questionContainer?: HTMLElement;
	questionclick?: (this: QuestionContext, event: Event, element: HTMLElement) => void;
	getQuestionContainer?(): HTMLElement;
	getChoiceContainer(): HTMLElement;
	getSelectedChoices(): string[];
	getChoices?(): Array<string | number>;
	setChoiceValue?(
		choiceId: string | number,
		value: string,
		subId?: string | number,
	): boolean;
	setChoiceAnswerValue(
		choiceId: string | number,
		answerId: string | number,
		value: string,
	): boolean;
	enableNextButton(): void;
	disableNextButton(): void;
	clickNextButton(): void;
	getQuestionInfo?(): QualtricsQuestionInfo | null;
	setJSEmbeddedData?(key: string, value: string): void;
	getJSEmbeddedData?(key: string): string | undefined;
}

export interface QualtricsSurveyEngine {
	setJSEmbeddedData(key: string, value: string): void;
	getJSEmbeddedData(key: string): string | undefined;
	addOnload?(callback: (this: QuestionContext) => void): void;
	addOnReady?(callback: (this: QuestionContext) => void): void;
	addOnUnload?(callback: (this: QuestionContext) => void): void;
}

export interface QualtricsGlobal {
	SurveyEngine: QualtricsSurveyEngine;
}
