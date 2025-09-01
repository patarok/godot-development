import type { Actions } from './$types';
import { createPasswordResetToken } from '$lib/server/userStorage';

export const actions: Actions = {
    default: async ({ request, url }) => {
        const { username } = Object.fromEntries(await request.formData()) as Record<string, string>;
        // Create token but do not leak existence
        const result = await createPasswordResetToken(username);
        if (result) {
            const link = `${url.origin}/(auth)/reset?token=${encodeURIComponent(result.token)}`;
            console.log('Password reset link:', link, 'expiresAt:', result.expiresAt.toISOString());
        }
        return { ok: true, message: 'If the user exists, a reset link has been generated.' };
    }
};
