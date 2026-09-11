import {
  Alert,
  AlertDescription,
  Button,
  ProjectEditor,
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
  TokenSwatchGrid,
  useUIKit,
} from '@shining-technologies/ui-kit-react'

export interface ProjectPanelProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

/**
 * Edit the active project, or inspect the tokens it generated.
 *
 * A sheet rather than a page, so the components behind it stay on screen and
 * repaint as the colours change — seeing the change land on real components is
 * the entire feedback loop this panel exists to provide.
 */
export function ProjectPanel({ open, onOpenChange }: ProjectPanelProps) {
  const { project, deleteProject, forkProject } = useUIKit()

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="right" className="gallery__panel">
        <SheetHeader>
          <SheetTitle>{project.name}</SheetTitle>
          <SheetDescription>
            {project.builtIn
              ? 'A shipped preset. Editing it saves a copy so the preset stays available.'
              : 'Your project. Changes apply immediately and are saved in this browser.'}
          </SheetDescription>
        </SheetHeader>

        <Tabs defaultValue="design" appearance="underline">
          <TabsList>
            <TabsTrigger value="design">Design</TabsTrigger>
            <TabsTrigger value="tokens">Tokens</TabsTrigger>
          </TabsList>

          <TabsContent value="design">
            <ProjectEditor
              key={project.id}
              project={project}
              submitLabel={project.builtIn ? 'Save as new project' : 'Save changes'}
            />

            {!project.builtIn && (
              <div className="gallery__panel-danger">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => forkProject?.(project.id, `${project.name} copy`)}
                >
                  Duplicate
                </Button>
                <Button
                  variant="destructive"
                  size="sm"
                  onClick={() => {
                    deleteProject?.(project.id)
                    onOpenChange(false)
                  }}
                >
                  Delete project
                </Button>
              </div>
            )}
          </TabsContent>

          <TabsContent value="tokens">
            <Alert tone="info">
              <AlertDescription>
                Generated from {Object.keys(project.seed).length} seed colours. Every value below is
                derived, contrast-checked, and available as a <code>--sui-*</code> custom property.
              </AlertDescription>
            </Alert>
            <TokenSwatchGrid />
          </TabsContent>
        </Tabs>
      </SheetContent>
    </Sheet>
  )
}
