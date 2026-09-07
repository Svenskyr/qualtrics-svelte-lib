<script lang="ts">
	type Choice = { id: string; text: string };

	let {
		questionId,
		questionText,
		choices,
		inputType = 'radio',
		questionContainer = $bindable(),
		choiceContainer = $bindable()
	}: {
		questionId: string;
		questionText: string;
		choices: Choice[];
		inputType?: 'radio' | 'checkbox';
		questionContainer?: HTMLElement | undefined;
		choiceContainer?: HTMLElement | undefined;
	} = $props();

	function handleChange(event: Event) {
		const input = event.currentTarget as HTMLInputElement;
		const choiceEl = input.closest('.choice');
		if (!choiceEl) return;

		if (inputType === 'radio') {
			choiceContainer?.querySelectorAll('.choice.selected').forEach((el) => {
				el.classList.remove('selected');
			});
			if (input.checked) {
				choiceEl.classList.add('selected');
			}
		} else {
			choiceEl.classList.toggle('selected', input.checked);
		}
	}
</script>

<div class="QuestionOuter" data-question-id={questionId} bind:this={questionContainer}>
	<div class="question-display-wrapper">
		<div class="question-text">{questionText}</div>
		<div class="QuestionBody" bind:this={choiceContainer}>
			{#each choices as choice (choice.id)}
				<div
					class="choice"
					class:radio={inputType === 'radio'}
					class:checkbox={inputType === 'checkbox'}
				>
					<input
						id={`QR-${questionId}-${choice.id}`}
						type={inputType}
						name={questionId}
						value={choice.id}
						onchange={handleChange}
					/>
					<label class="choice-label" for={`QR-${questionId}-${choice.id}`}>{choice.text}</label>
				</div>
			{/each}
		</div>
	</div>
</div>

<style>
	.choice {
		display: flex;
		align-items: center;
		gap: 0.5rem;
	}
</style>
