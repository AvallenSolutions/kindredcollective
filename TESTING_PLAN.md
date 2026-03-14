# Kindred Collective — Full Platform Testing Plan

This plan tests every feature of the platform across all three user roles:
**Admin**, **Brand**, and **Supplier**. Work through each section in order, as later
sections depend on data created in earlier ones.

---

## Test Environment Setup

### Prerequisites
- Working local or staging environment with `.env` configured
- Supabase database connected
- Resend API key configured (or console fallback for email verification)
- A working browser with DevTools open to catch console errors

### Test Accounts to Create
You will create these accounts during the test run:

| Handle | Role | Created In |
|--------|------|------------|
| `admin@test.com` | ADMIN | Pre-seeded or created manually in Supabase |
| `brand@test.com` | MEMBER → Brand user | Section 2 (invite flow) |
| `supplier@test.com` | MEMBER → Supplier user | Section 3 (invite flow) |

### Database Verification Queries
Run these in Supabase SQL editor to verify test data:
```sql
-- Check all users
SELECT id, email, role, "createdAt" FROM "User" ORDER BY "createdAt" DESC LIMIT 10;

-- Check invite links
SELECT token, email, "usedCount", "maxUses", "isActive", "expiresAt" FROM "InviteLink" ORDER BY "createdAt" DESC;

-- Check invite requests
SELECT * FROM "InviteRequest" ORDER BY "createdAt" DESC;

-- Check organisations
SELECT o.name, o.type, om."role", u.email FROM "OrganisationMember" om
JOIN "Organisation" o ON o.id = om."organisationId"
JOIN "User" u ON u.id = om."userId";
```

---

## SECTION 1 — Marketing & Public Pages

### 1.1 Homepage (`/`)
- [ ] Page loads without errors
- [ ] Stats counters show real numbers (suppliers, brands, members, events)
- [ ] Brand marquee scrolls correctly
- [ ] "Get Started" CTA links to `/join`
- [ ] "Login" CTA links to `/login`
- [ ] Navigation links work (About, Join, Login)
- [ ] Footer links work

### 1.2 About Page (`/about`)
- [ ] Page loads without errors
- [ ] Content displays correctly
- [ ] CTA button links to `/join`

### 1.3 Join Page (`/join`)
- [ ] Page loads without errors
- [ ] "Sign Up with Invite" button links to `/signup`
- [ ] "Email Us" button opens email client with correct address
- [ ] WhatsApp button only appears if `NEXT_PUBLIC_WHATSAPP_NUMBER` is set
- [ ] **Submit join request form:**
  - [ ] Fill in all fields (name, email, company, type, message)
  - [ ] Click "Submit Request"
  - [ ] Success confirmation screen appears
  - [ ] Verify DB: `SELECT * FROM "InviteRequest" ORDER BY "createdAt" DESC LIMIT 1;`
  - [ ] Verify email notification sent to `hello@kindredcollective.co.uk` (or console log if no Resend key)
- [ ] **Validation: submit with empty name** → error shown
- [ ] **Validation: submit with invalid email** → error shown

---

## SECTION 2 — Admin User Flows

> **Login as:** `admin@test.com` (must have `role = ADMIN` in the `User` table)

### 2.1 Admin Login
- [ ] Navigate to `/login`
- [ ] Log in with admin credentials
- [ ] Redirected to `/dashboard`
- [ ] Header shows "Admin" link in navigation

### 2.2 Admin Dashboard (`/admin`)
- [ ] Navigate to `/admin`
- [ ] All 7 stat counters load (Users, Invite Links, Brands, Suppliers, Events, Offers, Reviews)
- [ ] Recent users table populates
- [ ] All quick action buttons are visible (Invite Links, Add User, Add Supplier, Add Event, Join Requests)
- [ ] Non-admin users are redirected away from `/admin` → verify by logging in as a member

### 2.3 Invite Link Management (`/admin/invites`)

#### Create a general invite link
- [ ] Click "Create Invite" or navigate to `/admin/invites`
- [ ] Create invite with:
  - Notes: "Test brand invite"
  - Max uses: 1
  - No expiry
- [ ] Invite appears in list
- [ ] Copy invite link button works
- [ ] Token is a valid URL ending in `/signup?invite=TOKEN`

#### Create a targeted invite link (for brand user)
- [ ] Create a new invite link:
  - Email: `brand@test.com`
  - Notes: "Brand user test invite"
  - Max uses: 1
  - Expiry: 7 days from today
- [ ] Record the invite URL for use in Section 3

