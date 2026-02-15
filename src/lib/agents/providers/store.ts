/**
 * Settings Store - Client-Side Only
 * Zustand store for managing AI provider settings
 */

import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import {
  AgentSystemSettings,
  ProviderConfig,
  ProviderType,
  DEFAULT_SETTINGS,
} from './client-types';

interface SettingsState extends AgentSystemSettings {
  // Actions
  setActiveProvider: (provider: ProviderType) => void;
  updateProviderConfig: (type: ProviderType, config: Partial<ProviderConfig>) => void;
  setModel: (modelType: 'masterOrchestrator' | 'subOrchestrator' | 'tool', model: string) => void;
  setMaxIterations: (iterations: number) => void;
  setDefaultTemperature: (temp: number) => void;
  setTimeout: (timeout: number) => void;
  setDebugMode: (enabled: boolean) => void;
  setLogApiCalls: (enabled: boolean) => void;
  resetToDefaults: () => void;
  importSettings: (settings: Partial<AgentSystemSettings>) => void;
  exportSettings: () => AgentSystemSettings;
}

export const useSettingsStore = create<SettingsState>()(
  persist(
    (set, get) => ({
      // Initial state
      ...DEFAULT_SETTINGS,

      // Actions
      setActiveProvider: (provider) => {
        set({ activeProvider: provider });
      },

      updateProviderConfig: (type, config) => {
        set((state) => ({
          providers: {
            ...state.providers,
            [type]: {
              ...state.providers[type],
              ...config,
            },
          },
        }));
      },

      setModel: (modelType, model) => {
        switch (modelType) {
          case 'masterOrchestrator':
            set({ masterOrchestratorModel: model });
            break;
          case 'subOrchestrator':
            set({ subOrchestratorModel: model });
            break;
          case 'tool':
            set({ toolModel: model });
            break;
        }
      },

      setMaxIterations: (iterations) => {
        set({ maxIterations: iterations });
      },

      setDefaultTemperature: (temp) => {
        set({ defaultTemperature: temp });
      },

      setTimeout: (timeout) => {
        set({ timeout: timeout });
      },

      setDebugMode: (enabled) => {
        set({ debugMode: enabled });
      },

      setLogApiCalls: (enabled) => {
        set({ logApiCalls: enabled });
      },

      resetToDefaults: () => {
        set(DEFAULT_SETTINGS);
      },

      importSettings: (settings) => {
        set((state) => ({
          ...state,
          ...settings,
        }));
      },

      exportSettings: () => {
        const state = get();
        return {
          activeProvider: state.activeProvider,
          providers: state.providers,
          masterOrchestratorModel: state.masterOrchestratorModel,
          subOrchestratorModel: state.subOrchestratorModel,
          toolModel: state.toolModel,
          maxIterations: state.maxIterations,
          defaultTemperature: state.defaultTemperature,
          timeout: state.timeout,
          debugMode: state.debugMode,
          logApiCalls: state.logApiCalls,
        };
      },
    }),
    {
      name: 'agent-system-settings',
      version: 1,
    }
  )
);

// Helper hooks
export const useActiveProvider = () => useSettingsStore((state) => state.activeProvider);
export const useProviderConfig = (type: ProviderType) => 
  useSettingsStore((state) => state.providers[type]);
export const useModelSettings = () => 
  useSettingsStore((state) => ({
    masterOrchestrator: state.masterOrchestratorModel,
    subOrchestrator: state.subOrchestratorModel,
    tool: state.toolModel,
  }));
