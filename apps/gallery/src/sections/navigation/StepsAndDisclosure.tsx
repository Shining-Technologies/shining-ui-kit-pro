import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
  Button,
  Card,
  CardContent,
  ChevronDownIcon,
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
  Stepper,
  type StepperStep,
} from '@shining-technologies/ui'
import { useState } from 'react'
import { Demo } from '../Demo'

const BOOKING_STEPS: StepperStep[] = [
  { id: 'service', label: 'Service', description: 'What needs doing' },
  { id: 'address', label: 'Address', description: 'Where the crew goes' },
  { id: 'schedule', label: 'Schedule', description: 'Pick a time' },
  { id: 'extras', label: 'Extras', optional: true },
  { id: 'confirm', label: 'Confirm' },
]

const STEP_BODY: Record<string, string> = {
  service: 'Deep clean · 3 bedrooms, 2 bathrooms.',
  address: '12 High Street, Fitzroy VIC 3065.',
  schedule: 'Thursday 14 March, 9:00 – 13:00.',
  extras: 'Oven interior, inside windows.',
  confirm: 'Review the booking, then pay the deposit.',
}

const ONBOARDING: StepperStep[] = [
  { id: 'account', label: 'Create account', description: 'Signed up with Google' },
  { id: 'company', label: 'Company details', description: 'ABN and trading name' },
  {
    id: 'payments',
    label: 'Connect payments',
    description: 'Stripe rejected the bank account. Check the BSB.',
    status: 'error',
  },
  { id: 'team', label: 'Invite your team', description: 'Optional, can be done later' },
  { id: 'launch', label: 'Go live' },
]

export function StepsAndDisclosure() {
  const [step, setStep] = useState(1)
  const [freeStep, setFreeStep] = useState(0)
  const [advancedOpen, setAdvancedOpen] = useState(false)
  const current = BOOKING_STEPS[step]!
  const last = step === BOOKING_STEPS.length - 1

  return (
    <div className="stack">
      <Demo
        title="Stepper"
        note="Shows progress through a task done in order. Completed steps can be clicked to go back. Later steps cannot be clicked until they are reached. Each label sits under its step; on a narrow screen the text gets smaller and descriptions are hidden, so every label still fits."
        inline={false}
      >
        <div className="stack">
          <Stepper
            aria-label="Booking progress"
            steps={BOOKING_STEPS}
            activeStep={step}
            onStepClick={(index) => setStep(index)}
          />
          <Card variant="flat">
            <CardContent>
              <div className="nav-demo__step">
                <div>
                  <p className="nav-demo__step-title">
                    Step {step + 1} of {BOOKING_STEPS.length}: {current.label}
                  </p>
                  <p className="muted">{STEP_BODY[current.id]}</p>
                </div>
                <div className="nav-demo__step-actions">
                  <Button
                    variant="outline"
                    size="sm"
                    disabled={step === 0}
                    onClick={() => setStep((s) => s - 1)}
                  >
                    Back
                  </Button>
                  <Button size="sm" onClick={() => setStep((s) => (last ? 0 : s + 1))}>
                    {last ? 'Start over' : 'Continue'}
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </Demo>

      <div className="grid-2">
        <Demo
          title="Stepper — vertical, with an error"
          note="A step can override its status. An error is announced with the step's label, not shown by colour alone."
          inline={false}
        >
          <Stepper
            aria-label="Onboarding"
            orientation="vertical"
            steps={ONBOARDING}
            activeStep={3}
          />
        </Demo>

        <Demo
          title="Stepper — small, non-linear"
          note="With linear={false}, any step can be clicked, which suits a settings wizard whose steps do not depend on each other."
          inline={false}
        >
          <div className="stack-sm">
            <Stepper
              aria-label="Profile setup"
              size="sm"
              orientation="vertical"
              linear={false}
              activeStep={freeStep}
              onStepClick={(index) => setFreeStep(index)}
              steps={[
                { id: 'photo', label: 'Photo' },
                { id: 'bio', label: 'Bio' },
                { id: 'skills', label: 'Skills' },
                { id: 'availability', label: 'Availability', disabled: true },
              ]}
            />
            <p className="muted">Current step: {freeStep + 1}</p>
          </div>
        </Demo>
      </div>

      <Demo title="Accordion" inline={false}>
        <div className="grid-2">
          <Accordion type="single" collapsible defaultValue="a">
            <AccordionItem value="a">
              <AccordionTrigger>What does a deep clean include?</AccordionTrigger>
              <AccordionContent>
                Everything in a regular clean, plus oven interiors, window tracks, skirting boards
                and inside all cupboards.
              </AccordionContent>
            </AccordionItem>
            <AccordionItem value="b">
              <AccordionTrigger>Can I reschedule?</AccordionTrigger>
              <AccordionContent>Up to 24 hours before the booking, at no charge.</AccordionContent>
            </AccordionItem>
            <AccordionItem value="c">
              <AccordionTrigger>Do I need to be home?</AccordionTrigger>
              <AccordionContent>No. Leave access instructions on the booking.</AccordionContent>
            </AccordionItem>
          </Accordion>

          <Accordion type="multiple" appearance="separated" defaultValue={['x']}>
            <AccordionItem value="x">
              <AccordionTrigger>Separated</AccordionTrigger>
              <AccordionContent>
                Each item gets its own card instead of a shared rule.
              </AccordionContent>
            </AccordionItem>
            <AccordionItem value="y">
              <AccordionTrigger>Multiple</AccordionTrigger>
              <AccordionContent>More than one panel can be open at a time.</AccordionContent>
            </AccordionItem>
          </Accordion>
        </div>
      </Demo>

      <Demo
        title="Collapsible"
        note="The Radix trigger has no styles, so pass your own button with asChild."
        inline={false}
      >
        <Collapsible open={advancedOpen} onOpenChange={setAdvancedOpen}>
          <CollapsibleTrigger asChild>
            <Button variant="outline" size="sm">
              {advancedOpen ? 'Hide' : 'Show'} advanced options
              <ChevronDownIcon style={{ transform: advancedOpen ? 'rotate(180deg)' : undefined }} />
            </Button>
          </CollapsibleTrigger>
          <CollapsibleContent>
            <Card variant="flat" style={{ marginTop: '0.75rem' }}>
              <CardContent>Retry policy, webhook URL and idempotency key.</CardContent>
            </Card>
          </CollapsibleContent>
        </Collapsible>
      </Demo>
    </div>
  )
}
