<script lang="ts">
    import { Card, CardHeader, CardAction, CardDescription, CardTitle, CardContent, CardFooter } from "$lib/components/ui/card";
    import { Label } from "$lib/components/ui/label";
    import { Input } from "$lib/components/ui/input";
    import { Button } from "$lib/components/ui/button";
    import { enhance } from "$app/forms";
    import type { SubmitFunction } from "@sveltejs/kit";
    import * as Avatar from "$lib/components/ui/avatar/index.js";
    import * as HoverCard from "$lib/components/ui/hover-card/index.js";
    import { formatCurrencyInt } from '$lib/utils/formatCurrency';
    import { clampToWordCount } from '$lib/utils/clampToX';
    import { dateMat } from '$lib/utils/dateMat';
    import { Badge } from "$lib/components/ui/badge/index.js";
    import TrendingUpIcon from "@tabler/icons-svelte/icons/trending-up";
    import { IconMoneybag } from "@tabler/icons-svelte";
    import { IconMoneybagMinus } from "@tabler/icons-svelte";
    import { IconHourglass } from "@tabler/icons-svelte";
    import { IconHourglassFilled } from "@tabler/icons-svelte";
    import { IconCalendarPlus } from "@tabler/icons-svelte";
    import { IconCalendarOff } from "@tabler/icons-svelte";

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
            avatarData?: string;
            title: string;
            description?: string;
            estimatedBudget?: number;
            estimatedHours?: number;
            actualHours?: number;
            actualCost?: number;
            startDate?: string;
            endDate?: string;
            actualStartDate?: string;
            actualEndDate?: string;
        };
    } = $props();

   // debugger;
    console.log("PROJECT DATA: ", project);
   // debugger;
    const projectWorth = $derived(formatCurrencyInt((project.estimatedBudget * 1.2), 'en-US', 'USD'));
    const projectActualCost = $derived(formatCurrencyInt(project.actualCost, 'en-US', 'USD'));
    const projectDescription = $derived(clampToWordCount(project.description, 9));
    const projectStartDate = dateMat(project.startDate,'EUR');

    const whatIsIt = projectStartDate;

    </script>

<Card class={"w-full max-w-xl " + (className ?? "")}>
        <CardHeader>
            <CardTitle class="text-lg font-bold flex">
                <button type="button" class="inline-flex items-center gap-2" title={project.title}>
                    <Avatar.Root class="size-8 mr-2">
                        <Avatar.Image src={project.avatarData} alt={project.title} />
                        <Avatar.Fallback>FF</Avatar.Fallback>
                    </Avatar.Root>

                </button>
                {project.title}
            </CardTitle>

            <CardDescription>{projectDescription}</CardDescription>
            <CardAction class="flex-col flex max-w-full">
                <Badge variant="outline" class="mx-auto">
                    <IconMoneybag />
                    {projectWorth}
                </Badge>
                <Badge variant="outline" class="mt-2 mx-auto">
                    <IconMoneybagMinus />
                    {projectActualCost}
                </Badge>
                <Badge class="mt-2 max-w-[6rem]" variant="outline">
                    <span class="flex-col flex m-2 max-w-full">
                    <Avatar.Root class="size-8 mr-2 mx-auto">
                        <Avatar.Image src={project.avatarData} alt={project.title} />
                        <Avatar.Fallback>FF</Avatar.Fallback>
                    </Avatar.Root>
                        <div class="whitespace-normal max-w-full">
                    Maxasxaxax Muster-Axt</div>
                                                </span>
                </Badge>
            </CardAction>
        </CardHeader>

        <CardContent class="space-y-4 flex-col items-start gap-1.5 text-sm">
            <CardDescription>
                <u>INVOLVED USERS</u>


            </CardDescription>
            <CardAction>
            <Badge variant="outline">
                <IconHourglass />
                {project.estimatedHours}h
            </Badge>
            <Badge variant="outline">
                <IconHourglassFilled />
                {project.actualHours}h
            </Badge>
            </CardAction>
            <CardAction>
                <Badge variant="outline">
                    <IconCalendarPlus />
                    {dateMat(project.startDate, 'EUR')}
                </Badge>
                <Badge variant="outline">
                    <IconCalendarOff />
                    {dateMat(project.endDate, 'EUR')}
                </Badge>
            </CardAction>
        </CardContent>

<!--    <div class="flex flex-col gap-2">-->
<!--        <Label for="title">Title</Label>-->
<!--        <Input id="title" name="title" value={project.title} required />-->
<!--    </div>-->

<!--    <div class="flex flex-col gap-2">-->
<!--        <Label for="description">Description</Label>-->
<!--        <Input id="description" name="description" value={project.description} />-->
<!--    </div>-->

<!--    <div class="flex flex-col gap-2">-->
<!--        <Label for="startDate">Start Date</Label>-->
<!--        <Label for="startDate">{project.startDate}</Label>-->
<!--    </div>-->

<!--    <div class="flex flex-col gap-2">-->
<!--        <Label for="endDate">End Date</Label>-->
<!--        <Input id="endDate" name="endDate" type="date" value={project.endDate} />-->
<!--    </div>-->

        <CardFooter>
            <Button class="mx-auto" type="submit">Edit</Button>
        </CardFooter>

</Card>
