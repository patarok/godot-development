<script lang="ts">
	import { Dialog as DialogPrimitive } from "bits-ui";

	let { ref = $bindable(null), ...restProps }: DialogPrimitive.TriggerProps = $props();
    console.log("GREETINGS FROM DEBUGGER: ", ref);
</script>

<DialogPrimitive.Trigger bind:ref data-slot="dialog-trigger" {...restProps} />
