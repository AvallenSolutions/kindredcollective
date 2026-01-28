# Kindred Collective - Testing Guide

This guide covers comprehensive testing scenarios for the private membership and team management system.

## Test Environment Setup

Before testing, ensure:
1. Database migrations are applied: `npm run db:migrate`
2. Environment variables are set (DATABASE_URL, SUPABASE keys)
3. Development server is running: `npm run dev`
4. You have admin access to create invite links

---

## Test Scenarios

### 1. Admin Invite Link Management

**Objective**: Verify admins can create, manage, and deactivate invite links.

#### 1.1 Create Invite Link (Unlimited)
- [ ] Navigate to `/admin/invites`
- [ ] Click "Generate New Invite Link"
- [ ] Leave expiry and max uses empty
- [ ] Add notes (optional)
- [ ] Click "Generate Invite"
- [ ] **Expected**: New invite appears in active invites list
- [ ] **Expected**: Can copy invite URL

#### 1.2 Create Invite Link (With Expiry)
- [ ] Generate invite with expiry date 7 days from now
- [ ] **Expected**: Invite shows expiry date
- [ ] **Expected**: usedCount = 0

#### 1.3 Create Invite Link (With Max Uses)
- [ ] Generate invite with maxUses = 5
- [ ] **Expected**: Invite shows "0/5 uses"

#### 1.4 View Invite Statistics
- [ ] Check dashboard stats
- [ ] **Expected**: Total invites count
- [ ] **Expected**: Active invites count
- [ ] **Expected**: Total signups count

#### 1.5 Deactivate Invite Link
- [ ] Click deactivate on an active invite
- [ ] **Expected**: Invite moves to inactive list
- [ ] **Expected**: Can no longer be used for signup

#### 1.6 Delete Invite Link
- [ ] Click delete on an invite
- [ ] Confirm deletion
- [ ] **Expected**: Invite removed from list

---

### 2. Signup Flow - Email/Password

**Objective**: Verify private membership with invite-only signup.

#### 2.1 Signup Without Invite Token
- [ ] Navigate to `/signup` (no query params)
- [ ] **Expected**: Shows "Invite Required" page
- [ ] **Expected**: Error message displayed
- [ ] **Expected**: Cannot proceed to signup form
- [ ] **Expected**: Link to login page

#### 2.2 Signup With Invalid Invite Token
- [ ] Navigate to `/signup?invite=invalid-token-12345`
- [ ] **Expected**: Shows "Invalid invite link" error
- [ ] **Expected**: Cannot proceed to signup form

#### 2.3 Signup With Expired Invite Token
- [ ] Create invite with expiry date in the past
- [ ] Navigate to `/signup?invite=<expired-token>`
- [ ] **Expected**: Shows expired invite error

#### 2.4 Signup With Maxed Out Invite
- [ ] Create invite with maxUses = 1
- [ ] Use it to create one account
- [ ] Try to use same invite again
- [ ] **Expected**: Shows max uses reached error

#### 2.5 Successful Brand Signup
- [ ] Create valid invite link
- [ ] Navigate to `/signup?invite=<token>`
- [ ] **Expected**: Invite validates successfully
- [ ] Select "I'm a Brand" role
- [ ] Fill in first name, last name, email, password
- [ ] Click "Create Account"
- [ ] **Expected**: Account created successfully
- [ ] **Expected**: Redirected to `/onboarding`
- [ ] **Expected**: Invite usedCount incremented

#### 2.6 Successful Supplier Signup
- [ ] Use valid invite link
- [ ] Select "I'm a Supplier" role
- [ ] Complete signup form
- [ ] **Expected**: Account created with SUPPLIER role
- [ ] **Expected**: Redirected to `/onboarding`

---

### 3. Signup Flow - OAuth (Google/LinkedIn)

**Objective**: Verify OAuth respects invite requirements.

#### 3.1 OAuth Signup Without Invite (Security Test)
- [ ] Navigate to `/login` (not signup page)
- [ ] Click "Continue with Google" or LinkedIn
- [ ] Complete OAuth flow with NEW Google account
- [ ] **Expected**: Redirected back to signup with error
- [ ] **Expected**: User account NOT created
- [ ] **Expected**: Error message about required invite

#### 3.2 OAuth Signup With Valid Invite
- [ ] Create valid invite link
- [ ] Navigate to `/signup?invite=<token>`
- [ ] Validate invite works
- [ ] Select "I'm a Brand" role
- [ ] Click "Continue with Google"
- [ ] Complete OAuth with NEW account
- [ ] **Expected**: User created with BRAND role
- [ ] **Expected**: inviteLinkToken stored in User record
- [ ] **Expected**: Invite usedCount incremented
- [ ] **Expected**: Redirected to `/onboarding`

