import type {
	MultipleChoiceItem,
	MultipleChoiceQuestion,
} from '../../../common/QuestionTypes/MultipleChoiceQuestion/v4/index.js';

export type { MultipleChoiceItem, MultipleChoiceQuestion };

export interface StoredQuestionData {
	canonicalItems: Pick<
		MultipleChoiceItem,
		'itemId' | 'isSelected' | 'wasSelected' | 'displayOrder'
	>[];
}

export interface MultipleChoiceEmbeddedData {
	question: MultipleChoiceQuestion;
	score?: number;
	complete?: boolean;
}

export type ChoiceCorrectness = 'correct' | 'incorrect' | 'hidden';
