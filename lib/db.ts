import { drizzle } from 'drizzle-orm/d1';
import { env } from './cf';

export const db = () => drizzle(env().DB);