#### 3.3 OAuth Login (Existing User)
- [ ] Navigate to `/login`
- [ ] Click "Continue with Google"
- [ ] Use existing Google account (already signed up)
- [ ] **Expected**: Login successful without invite
- [ ] **Expected**: Redirected to `/dashboard`

---

### 4. Onboarding Flow - Brand

**Objective**: Verify brand users can create profiles and organizations.

#### 4.1 Brand - Create New Brand
- [ ] Complete signup as BRAND user
- [ ] On onboarding page, click "Create New Brand"
- [ ] Fill in brand details:
  - Name
  - Category
  - Description
  - Logo URL (optional)
- [ ] Click "Create Brand"
- [ ] **Expected**: Brand created in database
- [ ] **Expected**: Organisation created with type=BRAND
- [ ] **Expected**: User added as OWNER of organisation
- [ ] **Expected**: Redirected to `/dashboard`
- [ ] **Expected**: Member profile created

#### 4.2 Brand - Join Existing Team
- [ ] Have another brand user create an organisation
- [ ] Have them generate an org invite
- [ ] Signup as new BRAND user
- [ ] On onboarding, click "Join My Team"
- [ ] Enter organisation invite token
- [ ] **Expected**: Token validates
- [ ] **Expected**: Shows organisation name
- [ ] Click "Join Team"
- [ ] **Expected**: Added to organisation as MEMBER
- [ ] **Expected**: Redirected to `/dashboard`

---

### 5. Onboarding Flow - Supplier

**Objective**: Verify supplier users can claim, create, or join.

#### 5.1 Supplier - Claim Existing Supplier
- [ ] Ensure database has unclaimed suppliers
- [ ] Complete signup as SUPPLIER user
- [ ] Click "Claim My Supplier"
- [ ] Search for supplier by name
- [ ] **Expected**: Search returns results
- [ ] **Expected**: Only unclaimed suppliers shown
- [ ] Select supplier from results
- [ ] Click "Claim This Supplier"
- [ ] **Expected**: Supplier claimStatus = CLAIMED
- [ ] **Expected**: Supplier.userId = current user
- [ ] **Expected**: Organisation created for supplier
- [ ] **Expected**: User added as OWNER
- [ ] **Expected**: Redirected to `/dashboard`

#### 5.2 Supplier - Create New Supplier
- [ ] Complete signup as SUPPLIER user
- [ ] Click "Create New Supplier"
- [ ] Fill in supplier details:
  - Company name
  - Category
  - Services
  - Description
- [ ] Click "Create Supplier"
- [ ] **Expected**: Supplier created with claimStatus=CLAIMED
- [ ] **Expected**: Organisation created
- [ ] **Expected**: User is OWNER
- [ ] **Expected**: Redirected to `/dashboard`

#### 5.3 Supplier - Join Existing Team
- [ ] Have existing supplier create org invite
- [ ] Signup as new SUPPLIER user
- [ ] Click "Join My Team"
- [ ] Enter org invite token
- [ ] Validate and join
- [ ] **Expected**: Added to supplier's organisation
- [ ] **Expected**: Role = MEMBER

---

### 6. Team Management - Invitations

**Objective**: Verify owners and admins can invite team members.

#### 6.1 Owner Invites Admin
- [ ] Login as OWNER
- [ ] Navigate to `/settings/team`
- [ ] Click "Invite Team Member"
- [ ] Enter email address
- [ ] Select role = "ADMIN"
- [ ] Click "Send Invite"
- [ ] **Expected**: Invite created
- [ ] **Expected**: Invite URL displayed to copy
- [ ] **Expected**: Invite appears in pending invites

#### 6.2 Owner Invites Member
- [ ] Login as OWNER
- [ ] Invite user with role = "MEMBER"
- [ ] **Expected**: Invite created successfully

#### 6.3 Admin Invites Member
- [ ] Login as ADMIN
- [ ] Try to invite user with role = "MEMBER"
- [ ] **Expected**: Invite created successfully

#### 6.4 Admin Tries to Invite Admin (Should Fail)
- [ ] Login as ADMIN (not OWNER)
- [ ] Try to invite user with role = "ADMIN"
- [ ] **Expected**: Error: "Only the owner can invite admins"

#### 6.5 Member Tries to Invite (Should Fail)
- [ ] Login as MEMBER (not admin/owner)
- [ ] Navigate to `/settings/team`
- [ ] **Expected**: No invite button visible OR
- [ ] **Expected**: Invite button disabled OR
- [ ] **Expected**: API returns 403 Forbidden

#### 6.6 Check Existing Member Invite (Should Fail)
- [ ] Try to invite email that's already in organisation
- [ ] **Expected**: Error: "User already member"

