import {
  Button,
  Card,
  CardContent,
  CardFooter,
  Empty,
  Field,
  Input,
  NumberInput,
  RadioGroup,
  RadioGroupItem,
  Stepper,
  Textarea,
  type StepperStep,
} from '@shining-technologies/ui'
import { useState } from 'react'
import { Demo } from '../Demo'

interface Request {
  supplier: string
  reason: string
  quantity: number | null
  unitPrice: number | null
  delivery: 'standard' | 'express'
}

const EMPTY: Request = { supplier: '', reason: '', quantity: 1, unitPrice: null, delivery: 'standard' }

const STEPS = [
  { id: 'supplier', label: 'Supplier' },
  { id: 'items', label: 'Items' },
  { id: 'review', label: 'Review' },
] as const

type Errors = Partial<Record<keyof Request, string>>

function validateStep(step: number, request: Request): Errors {
  const errors: Errors = {}
  if (step === 0) {
    if (!request.supplier.trim()) errors.supplier = 'Enter the supplier.'
    if (request.reason.trim().length < 10) errors.reason = 'Say why, in at least 10 characters.'
  }
  if (step === 1) {
    if (!request.quantity || request.quantity < 1) errors.quantity = 'Order at least one.'
    if (!request.unitPrice || request.unitPrice <= 0) errors.unitPrice = 'Enter the unit price.'
  }
  return errors
}

const money = new Intl.NumberFormat('en-AU', { style: 'currency', currency: 'AUD' })

function Wizard() {
  const [active, setActive] = useState(0)
  const [request, setRequest] = useState(EMPTY)
  const [errors, setErrors] = useState<Errors>({})
  const [failed, setFailed] = useState<ReadonlySet<number>>(new Set())
  const [submitted, setSubmitted] = useState(false)
  const [submitting, setSubmitting] = useState(false)

  const set = <K extends keyof Request>(key: K, value: Request[K]) => setRequest((current) => ({ ...current, [key]: value }))

  const next = () => {
    const found = validateStep(active, request)
    setErrors(found)
    const bad = Object.keys(found).length > 0
    setFailed((current) => {
      const updated = new Set(current)
      if (bad) updated.add(active)
      else updated.delete(active)
      return updated
    })
    if (!bad) setActive((step) => step + 1)
  }

  const steps: StepperStep[] = STEPS.map((step, index) => ({
    ...step,
    status: failed.has(index) ? 'error' : undefined,
  }))

  if (submitted) {
    return (
      <Card>
        <Empty
          status="success"
          title="Request PR-0412 submitted"
          description="Your manager has been asked to approve it. You will get an email when they do."
          actions={
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                setRequest(EMPTY)
                setActive(0)
                setSubmitted(false)
              }}
            >
              Start another
            </Button>
          }
        />
      </Card>
    )
  }

  const total = (request.quantity ?? 0) * (request.unitPrice ?? 0)

  return (
    <Card>
      <CardContent className="stack">
        <Stepper steps={steps} activeStep={active} onStepClick={(index) => setActive(index)} />

        {active === 0 ? (
          <div className="stack-sm">
            <Field label="Supplier" required error={errors.supplier}>
              <Input value={request.supplier} onChange={(event) => set('supplier', event.target.value)} />
            </Field>
            <Field label="Reason" required error={errors.reason} description="Who needs it and why.">
              <Textarea rows={3} value={request.reason} onChange={(event) => set('reason', event.target.value)} />
            </Field>
          </div>
        ) : null}

        {active === 1 ? (
          <div className="grid-2">
            <Field label="Quantity" required error={errors.quantity}>
              <NumberInput value={request.quantity} min={1} onValueChange={(value) => set('quantity', value)} />
            </Field>
            <Field label="Unit price" required error={errors.unitPrice}>
              <NumberInput value={request.unitPrice} min={0} prefix="$" precision={2} onValueChange={(value) => set('unitPrice', value)} />
            </Field>
            <Field label="Delivery" className="pattern-span">
              <RadioGroup value={request.delivery} onValueChange={(value) => set('delivery', value as Request['delivery'])}>
                <label className="choice">
                  <RadioGroupItem value="standard" /> Standard (5 business days)
                </label>
                <label className="choice">
                  <RadioGroupItem value="express" /> Express (next business day, +$40)
                </label>
              </RadioGroup>
            </Field>
          </div>
        ) : null}

        {active === 2 ? (
          <dl className="pattern-review">
            <dt>Supplier</dt>
            <dd>{request.supplier}</dd>
            <dt>Reason</dt>
            <dd>{request.reason}</dd>
            <dt>Items</dt>
            <dd>
              {request.quantity} × {money.format(request.unitPrice ?? 0)}
            </dd>
            <dt>Delivery</dt>
            <dd>{request.delivery === 'express' ? 'Express' : 'Standard'}</dd>
            <dt>Total</dt>
            <dd>
              <strong>{money.format(total + (request.delivery === 'express' ? 40 : 0))}</strong>
            </dd>
          </dl>
        ) : null}
      </CardContent>
      <CardFooter bordered className="pattern-actions">
        <Button variant="ghost" disabled={active === 0} onClick={() => setActive((step) => step - 1)}>
          Previous
        </Button>
        {active < STEPS.length - 1 ? (
          <Button onClick={next}>Next</Button>
        ) : (
          <Button
            disabled={submitting}
            onClick={async () => {
              setSubmitting(true)
              await new Promise((resolve) => setTimeout(resolve, 700))
              setSubmitting(false)
              setSubmitted(true)
            }}
          >
            {submitting ? 'Submitting…' : 'Submit request'}
          </Button>
        )}
      </CardFooter>
    </Card>
  )
}

export function MultiStepPattern() {
  return (
    <div className="stack">
      <Demo
        title="Purchase request"
        note="Each step is checked before the next; a step that failed is marked on the stepper, and completed steps can be revisited from it. The last step reviews everything, then the request is submitted and the view becomes a success state."
        inline={false}
        code={`
<Stepper steps={steps} activeStep={active} onStepClick={setActive} />
{active === 0 && <SupplierStep errors={errors} />}
{active === 1 && <ItemsStep errors={errors} />}
{active === 2 && <Review request={request} />}
<CardFooter>
  <Button variant="ghost" disabled={active === 0} onClick={back}>Previous</Button>
  {last ? <Button onClick={submit}>Submit request</Button> : <Button onClick={next}>Next</Button>}
</CardFooter>

// once submitted
<Empty status="success" title="Request submitted" />`}
      >
        <Wizard />
      </Demo>
    </div>
  )
}
