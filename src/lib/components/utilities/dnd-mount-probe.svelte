<script>
    import { onMount, onDestroy } from 'svelte';
    onMount(() => console.log('Dnd subtree MOUNT'));
    onDestroy(() => console.log('Dnd subtree UNMOUNT'));
</script>