#### 6.7 Accept Organisation Invite
- [ ] Use valid org invite to signup
- [ ] Complete onboarding with "Join Team" flow
- [ ] **Expected**: Added to organisation
- [ ] **Expected**: Role assigned correctly
- [ ] **Expected**: Invite marked as accepted

---

### 7. Team Management - Member Roles

**Objective**: Verify role changes and permission enforcement.

#### 7.1 Owner Promotes Member to Admin
- [ ] Login as OWNER
- [ ] Navigate to `/settings/team`
- [ ] Find MEMBER in team list
- [ ] Click role dropdown, select "ADMIN"
- [ ] Confirm change
- [ ] **Expected**: Member role updated to ADMIN
- [ ] **Expected**: UI reflects new role immediately

#### 7.2 Owner Demotes Admin to Member
- [ ] Login as OWNER
- [ ] Change ADMIN role to MEMBER
- [ ] **Expected**: Successfully demoted

#### 7.3 Admin Tries to Change Another Admin (Should Fail)
- [ ] Login as ADMIN (not OWNER)
- [ ] Try to change another admin's role
- [ ] **Expected**: Error: "Only owner can change admin roles"

#### 7.4 Admin Demotes Member to Lower Role
- [ ] Login as ADMIN
- [ ] Change MEMBER role
- [ ] **Expected**: Should work (admins can manage members)

#### 7.5 Member Tries to Change Roles (Should Fail)
- [ ] Login as MEMBER
- [ ] Try to access role management
- [ ] **Expected**: 403 Forbidden or UI hidden

---

### 8. Team Management - Remove Members

**Objective**: Verify member removal and permission enforcement.

#### 8.1 Owner Removes Member
- [ ] Login as OWNER
- [ ] Navigate to team settings
- [ ] Click "Remove" on MEMBER
- [ ] Confirm removal
- [ ] **Expected**: Member removed from organisation
- [ ] **Expected**: Member no longer in list

#### 8.2 Owner Removes Admin
- [ ] Login as OWNER
- [ ] Remove an ADMIN
- [ ] **Expected**: Successfully removed

#### 8.3 Admin Removes Member
- [ ] Login as ADMIN
- [ ] Remove a MEMBER
- [ ] **Expected**: Successfully removed

#### 8.4 Admin Tries to Remove Another Admin (Should Fail)
- [ ] Login as ADMIN
- [ ] Try to remove another ADMIN
- [ ] **Expected**: Error: "Only owner can remove admins"

#### 8.5 Admin Tries to Remove Owner (Should Fail)
- [ ] Login as ADMIN
- [ ] Try to remove OWNER
- [ ] **Expected**: Error: "Cannot remove owner"

#### 8.6 User Tries to Remove Self (Should Fail)
- [ ] Login as any user
- [ ] Try to remove yourself
- [ ] **Expected**: Error: "Cannot remove yourself"

#### 8.7 Member Tries to Remove Anyone (Should Fail)
- [ ] Login as MEMBER
- [ ] Try to remove any member
- [ ] **Expected**: 403 Forbidden

---

### 9. Ownership Transfer

**Objective**: Verify ownership can be transferred to admins.

#### 9.1 Owner Transfers to Admin
- [ ] Login as OWNER
- [ ] Navigate to team settings "Danger Zone"
- [ ] Click "Transfer Ownership"
- [ ] Select an ADMIN from dropdown
- [ ] Confirm transfer
- [ ] **Expected**: Selected admin becomes OWNER
- [ ] **Expected**: Previous owner becomes ADMIN
- [ ] **Expected**: UI updates to show new owner

#### 9.2 Owner Tries to Transfer to Member (Should Fail)
- [ ] Login as OWNER
- [ ] Try to transfer ownership to MEMBER (not admin)
- [ ] **Expected**: Error: "Must be admin to receive ownership"
- [ ] **Alternative**: MEMBERs not shown in dropdown

#### 9.3 Owner Tries to Transfer to Self (Should Fail)
- [ ] Login as OWNER
- [ ] Try to transfer to yourself
- [ ] **Expected**: Error: "You are already the owner"

#### 9.4 Admin Tries to Transfer Ownership (Should Fail)
- [ ] Login as ADMIN (not owner)
- [ ] Try to access ownership transfer
- [ ] **Expected**: 403 Forbidden or UI hidden

---

### 10. Community Page

**Objective**: Verify all users appear on community page.

#### 10.1 View All Members
- [ ] Create multiple users (brands and suppliers)
- [ ] Navigate to `/community`
- [ ] **Expected**: All members visible
- [ ] **Expected**: Both brand and supplier members shown
- [ ] **Expected**: Member profiles display correctly

