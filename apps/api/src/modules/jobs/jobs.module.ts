import { Module } from '@nestjs/common';
import { BullModule } from '@nestjs/bullmq';

@Module({
  imports: [
    BullModule.forRoot({
      connection: {
        host: process.env.REDIS_HOST || 'localhost',
        port: Number(process.env.REDIS_PORT) || 6383,
        password: process.env.REDIS_PASSWORD || undefined,
      },
    }),
    BullModule.registerQueue({
      name: 'compliance-analysis-queue',
    }),
  ],
  exports: [BullModule],
})
export class JobsModule {}
