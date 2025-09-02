// something like this will be there in PRODUCTION

// import { AppDataSource } from '../src/lib/server/database';
//
// async function generateSchema() {
//     await AppDataSource.initialize();
//     const queryRunner = AppDataSource.createQueryRunner();
//
//     // This will log all the SQL needed to create your schema
//     await AppDataSource.synchronize(true);
//
//     await queryRunner.release();
//     await AppDataSource.destroy();
// }
//
// generateSchema();