import {
  Alert,
  AlertDescription,
  Button,
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
  Checkbox,
  Field,
  Input,
  OtpInput,
  PasswordInput,
  Separator,
} from '@shining-technologies/ui'
import { useState, type FormEvent } from 'react'
import { Demo } from '../Demo'

/*
 * Screens only. Every submit here resolves after a pause; an application wires
 * the same forms to its own authentication service.
 */

const wait = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms))

function SignIn() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)

  const submit = async (event: FormEvent) => {
    event.preventDefault()
    setError(null)
    setBusy(true)
    await wait(700)
    setBusy(false)
    // The demo accepts nothing, to show the failure state.
    setError('That email and password do not match an account.')
  }

  return (
    <Card className="pattern-auth">
      <CardHeader>
        <CardTitle as="h3">Sign in</CardTitle>
        <CardDescription>Welcome back to Fieldwork.</CardDescription>
      </CardHeader>
      <form onSubmit={submit} noValidate>
        <CardContent className="stack-sm">
          {error ? (
            <Alert tone="destructive">
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          ) : null}
          <Field label="Email" required>
            <Input type="email" autoComplete="email" value={email} onChange={(event) => setEmail(event.target.value)} />
          </Field>
          <Field label="Password" required>
            <PasswordInput autoComplete="current-password" value={password} onChange={(event) => setPassword(event.target.value)} />
          </Field>
          <div className="pattern-auth-row">
            <label className="choice">
              <Checkbox defaultChecked /> Keep me signed in
            </label>
            <a href="#pattern-auth/reset-password">Forgot password?</a>
          </div>
        </CardContent>
        <CardFooter className="stack-sm">
          <Button type="submit" className="pattern-wide" disabled={busy}>
            {busy ? 'Signing in…' : 'Sign in'}
          </Button>
          <div className="pattern-divider">
            <Separator />
            <span className="muted">or</span>
            <Separator />
          </div>
          <Button type="button" variant="outline" className="pattern-wide">
            Continue with SSO
          </Button>
        </CardFooter>
      </form>
    </Card>
  )
}

function Register() {
  const [password, setPassword] = useState('')
  const [done, setDone] = useState(false)

  if (done) {
    return (
      <Card className="pattern-auth">
        <CardHeader>
          <CardTitle as="h3">Check your email</CardTitle>
          <CardDescription>We sent a link to confirm your address. It expires in 24 hours.</CardDescription>
        </CardHeader>
        <CardFooter>
          <Button variant="outline" onClick={() => setDone(false)}>
            Back
          </Button>
        </CardFooter>
      </Card>
    )
  }

  return (
    <Card className="pattern-auth">
      <CardHeader>
        <CardTitle as="h3">Create an account</CardTitle>
        <CardDescription>Free for 14 days. No card needed.</CardDescription>
      </CardHeader>
      <form
        onSubmit={async (event) => {
          event.preventDefault()
          await wait(400)
          setDone(true)
        }}
      >
        <CardContent className="stack-sm">
          <Field label="Full name" required>
            <Input autoComplete="name" required />
          </Field>
          <Field label="Work email" required>
            <Input type="email" autoComplete="email" required />
          </Field>
          <Field label="Password" required>
            <PasswordInput
              strength
              autoComplete="new-password"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              required
            />
          </Field>
          <label className="choice">
            <Checkbox required /> I agree to the terms of service
          </label>
        </CardContent>
        <CardFooter>
          <Button type="submit" className="pattern-wide">
            Create account
          </Button>
        </CardFooter>
      </form>
    </Card>
  )
}

function ResetPassword() {
  const [sent, setSent] = useState(false)
  return (
    <Card className="pattern-auth">
      <CardHeader>
        <CardTitle as="h3">Reset your password</CardTitle>
        <CardDescription>
          {sent
            ? 'If an account uses that address, a reset link is on its way.'
            : 'Enter the email you sign in with and we will send a link.'}
        </CardDescription>
      </CardHeader>
      {sent ? (
        <CardFooter>
          <Button variant="outline" onClick={() => setSent(false)}>
            Send again
          </Button>
        </CardFooter>
      ) : (
        <form
          onSubmit={async (event) => {
            event.preventDefault()
            await wait(400)
            setSent(true)
          }}
        >
          <CardContent>
            <Field label="Email" required>
              <Input type="email" autoComplete="email" required />
            </Field>
          </CardContent>
          <CardFooter>
            <Button type="submit" className="pattern-wide">
              Send reset link
            </Button>
          </CardFooter>
        </form>
      )}
    </Card>
  )
}

function VerifyCode() {
  const [state, setState] = useState<'idle' | 'checking' | 'wrong' | 'ok'>('idle')
  return (
    <Card className="pattern-auth">
      <CardHeader>
        <CardTitle as="h3">Enter the code</CardTitle>
        <CardDescription>We sent a 6-digit code to ••••• 412. (Try 123456.)</CardDescription>
      </CardHeader>
      <CardContent className="stack-sm">
        <Field label="Verification code" error={state === 'wrong' ? 'That code is not right. Check the message and try again.' : undefined}>
          <OtpInput
            length={6}
            groupEvery={3}
            disabled={state === 'checking' || state === 'ok'}
            onComplete={async (code) => {
              setState('checking')
              await wait(500)
              setState(code === '123456' ? 'ok' : 'wrong')
            }}
          />
        </Field>
        <p className="muted pattern-count" role="status">
          {state === 'checking' ? 'Checking…' : state === 'ok' ? 'Verified. Signing you in…' : ''}
        </p>
      </CardContent>
      <CardFooter>
        <Button variant="link" onClick={() => setState('idle')}>
          Send a new code
        </Button>
      </CardFooter>
    </Card>
  )
}

export function AuthPattern() {
  return (
    <div className="stack">
      <Alert tone="info">
        <AlertDescription>
          These are screens, not authentication: the package ships no auth logic. Wire the forms to your own
          identity provider.
        </AlertDescription>
      </Alert>
      <div className="grid-2">
        <Demo
          title="Sign in"
          note="The error is shown above the fields and never says which of the two was wrong."
          inline={false}
          code={`
<form onSubmit={signIn} noValidate>
  {error && <Alert tone="destructive"><AlertDescription>{error}</AlertDescription></Alert>}
  <Field label="Email" required><Input type="email" autoComplete="email" /></Field>
  <Field label="Password" required><PasswordInput autoComplete="current-password" /></Field>
  <Button type="submit" disabled={busy}>{busy ? 'Signing in…' : 'Sign in'}</Button>
</form>`}
        >
          <SignIn />
        </Demo>
        <Demo
          title="Create an account"
          note="PasswordInput with strength shows the meter and the rules as they are met."
          inline={false}
          code={`
<Field label="Password" required>
  <PasswordInput strength autoComplete="new-password" value={password} onChange={…} />
</Field>`}
        >
          <Register />
        </Demo>
        <Demo title="Reset password" note="The confirmation does not reveal whether the address has an account." inline={false}>
          <ResetPassword />
        </Demo>
        <Demo
          title="Verification code"
          note="OtpInput accepts a pasted code and submits on the last digit."
          inline={false}
          code={`
<Field label="Verification code" error={wrong ? 'That code is not right.' : undefined}>
  <OtpInput length={6} groupEvery={3} onComplete={verify} />
</Field>`}
        >
          <VerifyCode />
        </Demo>
      </div>
    </div>
  )
}
