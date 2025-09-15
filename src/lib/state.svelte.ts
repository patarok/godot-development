class AppState {
    current = $state('landing');

    setLanding() {
        this.current = 'landing';
        debugger;
    }

    setMain() {
        this.current = 'main';
        debugger;
    }

    setAdmin() {
        this.current = 'admin';
        debugger;
    }
}

export const appState = new AppState();