#### Create a targeted invite link (for supplier user)
- [ ] Create a new invite link:
  - Email: `supplier@test.com`
  - Notes: "Supplier user test invite"
  - Max uses: 1
  - Expiry: 7 days from today
- [ ] Record the invite URL for use in Section 4

#### Manage existing invites
- [ ] Deactivate an invite → status changes to inactive
- [ ] Reactivate the invite → status changes back to active
- [ ] Invites show correct `usedCount` as users sign up

### 2.4 Join Requests (`/admin/join-requests`)
- [ ] Navigate to `/admin/join-requests`
- [ ] The request submitted in Section 1.3 appears in the "Pending" list
- [ ] Request shows: name, email, company, type, message, date
- [ ] "Send Invite" button links to `/admin/invites?prefill=EMAIL`
- [ ] Reviewed requests appear in the "Reviewed" section (requires DB update)

### 2.5 Admin Supplier Management (`/admin/suppliers`)

#### Create a new supplier
- [ ] Click "Add Supplier" → navigate to `/admin/suppliers/new`
- [ ] Fill in all fields:
  - Company Name: "PackTest Co"
  - Slug: "packtest-co"
  - Category: Packaging
  - Tagline: "Test packaging supplier"
  - Description: "A test packaging company for testing purposes."
  - Services: Add 2–3 services
  - Location: London
  - Country: UK
  - Contact Email: `packtest@test.com`
  - Contact Name: "Jane Pack"
  - Website: `https://packtest.com`
  - Set `isPublic = true`
  - Set `isVerified = true`
- [ ] Save supplier
- [ ] Supplier appears in admin list
- [ ] Supplier appears on `/explore` page
- [ ] Navigate to `/explore/packtest-co` → profile loads correctly

#### Edit a supplier
- [ ] Open PackTest Co in admin
- [ ] Change tagline to "Updated tagline"
- [ ] Save
- [ ] Visit `/explore/packtest-co` → updated tagline shows

#### Verify supplier
- [ ] Set `isVerified = true` on a supplier
- [ ] Verified badge appears on supplier card and profile

### 2.6 Admin Event Management (`/admin/events`)

#### Create a new event
- [ ] Click "Add Event" → navigate to `/admin/events/new`
- [ ] Fill in:
  - Title: "Kindred Test Meetup"
  - Slug: "kindred-test-meetup"
  - Type: Networking
  - Status: Published
  - Start Date: 2 weeks from today (pick a future date)
  - End Date: Same day, 2 hours later
  - City: London
  - Country: United Kingdom
  - Description: "A test networking event."
  - isFree: true
  - isFeatured: true
  - showAttendees: true
- [ ] Save event
- [ ] Event appears in `/admin/events` list
- [ ] Navigate to `/events` → featured event section shows "Kindred Test Meetup"
- [ ] Navigate to `/community/events` → event appears

#### Edit an event
- [ ] Open event in admin
- [ ] Change `isFeatured` to false
- [ ] Save
- [ ] Visit `/events` → event is no longer in featured position

#### Create a past event (for past events testing)
- [ ] Create another event with:
  - Title: "Past Test Event"
  - Start Date: 3 months ago (past date)
  - Status: Completed
  - City: Manchester
  - Image URL: any Unsplash URL
- [ ] Visit `/events` → event appears in Past Events section

### 2.7 Admin User Management (`/admin/users`)
- [ ] List loads with all users
- [ ] User search or filter works
- [ ] Click on a user → user details page loads
- [ ] User role is shown correctly
- [ ] **Change role**: update a test user to ADMIN, then back to MEMBER
- [ ] Verify DB: `SELECT email, role FROM "User" WHERE email = 'brand@test.com';`

### 2.8 Admin Review Moderation (`/admin/reviews`)
- [ ] Reviews page loads (may be empty at this point)
- [ ] After reviews are created (Section 3/4), return here to verify they appear
- [ ] Delete a review → review removed from supplier page and count

---

## SECTION 3 — Brand User Registration & Onboarding

### 3.1 Sign Up via Invite Link
- [ ] Open the brand invite URL from Section 2.3 in a new private/incognito window
- [ ] `/signup?invite=TOKEN` page loads
- [ ] Invite validation message shows ("Valid invite")
- [ ] **OAuth signup (Google)**: click "Continue with Google" → completes sign-in → redirected to `/onboarding`
  - OR
- [ ] **Email signup**:
  - First name: "Alice"
  - Last name: "Brand"
  - Email: `brand@test.com`
  - Password: `TestPassword123!`
  - Click "Create Account"
  - Redirected to `/onboarding`
- [ ] Verify DB: `SELECT email, role FROM "User" WHERE email = 'brand@test.com';`

