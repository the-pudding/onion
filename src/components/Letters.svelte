<script>
let { string, height, space } = $props();

let letters = $derived(string.split(""));

const rotations = [-4, -2, 0, 2, 4];

const getRandomIndex = (max) => {
    return Math.floor(Math.random() * max) + 1;
};
</script>

<div class="letters" 
    aria-label={string} 
    style="margin: {space == "extra" ? "6rem 0 2rem 0" : "-1rem 0"};" 
>
        {#each letters as letter, i}
            {#if letter !== " "}
                <img src="./assets/letters/{letter}.png" 
                    alt="{letter} styled as an Onion" 
                    style="height: {height}px; 
                        max-height: {space == "extra" ? "100px" : "300px"};
                        transform: rotate({rotations[getRandomIndex(rotations.length - 1)]}deg);"
                />
            {:else}
                <span style="width: {height}px;"></span>
            {/if}
        {/each}
</div>

<style>
    .letters {
        display: flex;
        flex-direction: row;
        justify-content: center;
        align-items: center;
        gap: 0.5rem;
    }

    img {
        max-height: 300px;
        filter: drop-shadow(0 1px 1px rgba(0, 0, 0, 0.06)) 
          drop-shadow(0 2px 2px rgba(0, 0, 0, 0.06)) 
          drop-shadow(0 4px 4px rgba(0, 0, 0, 0.06));
    }
</style>