import type { Broker, Insurer } from '@seguros/schemas';

import { useRegistryList } from './useRegistries';

export function useInsurerOptions() {
  return useRegistryList<Insurer>('insurers');
}

export function useBrokerOptions() {
  return useRegistryList<Broker>('brokers');
}
