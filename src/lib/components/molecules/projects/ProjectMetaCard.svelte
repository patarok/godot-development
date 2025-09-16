<script lang="ts">
    import { Card, CardHeader, CardTitle, CardContent, CardFooter } from "$lib/components/ui/card";
    import { Label } from "$lib/components/ui/label";
    import { Input } from "$lib/components/ui/input";
    import { Button } from "$lib/components/ui/button";
    import { enhance } from "$app/forms";
    import type { SubmitFunction } from "@sveltejs/kit";

    let {
        class: className,
        method = "POST",
        action,
        enhanceForm = false,
        enhanceCallback = undefined,
        project
    }: {
        class?: string;
        method?: string;
        action?: string;
        enhanceForm?: boolean;
        enhanceCallback?: SubmitFunction;
        project: {
            id: number;
            title: string;
            description?: string;
            startDate?: string;
            endDate?: string;
            actualStartDate?: string;
            actualEndDate?: string;
        };
    } = $props();
</script>

<Card class={"w-full max-w-xl " + (className ?? "")}>
    <form
            method={method}
            action={action}
            use:enhance={enhanceForm ? (enhanceCallback ?? enhance) : undefined}
    >
        <CardHeader>
            <CardTitle>Edit Project Metadata</CardTitle>
        </CardHeader>

        <CardContent class="space-y-4">
            <div class="flex flex-col gap-2">
                <Label for="title">Title</Label>
                <Input id="title" name="title" value={project.title} required />
            </div>

            <div class="flex flex-col gap-2">
                <Label for="description">Description</Label>
                <Input id="description" name="description" value={project.description} />
            </div>

            <div class="flex flex-col gap-2">
                <Label for="startDate">Start Date</Label>
                <Input id="startDate" name="startDate" type="date" value={project.startDate} />
            </div>

            <div class="flex flex-col gap-2">
                <Label for="endDate">End Date</Label>
                <Input id="endDate" name="endDate" type="date" value={project.endDate} />
            </div>
        </CardContent>

        <CardFooter>
            <Button type="submit">Save</Button>
        </CardFooter>
    </form>
</Card>
