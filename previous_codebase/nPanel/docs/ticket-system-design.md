# Ticket/Support System Design Document

## Overview
A comprehensive ticket/support system that enables communication between agency users and customer users (or both) with full threading, comments, attachments, and activity tracking.

## Database Schema

### Core Models

#### 1. Ticket
The main ticket entity representing a support request.

**Key Fields:**
- `ticketNumber`: Human-readable unique identifier (e.g., TKT-2024-001)
- `subject`: Ticket title/subject
- `description`: Initial ticket description
- `type`: Category (TECHNICAL, BILLING, FEATURE, BUG, etc.)
- `priority`: Priority level (LOW, NORMAL, HIGH, URGENT)
- `status`: Current status (OPEN, IN_PROGRESS, WAITING, RESOLVED, CLOSED, CANCELLED)
- `source`: How ticket was created (WEB, EMAIL, API, CHAT, PHONE)
- `createdById`: User who created the ticket (customer or agency)
- `teamId`: Associated team (if customer created)
- `assignedToId`: Agency user assigned to handle
- `internalNotes`: Notes visible only to agency users

**Timestamps:**
- `createdAt`, `updatedAt`
- `resolvedAt`, `closedAt`
- `firstResponseAt`, `lastResponseAt`
- `lastCustomerResponseAt`, `lastAgentResponseAt`

#### 2. TicketComment
Threaded comments/replies on tickets.

**Key Features:**
- Full threading via `parentId` (self-referential)
- `isInternal`: Internal comments visible only to agency
- `isSystem`: System-generated comments (status changes, etc.)
- Soft delete via `deletedAt`
- Edit tracking via `editedAt`

#### 3. TicketParticipant
Tracks who's involved in a ticket.

**Roles:**
- `CREATOR`: Original ticket creator
- `ASSIGNEE`: Assigned agent
- `WATCHER`: Users watching the ticket
- `CC`: Users CC'd on the ticket

#### 4. TicketAttachment
File attachments for tickets and comments.

**Features:**
- Can be attached to ticket or specific comment
- Stores file metadata (name, size, mime type, URL)
- Supports cloud storage (S3, etc.) via `storageKey`

#### 5. TicketTag & TicketTagRelation
Categorization system for tickets.

**Features:**
- Many-to-many relationship
- Tags have colors for UI
- Track who added tags and when

#### 6. TicketActivityLog
Comprehensive activity tracking.

**Tracks:**
- All ticket changes (CREATE, UPDATE, STATUS_CHANGE, etc.)
- Assignments, comments, attachments
- Tag additions/removals
- Request metadata (IP, user agent)

## System Flow

### 1. Ticket Creation

**Customer Flow:**
1. Customer creates ticket via web interface
2. System generates unique `ticketNumber`
3. Ticket created with status `OPEN`
4. Auto-add customer as `CREATOR` participant
5. Activity log entry created
6. Notification sent to assigned agent (if auto-assigned) or agency team

**Agency Flow:**
1. Agency user can create ticket on behalf of customer
2. Can assign to specific agent immediately
3. Can set priority/type based on issue

### 2. Ticket Assignment

**Options:**
- Manual assignment by agency admin
- Auto-assignment based on:
  - Workload balancing
  - Skill/expertise matching
  - Round-robin
  - Ticket type/category

**On Assignment:**
- Update `assignedToId`
- Add agent as `ASSIGNEE` participant
- Create activity log entry
- Send notification to assigned agent

### 3. Comment Threading

**Structure:**
- Root-level comments (no `parentId`) appear as main replies
- Nested comments (`parentId` set) appear as replies to specific comments
- Unlimited nesting depth
- Comments can be:
  - Public (visible to all)
  - Internal (visible only to agency)
  - System-generated (status changes, etc.)

**Flow:**
1. User creates comment
2. If replying, set `parentId` to parent comment
3. Update ticket `lastResponseAt` and role-specific timestamps
4. Create activity log entry
5. Send notifications to:
   - Other participants
   - Ticket creator (if not commenter)
   - Assigned agent (if not commenter)

### 4. Status Workflow

**Status Transitions:**
```
OPEN → IN_PROGRESS → WAITING → RESOLVED → CLOSED
  ↓         ↓            ↓
CANCELLED  CANCELLED   CANCELLED
```

**Status Meanings:**
- `OPEN`: New ticket, awaiting first response
- `IN_PROGRESS`: Agent actively working on issue
- `WAITING`: Waiting for customer response
- `RESOLVED`: Issue resolved, awaiting customer confirmation
- `CLOSED`: Ticket closed (customer confirmed or auto-closed)
- `CANCELLED`: Ticket cancelled

**On Status Change:**
- Update relevant timestamp (`resolvedAt`, `closedAt`)
- Create system comment if enabled
- Create activity log entry
- Send notifications

### 5. Priority Management

**Priority Levels:**
- `LOW`: Non-urgent, can wait
- `NORMAL`: Standard priority
- `HIGH`: Important, needs attention soon
- `URGENT`: Critical, immediate attention required

