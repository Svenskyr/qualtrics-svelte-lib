import type { MultipleChoiceQuestion } from './types.js';
import type { ChoiceCorrectness } from './types.js';

export function computeScoreOnCorrectSelection(
	question: MultipleChoiceQuestion,
	correctnessByItemId: Map<string, ChoiceCorrectness>,
): number {
	const numCorrectChoices = question.canonicalItems.filter((item) => item.isTrue === true).length;
	const numRevealedCorrectChoices =
		[...correctnessByItemId.values()].filter((c) => c === 'correct').length;
	const numHiddenCorrectChoices = numCorrectChoices - numRevealedCorrectChoices + 1;
	const numHiddenChoices =
		[...correctnessByItemId.values()].filter((c) => c === 'hidden').length + 1;
	return Math.round((1 - numHiddenCorrectChoices / numHiddenChoices) * 1e3) / 1e3; // 3 decimals
}
