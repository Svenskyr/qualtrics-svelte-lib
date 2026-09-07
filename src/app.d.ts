// See https://svelte.dev/docs/kit/types#app.d.ts
// for information about these interfaces
import type { MultipleChoiceQuestion } from './lib/qualtrics/MultipleChoiceQuestion/v2/types.js';
import type { QualtricsGlobal } from './routes/q/mock/types.js';

declare global {
	namespace App {
		// interface Error {}
		// interface Locals {}
		// interface PageData {}
		// interface PageState {}
		// interface Platform {}
	}

	interface Window {
		Qualtrics?: QualtricsGlobal;
		svlib?: {
			enableMultipleChoiceQuestion: (
				qContext: unknown,
				attachment: MultipleChoiceQuestion,
			) => void;
			disableMultipleChoiceQuestion: (qContext: unknown) => void;
			enableComprehensionQuestion: (
				qContext: unknown,
				correctChoices?: number[],
				requiredChoices?: number[],
			) => void;
			disableComprehensionQuestion: (qContext: unknown) => void;
			NextButtonManager: unknown;
		};
	}
}

export {};