**Priority Escalation:**
- Auto-escalate based on:
  - Time since last response
  - Time since creation
  - Customer type (VIP, etc.)

### 6. Notification System

**Notification Triggers:**
- Ticket created
- Ticket assigned
- New comment added
- Status changed
- Priority changed
- Ticket resolved/closed

**Recipients:**
- Ticket creator
- Assigned agent
- All participants
- Agency team (for unassigned tickets)

### 7. Search & Filtering

**Filter Options:**
- Status (open, in-progress, resolved, closed)
- Priority (low, normal, high, urgent)
- Type (technical, billing, feature, etc.)
- Assigned agent
- Team/customer
- Date range
- Tags

**Search:**
- Full-text search on:
  - Subject
  - Description
  - Comments
  - Ticket number

## API Endpoints (Proposed)

### Tickets
- `GET /tickets` - List tickets (with filters)
- `GET /tickets/:id` - Get ticket details
- `POST /tickets` - Create ticket
- `PATCH /tickets/:id` - Update ticket
- `PATCH /tickets/:id/assign` - Assign ticket
- `PATCH /tickets/:id/status` - Change status
- `PATCH /tickets/:id/priority` - Change priority
- `POST /tickets/:id/close` - Close ticket
- `POST /tickets/:id/reopen` - Reopen ticket

### Comments
- `GET /tickets/:id/comments` - Get ticket comments (threaded)
- `POST /tickets/:id/comments` - Add comment
- `PATCH /comments/:id` - Edit comment
- `DELETE /comments/:id` - Delete comment (soft)
- `POST /comments/:id/reply` - Reply to comment

### Attachments
- `GET /tickets/:id/attachments` - List attachments
- `POST /tickets/:id/attachments` - Upload attachment
- `DELETE /attachments/:id` - Delete attachment

### Participants
- `GET /tickets/:id/participants` - List participants
- `POST /tickets/:id/participants` - Add participant
- `DELETE /tickets/:id/participants/:userId` - Remove participant

### Tags
- `GET /tickets/tags` - List all tags
- `POST /tickets/tags` - Create tag
- `POST /tickets/:id/tags` - Add tag to ticket
- `DELETE /tickets/:id/tags/:tagId` - Remove tag from ticket

### Activity
- `GET /tickets/:id/activity` - Get ticket activity log

## Permissions & Access Control

### Customer Users
- Can create tickets for their team
- Can view their team's tickets
- Can comment on their tickets
- Can upload attachments
- Cannot see internal comments/notes
- Cannot change status/priority (except closing resolved tickets)

### Agency Users
- Can view all tickets
- Can create tickets for any customer
- Can assign tickets
- Can change status/priority
- Can add internal comments/notes
- Can manage tags
- Can view activity logs

### Agency Admins
- All agency user permissions
- Can manage ticket tags
- Can view analytics/reports
- Can configure auto-assignment rules

## UI/UX Considerations

### Ticket List View
- Table/card view with key information
- Quick filters (status, priority, type)
- Sort by: date, priority, status
- Bulk actions (assign, change status, add tags)

### Ticket Detail View
- Header with ticket info (number, status, priority, assigned agent)
- Description section
- Comment thread (nested view)
- Attachments section
- Activity timeline
- Tags section
- Actions sidebar (assign, change status, add tags, etc.)

### Comment Threading UI
- Indented replies for nested comments
- Collapsible threads
- Visual distinction for internal/system comments
- Edit/delete actions (with permissions)
- Reply button on each comment

## Future Enhancements

1. **Email Integration**
   - Create tickets from emails
   - Send email notifications
   - Reply via email (creates comment)

2. **SLA Management**
   - Track response times
   - Set SLA targets
   - Escalation rules

3. **Knowledge Base Integration**
   - Link tickets to KB articles
   - Suggest articles based on ticket content

4. **Satisfaction Surveys**
   - Post-resolution surveys
   - CSAT tracking

5. **Automation Rules**
   - Auto-assignment rules
   - Auto-tagging
   - Auto-status changes
   - Auto-escalation

6. **Reporting & Analytics**
   - Ticket volume trends
   - Response time metrics
   - Resolution time metrics
   - Agent performance
   - Customer satisfaction

7. **Chat Widget Integration**
   - Create tickets from chat
   - Live chat support

## Migration Strategy

1. Create migration file with all tables
2. Add relations to User and Team models
3. Seed initial ticket tags
4. Create indexes for performance
5. Set up activity logging triggers (optional)

## Security Considerations

1. **Data Isolation**
   - Customers can only see their team's tickets
   - Internal comments hidden from customers
   - Soft deletes for audit trail

2. **File Upload Security**
   - Validate file types
   - Scan for malware
   - Limit file sizes
   - Store in secure cloud storage

3. **Rate Limiting**
   - Limit ticket creation per user/team
   - Limit comments per time period
   - Prevent spam/abuse

4. **Audit Trail**
   - All changes logged in activity log
   - Track IP addresses and user agents
   - Immutable activity records
