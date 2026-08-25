import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';

const root = resolve(import.meta.dirname, '..');
const read = (path: string) => readFileSync(resolve(root, path), 'utf8');

describe('industrial MCP core visual system', () => {
  it('uses the approved reactor core for the first onboarding step', () => {
    const onboarding = read('components/onboarding-modal.tsx');

    expect(onboarding).toContain('currentStepIndex === 0');
    expect(onboarding).toContain("require('../assets/images/icon.png')");
    expect(onboarding).toContain('MCP Hub reactor core');
  });

  it('keeps the branded loader restrained and native-driver compatible', () => {
    const loader = read('components/mcp-reactor-loader.tsx');

    expect(loader).toContain('Animated.loop');
    expect(loader).toContain('useNativeDriver: true');
    expect(loader).toContain('Warming the command bunker');
  });

  it('uses the reactor loader during assistant configuration loading', () => {
    const assistant = read('components/ai-chat-modal.tsx');

    expect(assistant).toContain('MCPReactorLoader');
    expect(assistant).toContain('Checking your command bunker');
  });

  it('publishes hosted social-share artwork for Open Graph and Twitter', () => {
    const landing = read('landing/index.html');

    expect(landing).toContain('property="og:image"');
    expect(landing).toContain('name="twitter:image"');
    expect(landing).toContain('summary_large_image');
    expect(landing).toContain('zuCJXXZCeUNzHFOB.png');
  });
});