#### Invalid invite tests (in a separate window)
- [ ] Visit `/signup` with no invite token → error shown, cannot proceed
- [ ] Visit `/signup?invite=INVALID_TOKEN` → error shown
- [ ] Use the brand invite URL a second time after it's been used → "Invite already used" error

### 3.2 Onboarding — Brand User (`/onboarding`)

#### Step 1: Profile
- [ ] Profile form appears
- [ ] Fill in:
  - Company: "Sunrise Spirits"
  - Job Title: "Founder"
  - Bio: "Building a sustainable spirits brand"
  - LinkedIn: `https://linkedin.com/in/alice-brand`
- [ ] **Avatar upload**: upload a test image → preview appears
- [ ] Click "Continue"

#### Step 2: Brand Affiliation
- [ ] Option to "Create a Brand" or skip
- [ ] Click "Create a Brand"
- [ ] Fill in:
  - Brand Name: "Sunrise Spirits"
  - Category: Spirits
  - Description: "A premium craft gin brand"
  - Tagline: "Crafted with sunrise botanicals"
- [ ] Submit brand creation
- [ ] Brand appears in confirmation
- [ ] Click "Continue"

#### Step 3: Supplier Affiliation
- [ ] Option to claim/join a supplier or skip
- [ ] Click "Skip" (Alice is a brand, not a supplier)

#### Step 4: Complete
- [ ] Completion screen shown
- [ ] Click "Go to Dashboard"
- [ ] Redirected to `/dashboard`
- [ ] Dashboard shows brand affiliation and stats

### 3.3 Dashboard — Brand User
- [ ] Dashboard loads without errors
- [ ] Brand organisation shown ("Sunrise Spirits")
- [ ] Role shown as "Owner"
- [ ] Stats: saved suppliers (0), events attending (0), offers claimed (0)
- [ ] "Saved Suppliers", "Upcoming Events", "Recent Offers" sections show empty states

### 3.4 Profile Settings (`/dashboard/settings`)
- [ ] Navigate to profile settings
- [ ] Edit bio → save → bio updates
- [ ] Upload new avatar → avatar updates across header/profile
- [ ] Edit LinkedIn URL → save → updates

### 3.5 Explore Suppliers (`/explore`)
- [ ] Page loads with real supplier data (PackTest Co from Section 2.5 should appear)
- [ ] Category filter sidebar shows category counts
- [ ] AI Assistant widget visible in sidebar
- [ ] Category filter works (click "Packaging" → only packaging suppliers shown)
  - Note: sidebar filters are currently UI only (non-functional); confirm this is known
- [ ] Search bar → type "pack" → links to `/search` page

### 3.6 Search Page (`/search`)
- [ ] Navigate to `/search`
- [ ] Type "PackTest" in search box → results appear (real database query, no fake delay)
- [ ] "Matching Suppliers" section shows PackTest Co
- [ ] Click a sample query button → searches and shows results
- [ ] Search with no results → "No results found" message appears
- [ ] "Refine Your Search" input at bottom works

### 3.7 Supplier Profile Page (`/explore/packtest-co`)
- [ ] Full supplier profile loads
- [ ] Company name, tagline, description visible
- [ ] Category, services, location displayed
- [ ] Verified badge shown
- [ ] **Save supplier**: click heart/save button → saved to dashboard
  - Return to dashboard → PackTest Co appears in "Saved Suppliers"
- [ ] **Contact supplier**:
  - Click "Contact" button
  - Fill in subject: "Test enquiry"
  - Fill in message: "This is a test message of at least 20 characters."
  - Submit
  - Success message shown
  - Verify email sent (check Resend dashboard or console log)
- [ ] **Write a review**:
  - Click "Write a Review"
  - Rating: 5 stars
  - Title: "Great supplier"
  - Content: "PackTest Co provided excellent service and quality packaging."
  - Would recommend: Yes
  - Submit
  - Review appears in supplier's reviews section
  - Star rating count updates

### 3.8 Events — Brand User

#### Browse events (`/events`)
- [ ] Events page loads with real data
- [ ] "Kindred Test Meetup" appears in upcoming events
- [ ] Event type, date, location displayed correctly
- [ ] Event type filter buttons visible (non-functional filters are OK)

#### RSVP to an event (`/community/events/kindred-test-meetup`)
- [ ] Navigate to the event detail page
- [ ] RSVP button shows "RSVP" or current status
- [ ] Click "Going" → status changes to "Going"
- [ ] Attendee count increases by 1
- [ ] Dashboard → "Upcoming Events" now shows this event
- [ ] Change RSVP to "Interested" → status updates
- [ ] Change back to "Going"

