<script lang="ts">
    import RegisterForm from "$lib/components/register-form.svelte"

    import type { ActionData } from "./$types";
    import LoginForm from "$lib/components/login-form.svelte";

    let { form }: { form: ActionData } = $props();
</script>

<svelte:head>
    <title>Register New User</title>
</svelte:head>

<RegisterForm class="mx-auto max-w-sm mt-[48px]" method="POST" action="?/register" enhanceForm={true} error={form?.error} message={form?.message} />