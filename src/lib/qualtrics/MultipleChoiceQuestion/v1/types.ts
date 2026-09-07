export interface ChoiceState {
	correctness: 'correct' | 'incorrect' | 'hidden';
	selected: boolean;
	disabled: boolean;
}

export interface ComprehensionEmbeddedData {
	choiceHistory: Record<string, ChoiceState>;
	selectedChoices: number[];
	complete?: boolean;
	score?: number;
}
