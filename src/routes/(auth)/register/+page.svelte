<script lang="ts">
    import { enhance } from "$app/forms";
    import Alert from "$lib/components/alert.svelte";
    import type { ActionData } from "./$types";

    let { form }: { form: ActionData } = $props();
</script>

<svelte:head>
    <title>Register New User</title>
</svelte:head>

{#if form?.error}
    <Alert>{@html form?.message}</Alert>
{/if}

<form method="post" use:enhance>
    <div class="mb-3">
        <input
                type="email"
                name="email"
                placeholder="Email"
                class="input"
                required
        />
    </div>
    <div class="mb-3">
        <input
                type="text"
                name="forename"
                placeholder="Forename"
                class="input"
        />
    </div>
    <div class="mb-3">
        <input
                type="text"
                name="surname"
                placeholder="Surname"
                class="input"
        />
    </div>
    <div class="mb-3">
        <input
                type="text"
                name="username"
                placeholder="Username"
                class="input"
                required
        />
    </div>
    <div class="mb-3">
        <input
                type="password"
                name="password"
                placeholder="Password"
                class="input"
                required
        />
    </div>
    <div class="mb-3">
        <label for="role">Role</label>
        <select id="role" name="role" class="input" required>
            <option value="user" selected>User</option>
            <option value="admin">Admin</option>
        </select>
    </div>
    <div class="inline-flex items-center gap-3">
        <button type="submit" class="btn">Register</button>
    </div>
</form>
