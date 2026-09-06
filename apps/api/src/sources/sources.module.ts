import { Module } from '@nestjs/common';
import { AdzunaSource } from './adzuna/adzuna.source.js';
import { AtsSource } from './ats/ats.source.js';
import { EuresSource } from './eures/eures.source.js';
import { FranceTravailSource } from './france-travail/france-travail.source.js';
import {
  JOB_SOURCE_CONNECTORS,
  type JobSourceConnector,
} from './source.types.js';

/** One connector per source; the ingestion iterates over the list without knowing them. */
@Module({
  providers: [
    FranceTravailSource,
    AdzunaSource,
    AtsSource,
    EuresSource,
    {
      provide: JOB_SOURCE_CONNECTORS,
      useFactory: (...connectors: JobSourceConnector[]) => connectors,
      inject: [FranceTravailSource, AdzunaSource, AtsSource, EuresSource],
    },
  ],
  exports: [JOB_SOURCE_CONNECTORS],
})
export class SourcesModule {}
