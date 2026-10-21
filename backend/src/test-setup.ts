import { Logger } from '@nestjs/common';

/*
 * Silences Nest's logger in the specs: a warning a test provokes on purpose is noise in the report.
 */
Logger.overrideLogger(false);
