import 'reflect-metadata';
import * as dotenv from 'dotenv';
import * as path from 'path';

// Load .env
dotenv.config({ path: path.resolve(__dirname, '../.env') });
