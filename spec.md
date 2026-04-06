# Dokmai IC

## Current State
- Backend: Feedback type has `id`, `message`, `timestamp`, `status` fields. No reply field.
- Admin Panel (v20): Displays all feedback with filter tabs (All/Unread/Read/Resolved), mark as read, mark as resolved, delete. No reply functionality.
- FeedbackPage: User can submit feedback and view their own feedback history. No admin reply shown.

## Requested Changes (Diff)

### Add
- Backend: `adminReply` optional field (`?Text`) to `Feedback` type
- Backend: `adminReplyTimestamp` optional field (`?Int`) to `Feedback` type  
- Backend: `adminReplyFeedback(user: Principal, feedbackId: Nat, reply: Text)` function — admin only
- Backend: `getUserFeedbackWithReplies()` — user calls to get their own feedback including admin replies
- Admin Panel: Reply button/input per feedback item; admin can type and submit reply
- FeedbackPage: Show admin reply below each user feedback item with timestamp

### Modify
- `FeedbackWithPrincipal` type: add `adminReply: ?Text`, `adminReplyTimestamp: ?Int`
- `getAllFeedbackEntries()`: return reply fields
- `submitFeedbackEntry`: new feedback has `adminReply = null`, `adminReplyTimestamp = null`
- `markFeedbackAsRead`, `markFeedbackAsResolved`, `adminDeleteFeedback`: preserve reply fields
- FeedbackPage: update history display to show reply section
- Backend bindings (backend.did.d.ts) regenerated automatically

### Remove
- Nothing removed

## Implementation Plan
1. Update `Feedback` type in main.mo to include `adminReply: ?Text` and `adminReplyTimestamp: ?Int`
2. Update `FeedbackWithPrincipal` type similarly
3. Add `adminReplyFeedback` function in backend
4. Add `getUserFeedbackWithReplies` query for users to fetch their own feedback with replies
5. Update all functions that create/modify Feedback to carry reply fields
6. Regenerate backend bindings
7. Update AdminPage: add reply input per feedback item
8. Update FeedbackPage: display admin reply below each feedback
