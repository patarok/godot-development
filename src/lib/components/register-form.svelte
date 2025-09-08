<script lang="ts">
    import * as RadioGroup from "$lib/components/ui/radio-group";
    import { Button } from "$lib/components/ui/button";
    import * as Card from "$lib/components/ui/card";
    import { Label } from "$lib/components/ui/label";
    import { Input } from "$lib/components/ui/input";
    import { cn } from "$lib/utils.js";
    import type { HTMLAttributes } from "svelte/elements";

    // Only import enhance inside the component if you want to toggle it via prop
    import { enhance, type SubmitFunction } from "$app/forms";

    const newId = $props.id();
    // Props in runes mode: destructure from $props()
    let {
        class: className,
        // Accept a parent-provided HTML id under a different name to avoid collision
        parentId: htmlId = undefined,
        // Form props
        method = "POST",
        action = undefined,
        enhanceForm = true,
        // Optional error props
        error,
        message,
        enhanceCallback = undefined,
        ...restProps
    }: HTMLAttributes<HTMLDivElement> & {
        parentId?: string;

        action?: string;
        enhanceForm?: boolean;
        error?: string;
        message?: string;
        enhanceCallback?: SubmitFunction;
    } = $props();

    // Use the provided id if present, otherwise generate a hydration-safe one
    const uid = htmlId ?? newId;
</script>

<div class={cn("flex flex-col gap-6", className)} {...restProps}>
    <Card.Root>
        <Card.Header class="text-center">
            <Card.Title class="text-xl">Welcome</Card.Title>
            <Card.Description>Create an account with your Apple or Google login</Card.Description>
        </Card.Header>

        <Card.Content>
            {#if error || message}
                <div class="mb-4 text-sm text-destructive">
                    {#if error}<div class="font-medium">{@html error}</div>{/if}
                    {#if message}<div>{@html message}</div>{/if}
                </div>
            {/if}

            <form
                    method={method}
                    action={action}
                    class={className}
                    use:enhance={enhanceForm ? enhanceCallback : null}
            >
                <div class="grid gap-6">
                    <div class="flex flex-col gap-4">
                        <Button type="button" variant="outline" class="w-full">
                            <!-- Apple icon -->
                            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" class="size-4">
                                <path d="M12.152 6.896c-.948 0-2.415-1.078-3.96-1.04-2.04.027-3.91 1.183-4.961 3.014-2.117 3.675-.546 9.103 1.519 12.09 1.013 1.454 2.208 3.09 3.792 3.039 1.52-.065 2.09-.987 3.935-.987 1.831 0 2.35.987 3.96.948 1.637-.026 2.676-1.48 3.676-2.948 1.156-1.688 1.636-3.325 1.662-3.415-.039-.013-3.182-1.221-3.22-4.857-.026-3.04 2.48-4.494 2.597-4.559-1.429-2.09-3.623-2.324-4.39-2.376-2-.156-3.675 1.09-4.61 1.09zM15.53 3.83c.843-1.012 1.4-2.427 1.245-3.83-1.207.052-2.662.805-3.532 1.818-.78.896-1.454 2.338-1.273 3.714 1.338.104 2.715-.688 3.559-1.701" fill="currentColor" />
                            </svg>
                            Create account with Apple
                        </Button>
                        <Button type="button" variant="outline" class="w-full">
                            <!-- Google icon -->
                            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" class="size-4">
                                <path d="M12.48 10.92v3.28h7.84c-.24 1.84-.853 3.187-1.787 4.133-1.147 1.147-2.933 2.4-6.053 2.4-4.827 0-8.6-3.893-8.6-8.72s3.773-8.72 8.6-8.72c2.6 0 4.507 1.027 5.907 2.347l2.307-2.307C18.747 1.44 16.133 0 12.48 0 5.867 0 .307 5.387.307 12s5.56 12 12.173 12c3.573 0 6.267-1.173 8.373-3.36 2.16-2.16 2.84-5.213 2.84-7.667 0-.76-.053-1.467-.173-2.053H12.48z" fill="currentColor" />
                            </svg>
                            Create account with Google
                        </Button>
                    </div>

                    <div class="after:border-border relative text-center text-sm after:absolute after:inset-0 after:top-1/2 after:z-0 after:flex after:items-center after:border-t">
                        <span class="bg-card text-muted-foreground relative z-10 px-2">OR</span>
                    </div>

                    <div class="grid gap-6">
                        <div class="grid gap-3">
                            <Label for="forename-{uid}">Forename</Label>
                            <Input id="forename-{uid}" name="forename" type="text" placeholder="Max" required />
                        </div>
                        <div class="grid gap-3">
                            <Label for="surname-{uid}">Surname</Label>
                            <Input id="surname-{uid}" name="surname" type="text" placeholder="Smith" required />
                        </div>
                        <div class="grid gap-3">
                            <div class="flex items-center">
                                <Label for="username-{uid}">Username</Label>
                                <span class="ml-auto text-sm underline-offset-4 hover:underline">...is email if not given</span>
                            </div>
                            <Input id="username-{uid}" name="username" type="text" required />
                        </div>
                        <div class="grid gap-3">
                            <Label for="email-{uid}">Email</Label>
                            <Input id="email-{uid}" name="email" type="email" placeholder="m@example.com" required />
                        </div>

                        <div class="grid gap-3">
                            <div class="flex items-center">
                                <Label for="password-{uid}">Password</Label>
                                <a href="/forgot" class="ml-auto text-sm underline-offset-4 hover:underline">Forgot your password?</a>
                            </div>
                            <Input id="password-{uid}" name="password" type="password" required />
                        </div>
                        <div class="grid gap-3">
                            <Label for="role-{uid}">Role</Label>
                            <RadioGroup.Root name="role">
                                <div class="flex items-center space-x-2">
                                    <RadioGroup.Item value="admin" id="role-admin-{uid}" />
                                    <Label for="role-admin-{uid}">Admin</Label>
                                </div>
                                <div class="flex items-center space-x-2">
                                    <RadioGroup.Item value="user" id="role-user-{uid}" />
                                    <Label for="role-user-{uid}">User</Label>
                                </div>
                            </RadioGroup.Root>
                        </div>

                        <Button type="submit" class="w-full">Create</Button>
                    </div>

                    <div class="text-center text-sm">
                        Already have an account?
                        <a href="/login" class="underline underline-offset-4"> Log in </a>
                    </div>
                </div>
            </form>
        </Card.Content>
    </Card.Root>

    <div class="text-muted-foreground *:[a]:hover:text-primary *:[a]:underline *:[a]:underline-offset-4 text-balance text-center text-xs">
        By clicking continue, you agree to our <a href="/terms">Terms of Service</a> and <a href="/privacy">Privacy Policy</a>.
    </div>
</div>