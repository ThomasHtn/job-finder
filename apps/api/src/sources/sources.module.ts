import { Module } from '@nestjs/common';
import { AdzunaSource } from './adzuna/adzuna.source.js';
import { ApecSource } from './apec/apec.source.js';
import { AtsSource } from './ats/ats.source.js';
import { EuresSource } from './eures/eures.source.js';
import { FranceTravailSource } from './france-travail/france-travail.source.js';
import { FreeWorkSource } from './free-work/free-work.source.js';
import type { JobSourceConnector } from './job-source-connector.js';
import { JOB_SOURCE_CONNECTORS } from './job-source-connectors.token.js';

/**
 * One connector per source; the ingestion iterates over the list without knowing them.
 */
@Module({
  providers: [
    FranceTravailSource,
    AdzunaSource,
    AtsSource,
    EuresSource,
    ApecSource,
    FreeWorkSource,
    {
      provide: JOB_SOURCE_CONNECTORS,
      useFactory: (...connectors: JobSourceConnector[]) => connectors,
      inject: [
        FranceTravailSource,
        AdzunaSource,
        AtsSource,
        EuresSource,
        ApecSource,
        FreeWorkSource,
      ],
    },
  ],
  exports: [JOB_SOURCE_CONNECTORS],
})
export class SourcesModule {}
