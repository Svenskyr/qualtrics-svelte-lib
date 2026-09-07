import { choiceIdFromInputId } from '../../choice-id.js';
import { syncChoiceValue } from '../../choice-api.js';
import { normalizeQuestionId } from '../../normalize-question-id.js';
import { NextButtonManager } from '../../next-button-manager.js';
import { loadSessionJson, saveSessionJson } from '../../storage.js';
import type { QuestionContext } from '../../types.js';
import type { ChoiceState, ComprehensionEmbeddedData } from './types.js';

function getSurveyEngine() {
	return window.Qualtrics?.SurveyEngine;
}

export function comprehensionEmbeddedDataKey(questionId: string): string {
	return `cq_${normalizeQuestionId(questionId)}`;
}

export function setComprehensionEmbeddedData(
	questionId: string,
	data: ComprehensionEmbeddedData,
): void {
	try {
		getSurveyEngine()?.setJSEmbeddedData(
			comprehensionEmbeddedDataKey(questionId),
			JSON.stringify(data),
		);
	} catch (error) {
		console.error(
			'Error setting comprehension embedded data for %s (expected Survey Flow field __js_%s): %s',
			questionId,
			comprehensionEmbeddedDataKey(questionId),
			error,
		);
	}
}

export function updateComprehensionScores(qContext: QuestionContext, score: number): void {
	const comprehensionScores =
		(loadSessionJson('comprehensionScores') as Record<string, number[]> | null) ?? {};
	const questionId = normalizeQuestionId(qContext.questionId);
	if (!comprehensionScores[questionId]) {
		comprehensionScores[questionId] = [];
	}
	comprehensionScores[questionId].push(score);
	saveSessionJson('comprehensionScores', comprehensionScores);
}

export class ComprehensionController {
	private qContext: QuestionContext;
	private questionId: string;
	private choiceInputs: HTMLInputElement[];
	private correctChoices: number[];
	private requiredChoices: number[];
	private nextButtonManager: NextButtonManager;
	private lastScore: number | null = null;
	private isComplete = false;
	private clickHandler: ((event: Event) => void) | null = null;

	constructor(
		qContext: QuestionContext,
		correctChoices: number[] = [],
		requiredChoices: number[] = correctChoices,
	) {
		this.qContext = qContext;
		this.questionId = normalizeQuestionId(qContext.questionId);
		this.choiceInputs = Array.from(
			qContext
				.getChoiceContainer()
				.querySelectorAll<HTMLInputElement>("input[type='radio'], input[type='checkbox']"),
		);
		this.correctChoices = correctChoices;
		this.requiredChoices = requiredChoices;
		this.nextButtonManager = NextButtonManager.getInstance();
		this.nextButtonManager.registerQuestion(qContext);
	}

	public init(): void {
		this.loadChoiceStates();

		if (this.requiredChoices.length > 0) {
			const passed = this.evaluateRequiredChoices(this.requiredChoices);
			this.nextButtonManager.setQuestionPassState(this.qContext, passed);
			if (passed) {
				this.completeQuestion();
			} else {
				this.syncResponseEmbeddedData();
			}
		} else {
			this.syncResponseEmbeddedData();
		}

		const callbacks: Array<(event: Event) => void> = [];

		if (this.correctChoices.length > 0) {
			callbacks.push((event) => this.checkClickedChoiceCorrectness(event, this.correctChoices));
			callbacks.push((event) => this.checkAllChoicesCorrectness(event, this.correctChoices));
		}

		if (this.requiredChoices.length > 0) {
			callbacks.push((event) => this.checkAllChoicesRequired(event, this.requiredChoices));
		}

		callbacks.push(() => this.saveChoiceStates());

		this.attachChoiceListeners(callbacks);
	}

	public destroy(): void {
		if (this.clickHandler) {
			for (const input of this.choiceInputs) {
				input.removeEventListener('click', this.clickHandler);
			}
			this.clickHandler = null;
		}
		this.nextButtonManager.unregisterQuestion(this.qContext);
	}

	private attachChoiceListeners(callbacks: Array<(event: Event) => void>): void {
		this.clickHandler = (event: Event) => {
			setTimeout(() => {
				for (const cb of callbacks) {
					cb(event);
				}
			}, 0);
		};
		for (const input of this.choiceInputs) {
			input.addEventListener('click', this.clickHandler);
		}
	}

	private resolveInput(event: Event): HTMLInputElement | null {
		const target = event.target as HTMLElement | null;
		if (!target) return null;
		// Avoid `instanceof HTMLInputElement` — Qualtrics can run across frame realms.
		if (target.tagName === 'INPUT') return target as HTMLInputElement;
		return (target.closest?.('input') as HTMLInputElement | null) ?? null;
	}

