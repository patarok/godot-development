import { browser } from '$app/environment';

class AppState {
    current = $state('landing'); // Always start with landing

    // Initialize from localStorage after hydration
    init() {
        if (browser) {
            const stored = localStorage.getItem('appState');
            if (stored) {
                this.current = stored;
            }
        }
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