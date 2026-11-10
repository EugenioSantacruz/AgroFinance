import React, { createContext, useContext, useEffect, useState } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { APP_CONFIG } from '../constants/config';
import { AmbitoFiltro, CurrencyCode } from '../types/domain';

interface PrivacyContextValue {
  isPrivate: boolean;
  togglePrivacy: () => void;
  displayCurrency: CurrencyCode;
  toggleDisplayCurrency: () => void;
  activeCampanaId: string;
  setActiveCampanaId: (id: string) => void;
  activeAmbito: AmbitoFiltro;
  setActiveAmbito: (ambito: AmbitoFiltro) => void;
}

const PrivacyContext = createContext<PrivacyContextValue>({
  isPrivate: false,
  togglePrivacy: () => {},
  displayCurrency: 'PYG',
  toggleDisplayCurrency: () => {},
  activeCampanaId: 'ALL',
  setActiveCampanaId: () => {},
  activeAmbito: 'TODOS',
  setActiveAmbito: () => {},
});

export const PrivacyProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const [isPrivate, setIsPrivate] = useState(false);
  const [displayCurrency, setDisplayCurrency] = useState<CurrencyCode>('PYG');
  const [activeCampanaId, setActiveCampanaState] = useState<string>('ALL');
  const [activeAmbito, setActiveAmbitoState] = useState<AmbitoFiltro>('TODOS');

  useEffect(() => {
    AsyncStorage.getItem(APP_CONFIG.STORAGE_KEYS.PRIVACY_MASK).then((val) => {
      if (val === 'true') setIsPrivate(true);
    });
    AsyncStorage.getItem(APP_CONFIG.STORAGE_KEYS.DISPLAY_CURRENCY).then(
      (cur) => {
        if (cur === 'PYG' || cur === 'USD') setDisplayCurrency(cur);
      }
    );
    AsyncStorage.getItem(APP_CONFIG.STORAGE_KEYS.ACTIVE_CAMPANA).then(
      (camp) => {
        if (camp) setActiveCampanaState(camp);
      }
    );
    AsyncStorage.getItem(APP_CONFIG.STORAGE_KEYS.ACTIVE_AMBITO).then((amb) => {
      if (amb === 'TODOS' || amb === 'NEGOCIO' || amb === 'PERSONAL') {
        setActiveAmbitoState(amb);
      }
    });
  }, []);

  const togglePrivacy = () => {
    setIsPrivate((prev) => {
      const next = !prev;
      AsyncStorage.setItem(APP_CONFIG.STORAGE_KEYS.PRIVACY_MASK, String(next));
      return next;
    });
  };

  const toggleDisplayCurrency = () => {
    setDisplayCurrency((prev) => {
      const next: CurrencyCode = prev === 'USD' ? 'PYG' : 'USD';
      AsyncStorage.setItem(APP_CONFIG.STORAGE_KEYS.DISPLAY_CURRENCY, next);
      return next;
    });
  };

  const setActiveCampanaId = (id: string) => {
    setActiveCampanaState(id);
    AsyncStorage.setItem(APP_CONFIG.STORAGE_KEYS.ACTIVE_CAMPANA, id);
  };

  const setActiveAmbito = (ambito: AmbitoFiltro) => {
    setActiveAmbitoState(ambito);
    AsyncStorage.setItem(APP_CONFIG.STORAGE_KEYS.ACTIVE_AMBITO, ambito);
  };

  return (
    <PrivacyContext.Provider
      value={{
        isPrivate,
        togglePrivacy,
        displayCurrency,
        toggleDisplayCurrency,
        activeCampanaId,
        setActiveCampanaId,
        activeAmbito,
        setActiveAmbito,
      }}
    >
      {children}
    </PrivacyContext.Provider>
  );
};

export const usePrivacy = () => useContext(PrivacyContext);
