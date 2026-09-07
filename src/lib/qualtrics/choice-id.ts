/** Qualtrics input ids look like `QR-QID1-1` or (legacy) `QR~QID1~1`. */
export function choiceIdFromInputId(inputId: string): string {
	const parts = inputId.split(/[-~]/);
	return parts[parts.length - 1] ?? inputId;
}
