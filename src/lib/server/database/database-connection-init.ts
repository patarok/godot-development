import { AppDataSource } from './config/datasource';


// race conditions finally eliminated for sure
let initPromise: Promise<typeof AppDataSource> | null = null;

export async function initializeDatabase() {
    if (AppDataSource.isInitialized) return AppDataSource;

    return initPromise ??= (async () => {
        await AppDataSource.initialize();
        console.log('Database connection initialized');
        return AppDataSource;
    })();
}

export { AppDataSource };