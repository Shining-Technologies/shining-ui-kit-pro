// Server Component. No 'use client' anywhere in this file's app-level import chain.
import {
  Alert,
  AlertDescription,
  AlertTitle,
  Badge,
  Button,
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
  CheckCircleIcon,
  InfoIcon,
  SearchIcon,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
  Tooltip,
  createColumnHelper,
  getPageNumbers,
  getPageRange,
} from '@shining-technologies/ui'
import { createThemeCss } from '@shining-technologies/ui/theme'
import type { User } from '@/lib/users'

export default function HomePage() {
  const helper = createColumnHelper<User>()
  const helperColumns = [
    helper.accessor('name', { header: 'Name', filter: { type: 'text' } }),
    helper.accessor('score', { header: 'Score', sortingFn: 'number' }),
    helper.computed('initial', (row) => row.name.charAt(0), { header: 'Initial' }),
  ]
  const pageNumbers = getPageNumbers(4, 20)
  const range = getPageRange(2, 25, 480)
  const tenantCss = createThemeCss(
    { primary: '#be123c' },
    { selector: '[data-tenant]', darkSelector: '.dark [data-tenant]' },
  )

  return (
    <main className="p-6 space-y-6">
      <h1 className="text-2xl font-semibold">Server Components</h1>

      <section className="flex flex-wrap items-center gap-3">
        <Button data-testid="home-primary-button">Primary</Button>
        <Button variant="outline">Outline</Button>
        <Button variant="destructive">Delete</Button>
        <Badge tone="success">Live</Badge>
        <Badge tone="warning" variant="solid">
          Pending
        </Badge>
        <SearchIcon aria-label="search icon" />
        <InfoIcon aria-hidden="true" />
        <CheckCircleIcon aria-hidden="true" />
      </section>

      <Card>
        <CardHeader>
          <CardTitle>Server helpers</CardTitle>
          <CardDescription>Results computed on the server</CardDescription>
        </CardHeader>
        <CardContent>
          <dl>
            <dt>createColumnHelper ids</dt>
            <dd data-testid="helper-columns">
              {helperColumns.map((c) => ('accessorKey' in c && c.accessorKey) || c.id).join(',')}
            </dd>
            <dt>getPageNumbers(4, 20)</dt>
            <dd data-testid="page-numbers">{JSON.stringify(pageNumbers)}</dd>
            <dt>getPageRange(2, 25, 480)</dt>
            <dd data-testid="page-range">{`${range.from}-${range.to} of ${range.total}`}</dd>
            <dt>createThemeCss length</dt>
            <dd data-testid="theme-css-length">{tenantCss.length}</dd>
          </dl>
        </CardContent>
        <CardFooter>
          <Badge>footer</Badge>
        </CardFooter>
      </Card>

      <Alert tone="info">
        <AlertTitle>Heads up</AlertTitle>
        <AlertDescription>This alert is rendered by a Server Component.</AlertDescription>
      </Alert>

      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Name</TableHead>
            <TableHead>Role</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          <TableRow>
            <TableCell>Ann</TableCell>
            <TableCell>Admin</TableCell>
          </TableRow>
          <TableRow>
            <TableCell>Zoë</TableCell>
            <TableCell>Viewer</TableCell>
          </TableRow>
        </TableBody>
      </Table>

      <style dangerouslySetInnerHTML={{ __html: tenantCss }} />
      <section data-tenant className="sui-theme p-4" data-testid="tenant">
        <h2>Tenant section</h2>
        <Button data-testid="tenant-button">Tenant primary</Button>
      </section>

      <Tabs defaultValue="one">
        <TabsList>
          <TabsTrigger value="one">One</TabsTrigger>
          <TabsTrigger value="two">Two</TabsTrigger>
        </TabsList>
        <TabsContent value="one">First panel</TabsContent>
        <TabsContent value="two">Second panel</TabsContent>
      </Tabs>

      <Tooltip content="Tooltip from a Server Component">
        <Button variant="outline">Hover me</Button>
      </Tooltip>
    </main>
  )
}
