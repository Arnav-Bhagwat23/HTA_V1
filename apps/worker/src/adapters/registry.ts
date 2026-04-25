import type { RoutedSourcePlan } from '../routing/source-router';

import { NiceAdapter } from './nice.adapter';
import type { SourceAdapter } from './base.adapter';
import { GbaAdapter } from './gba.adapter';
import { HasAdapter } from './has.adapter';
import { PbacAdapter } from './pbac.adapter';

export const adapters: SourceAdapter[] = [
  new GbaAdapter(),
  new HasAdapter(),
  new NiceAdapter(),
  new PbacAdapter(),
];

export const getAdapterBySourceKey = (
  sourceKey: RoutedSourcePlan['sourceKey'],
): SourceAdapter | null =>
  adapters.find((adapter) => adapter.source === sourceKey) ?? null;
