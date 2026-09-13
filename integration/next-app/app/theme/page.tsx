import { Button } from '@shining-technologies/ui'

export default function ThemePage() {
  return (
    <main className="p-6 space-y-6">
      <h1 className="text-2xl font-semibold">Theme</h1>

      <section className="flex gap-4 items-center">
        <Button data-testid="default-button">Default</Button>
        <Button data-testid="override-button" className="bg-red-600 rounded-none">
          Overridden
        </Button>
        <div data-testid="red-reference" className="bg-red-600 w-8 h-8" />
      </section>

      <div data-testid="tw-primary" className="bg-primary text-primary-foreground rounded-lg p-4">
        Tailwind bg-primary
      </div>

      <section data-theme="slate" data-testid="theme-slate" className="p-4">
        <h2>Slate</h2>
        <Button>Slate button</Button>
      </section>

      <section data-theme="ember" data-testid="theme-ember" className="p-4">
        <h2>Ember</h2>
        <Button>Ember button</Button>
      </section>
    </main>
  )
}
