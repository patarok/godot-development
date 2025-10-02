<script lang="ts">
    import { onMount, tick } from 'svelte';
    export let id: number | string;
    export let node: { current: HTMLElement | null };
    onMount(async () => {
        await tick();
        setTimeout(() => {
            console.log('[REG CHECK]', id, 'row ref =', node.current);
        }, 0);
    });
</script>