### 3.9 Offers — Brand User

#### Browse offers (`/offers`)
- [ ] Offers page loads (may be empty — offers will be created in Section 4)
- [ ] Loading state shown briefly then resolves
- [ ] If empty: "No offers available yet" message shown
- [ ] Filter buttons (% Off, £ Off, Free Trials, Bundles) are visible

#### Claim an offer (after supplier creates one in Section 4)
- [ ] Return to `/offers` after Section 4 is complete
- [ ] Offer from PackTest Co appears
- [ ] Promo code displayed
- [ ] Copy code button works (copies to clipboard)
- [ ] Click "Claim Offer" → claim recorded
- [ ] Dashboard → "Recent Offer Claims" shows claimed offer
- [ ] Attempting to claim same offer twice → error or duplicate prevention

### 3.10 News — Brand User (`/news`)
- [ ] Page loads
- [ ] If no news articles in DB: empty state shows "No Articles Yet"
- [ ] If articles exist: category filter works
- [ ] Article bookmark button toggles saved state (client-side only, not persisted)
- [ ] Article external links open in new tab

### 3.11 Community — Brand User (`/community`)
- [ ] Page loads without errors
- [ ] Member auto-creation does not error for existing member
- [ ] Navigate to `/community/brands` → Sunrise Spirits appears
- [ ] Navigate to `/community/members` → Alice Brand appears
- [ ] Navigate to `/community/events` → Kindred Test Meetup appears

### 3.12 Team Management — Brand User (`/settings/team`)
- [ ] Navigate to `/settings/team`
- [ ] "Sunrise Spirits" org shown
- [ ] Alice is listed as Owner
- [ ] Team stats show: 1 member, 1 owner

#### Invite a team member
- [ ] Click "Invite Member"
- [ ] Enter email: `brandteam@test.com`
- [ ] Select role: Member
- [ ] Click "Send Invite"
- [ ] Success message shown
- [ ] Invite appears in pending invites list
- [ ] Verify DB: `SELECT * FROM "OrganisationInvite" ORDER BY "createdAt" DESC LIMIT 1;`
- [ ] Copy invite link button works
- [ ] **Accept invite**: open invite link in new incognito window
  - Sign up or log in as `brandteam@test.com`
  - Accept organisation invite
  - Verify they appear in team list

#### Change member role
- [ ] Once team member added, change role from Member → Admin
- [ ] Role badge updates

#### Remove team member
- [ ] Click remove on team member
- [ ] Confirmation dialog (if any)
- [ ] Member removed from list

#### Transfer ownership (Danger Zone)
- [ ] Transfer ownership to an Admin member
- [ ] Alice's role changes to Admin
- [ ] New owner has full control

### 3.13 Brand Profile in Community (`/community/brands/sunrise-spirits`)
- [ ] Brand profile page loads
- [ ] Name, tagline, description, category shown
- [ ] Location shown
- [ ] Verified status shown

---

## SECTION 4 — Supplier User Registration & Onboarding

### 4.1 Sign Up via Invite Link
- [ ] Open the supplier invite URL from Section 2.3 in a new private/incognito window
- [ ] Invite validates correctly
- [ ] **Email signup**:
  - First name: "Bob"
  - Last name: "Supply"
  - Email: `supplier@test.com`
  - Password: `TestPassword456!`
  - Click "Create Account"
  - Redirected to `/onboarding`

### 4.2 Onboarding — Supplier User (`/onboarding`)

#### Step 1: Profile
- [ ] Fill in:
  - Company: "PackTest Co" (same as admin-created supplier)
  - Job Title: "Sales Manager"
  - Bio: "I handle sales at PackTest Co"
- [ ] Click "Continue"

#### Step 2: Brand Affiliation
- [ ] Click "Skip" (Bob is a supplier, not a brand)

#### Step 3: Supplier Affiliation — Claim existing supplier
- [ ] Select "I work for an existing supplier"
- [ ] Search for "PackTest"
- [ ] "PackTest Co" appears in results
- [ ] Click "Claim this supplier"
- [ ] Claim request submitted
- [ ] Verify DB: `SELECT * FROM "SupplierClaim" ORDER BY "createdAt" DESC LIMIT 1;`
  - Status should be `PENDING`

> **Admin verification step**: Log in as admin, go to `/admin` and verify claim, or use SQL:
> ```sql
> UPDATE "SupplierClaim" SET status = 'CLAIMED' WHERE "userId" = '<bob-user-id>';
> UPDATE "Supplier" SET "claimStatus" = 'CLAIMED' WHERE slug = 'packtest-co';
> UPDATE "Organisation" SET "supplierId" = '<supplier-id>' WHERE type = 'SUPPLIER';
> ```

