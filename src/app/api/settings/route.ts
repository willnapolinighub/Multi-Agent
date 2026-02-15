/**
 * Settings API Endpoint
 * Save/load provider settings on the server
 */

import { NextRequest, NextResponse } from 'next/server';
import { AgentSystemSettings, DEFAULT_SETTINGS, ProviderType } from '@/lib/agents/providers/client-types';

// Lazy load provider factory to avoid issues
let providerFactoryInstance: any = null;

async function getProviderFactory() {
  if (!providerFactoryInstance) {
    const providersModule = await import('@/lib/agents/providers');
    providerFactoryInstance = providersModule.providerFactory;
  }
  return providerFactoryInstance;
}

// In-memory settings store (in production, use a database)
let settingsStore: AgentSystemSettings = { ...DEFAULT_SETTINGS };

// GET /api/settings - Get current settings
export async function GET() {
  return NextResponse.json({
    settings: settingsStore,
  });
}

// POST /api/settings - Update settings
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { settings, action, provider } = body as {
      settings?: Partial<AgentSystemSettings>;
      action?: 'test' | 'init' | 'models';
      provider?: string;
    };

    const factory = await getProviderFactory();

    // Handle actions
    if (action === 'test' && provider) {
      const providerType = provider as ProviderType;
      
      // For OpenAI, we test via the SDK
      if (providerType === 'openai') {
        return NextResponse.json({ success: true });
      }
      
      // Initialize and test the provider
      if (settings?.providers?.[providerType]) {
        await factory.initializeProvider(providerType, settings.providers[providerType]);
      }
      
      const result = await factory.testProvider(providerType);
      return NextResponse.json(result);
    }

    if (action === 'models' && provider) {
      const providerType = provider as ProviderType;
      const models = await factory.listModels(providerType);
      return NextResponse.json({ models });
    }

    if (action === 'init' && provider) {
      const providerType = provider as ProviderType;
      const config = settings?.providers?.[providerType];
      if (config) {
        await factory.initializeProvider(providerType, config);
        return NextResponse.json({ success: true });
      }
    }

    // Update settings
    if (settings) {
      settingsStore = {
        ...settingsStore,
        ...settings,
      };

      // Initialize providers with new settings
      await factory.initializeAll(settingsStore.providers);
      factory.setActiveProvider(settingsStore.activeProvider);

      return NextResponse.json({
        success: true,
        settings: settingsStore,
      });
    }

    return NextResponse.json({ error: 'Invalid request' }, { status: 400 });
  } catch (error) {
    console.error('Settings API error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}
