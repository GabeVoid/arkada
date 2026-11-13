import { useContext } from 'react';
import { ArkadaContext, ArkadaStoreValue } from '../context/ArkadaContext';

export function useArkadaStore(): ArkadaStoreValue {
  const context = useContext(ArkadaContext);
  if (!context) {
    throw new Error('useArkadaStore deve ser utilizado dentro de um ArkadaProvider.');
  }
  return context;
}

