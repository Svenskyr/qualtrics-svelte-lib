export function saveSessionJson(key: string, data: Record<string, unknown>): void {
	try {
		sessionStorage.setItem(key, JSON.stringify(data));
	} catch (error) {
		console.error('Error saving session data: %s', error);
	}
}

export function loadSessionJson(key: string): Record<string, unknown> | null {
	try {
		const jsonString = sessionStorage.getItem(key);
		return jsonString ? (JSON.parse(jsonString) as Record<string, unknown>) : null;
	} catch (error) {
		console.error('Error loading session data: %s', error);
		return null;
	}
}
