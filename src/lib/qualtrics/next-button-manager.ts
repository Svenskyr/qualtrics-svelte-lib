import { resolveQuestionId } from './normalize-question-id.js';
import type { QuestionContext } from './types.js';

export interface QuestionPassState {
	questionId: string;
	passed: boolean;
	qContext: QuestionContext;
}

export class NextButtonManager {
	private static instance: NextButtonManager | null = null;
	private requiredQuestions: QuestionPassState[] = [];

	private constructor() {}

	public static getInstance(): NextButtonManager {
		if (!NextButtonManager.instance) {
			NextButtonManager.instance = new NextButtonManager();
		}
		return NextButtonManager.instance;
	}

	/** Test helper: reset singleton between harness boots. */
	public static resetInstance(): void {
		NextButtonManager.instance = null;
	}

	public registerQuestion(qContext: QuestionContext): void {
		const questionId = resolveQuestionId(qContext);
		const existing = this.requiredQuestions.find((q) => q.questionId === questionId);
		if (existing) {
			existing.qContext = qContext;
			existing.passed = false;
			this.updateNextButtonState();
			return;
		}

		this.requiredQuestions.push({
			questionId,
			passed: false,
			qContext,
		});
		this.updateNextButtonState();
	}

	public unregisterQuestion(qContext: QuestionContext): void {
		const questionId = resolveQuestionId(qContext);
		this.requiredQuestions = this.requiredQuestions.filter((q) => q.questionId !== questionId);
		this.updateNextButtonState();
	}

	public checkOverallPassState(): boolean {
		if (this.requiredQuestions.length === 0) {
			return true;
		}
		return this.requiredQuestions.every((q) => q.passed);
	}

	public setQuestionPassState(qContext: QuestionContext, passed: boolean): void {
		const questionId = resolveQuestionId(qContext);
		const question = this.requiredQuestions.find((q) => q.questionId === questionId);
		if (question) {
			question.passed = passed;
			this.updateNextButtonState();
		}
	}

	public clearQuestions(): void {
		this.requiredQuestions = [];
		this.updateNextButtonState();
	}

	private updateNextButtonState(): void {
		const qContext = this.requiredQuestions[0]?.qContext;
		if (!qContext) {
			return;
		}

		if (this.checkOverallPassState()) {
			qContext.enableNextButton();
		} else {
			qContext.disableNextButton();
		}
	}
}
