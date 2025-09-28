<script lang="ts">
    import ForgotForm from "$lib/components/forgot-form.svelte";
    import type { ActionData } from "./$types";
    let { form }: { form: ActionData } = $props();
</script>

<svelte:head><title>Forgot</title></svelte:head>

<ForgotForm class="mx-auto max-w-sm mt-[48px]" method="POST" action="?/requestreset" enhanceForm={true} error={form?.error} message={form?.message} />