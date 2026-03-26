# Stripe Setup Guide (WorkForce)

This guide walks you through configuring Stripe subscriptions for this app.

## 1) Get your Stripe API keys

1. Sign in to Stripe Dashboard: https://dashboard.stripe.com/
2. Open **Developers → API keys**: https://dashboard.stripe.com/test/apikeys
3. Copy:
   - **Secret key** (`sk_test_...`) for local/test mode
   - Use `sk_live_...` only when going live

You will place this in:
- `STRIPE_SECRET_KEY`

---

## 2) Create recurring Price objects

You need two monthly recurring prices:

- **PRO** = `$29/month`
- **ADVANCED** = `$59/month`

### Option A: Dashboard UI
1. Go to **Product Catalog**: https://dashboard.stripe.com/test/products
2. Create product: `WorkForce Pro`
   - Add price: `29 USD`
   - Billing period: `Monthly`
3. Create product: `WorkForce Advanced`
   - Add price: `59 USD`
   - Billing period: `Monthly`
4. Copy the generated Price IDs (`price_...`)

Set them as:
- `STRIPE_PRICE_PRO=price_...`
- `STRIPE_PRICE_ADVANCED=price_...`

### Option B: Stripe CLI
```bash
stripe products create --name "WorkForce Pro"
stripe prices create --unit-amount 2900 --currency usd --recurring interval=month --product <PRO_PRODUCT_ID>

stripe products create --name "WorkForce Advanced"
stripe prices create --unit-amount 5900 --currency usd --recurring interval=month --product <ADV_PRODUCT_ID>
```

---

## 3) Set up webhook endpoint

Your app expects:
- Local/Prod route: `/api/stripe/webhook`

### Local webhook (recommended during development)
Run:
```bash
stripe listen --forward-to localhost:3000/api/stripe/webhook
```

Stripe CLI will print a signing secret like `whsec_...`.
Set it as:
- `STRIPE_WEBHOOK_SECRET=whsec_...`

### Production webhook
1. Go to **Developers → Webhooks**: https://dashboard.stripe.com/webhooks
2. Add endpoint:
   - `https://your-domain.com/api/stripe/webhook`
3. Subscribe to required events (typically):
   - `checkout.session.completed`
   - `customer.subscription.created`
   - `customer.subscription.updated`
   - `customer.subscription.deleted`
4. Copy the endpoint signing secret and set `STRIPE_WEBHOOK_SECRET` in production env.

---

## 4) Test with Stripe CLI

Start app locally, then in a new terminal:

```bash
stripe listen --forward-to localhost:3000/api/stripe/webhook
```

Optional: trigger test events:

```bash
stripe trigger checkout.session.completed
stripe trigger customer.subscription.updated
```

---

## 5) Test card numbers

Use these in Stripe Checkout (test mode):

- **Success:** `4242 4242 4242 4242`
- **Requires authentication (3DS):** `4000 0025 0000 3155`
- **Declined:** `4000 0000 0000 9995`

Use any future expiration date, any 3-digit CVC, any ZIP.

---

## 6) Populate `.env.local`

Update `/Users/vitachums/.openclaw/workspace/workforce-app/.env.local`:

```env
STRIPE_SECRET_KEY=sk_test_xxx
STRIPE_WEBHOOK_SECRET=whsec_xxx
STRIPE_PRICE_PRO=price_xxx
STRIPE_PRICE_ADVANCED=price_xxx
```

Then restart your dev server so env changes are applied.

---

## 7) Pre-Go-Live checklist

- [ ] Using correct keys for environment (`sk_test` for test, `sk_live` for prod)
- [ ] PRO and ADVANCED Price IDs are correct and active
- [ ] Webhook endpoint reachable in production
- [ ] `STRIPE_WEBHOOK_SECRET` matches the exact endpoint/CLI listener
- [ ] Checkout flow creates/upgrades subscriptions correctly
- [ ] Portal/cancellation flow works as expected
- [ ] Trial-expired users are gated and prompted to upgrade
- [ ] Test successful + failed payment scenarios

---

## Quick reference

- API keys: https://dashboard.stripe.com/test/apikeys
- Products/Prices: https://dashboard.stripe.com/test/products
- Webhooks: https://dashboard.stripe.com/webhooks
- Stripe CLI docs: https://docs.stripe.com/stripe-cli
