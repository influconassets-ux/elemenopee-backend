declare module 'rate-limit-mongo' {
    import { Store } from 'express-rate-limit';

    interface Options {
        uri: string;
        collectionName?: string;
        expireTimeMs?: number;
        resetExpireDateOnChange?: boolean;
        errorHandler?: (err: any) => void;
    }

    export default class MongoStore implements Store {
        constructor(options: Options);
        incr(key: string, callback: (err: any, hits: number, resetTime?: Date) => void): void;
        decrement(key: string): void;
        resetKey(key: string): void;
    }
}
