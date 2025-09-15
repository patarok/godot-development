<script>
    function test() {
        alert('Button works!');
    }
</script>

<h1>Button Test</h1>
<button onclick={test}>CLICK ME</button>
<button onclick={() => alert('Arrow function works!')}>ARROW FUNCTION</button>