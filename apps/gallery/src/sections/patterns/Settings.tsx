import {
  BellIcon,
  Button,
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
  ConfirmDialog,
  Field,
  Input,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
  SettingsIcon,
  Switch,
  TrashIcon,
  UserAvatar,
  UserIcon,
  VerticalNav,
  VerticalNavItem,
  VerticalNavSection,
} from '@shining-technologies/ui'
import { useState } from 'react'
import { Demo } from '../Demo'

type SectionId = 'profile' | 'notifications' | 'team' | 'danger'

function useSection<T>(initial: T) {
  const [saved, setSaved] = useState(initial)
  const [value, setValue] = useState(initial)
  const [saving, setSaving] = useState(false)
  return {
    value,
    setValue,
    dirty: JSON.stringify(value) !== JSON.stringify(saved),
    saving,
    reset: () => setValue(saved),
    save: async () => {
      setSaving(true)
      await new Promise((resolve) => setTimeout(resolve, 600))
      setSaved(value)
      setSaving(false)
    },
  }
}

function SectionFooter({ dirty, saving, onSave, onReset }: { dirty: boolean; saving: boolean; onSave: () => void; onReset: () => void }) {
  return (
    <CardFooter bordered className="pattern-actions">
      <span className="muted pattern-save-state" role="status">
        {saving ? 'Saving…' : dirty ? 'Unsaved changes' : 'Saved'}
      </span>
      <Button variant="ghost" disabled={!dirty || saving} onClick={onReset}>
        Reset
      </Button>
      <Button disabled={!dirty || saving} onClick={onSave}>
        Save
      </Button>
    </CardFooter>
  )
}

const MEMBERS = [
  { name: 'Priya Raman', email: 'priya@acme.example', role: 'owner' },
  { name: 'Tom Whitfield', email: 'tom@acme.example', role: 'admin' },
  { name: 'Ana Ortiz', email: 'ana@acme.example', role: 'member' },
  { name: 'Kofi Mensah', email: 'kofi@acme.example', role: 'viewer' },
]