	private checkClickedChoiceCorrectness(event: Event, correctChoices: number[]): boolean {
		const input = this.resolveInput(event);
		if (!input) return false;
		const choiceId = parseInt(choiceIdFromInputId(input.id), 10);
		if (Number.isNaN(choiceId)) return false;

		if (correctChoices.includes(choiceId)) {
			input.setAttribute('data-correctness', 'correct');
			input.disabled = true;
			this.syncChoiceDisabledAttr(input);
			this.lastScore = this.computeScoreOnCorrectChoiceSelected();
			return true;
		}

		if (input.type === 'radio') {
			input.setAttribute('data-correctness', 'incorrect');
			input.disabled = true;
			this.syncChoiceDisabledAttr(input);
		} else if (input.type === 'checkbox') {
			if (input.checked) {
				input.setAttribute('data-correctness', 'incorrect');
			} else {
				input.setAttribute('data-correctness', 'incorrect');
				input.disabled = true;
				this.syncChoiceDisabledAttr(input);
			}
		}
		return false;
	}

	private checkAllChoicesCorrectness(_event: Event, correctChoices: number[]): boolean {
		const selectedChoices = this.qContext.getSelectedChoices().map(Number);

		if (correctChoices.every((choice) => selectedChoices.includes(choice))) {
			for (const input of this.choiceInputs) {
				if (input.getAttribute('data-correctness') === 'incorrect' && input.checked) {
					continue;
				}
				input.disabled = true;
				this.syncChoiceDisabledAttr(input);
			}

			if (selectedChoices.every((choice: number) => correctChoices.includes(choice))) {
				return true;
			}
		} else {
			for (const input of this.choiceInputs) {
				if (input.getAttribute('data-correctness') === 'incorrect' && !input.checked) {
					input.disabled = true;
					this.syncChoiceDisabledAttr(input);
				}
			}
		}
		return false;
	}

	private computeScoreOnCorrectChoiceSelected(): number {
		const numCorrectChoices = this.correctChoices.length;
		const numRevealedCorrectChoices = this.choiceInputs.filter(
			(input) => input.getAttribute('data-correctness') === 'correct',
		).length;
		const numHiddenCorrectChoices = numCorrectChoices - numRevealedCorrectChoices + 1;
		const numHiddenChoices =
			this.choiceInputs.filter((input) => input.getAttribute('data-correctness') === 'hidden')
				.length + 1;
		return 1 - numHiddenCorrectChoices / numHiddenChoices;
	}

	private evaluateRequiredChoices(requiredChoices: number[]): boolean {
		const selectedChoices = this.qContext.getSelectedChoices().map(Number);
		if (!requiredChoices.every((choice) => selectedChoices.includes(choice))) {
			return false;
		}
		if (this.hasSelectedIncorrectChoices()) {
			return false;
		}
		return true;
	}

	private hasSelectedIncorrectChoices(): boolean {
		return this.choiceInputs.some(
			(input) => input.checked && input.getAttribute('data-correctness') === 'incorrect',
		);
	}

	private checkAllChoicesRequired(_event: Event, requiredChoices: number[]): boolean {
		const passed = this.evaluateRequiredChoices(requiredChoices);
		if (passed) {
			this.nextButtonManager.setQuestionPassState(this.qContext, true);
			this.completeQuestion();
		} else {
			this.nextButtonManager.setQuestionPassState(this.qContext, false);
			this.syncResponseEmbeddedData({ complete: false });
		}
		return passed;
	}

	private saveChoiceStates(): void {
		const choiceHistory = this.getChoiceHistory();
		saveSessionJson(this.questionId + '_choiceHistory', choiceHistory);
		this.syncResponseEmbeddedData();
	}

	private getChoiceHistory(): Record<string, ChoiceState> {
		const choiceHistory: Record<string, ChoiceState> = {};
		for (const input of this.choiceInputs) {
			const choiceId = choiceIdFromInputId(input.id);
			choiceHistory[choiceId] = {
				correctness: (input.getAttribute('data-correctness') as ChoiceState['correctness']) ?? 'hidden',
				selected: input.checked,
				disabled: input.disabled,
			};
		}
		return choiceHistory;
	}

	private syncResponseEmbeddedData(overrides: Partial<ComprehensionEmbeddedData> = {}): void {
		const data: ComprehensionEmbeddedData = {
			choiceHistory: this.getChoiceHistory(),
			selectedChoices: this.qContext.getSelectedChoices().map(Number),
			complete: this.isComplete,
			...(this.lastScore !== null ? { score: this.lastScore } : {}),
			...overrides,
		};
		setComprehensionEmbeddedData(this.questionId, data);
	}

	private completeQuestion(): void {
		this.isComplete = true;
		const score = this.lastScore;
		if (score !== null) {
			updateComprehensionScores(this.qContext, score);
		}
		this.syncResponseEmbeddedData({
			complete: true,
			...(score !== null ? { score } : {}),
		});
	}

	private loadChoiceStates(): void {
		const history =
			(loadSessionJson(this.questionId + '_choiceHistory') as Record<string, ChoiceState> | null) ??
			{};

		for (const input of this.choiceInputs) {
			const choiceId = choiceIdFromInputId(input.id);
			const state = history[choiceId];

			if (state) {
				input.setAttribute('data-correctness', state.correctness);
				input.checked = state.selected;
				input.disabled = state.disabled;
			} else {
				input.setAttribute('data-correctness', 'hidden');
				input.checked = false;
				input.disabled = false;
			}

			this.syncChoiceDisabledAttr(input);
			syncChoiceValue(this.qContext, choiceId, input.checked);
		}
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
