declare global {
    // the docs say this is where we want to make types available
    // the interfaces mean what interfaces mostly mean:
    // we are contracting the types to fullfill their definition
    // f.i. PageData: if:
    // declare global {
    //     namespace App {
    //         interface PageData {
    //             categories: string[];
    //         }
    //     }
    // }
    // now: any load function in our application must return an object,
    // that contains a categories property of type string[]
    // this means we only should contract types here that should be available EVERYWHERE
    // otherwise they will have to make a contract to the pages specific 'load' function
    namespace App {
        // common shape of expected or unexpected errors
        // interface Error {}
        // immich music player defines it as follows:
        // interface Error {
        //     message: string;
        //     stack?: string;
        //     code?: string | number;
        // }

        // defines 'event.locals'
        // interface Locals {}
        // SvelteKit Starter defines it as follows
        // interface Locals {
        //     user: {
        //         id: number,
        //         name: string,
        //     };
        // }

        // shape of "'page.data' state" and "'$page.data' store"
        // interface PageData {}

        // special contracts distinct to 'Edge Platforms' (PaaS) like:
        // Vercel, Netlify, 'Cloudflare Workers'
        // interface Platform {}
    }

    // This is where you can put your global types.
    // f.i.:
    // export type Todo = { /* whatever members */ };
}

export {};
