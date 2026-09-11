import { fileURLToPath } from 'node:url'
import type { StorybookConfig } from '@storybook/react-vite'

const r = (p: string) => fileURLToPath(new URL(p, import.meta.url))

const config: StorybookConfig = {
  stories: ['../packages/react/src/**/*.stories.@(ts|tsx)', '../stories/**/*.stories.@(ts|tsx)'],
  addons: ['@storybook/addon-essentials', '@storybook/addon-a11y', '@storybook/addon-themes'],
  framework: { name: '@storybook/react-vite', options: {} },
  core: { disableTelemetry: true },
  typescript: { reactDocgen: 'react-docgen-typescript' },
  viteFinal(config) {
    config.resolve ??= {}
    // Stories run against the sources, so a change shows up without a build.
    config.resolve.alias = {
      ...config.resolve.alias,
      '@shining-technologies/ui-kit-core': r('../packages/core/src/index.ts'),
      '@shining-technologies/ui-kit-react/virtualized': r('../packages/react/src/virtualized.tsx'),
      '@shining-technologies/ui-kit-react/recharts': r('../packages/react/src/recharts.ts'),
      '@shining-technologies/ui-kit-react': r('../packages/react/src/index.ts'),
      '@shining-technologies/ui-kit-themes': r('../packages/themes/src/index.ts'),
      '@shining-technologies/ui-kit-export-csv': r('../packages/export-csv/src/index.ts'),
      '@shining-technologies/ui-kit-examples': r('../examples/src/index.ts'),
    }
    return config
  },
}

export default config
