<script lang="ts">
    import type { PageData } from './$types';

    let { data }: { data: PageData } = $props();
    const user = data.user;
    const username = user?.username ?? 'guest';

</script>


<h1>Welcome to SvelteKit, {username}</h1>
{#if user}
<p>
    Email: {user.email}
    {#if user.forename || user.surname}
        <br />Name: {user.forename ?? ''} {user.surname ?? ''}
        <br />Role: {user.role ?? ''}
    {/if}
</p>
{/if}

<p class="max-w-[20em] mx-auto">
    Visit <a href="https://kit.svelte.dev">kit.svelte.dev</a> to read the documentation
</p>