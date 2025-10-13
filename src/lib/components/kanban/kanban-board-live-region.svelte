<script lang="ts">
    let { announcement, ariaLive = 'assertive', id } = $props<{
        announcement: string;
        ariaLive?: 'polite' | 'assertive' | 'off';
        id: string;
    }>();
</script>

<div
        {id}
        role="status"
        aria-live={ariaLive}
        aria-atomic="true"
        class="sr-only"
>
    {announcement}
</div>

<style>
    .sr-only {
        position: fixed;
        top: 0;
        left: 0;
        width: 1px;
        height: 1px;
        margin: -1px;
        padding: 0;
        overflow: hidden;
        clip: rect(0, 0, 0, 0);
        white-space: nowrap;
        border: 0;
    }
</style>