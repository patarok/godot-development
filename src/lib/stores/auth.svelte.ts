import { browser } from '$app/environment';

class AuthStore {
    user = $state(null);
    isAdmin = $derived(this.user?.isAdmin ?? false);
    permissions = $derived(this.user?.permissions ?? []);
    isAuthenticated = $derived(!!this.user);

    setUser(userData) {
        this.user = userData;
    }

    clearUser() {
        this.user = null;
    }

    hasPermission(permission: string) {
        return this.permissions.includes(permission);
    }
}

export const auth = new AuthStore();