function SettingsPage() {
  const [section, setSection] = useState<SectionId>('profile')
  const profile = useSection({ name: 'Priya Raman', email: 'priya@acme.example', timezone: 'Australia/Sydney' })
  const notifications = useSection({ mentions: true, digest: true, invoices: false, security: true })
  const team = useSection(Object.fromEntries(MEMBERS.map((member) => [member.email, member.role])))
  const [confirmDelete, setConfirmDelete] = useState(false)
  const [deleted, setDeleted] = useState(false)

  return (
    <div className="pattern-frame pattern-settings">
      <VerticalNav aria-label="Settings">
        <VerticalNavSection title="Account">
          <VerticalNavItem icon={<UserIcon />} active={section === 'profile'} onClick={() => setSection('profile')}>
            Profile
          </VerticalNavItem>
          <VerticalNavItem icon={<BellIcon />} active={section === 'notifications'} onClick={() => setSection('notifications')}>
            Notifications
          </VerticalNavItem>
        </VerticalNavSection>
        <VerticalNavSection title="Organisation">
          <VerticalNavItem icon={<SettingsIcon />} active={section === 'team'} onClick={() => setSection('team')}>
            Team & roles
          </VerticalNavItem>
          <VerticalNavItem icon={<TrashIcon />} active={section === 'danger'} onClick={() => setSection('danger')}>
            Danger zone
          </VerticalNavItem>
        </VerticalNavSection>
      </VerticalNav>

      <div className="stack">
        {section === 'profile' ? (
          <Card>
            <CardHeader bordered>
              <CardTitle as="h3">Profile</CardTitle>
              <CardDescription>How you appear to your team.</CardDescription>
            </CardHeader>
            <CardContent className="stack-sm">
              <Field label="Name" required>
                <Input value={profile.value.name} onChange={(event) => profile.setValue({ ...profile.value, name: event.target.value })} />
              </Field>
              <Field label="Email" description="Sign-in and notifications go here.">
                <Input type="email" value={profile.value.email} onChange={(event) => profile.setValue({ ...profile.value, email: event.target.value })} />
              </Field>
              <Field label="Time zone">
                <Select value={profile.value.timezone} onValueChange={(timezone) => profile.setValue({ ...profile.value, timezone })}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Australia/Sydney">Sydney (AEST)</SelectItem>
                    <SelectItem value="Australia/Perth">Perth (AWST)</SelectItem>
                    <SelectItem value="Pacific/Auckland">Auckland (NZST)</SelectItem>
                  </SelectContent>
                </Select>
              </Field>
            </CardContent>
            <SectionFooter dirty={profile.dirty} saving={profile.saving} onSave={() => void profile.save()} onReset={profile.reset} />
          </Card>
        ) : null}

        {section === 'notifications' ? (
          <Card>
            <CardHeader bordered>
              <CardTitle as="h3">Notifications</CardTitle>
              <CardDescription>Email only; the app always shows everything.</CardDescription>
            </CardHeader>
            <CardContent className="stack-sm">
              {(
                [
                  ['mentions', 'Mentions', 'When someone @mentions you.'],
                  ['digest', 'Daily digest', 'One email at 8:00 with what changed.'],
                  ['invoices', 'Invoices', 'Every invoice paid or overdue.'],
                  ['security', 'Security alerts', 'New sign-ins and API keys. Cannot be turned off.'],
                ] as const
              ).map(([key, label, description]) => (
                <Field key={key} label={label} description={description} orientation="horizontal" disabled={key === 'security'}>
                  <Switch
                    checked={notifications.value[key]}
                    onCheckedChange={(checked) => notifications.setValue({ ...notifications.value, [key]: checked })}
                  />
                </Field>
              ))}
            </CardContent>
            <SectionFooter
              dirty={notifications.dirty}
              saving={notifications.saving}
              onSave={() => void notifications.save()}
              onReset={notifications.reset}
            />
          </Card>
        ) : null}

        {section === 'team' ? (
          <Card>
            <CardHeader bordered>
              <CardTitle as="h3">Team & roles</CardTitle>
              <CardDescription>Owners manage billing; admins manage people; viewers only read.</CardDescription>
            </CardHeader>
            <CardContent>
              <ul className="pattern-members">
                {MEMBERS.map((member) => (
                  <li key={member.email}>
                    <UserAvatar name={member.name} size="sm" />
                    <span className="pattern-member-name">
                      {member.name}
                      <span className="muted">{member.email}</span>
                    </span>
                    <Select
                      value={team.value[member.email]}
                      disabled={member.role === 'owner'}
                      onValueChange={(role) => team.setValue({ ...team.value, [member.email]: role })}
                    >
                      <SelectTrigger aria-label={`Role for ${member.name}`} style={{ width: '8.5rem' }}>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="owner">Owner</SelectItem>
                        <SelectItem value="admin">Admin</SelectItem>
                        <SelectItem value="member">Member</SelectItem>
                        <SelectItem value="viewer">Viewer</SelectItem>
                      </SelectContent>
                    </Select>
                  </li>
                ))}
              </ul>
            </CardContent>
            <SectionFooter dirty={team.dirty} saving={team.saving} onSave={() => void team.save()} onReset={team.reset} />
          </Card>
        ) : null}

        {section === 'danger' ? (
          <Card className="pattern-danger">
            <CardHeader bordered>
              <CardTitle as="h3">Delete organisation</CardTitle>
              <CardDescription>
                {deleted
                  ? 'Deleted. (In an app, you would now be signed out.)'
                  : 'Removes Acme and all of its data for every member. This cannot be undone.'}
              </CardDescription>
            </CardHeader>
            <CardFooter className="pattern-actions">
              <Button variant="destructive" disabled={deleted} onClick={() => setConfirmDelete(true)}>
                Delete organisation
              </Button>
            </CardFooter>
          </Card>
        ) : null}
      </div>

      <ConfirmDialog
        open={confirmDelete}
        onOpenChange={setConfirmDelete}
        destructive
        title="Delete Acme?"
        description="All 4 members lose access and every job, invoice and file is deleted."
        confirmLabel="Delete organisation"
        onConfirm={async () => {
          await new Promise((resolve) => setTimeout(resolve, 800))
          setDeleted(true)
        }}
      />
    </div>
  )
}

export function SettingsPattern() {
  return (
    <div className="stack">
      <Demo
        title="Account and organisation settings"
        note="Settings navigation beside one section at a time. Each section saves and resets on its own and says whether it is saved; a role per team member (the owner's is fixed); the irreversible action is fenced off and confirmed."
        inline={false}
        code={`
<VerticalNav aria-label="Settings">
  <VerticalNavSection title="Account">
    <VerticalNavItem active={section === 'profile'} onClick={() => setSection('profile')}>Profile</VerticalNavItem>
  </VerticalNavSection>
</VerticalNav>
<Card>
  <CardHeader bordered><CardTitle as="h3">Notifications</CardTitle></CardHeader>
  <CardContent>
    <Field label="Daily digest" orientation="horizontal"><Switch checked={…} /></Field>
  </CardContent>
  <CardFooter bordered>
    <span role="status">{dirty ? 'Unsaved changes' : 'Saved'}</span>
    <Button variant="ghost" disabled={!dirty} onClick={reset}>Reset</Button>
    <Button disabled={!dirty} onClick={save}>Save</Button>
  </CardFooter>
</Card>`}
      >
        <SettingsPage />
      </Demo>
    </div>
  )
}
