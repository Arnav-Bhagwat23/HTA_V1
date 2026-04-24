import type { RoutedSourcePlan } from '../routing/source-router';

import type { SourceAdapter } from './base.adapter';
import { PbacAdapter } from './pbac.adapter';

export const adapters: SourceAdapter[] = [
  new PbacAdapter(),
];

export const getAdapterBySourceKey = (
  sourceKey: RoutedSourcePlan['sourceKey'],
): SourceAdapter | null =>
  adapters.find((adapter) => adapter.source === sourceKey) ?? null;
