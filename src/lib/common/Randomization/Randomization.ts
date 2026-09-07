/**
 * DJB2 hash function.
 * @param str - The string to hash.
 * @returns The hash of the string.
 */
export function djb2(str: string): number {
	let h = 5381;
	for (let i = 0; i < str.length; i++) {
		h = (Math.imul(h, 33) + str.charCodeAt(i)) >>> 0;
	}
	return h >>> 0;
}

/**
 * Mulberry32 random number generator.
 * @param seed - The seed. Must be a full 32-bit number?
 * @returns A function that generates a random number.
 */
export function mulberry32(seed: number): () => number {
	return function () {
		let t = (seed += 0x6d2b79f5);
		t = Math.imul(t ^ (t >>> 15), t | 1);
		t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
		return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
	};
}

/**
 * Fisher-Yates shuffle an array using a DJB2 hash and Mulberry32 random number generator.
 * @param array - The array to shuffle.
 * @param seed - The seed.
 * @returns The shuffled array.
 */
export function FisherYatesShuffle<T>(array: T[], seed?: string | number): T[] {
	const hash = seed ? djb2(seed.toString()) : (Math.random() * 2 ** 32) >>> 0;

	const rand = mulberry32(hash);
	const shuffled = [...array];
	for (let i = shuffled.length - 1; i > 0; i--) {
		const j = Math.floor(rand() * (i + 1));
		[shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
	}
	return shuffled;
}
