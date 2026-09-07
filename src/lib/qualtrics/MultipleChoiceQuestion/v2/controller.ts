import { isQuestionComplete } from '../../../common/QuestionTypes/MultipleChoiceQuestion/v4/index.js';
import { resolveQuestionId } from '../../normalize-question-id.js';
import { NextButtonManager } from '../../next-button-manager.js';
import type { QuestionContext } from '../../types.js';
import { QualtricsMcqAdapter } from './adapter.js';
import { setMultipleChoiceEmbeddedData } from './embedded-data.js';
import {
	loadStoredQuestion,
	saveStoredQuestion,
	toStoredData,
	updateComprehensionScores,
} from './persistence.js';
import type { MultipleChoiceEmbeddedData, MultipleChoiceQuestion } from './types.js';

export class MultipleChoiceController {
	private qContext: QuestionContext;
	private questionId: string;
	private adapter: QualtricsMcqAdapter;
	private nextButtonManager: NextButtonManager;
	private lastScore: number | null = null;
	private isComplete = false;
	private detachClickListener: (() => void) | null = null;

	constructor(qContext: QuestionContext, attachment: MultipleChoiceQuestion) {
		this.qContext = qContext;
		this.questionId = resolveQuestionId(qContext, attachment.qid);
		const stored = loadStoredQuestion(this.questionId);
		this.adapter = new QualtricsMcqAdapter(qContext, attachment, stored);
		this.nextButtonManager = NextButtonManager.getInstance();
		if (attachment.required && attachment.required !== 'none') {
			this.nextButtonManager.registerQuestion(qContext);
		}
	}

	public init(): void {
		this.adapter.syncDomFromQuestion();

		const complete = isQuestionComplete(this.adapter.question);
		if (complete) {
			this.isComplete = true;
		}
		if (this.adapter.question.required && this.adapter.question.required !== 'none') {
			this.nextButtonManager.setQuestionPassState(this.qContext, complete);
		}
		this.syncEmbeddedData(complete ? { complete: true } : {});

		this.detachClickListener = this.adapter.attachClickListener((event, element) =>
			this.onChoiceClick(event, element),
		);
	}

	public destroy(): void {
		this.detachClickListener?.();
		this.detachClickListener = null;
		if (this.adapter.question.required && this.adapter.question.required !== 'none') {
			this.nextButtonManager.unregisterQuestion(this.qContext);
		}
	}

	private onChoiceClick(event: Event, element: HTMLElement): void {
		const { score } = this.adapter.handleClick(event, element);
		if (score !== null) {
			this.lastScore = score;
		}

		this.persist();
		const complete = isQuestionComplete(this.adapter.question);

		if (this.adapter.question.required && this.adapter.question.required !== 'none') {
			this.nextButtonManager.setQuestionPassState(this.qContext, complete);
			if (complete) {
				this.completeQuestion();
			} else {
				this.syncEmbeddedData({ complete: false });
			}
		} else {
			this.syncEmbeddedData();
		}
	}

	private persist(): void {
		saveStoredQuestion(this.questionId, toStoredData(this.adapter.question));
	}

	private syncEmbeddedData(overrides: Partial<MultipleChoiceEmbeddedData> = {}): void {
		const data: MultipleChoiceEmbeddedData = {
			question: this.adapter.question,
			complete: this.isComplete,
			...(this.lastScore !== null ? { score: this.lastScore } : {}),
			...overrides,
		};
		setMultipleChoiceEmbeddedData(this.qContext, this.questionId, data);
	}

	private completeQuestion(): void {
		if (this.isComplete) return;

		this.isComplete = true;
		const score = this.lastScore;
		if (score !== null) {
			updateComprehensionScores(this.qContext, score);
		}
		this.syncEmbeddedData({
			complete: true,
			...(score !== null ? { score } : {}),
		});
	}
}
