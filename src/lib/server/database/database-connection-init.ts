import { AppDataSource } from './config/datasource';

let isInitialized = false;

export async function initializeDatabase() {
    if (!isInitialized) {
        await AppDataSource.initialize();
        isInitialized = true;
        console.log('Database connection initialized');
    }
    return AppDataSource;
}

export { AppDataSource };
//export * from './repositories';
//export * from './services';