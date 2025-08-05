<script>
	export let label;
	export let style = "inner";
	export let options = ["on", "off"];
	export let value = options[0];

	let checked = value === options[0];

	const id = `toggle-${Math.floor(Math.random() * 1000000)}`;

	const handleClick = (event) => {
		const target = event.target;
		const state = target.getAttribute("aria-checked");
		checked = state === "true" ? false : true;
		value = checked ? options[0] : options[1];
	};
</script>

<div class="toggle toggle--{style}">
	<span class="label" {id}>{label}</span>
	<button
		role="switch"
		aria-checked={checked}
		aria-labelledby={id}
		on:click={handleClick}
	>
		{#if style === "inner"}
			<span>{options[0]}</span>
			<span>{options[1]}</span>
		{/if}
	</button>
</div>

<style>
	.toggle button,
	.label {
		font-family: inherit;
		font-size: 1em;
	}

	.toggle--inner [role="switch"][aria-checked="true"] :first-child,
	[role="switch"][aria-checked="false"] :last-child {
		display: inline-block;
		border-radius: 4px;
		background: var(--onion-cream);
		color: var(--color-gray-100);
	}

	.toggle--inner button {
		padding: 0.5em;
		background-color: var(--onion-dark);
		border: 2px solid var(--color-gray-900);
	}

	.toggle--inner button span {
		user-select: none;
		pointer-events: none;
		display: inline-block;
		line-height: 1;
		padding: 0.25em;
	}

	.toggle--inner button:focus {
		box-shadow: 0 0 4px 0 var(--color-focus);
	}

	.toggle--slider {
		display: flex;
		align-items: center;
	}

	.toggle--slider button {
		width: 4.5em;
		height: 2.75em;
		position: relative;
		margin-left: 0.5em;
		background-color: var(--onion-yellow-light);
		border-radius: 4px;
	}

	.toggle--slider button:focus {
		box-shadow: 0 0px 4px var(--color-focus);
	}

	.toggle--slider button::before {
		content: "";
		position: absolute;
		width: 24px;
		height: 24px;
		background: url("/assets/dot.png") no-repeat center;
		background-size: contain;
		top: 0.35em;
		right: 2em;
	}

	.toggle--slider button[aria-checked="true"] {
		background-color: var(--onion-yellow-mid);
	}

	.toggle--slider button[aria-checked="true"]::before {
		transform: translateX(1.5em);
	}

	.toggle--slider button:focus {
		box-shadow: 0 0 4px 0 var(--color-focus);
	}
</style>
