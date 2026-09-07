<script lang="ts">
	/**
	 * Optional Svelte wrapper around the Qualtrics comprehension enhancer.
	 * The Qualtrics IIFE uses `enable.ts` / `ComprehensionController` directly
	 * (no mount) so survey headers do not need the Svelte runtime.
	 */
	import { onMount } from 'svelte';
	import type { QuestionContext } from '../../types.js';
	import { ComprehensionController } from './controller.js';
	import './comprehension.css';

	let {
		qContext,
		correctChoices = [],
		requiredChoices,
	}: {
		qContext: QuestionContext;
		correctChoices?: number[];
		requiredChoices?: number[];
	} = $props();

	onMount(() => {
		const controller = new ComprehensionController(
			qContext,
			correctChoices,
			requiredChoices ?? correctChoices,
		);
		controller.init();
		return () => controller.destroy();
	});
</script>
