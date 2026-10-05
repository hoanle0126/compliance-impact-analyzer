import { Module } from '@nestjs/common';
import { RegulatoryChangesService } from './regulatory-changes.service';
import { RegulatoryChangesController } from './regulatory-changes.controller';

@Module({
  controllers: [RegulatoryChangesController],
  providers: [RegulatoryChangesService],
  exports: [RegulatoryChangesService],
})
export class RegulatoryChangesModule {}
