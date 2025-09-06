<script lang="ts">
    import { menubarStyles } from './menubar.styles';
    import { Menubar as BitsMenubar } from 'bits-ui';

    // Alias the incoming `class` prop to `className` and gather other props in `rest`
    const { class: className = '', ...rest } = $props<{ class?: string }>();
</script>

<BitsMenubar.Root {...rest} class={`${menubarStyles} ${className}`.trim()}>
    <slot />
</BitsMenubar.Root>