import {
  Alert,
  AlertDescription,
  AlertTitle,
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  CheckCircleIcon,
  DateField,
  Field,
  FloatingFormActions,
  Input,
  NumberInput,
  PageHeader,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
  Textarea,
} from '@shining-technologies/ui'
import { useRef, useState } from 'react'
import { Demo } from '../Demo'

interface Values {
  title: string
  customer: string
  amount: number | null
  due: string
  notes: string
}

const SAVED: Values = { title: 'Annual maintenance', customer: 'globex', amount: 34000, due: '2026-10-31', notes: '' }

function validate(values: Values): Partial<Record<keyof Values, string>> {
  const errors: Partial<Record<keyof Values, string>> = {}
  if (!values.title.trim()) errors.title = 'Enter a title.'
  if (!values.customer) errors.customer = 'Choose a customer.'
  if (values.amount === null || values.amount <= 0) errors.amount = 'Enter an amount above zero.'
  if (!values.due) errors.due = 'Choose a due date.'
  return errors
}

const LABELS: Record<keyof Values, string> = {
  title: 'Title',
  customer: 'Customer',
  amount: 'Amount',
  due: 'Due date',
  notes: 'Notes',
}

function FormPage() {
  const [saved, setSaved] = useState(SAVED)
  const [values, setValues] = useState(SAVED)
  const [errors, setErrors] = useState<Partial<Record<keyof Values, string>>>({})
  const [submitting, setSubmitting] = useState(false)
  const [savedAt, setSavedAt] = useState<string | null>(null)
  const summary = useRef<HTMLDivElement>(null)

  const dirty = JSON.stringify(values) !== JSON.stringify(saved)
  const set = <K extends keyof Values>(key: K, value: Values[K]) => {
    setValues((current) => ({ ...current, [key]: value }))
    if (errors[key]) setErrors((current) => ({ ...current, [key]: undefined }))
  }

  const submit = async () => {
    const found = validate(values)
    setErrors(found)
    if (Object.values(found).some(Boolean)) {
      // The summary takes focus, so a screen reader hears what to fix.
      requestAnimationFrame(() => summary.current?.focus())
      return
    }
    setSubmitting(true)
    await new Promise((resolve) => setTimeout(resolve, 800))
    setSubmitting(false)
    setSaved(values)
    setSavedAt('just now')
  }

  const problems = Object.entries(errors).filter(([, message]) => message) as [keyof Values, string][]

  return (
    <form
      className="pattern-frame stack"
      noValidate
      onSubmit={(event) => {
        event.preventDefault()
        void submit()
      }}
    >
      <PageHeader
        as="h2"
        title="Edit quote Q-0088"
        description={savedAt ? `All changes saved ${savedAt}.` : 'Changes are saved when you press Save.'}
      />

      {problems.length ? (
        <Alert tone="destructive" ref={summary} tabIndex={-1}>
          <AlertTitle>
            {problems.length} {problems.length === 1 ? 'field needs' : 'fields need'} attention
          </AlertTitle>
          <AlertDescription>
            <ul className="pattern-errors">
              {problems.map(([key, message]) => (
                <li key={key}>
                  <a href={`#quote-${key}`}>
                    {LABELS[key]}: {message}
                  </a>
                </li>
              ))}
            </ul>
          </AlertDescription>
        </Alert>
      ) : savedAt && !dirty ? (
        <Alert tone="success" icon={<CheckCircleIcon />}>
          <AlertTitle>Quote saved</AlertTitle>
        </Alert>
      ) : null}

      <Card>
        <CardHeader bordered>
          <CardTitle as="h3">Details</CardTitle>
          <CardDescription>What the quote is for and who receives it.</CardDescription>
        </CardHeader>
        <CardContent className="grid-2">
          <Field label="Title" required error={errors.title} htmlFor="quote-title">
            <Input value={values.title} onChange={(event) => set('title', event.target.value)} />
          </Field>
          <Field label="Customer" required error={errors.customer} htmlFor="quote-customer">
            <Select value={values.customer} onValueChange={(value) => set('customer', value)}>
              <SelectTrigger>
                <SelectValue placeholder="Choose a customer" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="globex">Globex</SelectItem>
                <SelectItem value="initech">Initech</SelectItem>
                <SelectItem value="northwind">Northwind Traders</SelectItem>
              </SelectContent>
            </Select>
          </Field>
        </CardContent>
      </Card>

      <Card>
        <CardHeader bordered>
          <CardTitle as="h3">Terms</CardTitle>
          <CardDescription>Amounts are in AUD and exclude GST.</CardDescription>
        </CardHeader>
        <CardContent className="grid-2">
          <Field label="Amount" required error={errors.amount} htmlFor="quote-amount">
            <NumberInput value={values.amount} onValueChange={(value) => set('amount', value)} min={0} step={100} />
          </Field>
          <Field label="Due date" required error={errors.due} htmlFor="quote-due">
            <DateField value={values.due || undefined} onChange={(value) => set('due', value ?? '')} />
          </Field>
          <Field label="Notes" description="Printed on the quote." htmlFor="quote-notes" className="pattern-span">
            <Textarea rows={3} value={values.notes} onChange={(event) => set('notes', event.target.value)} />
          </Field>
        </CardContent>
      </Card>

      <FloatingFormActions
        visible={dirty || submitting}
        message={submitting ? 'Saving…' : 'You have unsaved changes'}
        submitLabel="Save"
        cancelLabel="Discard"
        submitting={submitting}
        onSubmit={() => void submit()}
        onCancel={() => {
          setValues(saved)
          setErrors({})
        }}
        position="sticky"
      />
    </form>
  )
}

export function FormPagePattern() {
  return (
    <div className="stack">
      <Demo
        title="Edit a record"
        note="Sections as cards, required fields marked, errors shown only after a submit and summarised at the top (the summary takes focus and links to each field). The save bar appears once something changed, shows the save in progress and disappears when the form matches what is stored."
        inline={false}
        code={`
<form noValidate onSubmit={submit}>
  <PageHeader title="Edit quote" description={savedAt ? 'All changes saved' : undefined} />
  {errors.length > 0 && (
    <Alert tone="destructive" ref={summaryRef} tabIndex={-1}>
      <AlertTitle>2 fields need attention</AlertTitle>
      …
    </Alert>
  )}
  <Card>
    <CardHeader bordered><CardTitle as="h3">Details</CardTitle></CardHeader>
    <CardContent>
      <Field label="Title" required error={errors.title}><Input … /></Field>
    </CardContent>
  </Card>
  <FloatingFormActions visible={dirty} submitting={saving} onSubmit={submit} onCancel={reset} />
</form>`}
      >
        <FormPage />
      </Demo>
    </div>
  )
}
