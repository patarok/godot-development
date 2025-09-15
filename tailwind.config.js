/** @type {import('tailwindcss').Config} */
module.exports = {
    corePlugins: {
        preflight: true   // eigentlich Standard (aktiviert)
    },
    darkMode: ['class'],
    content: [
        './src/**/*.{html,js,svelte,ts}'
    ],
    theme: {
        extend: {
            fontFamily: {
                lexendDeca: ['Lexend Deca', 'sans-serif'],
                lexendMega: ['Lexend Mega', 'sans-serif'],
                lexendZetta: ['Lexend Zetta', 'sans-serif'],
            },
        },
    },
    plugins: []
}