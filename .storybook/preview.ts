import { withThemeByClassName } from '@storybook/addon-themes'
import type { Preview } from '@storybook/react'
import '../packages/react/src/styles/index.css'
import '../examples/src/examples.css'
import './storybook.css'

const preview: Preview = {
  parameters: {
    controls: { expanded: true, matchers: { color: /(background|color)$/i, date: /Date$/i } },
    layout: 'padded',
    a11y: { test: 'error' },
    options: {
      storySort: {
        order: [
          'Getting Started',
          'Projects',
          'Components',
          ['Buttons', 'Cards', 'Forms', 'Navigation', 'Overlays', 'Charts'],
          'DataTable',
          ['Basic', 'States', 'Sorting', 'Filtering', 'Pagination', 'Selection', 'Columns'],
          'Customization',
          'Design',
          'Examples',
          'Performance',
        ],
      },
    },
  },
  decorators: [
    // Dark mode is driven by a `.dark` class on <html>, exactly as an app would.
    withThemeByClassName({
      themes: { light: '', dark: 'dark' },
      defaultTheme: 'light',
    }),
  ],
}

export default preview