#### 10.2 Filter by Role
- [ ] Filter to show only brands
- [ ] **Expected**: Only brand members shown
- [ ] Filter to show only suppliers
- [ ] **Expected**: Only supplier members shown

---

### 11. Login Flow

**Objective**: Verify existing users can login without invites.

#### 11.1 Login with Email/Password
- [ ] Use existing account credentials
- [ ] Navigate to `/login`
- [ ] Enter email and password
- [ ] Click "Sign In"
- [ ] **Expected**: Login successful
- [ ] **Expected**: No invite required
- [ ] **Expected**: Redirected to `/dashboard`

#### 11.2 Login with OAuth (Existing Account)
- [ ] Navigate to `/login`
- [ ] Click "Continue with Google"
- [ ] Use account that already signed up
- [ ] **Expected**: Login successful without invite
- [ ] **Expected**: Redirected to `/dashboard`

---

### 12. Edge Cases & Security

#### 12.1 Multiple Signups with Same Invite
- [ ] Create invite with no max uses
- [ ] Use it to create 3 different accounts
- [ ] **Expected**: All signups successful
- [ ] **Expected**: usedCount = 3

#### 12.2 Concurrent Signup at Max Uses
- [ ] Create invite with maxUses = 1, usedCount = 0
- [ ] Attempt 2 signups simultaneously
- [ ] **Expected**: Only one succeeds
- [ ] **Expected**: Second gets "max uses reached" error

#### 12.3 Reactivate Deactivated Invite
- [ ] Deactivate an invite
- [ ] Try to use it for signup
- [ ] **Expected**: Rejected as inactive
- [ ] Reactivate the invite
- [ ] Try signup again
- [ ] **Expected**: Now works

#### 12.4 User Cannot Switch Roles
- [ ] Signup as BRAND
- [ ] Complete onboarding as brand
- [ ] Try to access supplier onboarding flow
- [ ] **Expected**: Cannot switch to supplier
- [ ] **Expected**: Must create new account

#### 12.5 Organisation Deletion (Future Enhancement)
- [ ] Login as OWNER
- [ ] Transfer ownership to admin
- [ ] Leave/delete your account
- [ ] **Expected**: Organisation still exists
- [ ] **Expected**: New owner can manage team

---

## Database Verification Queries

After completing test scenarios, verify database state:

```sql
-- Check invite usage
SELECT token, isActive, usedCount, maxUses, expiresAt
FROM "InviteLink"
ORDER BY createdAt DESC;

-- Check user invite tracking
SELECT email, role, "inviteLinkToken"
FROM "User"
ORDER BY createdAt DESC;

-- Check organisation structure
SELECT o.name, o.type, om.role, u.email
FROM "Organisation" o
JOIN "OrganisationMember" om ON o.id = om."organisationId"
JOIN "User" u ON om."userId" = u.id
ORDER BY o.name, om.role;

-- Check ownership distribution
SELECT o.name, COUNT(*) as member_count,
       SUM(CASE WHEN om.role = 'OWNER' THEN 1 ELSE 0 END) as owners,
       SUM(CASE WHEN om.role = 'ADMIN' THEN 1 ELSE 0 END) as admins,
       SUM(CASE WHEN om.role = 'MEMBER' THEN 1 ELSE 0 END) as members
FROM "Organisation" o
JOIN "OrganisationMember" om ON o.id = om."organisationId"
GROUP BY o.name;
```

---

## Expected Outcomes Summary

### ✅ Invite System
- Only users with valid invite links can signup
- Expired/inactive/maxed invites are rejected
- OAuth signups require invite tokens
- Invite usage is tracked accurately
- Admins can manage invite links

### ✅ Onboarding
- Brand users create new brands + organisations
- Supplier users can claim/create suppliers + organisations
- First user becomes OWNER automatically
- Users can join existing teams via org invites
- All users redirected to dashboard after onboarding

### ✅ Team Management
- Owners have full control
- Admins can manage members but not other admins
- Members have no management permissions
- Cannot remove self or owner
- Ownership transfer works correctly

### ✅ Security
- No public signup allowed
- OAuth respects invite requirements
- Role-based permissions enforced
- Cannot bypass invite with OAuth login
- Proper error messages for all failure cases

---

## Reporting Issues

When reporting issues, include:
1. Test scenario number and description
2. Steps to reproduce
3. Expected behavior
4. Actual behavior
5. Screenshots (if applicable)
6. Browser/environment details
7. Database state (relevant tables)

---

## Next Steps After Testing

1. Document any bugs found
2. Prioritize fixes by severity
3. Retest after fixes
4. Conduct user acceptance testing
5. Prepare for production deployment
