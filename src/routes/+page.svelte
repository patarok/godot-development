<script lang="ts">
    import type { PageData } from './$types';
    import * as Card from "$lib/components/ui/card";
    import {cn} from "$lib/utils";
    import Clock from "$lib/components/custom/clock/clock.svelte"
    import { getContext } from 'svelte';
    import { appState } from '$lib/state.svelte.js';
    let { data }: { data: PageData } = $props();
    const user = data.user;
    const username = user?.username ?? 'guest';
</script>

{#if appState.current === 'main'}

    <h1 class="text-4xl">this is where the action goes</h1>

{:else}
    <div class={cn("grid place-items-center min-h-screen mx-auto gap-2 md:gap-6")}>
        <div class="grid gap-2 md:gap-6 w-full max-w-md">
            <Card.Root class="w-full flex flex-col py-2 md:py-6">
                <Card.Content class="flex flex-col">
                    <div class="mx-auto">
                        <Clock showDate={true} dateClass="font-semibold"/>
                    </div>
                </Card.Content>



            </Card.Root>
            <Card.Root class="w-full flex flex-col py-2 md:py-6">

                <Card.Content class="flex flex-col py-2 md:py-4">
                    <h1 class="mx-auto text-4xl md:text-6xl mb-2 md:mb-4">GODOT</h1>


                    <div class="mx-auto max-w-1/2 md:max-w-full">
                        {#if user}
                            <button onclick={() => appState.setMain()} aria-label="enter project-mgmt app">
                                <svg xmlns="http://www.w3.org/2000/svg"
                                     viewBox="0 0 2703.214 1272.608"
                                     width="100%"
                                     height="auto"
                                     fill="currentColor"
                                     class="h-auto mx-auto">
                                    <path d="M72.373,651.52C62.109,212.429,541.276-95.972,961.842,145.033c138.551,79.397,256.167,196.988,382.632,325.418
    c5.749,5.839,8.404,5.236,13.785-0.188c197.808-199.402,484.222-503.454,885.399-385.157
    c168.833,49.784,286.15,159.321,346.255,324.377c201.16,552.413-375.869,1009.769-870.693,706.588
    c-124.801-76.466-232.581-181.978-359.98-311.726c-6.801-6.927-9.868-5.946-16.086,0.324
    c-144.739,145.956-300.538,304.607-492.977,371.024C458.575,1310.846,83.17,1077.492,72.373,651.52z M317.418,643.008
    c12.485,253.639,207.59,371.88,415.468,326.918c179.653-38.857,330.36-196.86,458.721-328.811c4.325-4.446,1.9-6.251-1.072-9.025
    c-111.488-104.066-220.365-231.184-357.581-296.6C567.01,208.705,316.523,394.639,317.418,643.008z M2385.265,632.288
    c-7.903-245.124-201.289-378.703-424.132-326.433c-175.334,41.126-325.161,198.381-449.641,326.279
    c-4.318,4.437-2.66,6.509,0.879,9.811c155.637,145.245,339.3,374.567,587.443,332.772
    C2265.103,946.877,2385.634,802.91,2385.265,632.288z"/>
                                </svg>
                            </button>
                        {:else}

                            <svg xmlns="http://www.w3.org/2000/svg"
                                 viewBox="0 0 2703.214 1272.608"
                                 width="100%"
                                 height="auto"
                                 fill="currentColor"
                                 class="h-auto mx-auto">
                                <path d="M72.373,651.52C62.109,212.429,541.276-95.972,961.842,145.033c138.551,79.397,256.167,196.988,382.632,325.418
    c5.749,5.839,8.404,5.236,13.785-0.188c197.808-199.402,484.222-503.454,885.399-385.157
    c168.833,49.784,286.15,159.321,346.255,324.377c201.16,552.413-375.869,1009.769-870.693,706.588
    c-124.801-76.466-232.581-181.978-359.98-311.726c-6.801-6.927-9.868-5.946-16.086,0.324
    c-144.739,145.956-300.538,304.607-492.977,371.024C458.575,1310.846,83.17,1077.492,72.373,651.52z M317.418,643.008
    c12.485,253.639,207.59,371.88,415.468,326.918c179.653-38.857,330.36-196.86,458.721-328.811c4.325-4.446,1.9-6.251-1.072-9.025
    c-111.488-104.066-220.365-231.184-357.581-296.6C567.01,208.705,316.523,394.639,317.418,643.008z M2385.265,632.288
    c-7.903-245.124-201.289-378.703-424.132-326.433c-175.334,41.126-325.161,198.381-449.641,326.279
    c-4.318,4.437-2.66,6.509,0.879,9.811c155.637,145.245,339.3,374.567,587.443,332.772
    C2265.103,946.877,2385.634,802.91,2385.265,632.288z"/>
                            </svg>

                        {/if}
                    </div>


                    <h2 class="mx-auto text-xl md:text-3xl text-center font-semibold mt-4 md:mt-8">Project <br />-<br />MGMT</h2>

                    {#if !user}
                        <Card.Header class="w-full">
                            <p class="mx-auto max-w-[20em] text-center mt-4">
                                <a class="font-bold" href="/login">Log in</a> to kickstart your projects
                            </p>
                        </Card.Header>
                    {/if}

                </Card.Content>
            </Card.Root>


            <Card.Root class="w-full">
                <Card.Header class="">
                    <Card.Title class="text-xl underline">Profile:</Card.Title>
                </Card.Header>
                <Card.Content>
                    {#if user}
                        <p class="text-center">
                            Email: {user.email}
                            {#if user.forename || user.surname}
                                <br />Name: {user.forename ?? ''} {user.surname ?? ''}
                                <br />Role: {user.role ?? ''}
                            {/if}
                        </p>
                    {:else}
                        <h3 class="text-md text-center">Guest</h3>
                    {/if}
                </Card.Content>
            </Card.Root>
            <Card.Root class="">
                <Card.Content class="px-8">
                    <h4 class="text-center mb-2 text-xl font-medium underline">News:</h4>
                    <ul class="font-bold list-disc">
                        <!--{#each newslines as newsline}-->
                        <!--    <li> foo newsline   </li>-->
                        <!--    <li> bar newsline   </li>-->
                        <!--    <li> bazoom newsline</li>-->
                        <!--{/each}-->
                        <li> foo newsline   </li>
                        <li> bar newsline   </li>
                        <li> bazoom newsline</li>
                    </ul>
                </Card.Content>
            </Card.Root>
        </div>
    </div>
{/if}


