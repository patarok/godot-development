export enum AppStateType {
    LANDING = 'landing',
    MAIN = 'main',
    ADMIN = 'admin'
}

class AppStateStore {
    current = $state<AppStateType>(AppStateType.LANDING);

    init() {
        if (browser) {
            const stored = localStorage.getItem('appState') as AppStateType;
            if (Object.values(AppStateType).includes(stored)) {
                this.current = stored;
            }
        }
    }

    setState(state: AppStateType) {
        this.current = state;
        if (browser) {
            localStorage.setItem('appState', state);
            document.cookie = `appState=${state}; path=/; max-age=${60 * 60 * 24 * 30}`;
        }
    }
}

export const appState = new AppStateStore();
