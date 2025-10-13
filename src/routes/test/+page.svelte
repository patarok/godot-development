<script>
    import { onMount } from 'svelte';
    let counter = 0;

    onMount(() => {
        counter++;
        console.log(`🧪 Test page mount #${counter}`);
    });
</script>

<h1>Test Page - Mount Counter: {counter}</h1>