#### Step 4: Complete
- [ ] Completion screen shown
- [ ] Redirected to `/dashboard`

### 4.3 Dashboard — Supplier User
- [ ] PackTest Co organisation shown
- [ ] Role shown as Owner (or as determined by claim process)
- [ ] Stats initialised at 0

### 4.4 Offer Management (`/settings/offers`)

#### Create a Percentage Discount offer
- [ ] Navigate to `/settings/offers`
- [ ] Click "Create New Offer"
- [ ] Fill in:
  - Title: "10% off for Kindred members"
  - Type: Percentage Discount
  - Discount Value: 10
  - Description: "Exclusive 10% discount for all Kindred Collective members on first orders."
  - Promo Code: `KINDRED10`
  - Terms: "Valid on first order only. Min order £500."
  - Start Date: today
  - End Date: 3 months from today
  - For Brands Only: No
  - Status: Active
- [ ] Save offer
- [ ] Offer appears in list with status "Active"
- [ ] Offer count in stats updates

#### Create a Free Trial offer
- [ ] Click "Create New Offer"
- [ ] Fill in:
  - Title: "Free packaging consultation"
  - Type: Free Trial
  - Description: "Book a free 30-min consultation with our packaging experts."
  - No promo code
  - For Brands Only: Yes
  - Status: Active
- [ ] Save offer

#### Edit an offer
- [ ] Open "10% off for Kindred members"
- [ ] Change promo code to `KINDRED15`, discount to 15
- [ ] Save
- [ ] Changes reflected in the list

#### Pause an offer
- [ ] Change offer status from Active → Paused
- [ ] Offer no longer appears on `/offers` page
- [ ] Reactivate → offer reappears

#### Delete an offer
- [ ] Create a throwaway offer
- [ ] Delete it
- [ ] Offer removed from list and from `/offers` page

### 4.5 Verify Offers Appear for Brand User
- [ ] Log in as `brand@test.com`
- [ ] Navigate to `/offers`
- [ ] "10% off for Kindred members" appears (type filter visible)
- [ ] "Free packaging consultation" appears only if user has brand affiliation
- [ ] Click offer type filter "% Off" → only percentage discount offers shown
- [ ] Clear filter → all offers shown
- [ ] Click "£ Off" filter → shows fixed discount offers (may be 0)

### 4.6 Supplier Explore Profile (`/explore/packtest-co`)
- [ ] Logged in as `supplier@test.com`, navigate to PackTest Co profile
- [ ] Edit button visible (as owner)
- [ ] Offers section shows the two active offers

### 4.7 Portfolio Images (`/api/me/supplier/images`)
- [ ] Navigate to supplier settings / profile edit
- [ ] Upload a portfolio image
- [ ] Image appears in supplier profile gallery

### 4.8 Supplier Reviews (as supplier viewing own reviews)
- [ ] Navigate to `/explore/packtest-co`
- [ ] The review written by Alice (Section 3.7) appears
- [ ] Star rating, title, content, reviewer name visible
- [ ] Average rating calculated correctly

### 4.9 Team Management — Supplier User (`/settings/team`)
- [ ] PackTest Co org shown with Bob as owner
- [ ] Invite a team member: `supplierteam@test.com` as Member role
- [ ] Invite sent; accept in new window
- [ ] Team member appears in list

---

## SECTION 5 — Cross-Role Interaction Tests

### 5.1 Brand contacting Supplier (logged in as brand)
- [ ] Logged in as `brand@test.com`
- [ ] Navigate to `/explore/packtest-co`
- [ ] Click "Contact Supplier"
- [ ] Fill in form with valid subject (any) and message (20+ chars)
- [ ] Submit
- [ ] Success confirmation shown
- [ ] Check Resend dashboard or console for email sent to `packtest@test.com`
- [ ] **Validation**: submit with message under 20 chars → error shown

### 5.2 Supplier without contact email
- [ ] In admin, create a supplier without a contact email
- [ ] As brand user, visit that supplier's profile
- [ ] Contact button should not appear or shows "No contact email configured"

### 5.3 RSVP edge cases
- [ ] As brand user, RSVP "Going" to an event at capacity (set capacity = 1 in admin)
- [ ] Second user tries to RSVP → "Spots remaining: 0" or capacity-full state shown

### 5.4 Saved supplier persists
- [ ] Save PackTest Co as brand user
- [ ] Log out and log back in
- [ ] Saved supplier still appears in dashboard

