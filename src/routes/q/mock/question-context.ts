import { choiceIdFromInputId } from '../../../lib/qualtrics/choice-id.js';
import type {
	CreateQuestionContextOptions,
	QuestionContext,
} from './types.js';

/**
 * Build a Qualtrics-like question context (`this` in question JS).
 */
export function createQuestionContext(options: CreateQuestionContextOptions): QuestionContext {
	const {
		questionId,
		choiceContainer,
		questionContainer = choiceContainer,
		questionText = '',
		choices = {},
		nextButton,
	} = options;

	const questionInfo = {
		QuestionID: questionId,
		QuestionType: 'MC',
		QuestionText: questionText,
		Choices: choices,
	};

	return {
		questionId,

		getChoiceContainer() {
			return choiceContainer;
		},

		getQuestionContainer() {
			return questionContainer;
		},

		getSelectedChoices() {
			const selected: string[] = [];
			const inputs = choiceContainer.querySelectorAll<HTMLInputElement>(
				'input[type="radio"], input[type="checkbox"]',
			);
			for (const input of inputs) {
				if (input.checked) {
					selected.push(choiceIdFromInputId(input.id));
				}
			}
			return selected;
		},

		setChoiceValue(choiceId: string | number, value: string) {
			const id = String(choiceId);
			const selected = value !== '';
			const inputs = choiceContainer.querySelectorAll<HTMLInputElement>(
				'input[type="radio"], input[type="checkbox"]',
			);
			for (const input of inputs) {
				if (choiceIdFromInputId(input.id) === id) {
					input.checked = selected;
					const choiceEl = input.closest('.choice');
					if (choiceEl) {
						choiceEl.classList.toggle('selected', selected);
					}
					if (selected && input.type === 'radio') {
						for (const other of inputs) {
							if (other !== input && other.name === input.name) {
								other.checked = false;
								other.closest('.choice')?.classList.remove('selected');
							}
						}
					}
					return true;
				}
			}
			return false;
		},

		setChoiceAnswerValue(
			choiceId: string | number,
			_answerId: string | number,
			value: string,
		) {
			return this.setChoiceValue!(choiceId, value);
		},

		enableNextButton() {
			nextButton.enable();
		},

		disableNextButton() {
			nextButton.disable();
		},

		clickNextButton() {
			nextButton.click();
		},

		getQuestionInfo() {
			return questionInfo;
		},

		getChoices() {
			return Object.keys(choices);
		},

		setJSEmbeddedData(key: string, value: string) {
			window.Qualtrics?.SurveyEngine.setJSEmbeddedData(key, value);
		},

		getJSEmbeddedData(key: string) {
			return window.Qualtrics?.SurveyEngine.getJSEmbeddedData(key);
		},
	};
}
