import { Module } from '@nestjs/common';
import { PrismaModule } from './prisma/prisma.module';
import { AuthModule } from './modules/auth/auth.module';
import { OrganizationsModule } from './modules/organizations/organizations.module';
import { RegulatoryChangesModule } from './modules/regulatory-changes/regulatory-changes.module';
import { RulesModule } from './modules/rules/rules.module';
import { AnalysesModule } from './modules/analyses/analyses.module';
import { IntegrationsModule } from './modules/integrations/integrations.module';
import { HealthModule } from './modules/health/health.module';
import { AiModule } from './modules/ai/ai.module';
import { JobsModule } from './modules/jobs/jobs.module';

@Module({
  imports: [
    PrismaModule,
    AiModule,
    JobsModule,
    AuthModule,
    OrganizationsModule,
    RegulatoryChangesModule,
    RulesModule,
    AnalysesModule,
    IntegrationsModule,
    HealthModule,
  ],
})
export class AppModule {}