### 5.5 Offer claim tracking
- [ ] As brand user, claim "10% off for Kindred members"
- [ ] Verify DB: `SELECT * FROM "OfferClaim" WHERE "userId" = '<alice-id>'`;
- [ ] Dashboard shows claimed offer
- [ ] Navigate to `/offers` and attempt to claim same offer again
  - Expect: duplicate claim prevented (unique constraint on offerId + userId)

---

## SECTION 6 — Authentication Edge Cases

### 6.1 Password Reset Flow
- [ ] Log out
- [ ] Navigate to `/login` → click "Forgot password?"
- [ ] Enter `brand@test.com`
- [ ] Click "Send reset email"
- [ ] Check email inbox for reset link
- [ ] Click reset link → `/reset-password` page loads with token
- [ ] Enter new password: `NewPassword123!`
- [ ] Save
- [ ] Log in with new password → successful

### 6.2 Session Persistence
- [ ] Log in as brand user
- [ ] Close browser tab (do not log out)
- [ ] Open new tab, navigate to `/dashboard`
- [ ] Session persists, dashboard loads without re-login

### 6.3 Protected Route Redirect
- [ ] Log out completely
- [ ] Navigate directly to `/dashboard` → redirected to `/login`
- [ ] Navigate directly to `/explore` → redirected to `/login` (if protected)
- [ ] Navigate directly to `/admin` → redirected to `/login`
- [ ] Navigate to `/` (homepage) → accessible without auth ✓

### 6.4 Admin Route Protection
- [ ] Log in as `brand@test.com` (non-admin)
- [ ] Navigate to `/admin` → redirected to `/dashboard`
- [ ] Navigate to `/admin/users` → redirected to `/dashboard`
- [ ] Log in as admin → `/admin` accessible ✓

### 6.5 Logout
- [ ] Click "Logout" in header
- [ ] Redirected to homepage or login
- [ ] Navigate to `/dashboard` → redirected to login
- [ ] Session cookie cleared

### 6.6 OAuth Flow (if configured)
- [ ] Click "Continue with Google" on login page
- [ ] Google OAuth window opens
- [ ] Complete Google auth
- [ ] Redirected to `/dashboard` or `/onboarding`
- [ ] Same for LinkedIn if configured

---

## SECTION 7 — Admin Content Management (Full CRUD)

### 7.1 Admin Offer Management (`/api/admin/offers`)
- [ ] Log in as admin
- [ ] View all offers in admin panel
- [ ] Edit an offer (change title or status)
- [ ] Delete a test offer → gone from `/offers` page
- [ ] Create a new offer for an existing supplier via admin

### 7.2 Admin Event Full CRUD
- [ ] Create a new event (see Section 2.6)
- [ ] Edit event: change title, status, dates
- [ ] Toggle `isFeatured` → verifies featured section on `/events` updates
- [ ] Change status to `CANCELLED` → event removed from upcoming
- [ ] Delete an event (throwaway) → gone from events list
- [ ] Verify DB: `SELECT * FROM "Event" WHERE title = 'Kindred Test Meetup';`

### 7.3 Admin Supplier Management — Full CRUD
- [ ] Edit PackTest Co (change services list)
- [ ] Upload a logo image via admin
- [ ] Toggle `isPublic` to false → supplier disappears from `/explore`
- [ ] Toggle `isPublic` back to true → reappears
- [ ] Delete a throwaway supplier

### 7.4 Admin User Management — Full CRUD
- [ ] View user list with pagination
- [ ] Click on Alice Brand → user detail page loads
- [ ] Edit user: change role to ADMIN temporarily → save
- [ ] Verify Alice now sees Admin link in header
- [ ] Change role back to MEMBER
- [ ] Admin cannot delete themselves (check if this is blocked)

### 7.5 Admin Invite Link Management — Full Control
- [ ] Create invite with expiry in the past → attempt to use → "Invite expired" error
- [ ] Create invite with `maxUses = 2`:
  - Use it once (sign up a user)
  - Use it a second time (sign up another user)
  - Attempt a third use → "Invite fully used" error
- [ ] Deactivate an invite mid-use → use link → "Invite inactive" error
- [ ] View invite usage count increments correctly

