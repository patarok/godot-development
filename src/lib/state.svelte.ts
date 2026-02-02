import { browser } from '$app/environment';

class AppState {
    current = $state('landing'); // Always start with landing
    theme = $state<'light' | 'dark'>('light');

    // Initialize from localStorage after hydration
    init() {
        if (browser) {
            const stored = localStorage.getItem('appState');
            if (stored) {
                this.current = stored;
            }
            const storedTheme = localStorage.getItem('theme') as 'light' | 'dark';
            if (storedTheme) {
                this.setTheme(storedTheme);
            }
        }
    }

    setTheme(newTheme: 'light' | 'dark') {
        this.theme = newTheme;
        if (browser) {
            localStorage.setItem('theme', newTheme);
            if (newTheme === 'dark') {
                document.documentElement.classList.add('dark');
            } else {
                document.documentElement.classList.remove('dark');
            }
        }
    }

    toggleTheme() {
        this.setTheme(this.theme === 'light' ? 'dark' : 'light');
    }

    setLanding() {
        this.current = 'landing';
        this.persist();
    }

    setMain() {
        this.current = 'main';
        this.persist();
    }

    setAdmin() {
        this.current = 'admin';
        this.persist();
    }

    private persist() {
        if (browser) {
            localStorage.setItem('appState', this.current);
            document.cookie = `appState=${this.current}; path=/; max-age=${60 * 60 * 24 * 30}`;
        }
    }
}

export const appState = new AppState();