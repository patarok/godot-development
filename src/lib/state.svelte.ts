import { browser } from '$app/environment';

export type AppStateValue = 'landing' | 'main' | 'admin';

class AppState {
    // Startwert: server-seitige Wahrheit übernimmt die Führung.
    // Der Wert wird via hydrate() aus data.appState (Cookie) gesetzt,
    // localStorage dient nur noch als Fallback bei hartem Client-Start.
    current = $state<AppStateValue>('landing');
    theme = $state<'light' | 'dark'>('light');

    /**
     * Hydriert den Client-State aus der server-seitigen Wahrheit (Cookie).
     * Muss aufgerufen werden, sobald data.appState im Layout verfügbar ist.
     * Ohne Server-Wert fällt er auf localStorage zurück (hartes Client-Start / SPA-Navigation).
     */
    hydrate(serverState?: AppStateValue | null) {
        if (!browser) return;

        if (serverState && (serverState === 'landing' || serverState === 'main' || serverState === 'admin')) {
            this.current = serverState;
        } else if (browser) {
            const stored = localStorage.getItem('appState') as AppStateValue | null;
            if (stored && (stored === 'landing' || stored === 'main' || stored === 'admin')) {
                this.current = stored;
            }
        }

        const storedTheme = localStorage.getItem('theme') as 'light' | 'dark' | null;
        if (storedTheme === 'light' || storedTheme === 'dark') {
            this.setTheme(storedTheme);
        }
    }

    /** @deprecated Backward-compatible alias; use hydrate() instead. */
    init() {
        this.hydrate();
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
