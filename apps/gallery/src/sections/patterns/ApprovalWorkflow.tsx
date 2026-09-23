import {
  Button,
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
  CheckIcon,
  CloseIcon,
  ConfirmDialog,
  Field,
  PageHeader,
  StatusBadge,
  StatusFlow,
  Textarea,
  Timeline,
  TimelineItem,
  UserAvatar,
  type StatusVocabulary,
} from '@shining-technologies/ui'
import { useState, type ReactNode } from 'react'
import { Demo } from '../Demo'

type Status = 'draft' | 'submitted' | 'under_review' | 'approved' | 'rejected'

const STATUSES: StatusVocabulary = {
  draft: { label: 'Draft', tone: 'neutral' },
  submitted: { label: 'Submitted', tone: 'info' },
  under_review: { label: 'Under review', tone: 'warning' },
  approved: { label: 'Approved', tone: 'success' },
  rejected: { label: 'Rejected', tone: 'destructive' },
}

interface HistoryEntry {
  id: number
  who: string
  what: ReactNode
  when: string
  tone: 'neutral' | 'info' | 'warning' | 'success' | 'destructive'
  comment?: string
}

const START: HistoryEntry[] = [{ id: 1, who: 'Tom Whitfield', what: 'created the draft', when: 'Sep 22, 09:10', tone: 'neutral' }]

function Workflow() {
  const [status, setStatus] = useState<Status>('draft')
  const [history, setHistory] = useState(START)
  const [comment, setComment] = useState('')
  const [commentError, setCommentError] = useState<string | null>(null)
  const [confirmReject, setConfirmReject] = useState(false)

  const log = (who: string, what: string, tone: HistoryEntry['tone'], note?: string) =>
    setHistory((list) => [{ id: list.length + 1, who, what, when: 'Just now', tone, comment: note }, ...list])

  const move = (next: Status, who: string, what: string, tone: HistoryEntry['tone'], note?: string) => {
    setStatus(next)
    log(who, what, tone, note)
    setComment('')
    setCommentError(null)
  }

  return (
    <div className="pattern-frame stack">
      <PageHeader
        as="h2"
        title={
          <span className="pattern-title">
            Expense claim EXP-0931
            <StatusBadge status={status} statuses={STATUSES} />
          </span>
        }
        description="Site visit to North depot · $1,284.50 · submitted by Tom Whitfield"
      />

      <StatusFlow
        steps={['draft', 'submitted', 'under_review', 'approved']}
        alternates={['rejected']}
        current={status}
        statuses={STATUSES}
        label="Claim progress"
      />

      <div className="pattern-split">
        <Card>
          <CardHeader bordered>
            <CardTitle as="h3">Decision</CardTitle>
            <CardDescription>
              {status === 'draft' && 'The requester submits the claim for approval.'}
              {status === 'submitted' && 'An approver picks the claim up for review.'}
              {status === 'under_review' && 'Approve, or reject with a reason the requester can act on.'}
              {(status === 'approved' || status === 'rejected') && 'This claim is closed.'}
            </CardDescription>
          </CardHeader>
          {status === 'under_review' ? (
            <CardContent>
              <Field label="Comment" description="Required to reject; sent to the requester." error={commentError}>
                <Textarea rows={3} value={comment} onChange={(event) => setComment(event.target.value)} />
              </Field>
            </CardContent>
          ) : null}
          <CardFooter bordered className="pattern-actions">
            {status === 'draft' ? (
              <Button onClick={() => move('submitted', 'Tom Whitfield', 'submitted the claim', 'info')}>Submit for approval</Button>
            ) : null}
            {status === 'submitted' ? (
              <Button onClick={() => move('under_review', 'Priya Raman', 'started the review', 'warning')}>Start review</Button>
            ) : null}
            {status === 'under_review' ? (
              <>
                <Button
                  variant="outline"
                  onClick={() => {
                    if (!comment.trim()) {
                      setCommentError('Say why, so the requester can fix it.')
                      return
                    }
                    setConfirmReject(true)
                  }}
                >
                  <CloseIcon />
                  Reject
                </Button>
                <Button onClick={() => move('approved', 'Priya Raman', 'approved the claim', 'success', comment || undefined)}>
                  <CheckIcon />
                  Approve
                </Button>
              </>
            ) : null}
            {status === 'approved' || status === 'rejected' ? (
              <Button
                variant="ghost"
                onClick={() => {
                  setStatus('draft')
                  setHistory(START)
                }}
              >
                Start over
              </Button>
            ) : null}
          </CardFooter>
        </Card>

        <Card>
          <CardHeader bordered>
            <CardTitle as="h3">History</CardTitle>
          </CardHeader>
          <CardContent>
            <Timeline aria-label="Claim history">
              {history.map((entry) => (
                <TimelineItem
                  key={entry.id}
                  icon={<UserAvatar name={entry.who} size="sm" />}
                  tone={entry.tone}
                  title={
                    <>
                      <strong>{entry.who}</strong> {entry.what}
                    </>
                  }
                  time={entry.when}
                >
                  {entry.comment ? `“${entry.comment}”` : undefined}
                </TimelineItem>
              ))}
            </Timeline>
          </CardContent>
        </Card>
      </div>

      <ConfirmDialog
        open={confirmReject}
        onOpenChange={setConfirmReject}
        destructive
        title="Reject EXP-0931?"
        description="Tom is told why and can edit and resubmit the claim."
        confirmLabel="Reject claim"
        onConfirm={() => move('rejected', 'Priya Raman', 'rejected the claim', 'destructive', comment)}
      />
    </div>
  )
}

export function ApprovalWorkflowPattern() {
  return (
    <div className="stack">
      <Demo
        title="Expense approval"
        note="Draft → submitted → under review → approved, with rejected off the main path. The status is in the header and the flow; the decision card shows only what this state allows; rejecting needs a reason and a confirmation; every step lands in the history."
        inline={false}
        code={`
<StatusFlow
  steps={['draft', 'submitted', 'under_review', 'approved']}
  alternates={['rejected']}
  current={status}
  statuses={STATUSES}
/>
<Card>
  <CardHeader><CardTitle as="h3">Decision</CardTitle></CardHeader>
  <CardContent>
    <Field label="Comment" error={commentError}><Textarea … /></Field>
  </CardContent>
  <CardFooter>
    <Button variant="outline" onClick={askToReject}>Reject</Button>
    <Button onClick={approve}>Approve</Button>
  </CardFooter>
</Card>
<Timeline aria-label="Claim history">{history.map(…)}</Timeline>`}
      >
        <Workflow />
      </Demo>
    </div>
  )
}
