import { Module } from '@nestjs/common';
import { AnalysesService } from './analyses.service';
import { AnalysesController, ActionsController } from './analyses.controller';
import { OrganizationsModule } from '../organizations/organizations.module';
import { RegulatoryChangesModule } from '../regulatory-changes/regulatory-changes.module';
import { RulesModule } from '../rules/rules.module';
import { AiModule } from '../ai/ai.module';

@Module({
  imports: [OrganizationsModule, RegulatoryChangesModule, RulesModule, AiModule],
  controllers: [AnalysesController, ActionsController],
  providers: [AnalysesService],
  exports: [AnalysesService],
})
export class AnalysesModule {}
