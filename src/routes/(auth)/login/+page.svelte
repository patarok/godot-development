<script lang="ts">
    import LoginForm from "$lib/components/login-form.svelte";
    import type { ActionData } from "./$types";
    let { form }: { form: ActionData } = $props();
</script>

<svelte:head><title>Login</title></svelte:head>

<LoginForm class="mx-auto max-w-sm mt-[48px]" action="?/login"  error={form?.error} message={form?.message} />