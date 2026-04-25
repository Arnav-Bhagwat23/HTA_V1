import type { RoutedSourcePlan } from '../routing/source-router';

import { AifaAdapter } from './aifa.adapter';
import { AempsAdapter } from './aemps.adapter';
import { NiceAdapter } from './nice.adapter';
import type { SourceAdapter } from './base.adapter';
import { GbaAdapter } from './gba.adapter';
import { HasAdapter } from './has.adapter';
import { PbacAdapter } from './pbac.adapter';

export const adapters: SourceAdapter[] = [
  new AifaAdapter(),
  new AempsAdapter(),
  new GbaAdapter(),
  new HasAdapter(),
  new NiceAdapter(),
  new PbacAdapter(),
];

export const getAdapterBySourceKey = (
  sourceKey: RoutedSourcePlan['sourceKey'],
): SourceAdapter | null =>
  adapters.find((adapter) => adapter.source === sourceKey) ?? null;
