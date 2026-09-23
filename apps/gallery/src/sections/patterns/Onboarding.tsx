import {
  Button,
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
  Empty,
  Field,
  ImageUpload,
  Input,
  Progress,
  SegmentedControl,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
  Stepper,
  Switch,
} from '@shining-technologies/ui'
import { useState } from 'react'
import { Demo } from '../Demo'

const STEPS = [
  { id: 'welcome', label: 'Welcome' },
  { id: 'profile', label: 'Profile' },
  { id: 'organisation', label: 'Organisation' },
  { id: 'preferences', label: 'Preferences' },
  { id: 'done', label: 'Done' },
]

function Onboarding() {
  const [step, setStep] = useState(0)
  const [name, setName] = useState('')
  const [nameError, setNameError] = useState<string | null>(null)
  const [org, setOrg] = useState('')
  const [size, setSize] = useState('2-10')
  const [theme, setTheme] = useState('system')
  const [tips, setTips] = useState(true)

  const next = () => {
    if (step === 1 && !name.trim()) {
      setNameError('Tell us what to call you.')
      return
    }
    setNameError(null)
    setStep((current) => Math.min(current + 1, STEPS.length - 1))
  }

  return (
    <Card className="pattern-onboarding">
      <CardHeader>
        <Progress value={(step / (STEPS.length - 1)) * 100} size="sm" aria-label="Set-up progress" />
        <Stepper steps={STEPS} activeStep={step} size="sm" onStepClick={(index) => setStep(index)} />
      </CardHeader>

      <CardContent className="stack-sm">
        {step === 0 ? (
          <div className="pattern-welcome">
            <CardTitle as="h3">Welcome to Fieldwork</CardTitle>
            <CardDescription>
              Three short steps and your crew can start booking jobs. You can change everything later in Settings.
            </CardDescription>
          </div>
        ) : null}

        {step === 1 ? (
          <>
            <CardTitle as="h3">About you</CardTitle>
            <Field label="Your name" required error={nameError}>
              <Input value={name} onChange={(event) => setName(event.target.value)} autoComplete="name" />
            </Field>
            <Field label="Photo" description="Optional. Shown next to your jobs and comments.">
              <ImageUpload shape="circle" maxSize={2 * 1024 * 1024} accept="image/*" />
            </Field>
          </>
        ) : null}

        {step === 2 ? (
          <>
            <CardTitle as="h3">Your organisation</CardTitle>
            <Field label="Organisation name" description="Leave blank to use your own name.">
              <Input value={org} onChange={(event) => setOrg(event.target.value)} autoComplete="organization" />
            </Field>
            <Field label="Team size">
              <Select value={size} onValueChange={setSize}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="1">Just me</SelectItem>
                  <SelectItem value="2-10">2–10</SelectItem>
                  <SelectItem value="11-50">11–50</SelectItem>
                  <SelectItem value="51+">51 or more</SelectItem>
                </SelectContent>
              </Select>
            </Field>
          </>
        ) : null}

        {step === 3 ? (
          <>
            <CardTitle as="h3">Preferences</CardTitle>
            <Field label="Appearance">
              <SegmentedControl
                aria-label="Appearance"
                value={theme}
                onValueChange={setTheme}
                options={[
                  { value: 'light', label: 'Light' },
                  { value: 'dark', label: 'Dark' },
                  { value: 'system', label: 'System' },
                ]}
              />
            </Field>
            <Field label="Show tips" description="Short hints the first time you open each page." orientation="horizontal">
              <Switch checked={tips} onCheckedChange={setTips} />
            </Field>
          </>
        ) : null}

        {step === 4 ? (
          <Empty
            status="success"
            title={`You’re all set${name ? `, ${name.split(' ')[0]}` : ''}`}
            description={`${org || name || 'Your organisation'} is ready. Invite your team or create your first job.`}
            actions={
              <>
                <Button variant="outline" size="sm">
                  Invite the team
                </Button>
                <Button size="sm">Create a job</Button>
              </>
            }
          />
        ) : null}
      </CardContent>

      {step < 4 ? (
        <CardFooter bordered className="pattern-actions">
          {step > 0 ? (
            <Button variant="ghost" onClick={() => setStep((current) => current - 1)}>
              Back
            </Button>
          ) : null}
          {step === 2 || step === 3 ? (
            <Button variant="ghost" onClick={() => setStep((current) => current + 1)}>
              Skip
            </Button>
          ) : null}
          <Button onClick={next}>{step === 0 ? 'Get started' : step === 3 ? 'Finish' : 'Continue'}</Button>
        </CardFooter>
      ) : (
        <CardFooter bordered className="pattern-actions">
          <Button variant="ghost" onClick={() => setStep(0)}>
            Start again
          </Button>
        </CardFooter>
      )}
    </Card>
  )
}

export function OnboardingPattern() {
  return (
    <div className="stack">
      <Demo
        title="First run"
        note="A progress bar and a small stepper say how far along the user is; only the name is required; optional steps can be skipped; the end is a success state with the two things to do next."
        inline={false}
        code={`
<Card>
  <CardHeader>
    <Progress value={(step / 4) * 100} size="sm" aria-label="Set-up progress" />
    <Stepper steps={steps} activeStep={step} size="sm" onStepClick={setStep} />
  </CardHeader>
  <CardContent>{/* the step */}</CardContent>
  <CardFooter>
    <Button variant="ghost" onClick={back}>Back</Button>
    <Button variant="ghost" onClick={skip}>Skip</Button>
    <Button onClick={next}>Continue</Button>
  </CardFooter>
</Card>

// the last step
<Empty status="success" title="You’re all set" actions={…} />`}
      >
        <Onboarding />
      </Demo>
    </div>
  )
}
