# GeniusPay Integration Specification

## Overview
Integrate GeniusPay as the official payment solution for vendor professional subscriptions (5,000 FCFA/month) in GazPoints.

## Architecture Decisions

### Database Schema
New tables:
- `vendor_subscription` - Tracks vendor subscription status, period, payment reference
- `payment_transaction` - Records all GeniusPay transactions with full metadata

### Payment Flow
1. Vendor registers → email verified → redirected to payment page
2. Vendor clicks "Payer 5 000 FCFA" → server creates GeniusPay payment
3. Server returns `checkout_url` → frontend redirects to GeniusPay checkout
4. Vendor pays via Mobile Money (Orange/MTN Cameroon) or Card
5. GeniusPay sends webhook (`payment.success`/`payment.failed`)
6. Server verifies webhook signature → updates subscription + transaction
7. Vendor redirected to success/error page → dashboard reflects active subscription

### Security Rules
- **Amount fixed server-side**: 5000 XAF (never from client)
- **Currency**: XAF (Cameroon uses XAF, GeniusPay supports it)
- **Secret keys**: Only server-side (X-API-Secret, webhook secret)
- **Idempotency**: Use `metadata.transaction_id` + webhook signature verification
- **Double activation prevention**: Check subscription status before activating
- **Verification**: Always verify payment status via GeniusPay API on webhook receipt

## Files to Create/Modify

### New Files
1. `db/schema.ts` - Add `vendorSubscription` and `paymentTransaction` tables
2. `lib/geniuspay.ts` - GeniusPay server client
3. `lib/geniuspay-webhook.ts` - Webhook verification utilities
4. `app/api/payment/initiate/route.ts` - Initiate payment
5. `app/api/payment/webhook/route.ts` - Handle webhooks
6. `app/api/payment/verify/[reference]/route.ts` - Verify payment status
7. `app/(auth)/paiement/abonnement/page.tsx` - Payment page
8. `app/(auth)/paiement/succes/page.tsx` - Success page
9. `app/(auth)/paiement/echec/page.tsx` - Error page
10. `drizzle/0015_geniuspay_subscription.sql` - Migration

### Modified Files
1. `app/(auth)/inscription/vendeur/page.tsx` - Redirect to payment after email verification
2. `app/_components/vendor-layout.tsx` - Show subscription status
3. `app/dashboard/vendeur/page.tsx` - Check subscription status
4. `app/admin/(protected)/vendeurs/page.tsx` - Show subscription info
5. `lib/env.ts` - Add GeniusPay env validation
6. `lib/auth.ts` - Add subscription check in session hook (optional)

## Environment Variables Required
```
GENIUSPAY_API_KEY=pk_sandbox_xxx
GENIUSPAY_API_SECRET=sk_sandbox_xxx
GENIUSPAY_WEBHOOK_SECRET=whsec_xxx
GENIUSPAY_ENV=sandbox
NEXT_PUBLIC_SITE_URL=https://gazpoints.com
```

## GeniusPay Cameroon Support
- Country: CM (Cameroon)
- Currency: XAF
- Providers: MTN_MOMO_CMR, ORANGE_CMR
- Auto-routing via phone number detection

## Testing Checklist (Sandbox Only)
- [ ] Payment successful (test card/Mobile Money)
- [ ] Payment failed (insufficient funds)
- [ ] Payment cancelled by user
- [ ] Payment pending (timeout)
- [ ] Webhook received multiple times (idempotency)
- [ ] User returns to success page without webhook
- [ ] Verify non-existent reference
- [ ] Attempt payment with falsified amount (client-side tampering)

## Acceptance Criteria
1. Vendor can subscribe via GeniusPay checkout
2. Subscription activates ONLY on confirmed webhook + API verification
3. Dashboard shows active/inactive subscription status
4. Admin can view all vendor payments
5. No double activation possible
6. All transactions logged with GeniusPay reference
7. TypeScript, lint, and build pass