### 7.6 Admin Review Management
- [ ] View all reviews
- [ ] Review from Section 3.7 (Alice's review of PackTest Co) visible
- [ ] Delete the review
- [ ] Visit PackTest Co supplier page → review gone, rating updates

---

## SECTION 8 — Full Page & Navigation Audit

Walk through every page and check for visual/functional issues.

### 8.1 Marketing Pages
| Page | URL | Check |
|------|-----|-------|
| Homepage | `/` | Loads, stats real, no broken images |
| About | `/about` | Loads, content correct |
| Join | `/join` | Loads, form functional |

### 8.2 Auth Pages
| Page | URL | Check |
|------|-----|-------|
| Login | `/login` | Form works, OAuth buttons visible |
| Signup | `/signup?invite=TOKEN` | Invite validated, form works |
| Forgot Password | `/forgot-password` | Form submits |
| Reset Password | `/reset-password` | Token in URL, password updates |

### 8.3 Platform Pages (as admin)
| Page | URL | Check |
|------|-----|-------|
| Dashboard | `/dashboard` | Stats, saved items, events, offers |
| Settings | `/dashboard/settings` | Profile editable |
| Explore | `/explore` | Suppliers load, search works |
| Supplier Profile | `/explore/packtest-co` | All sections load |
| Events | `/events` | Featured, upcoming, past load |
| Event Detail | `/community/events/kindred-test-meetup` | RSVP works |
| Offers | `/offers` | Offers load, filters work |
| News | `/news` | Articles load or empty state |
| Search | `/search` | Real results, no delay |
| Community Hub | `/community` | All sections |
| Brands | `/community/brands` | Brand cards |
| Brand Profile | `/community/brands/sunrise-spirits` | Profile loads |
| Members | `/community/members` | Member list |
| Community Events | `/community/events` | Event list |

### 8.4 Settings Pages (as supplier)
| Page | URL | Check |
|------|-----|-------|
| Offers | `/settings/offers` | Create/edit/delete/pause |
| Team | `/settings/team` | Invite, manage, transfer |

### 8.5 Admin Pages
| Page | URL | Check |
|------|-----|-------|
| Dashboard | `/admin` | All stats load |
| Users | `/admin/users` | List, pagination |
| User Detail | `/admin/users/[id]` | Profile shows |
| Add User | `/admin/users/new` | Form functional |
| Suppliers | `/admin/suppliers` | List loads |
| Add Supplier | `/admin/suppliers/new` | Form functional |
| Events | `/admin/events` | List loads |
| Add Event | `/admin/events/new` | Form functional |
| Invites | `/admin/invites` | List, create, copy |
| Reviews | `/admin/reviews` | List, delete |
| Join Requests | `/admin/join-requests` | Pending list, send invite link |

---

## SECTION 9 — Error Handling & Edge Cases

### 9.1 404 Pages
- [ ] Navigate to `/explore/nonexistent-slug` → 404 or "Supplier not found" shown
- [ ] Navigate to `/community/brands/nonexistent` → 404 or "Brand not found"
- [ ] Navigate to `/community/events/nonexistent` → 404 or "Event not found"

### 9.2 Form Validation
- [ ] Join form: empty name → error
- [ ] Supplier contact: message < 20 chars → error
- [ ] Create offer: no title → error (if validation enforced)
- [ ] Invite form: max uses = 0 → validate or reject

### 9.3 Private Supplier Visibility
- [ ] In admin, set a supplier to `isPublic = false`
- [ ] As brand user, verify supplier not visible on `/explore`
- [ ] Navigate directly to supplier URL → 404 or "Supplier not public"

### 9.4 Duplicate Signup Prevention
- [ ] Attempt to sign up with an email already registered
- [ ] Error: "Email already in use" shown

### 9.5 Rate Limiting
- [ ] Submit join form 6+ times in quick succession from same IP
  - 6th request should return rate limit error (limit is 5/10 min)
- [ ] Make 61+ requests to `/api/search` in a minute
  - Should hit rate limit (limit is 30/min)

### 9.6 Unauthenticated API Access
- [ ] Call `GET /api/me` without auth header → 401 Unauthorized
- [ ] Call `POST /api/suppliers/packtest-co/contact` without auth → 401

---

## SECTION 10 — Database Integrity Verification

After completing all sections, run these SQL queries to verify data integrity:

```sql
-- All users created
SELECT email, role, "createdAt" FROM "User" ORDER BY "createdAt" DESC;

-- All invite links and usage
SELECT token, email, notes, "usedCount", "maxUses", "isActive" FROM "InviteLink";

-- All invite requests
SELECT name, email, company, type, reviewed, "createdAt" FROM "InviteRequest";

-- All organisations and members
SELECT o.name, o.type, om.role, u.email
FROM "OrganisationMember" om
JOIN "Organisation" o ON o.id = om."organisationId"
JOIN "User" u ON u.id = om."userId"
ORDER BY o.name;

-- All suppliers
SELECT "companyName", slug, category, "isPublic", "isVerified", "claimStatus"
FROM "Supplier" ORDER BY "createdAt" DESC;

-- All brands
SELECT name, slug, category, "isPublic", "isVerified"
FROM "Brand" ORDER BY "createdAt" DESC;

-- All events
SELECT title, slug, type, status, "startDate", "isFeatured"
FROM "Event" ORDER BY "startDate";

-- All offers
SELECT o.title, o.type, o.status, s."companyName"
FROM "Offer" o JOIN "Supplier" s ON s.id = o."supplierId";

-- All reviews
SELECT sr.rating, sr."reviewerName", s."companyName", sr."isPublic"
FROM "SupplierReview" sr JOIN "Supplier" s ON s.id = sr."supplierId";

-- RSVPs
SELECT e.title, u.email, r.status
FROM "EventRsvp" r
JOIN "Event" e ON e.id = r."eventId"
JOIN "User" u ON u.id = r."userId";

-- Saved suppliers
SELECT s."companyName", u.email
FROM "SavedSupplier" ss
JOIN "Supplier" s ON s.id = ss."supplierId"
JOIN "User" u ON u.id = ss."userId";

-- Claimed offers
SELECT o.title, u.email, oc."claimedAt"
FROM "OfferClaim" oc
JOIN "Offer" o ON o.id = oc."offerId"
JOIN "User" u ON u.id = oc."userId";
```

---

## SECTION 11 — Mobile & Responsive Testing

Test on mobile viewport (375px) or use DevTools device emulation:

- [ ] Homepage: hero, marquee, bento grid stack correctly
- [ ] Header: hamburger menu opens/closes, links work
- [ ] Explore: single-column supplier grid
- [ ] Events: date widget + event card stack vertically
- [ ] Offers: 2-col grid on mobile (or single column)
- [ ] Join form: full-width inputs, buttons stack
- [ ] Admin dashboard: stat cards wrap to 2 columns
- [ ] Settings/team: table scrolls horizontally on mobile

---

## SECTION 12 — Pre-Launch Checklist

### Environment Variables (verify all set in production)
- [ ] `NEXT_PUBLIC_SUPABASE_URL`
- [ ] `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- [ ] `SUPABASE_SERVICE_ROLE_KEY`
- [ ] `DATABASE_URL`
- [ ] `DIRECT_URL`
- [ ] `RESEND_API_KEY` → emails are actually sent (not just logged)
- [ ] `NEXT_PUBLIC_APP_URL` → invite links point to correct domain
- [ ] `NEXT_PUBLIC_WHATSAPP_NUMBER` → set if WhatsApp button should appear on join page
- [ ] Google OAuth: `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET` (if using)
- [ ] LinkedIn OAuth: `LINKEDIN_CLIENT_ID`, `LINKEDIN_CLIENT_SECRET` (if using)

### Database Migration
- [ ] Run `prisma migrate deploy` (production) or `prisma db push` (staging)
  - Adds `InviteRequest` table
  - Adds `category` column to `NewsArticle`

### Seed Data Check
- [ ] At least 1 admin user exists with `role = 'ADMIN'` in `User` table
- [ ] Suppliers are seeded (`prisma db seed` if needed)
- [ ] News articles exist in `NewsArticle` (or empty state is acceptable)

### Performance Checks
- [ ] Supplier explore page loads in < 3 seconds
- [ ] Dashboard loads in < 3 seconds
- [ ] No N+1 query issues (check Supabase logs)

### Security Checks
- [ ] Invite-only: cannot sign up without valid invite token
- [ ] Admin routes reject non-admin users
- [ ] API routes return 401 for unauthenticated requests
- [ ] Contact form rate-limited (5/10 min)
- [ ] Search rate-limited (30/min)
- [ ] No sensitive data in client-side code or public API responses

---

## Test Summary Tracker

| Section | Description | Status | Issues |
|---------|-------------|--------|--------|
| 1 | Marketing & Public Pages | ⬜ | |
| 2 | Admin User Flows | ⬜ | |
| 3 | Brand Registration & Features | ⬜ | |
| 4 | Supplier Registration & Features | ⬜ | |
| 5 | Cross-Role Interactions | ⬜ | |
| 6 | Auth Edge Cases | ⬜ | |
| 7 | Admin Content Management | ⬜ | |
| 8 | Full Page Audit | ⬜ | |
| 9 | Error Handling | ⬜ | |
| 10 | Database Integrity | ⬜ | |
| 11 | Mobile Responsive | ⬜ | |
| 12 | Pre-Launch Checklist | ⬜ | |

**Legend:** ⬜ Not started · 🔄 In progress · ✅ Passed · ❌ Failed · ⚠️ Issues found
