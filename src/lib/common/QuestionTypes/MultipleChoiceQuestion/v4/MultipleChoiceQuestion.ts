import { FisherYatesShuffle } from '../../../Randomization/Randomization.js';

export interface MultipleChoiceQuestion {
	qid: string;
	questionText: string;
	canonicalItems: MultipleChoiceItem[];
	userItems?: MultipleChoiceItem[] | undefined;
	inputType: 'radio' | 'checkbox';
	required?: 'none' | 'any' | 'all' | undefined;
	randSeed?: string | undefined;
	showFeedback?: boolean | undefined;
	allowReset?: boolean | undefined;
	allowUserItems?: boolean | undefined;
}

export interface MultipleChoiceItem {
	itemId: string;
	itemText: string;
	isTrue?: boolean | null | undefined;
	displayOrder?: number | undefined;
	isSelected?: boolean | undefined;
	wasSelected?: boolean | undefined;
}

export function newMultipleChoiceQuestion(
	canonicalData: MultipleChoiceQuestion,
	storedData?: { canonicalItems: MultipleChoiceItem[]; userItems?: MultipleChoiceItem[] },
): MultipleChoiceQuestion {
	let canonicalItems: MultipleChoiceItem[] = resolveDisplayOrder(
		[...canonicalData.canonicalItems],
		canonicalData.randSeed,
	);

	if (storedData) {
		const storedMap = new Map(storedData.canonicalItems.map((item) => [item.itemId, item]));
		canonicalItems = canonicalItems.map((item) => {
			const storedItem = storedMap.get(item.itemId);
			return {
				...item,
				isSelected: storedItem?.isSelected ?? item.isSelected,
				wasSelected: storedItem?.wasSelected ?? item.wasSelected,
				displayOrder: storedItem?.displayOrder ?? item.displayOrder,
			};
		});
	}

	const question: MultipleChoiceQuestion = {
		...canonicalData,
		canonicalItems,
		userItems: canonicalData.allowUserItems ? (storedData?.userItems ?? []) : undefined,
	};
	return question;
}

export function mergeQuestionData(
	question: MultipleChoiceQuestion,
	storedData?: { canonicalItems: MultipleChoiceItem[]; userItems?: MultipleChoiceItem[] },
): MultipleChoiceQuestion {
	if (storedData) {
		if (storedData.canonicalItems) {
			const storedMap = new Map(storedData.canonicalItems.map((item) => [item.itemId, item]));
			for (const item of question.canonicalItems) {
				const storedItem = storedMap.get(item.itemId);
				item.isSelected = storedItem?.isSelected ?? item.isSelected;
				item.wasSelected = storedItem?.wasSelected ?? item.wasSelected;
				item.displayOrder = storedItem?.displayOrder ?? item.displayOrder;
			}
		}
		if (question.allowUserItems && storedData.userItems) {
			question.userItems = [...storedData.userItems];
		}
	}
	return question;
}

export function areAllTrueItemsSelected(question: MultipleChoiceQuestion): boolean {
	const trueItems = question.canonicalItems.filter((item) => item.isTrue === true);
	return trueItems.every((item) => item.isSelected === true);
}

export function areAllSelectedItemsTrue(question: MultipleChoiceQuestion): boolean {
	const selectedItems = question.canonicalItems.filter((item) => item.isSelected === true);
	return selectedItems.every((item) => item.isTrue === true);
}

export function isQuestionComplete(question: MultipleChoiceQuestion): boolean {
	switch (question.required) {
		case 'all': {
			return areAllTrueItemsSelected(question) && areAllSelectedItemsTrue(question);
		}
		case 'any': {
			const anyItems = [...question.canonicalItems, ...(question.userItems ?? [])];
			return anyItems.some((item) => item.isSelected);
		}
		case 'none':
		default:
			return true;
	}
}

export function selectItem(
	question: MultipleChoiceQuestion,
	itemId: string,
	isSelected: boolean,
): void {
	const items = [...question.canonicalItems, ...(question.userItems ?? [])];
	const item = items.find((i) => i.itemId === itemId);
	if (!item) return;

	if (isSelected && question.inputType === 'radio') {
		for (const i of items) {
			i.isSelected = false;
		}
	}

	item.isSelected = isSelected;
	item.wasSelected ||= isSelected;
}

export function resetQuestion(question: MultipleChoiceQuestion): void {
	const items = [...question.canonicalItems, ...(question.userItems ?? [])];
	for (const item of items) {
		item.isSelected = false;
		item.wasSelected = false;
	}
}

export function resolveDisplayOrder(
	items: MultipleChoiceItem[],
	randSeed?: string | number,
): MultipleChoiceItem[] {
	const resolvedItems = items.map((item) => ({ ...item }));
	let positiveDisplayIndices: MultipleChoiceItem[] = resolvedItems.filter(
		(item) => item.displayOrder !== undefined && item.displayOrder >= 0,
	);

	positiveDisplayIndices = shuffleSameDisplayIndexGroups(positiveDisplayIndices, randSeed);
	let negativeDisplayIndices: MultipleChoiceItem[] = resolvedItems.filter(
		(item) => item.displayOrder !== undefined && item.displayOrder < 0,
	);

	negativeDisplayIndices = shuffleSameDisplayIndexGroups(negativeDisplayIndices, randSeed);
	let undefinedDisplayIndices: MultipleChoiceItem[] = resolvedItems.filter(
		(item) => item.displayOrder === undefined,
	);

	undefinedDisplayIndices = FisherYatesShuffle(undefinedDisplayIndices, randSeed);

	const randomizedItems: MultipleChoiceItem[] = [
		...positiveDisplayIndices,
		...undefinedDisplayIndices,
		...negativeDisplayIndices,
	];
	randomizedItems.forEach((item, index) => {
		item.displayOrder = index + 1;
	});
	return randomizedItems;
}

function shuffleSameDisplayIndexGroups(
	items: MultipleChoiceItem[],
	randSeed?: string | number,
): MultipleChoiceItem[] {
	const groups = new Map<number, MultipleChoiceItem[]>();
	for (const item of items) {
		const displayOrder = item.displayOrder!;
		const group = groups.get(displayOrder) ?? [];
		group.push(item);
		groups.set(displayOrder, group);
	}

	const sortedKeys = [...groups.keys()].sort((a, b) => a - b);
	return sortedKeys.flatMap((displayIndex) =>
		FisherYatesShuffle(
			groups.get(displayIndex)!,
			randSeed !== undefined ? `${randSeed}:${displayIndex}` : undefined,
		),
	);
}
