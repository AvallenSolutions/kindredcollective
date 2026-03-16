# RFP Feature Plan — Kindred Collective

## What it is

A **reverse marketplace**. Instead of brands hunting for suppliers, brands post what they need and suppliers come to them. A brand posts an RFP (e.g. *"Need a sustainable packaging supplier, 10k units, Q3 deadline, £8–12k budget"*) and suppliers on the platform can browse the board and send an expression of interest. The brand reviews responses and follows up directly.

This is genuinely valuable because:
- Brands save hours of search time when they have a specific, urgent need
- Suppliers get warm, inbound leads with context already provided
- It drives regular platform engagement (suppliers check the board for new work)
- It makes the platform stickier — members return specifically to check RFPs

---

## User Roles & Flows

### Brand Flow
1. On the Explore page, clicks "Post a Request" → goes to `/requests/new`
2. Fills in: title, what they need, category (reuses existing `SupplierCategory`), budget range, deadline, location
3. Submits → RFP is published to the board
4. Can view all responses on `/requests/[id]` — see supplier name, message, and contact them directly
5. Can mark the RFP as **Awarded** or **Closed** when done

### Supplier Flow
1. On their dashboard, sees a **"New Requests"** section filtered to their category
2. Browses `/requests` board, can filter by category / location
3. Opens an RFP, reads the brief, submits an expression of interest (short message)
4. Can see their submitted responses in their dashboard
5. Brand contacts them directly if interested

### Admin Flow
- `/admin/requests` — view all RFPs, approve/reject (optional moderation), close spam

---

## Database Changes

### New enums
```prisma
enum RFPStatus {
  DRAFT
  OPEN
  CLOSED
  AWARDED
}

enum RFPResponseStatus {
  PENDING
  SHORTLISTED
  REJECTED
}
```

### New models
```prisma
model RFP {
  id            String    @id @default(cuid())
  title         String
  description   String    @db.Text
  brandId       String    // FK to Brand
  postedByUserId String   // FK to User
  category      SupplierCategory
  subcategories String[]
  budget        String?   // Free text, e.g. "£5,000–£10,000"
  deadline      DateTime?
  location      String?
  isRemoteOk    Boolean   @default(false)
  status        RFPStatus @default(OPEN)
  createdAt     DateTime  @default(now())
  updatedAt     DateTime  @updatedAt

  brand     Brand         @relation(fields: [brandId], references: [id], onDelete: Cascade)
  postedBy  User          @relation(fields: [postedByUserId], references: [id])
  responses RFPResponse[]

  @@index([brandId])
  @@index([category])
  @@index([status])
  @@index([createdAt])
}

model RFPResponse {
  id               String            @id @default(cuid())
  rfpId            String
  supplierId       String            // FK to Supplier
  respondedByUserId String           // FK to User
  message          String            @db.Text
  status           RFPResponseStatus @default(PENDING)
  createdAt        DateTime          @default(now())
  updatedAt        DateTime          @updatedAt

  rfp          RFP      @relation(fields: [rfpId], references: [id], onDelete: Cascade)
  supplier     Supplier @relation(fields: [supplierId], references: [id], onDelete: Cascade)
  respondedBy  User     @relation(fields: [respondedByUserId], references: [id])

  @@unique([rfpId, supplierId]) // one response per supplier per RFP
  @@index([rfpId])
  @@index([supplierId])
}
```

Also add `rfps RFP[]` relation to `Brand` and `rfpResponses RFPResponse[]` to `Supplier` and `User`.

---

## API Routes

| Method | Route | Who | What |
|--------|-------|-----|------|
| `GET` | `/api/requests` | Any member | List open RFPs (with filters: category, location, status) |
| `POST` | `/api/requests` | Brand org member | Create new RFP |
| `GET` | `/api/requests/[id]` | Any member | Get RFP detail + response count |
| `PATCH` | `/api/requests/[id]` | RFP owner | Update RFP or change status |
| `DELETE` | `/api/requests/[id]` | RFP owner / Admin | Delete RFP |
| `GET` | `/api/requests/[id]/responses` | RFP owner | List all responses |
| `POST` | `/api/requests/[id]/responses` | Supplier org member | Submit expression of interest |
| `PATCH` | `/api/requests/[id]/responses/[responseId]` | RFP owner | Shortlist or reject a response |
| `GET` | `/api/me/requests` | Brand org member | My posted RFPs |
| `GET` | `/api/me/rfp-responses` | Supplier org member | My submitted responses |
| `GET` | `/api/admin/requests` | Admin | All RFPs |

---

## Pages

### `/requests` — The Board
- Header: "Requests for Proposal" with "Post a Request" CTA (brand users only)
- Sidebar filters: Category, Location, Remote OK, Posted in last N days
- Cards showing: Brand name + logo, RFP title, category badge, budget, deadline, response count
- Sorted by newest first
- Accessible to all logged-in members

### `/requests/new` — Create RFP
- Auth-gated: must be logged in with a Brand organisation
- Form fields:
  - Title (e.g. "Sustainable packaging for 10k units")
  - What you need (rich text description)
  - Category (dropdown using SupplierCategory)
  - Budget range (text field — keeps it flexible)
  - Deadline (date picker)
  - Location / remote OK toggle
- Submit → redirects to `/requests/[id]`

### `/requests/[id]` — RFP Detail
- Shows full brief, brand name/logo, category, budget, deadline, location
- **For suppliers:** "Submit Expression of Interest" button → inline form with a message field
- **For brand (owner):** list of responses with supplier name, logo, message — "Shortlist" / "Reject" buttons, contact email visible for shortlisted
- **Status badge:** Open / Closed / Awarded
- Brand can close or mark as awarded from this page

### Dashboard additions
- **Brand dashboard:** "My Requests" card showing their open RFPs and response counts, quick "Post a Request" action
- **Supplier dashboard:** "New Opportunities" section showing 3 recent open RFPs in their category with "View All" link

### `/admin/requests`
- Table of all RFPs: brand, title, status, response count, posted date
- Can view, close, or delete any RFP

---

## Navigation
- Add **"Requests"** link to main nav (between Explore and Offers)
- Update the "Post a Request" button on the Explore page:
  - If user is logged in + has a Brand org → link to `/requests/new`
  - If logged in + no Brand org → tooltip/modal explaining it's for brand members
  - If not logged in → link to `/signup?role=brand` (current behaviour)

---

## Implementation Order

1. **Schema** — add models, run migration
2. **API routes** — CRUD for RFPs, plus response endpoints
3. **`/requests` board page** — list + filters
4. **`/requests/new` form** — create RFP
5. **`/requests/[id]` detail page** — view + respond + manage responses
6. **Dashboard integration** — brand "My Requests", supplier "Opportunities"
7. **Nav + Explore page CTA** — smart link based on auth state
8. **`/admin/requests`** — admin view

---

## What's explicitly out of scope (for now)
- Email notifications (can be added later via existing email infrastructure)
- File attachments on RFPs (brief documents, specs)
- In-platform messaging (brands/suppliers contact via email revealed on shortlist)
- Public RFP board (login-gated only, in keeping with the rest of the platform)
