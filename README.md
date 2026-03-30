# Nova

Overnight newborn care marketplace for the DC/MD/VA area. Families browse vetted night nannies, newborn care specialists, postpartum doulas, and registered nurses — with live availability, verified credentials, and direct booking.

Built for NOVA Birth Partners.

---

## Tech stack

| Layer | Technology |
|---|---|
| Frontend | React 18, Vite, Tailwind CSS |
| Backend | FastAPI (Python 3.11), SQLAlchemy 2 |
| Database | PostgreSQL 15 + PostGIS |
| Auth | Clerk (JWTs verified via JWKS) |
| Payments | Stripe Connect |
| Local dev | Docker Compose |

---

## Prerequisites

- Docker & Docker Compose
- A [Clerk](https://clerk.com) account (free tier works)
- A [Stripe](https://stripe.com) account (test mode works)

---

## Getting started

### 1. Clone and configure

```bash
cp .env.example .env
```

Fill in `.env`:

```env
# Clerk — from clerk.com dashboard → API Keys
CLERK_PUBLISHABLE_KEY=pk_test_...
CLERK_SECRET_KEY=sk_test_...
CLERK_WEBHOOK_SECRET=whsec_...

# Stripe — from stripe.com dashboard → Developers → API Keys
STRIPE_SECRET_KEY=sk_test_...
STRIPE_WEBHOOK_SECRET=whsec_...
```

### 2. Configure Clerk JWKS URL

In [backend/app/config.py](backend/app/config.py), update `CLERK_JWKS_URL` to match your Clerk instance:

```python
CLERK_JWKS_URL: str = "https://<your-clerk-frontend-api>/.well-known/jwks.json"
```

Your frontend API domain is the hostname portion of your `CLERK_PUBLISHABLE_KEY` (e.g. `clerk.your-app.com`).

### 3. Start services

```bash
docker-compose up
```

This starts:
- **PostgreSQL + PostGIS** on port 5432
- **FastAPI backend** on port 8000 (hot reload)
- **React frontend** on port 5173 (hot reload)

### 4. Run migrations

```bash
docker-compose exec backend alembic upgrade head
```

### 5. Configure Clerk webhook

In your Clerk dashboard → Webhooks, add an endpoint:

```
http://localhost:8000/webhooks/clerk
```

Subscribe to events: `user.created`, `user.updated`, `user.deleted`

Copy the signing secret into `CLERK_WEBHOOK_SECRET` in `.env`.

### 6. Configure Stripe price IDs

Replace the placeholder price IDs in [backend/app/routers/payments.py](backend/app/routers/payments.py):

```python
PLAN_PRICE_IDS = {
    PlanType.family_basic: "price_...",       # your Stripe price IDs
    PlanType.provider_basic: "price_...",
    PlanType.provider_boosted: "price_...",
}
```

---

## Project structure

```
Nova/
├── docker-compose.yml
├── .env.example
├── backend/
│   ├── Dockerfile
│   ├── requirements.txt
│   ├── alembic.ini
│   ├── alembic/
│   │   └── versions/
│   │       └── 0001_initial_schema.py   # Full schema + PostGIS
│   └── app/
│       ├── main.py                      # FastAPI app, CORS
│       ├── config.py                    # Settings from env
│       ├── database.py                  # SQLAlchemy session
│       ├── middleware/
│       │   └── auth.py                  # Clerk JWT verification
│       ├── models/
│       │   ├── user.py
│       │   ├── provider.py              # ProviderProfile, Certifications, Availability
│       │   ├── arrangement.py
│       │   ├── review.py
│       │   ├── scheduling.py            # ScheduledCall
│       │   └── subscription.py
│       ├── schemas/                     # Pydantic request/response models
│       └── routers/
│           ├── webhooks.py              # Clerk webhook sync
│           ├── users.py
│           ├── providers.py             # Browse, apply, profile, dashboard
│           ├── certifications.py
│           ├── availability.py
│           ├── arrangements.py          # Arrangements, reviews, calls
│           ├── admin.py                 # Admin approval queue
│           └── payments.py             # Stripe Connect + subscriptions
└── frontend/
    ├── index.html
    ├── vite.config.js
    ├── tailwind.config.js
    └── src/
        ├── App.jsx                      # Routes + auth guards
        ├── main.jsx                     # Clerk provider
        ├── api/
        │   └── client.js                # Axios client, all API functions
        ├── context/
        │   └── AuthContext.jsx          # Clerk + DB user state
        ├── components/
        │   ├── layout/                  # Navbar, Footer
        │   └── ui/                      # ProviderCard, StarRating,
        │                                # StatusBadge, LoadingSpinner
        └── pages/
            ├── Landing.jsx
            ├── SignIn.jsx / SignUp.jsx
            ├── DashboardRedirect.jsx    # Role-based redirect after login
            ├── ProviderSearch.jsx       # Browse + filter
            ├── ProviderProfile.jsx      # Full profile, certs, availability, reviews
            ├── ProviderApply.jsx        # 4-step application form
            ├── ProviderDashboard.jsx    # Profile editor, certs, availability, bookings
            ├── FamilyDashboard.jsx      # Active/past arrangements, leave reviews
            ├── ArrangementDetail.jsx    # Full agreement view, status actions
            └── AdminPanel.jsx           # Approval queue, cert verification, user mgmt
```

---

## API reference

Full interactive docs at `http://localhost:8000/docs` once the backend is running.

### Clerk webhook
| Method | Path | Description |
|---|---|---|
| POST | `/webhooks/clerk` | Sync user.created/updated/deleted to local DB |

### Users
| Method | Path | Auth | Description |
|---|---|---|---|
| GET | `/users/me` | Any | Get current user |
| PUT | `/users/me` | Any | Update profile + location |

### Providers
| Method | Path | Auth | Description |
|---|---|---|---|
| POST | `/providers/apply` | Provider | Submit application |
| GET | `/providers` | Public | Browse with filters |
| GET | `/providers/{id}` | Public | Full profile |
| GET | `/providers/me` | Provider | Own profile |
| PUT | `/providers/me` | Provider | Update profile |
| GET | `/providers/me/dashboard` | Provider | Dashboard data |
| GET | `/providers/{id}/availability` | Public | Available slots (minus booked) |
| GET | `/providers/{id}/reviews` | Public | All reviews |

### Certifications
| Method | Path | Auth |
|---|---|---|
| POST | `/providers/me/certifications` | Provider |
| PUT | `/providers/me/certifications/{id}` | Provider |
| DELETE | `/providers/me/certifications/{id}` | Provider |

### Availability
| Method | Path | Auth |
|---|---|---|
| POST | `/providers/me/availability` | Provider |
| PUT | `/providers/me/availability/{id}` | Provider |
| DELETE | `/providers/me/availability/{id}` | Provider |

### Arrangements
| Method | Path | Auth | Description |
|---|---|---|---|
| POST | `/arrangements` | Family | Create arrangement |
| GET | `/arrangements/me` | Any | Own arrangements |
| GET | `/arrangements/{id}` | Party/Admin | Detail view |
| PUT | `/arrangements/{id}` | Party/Admin | Confirm, complete, cancel |
| POST | `/arrangements/{id}/review` | Family | Leave review (completed only) |

### Scheduling
| Method | Path | Auth |
|---|---|---|
| POST | `/providers/{id}/schedule-call` | Family |
| PUT | `/calls/{id}` | Party/Admin |

### Admin
| Method | Path | Description |
|---|---|---|
| GET | `/admin/providers` | List providers (filter by status) |
| PUT | `/admin/providers/{id}/approve` | Approve provider |
| PUT | `/admin/providers/{id}/reject` | Reject with reason |
| PUT | `/admin/providers/{id}/boost` | Toggle boost |
| GET | `/admin/certifications` | List certs (filter unverified) |
| PUT | `/admin/certifications/{id}/verify` | Verify cert |
| GET | `/admin/users` | List all users |
| PUT | `/admin/users/{id}/flag` | Flag/unflag user |
| GET | `/admin/arrangements` | List all arrangements |
| DELETE | `/admin/reviews/{id}` | Remove review |

### Payments
| Method | Path | Auth | Description |
|---|---|---|---|
| POST | `/payments/connect-account` | Provider | Stripe Connect onboarding |
| POST | `/payments/create-payment-intent` | Family | Pay for arrangement |
| POST | `/payments/create-subscription` | Any | Subscribe to a plan |
| POST | `/payments/stripe-webhook` | — | Stripe event handler |

---

## Key logic

**Provider search sort order** — boosted providers surface first within their distance bracket, then sorted by distance ascending. Families can filter by provider type, day of week, start time, duration block (4/6/8/10/12 hrs), service type (daytime/overnight), and rate range.

**Live availability calendar** — `GET /providers/{id}/availability` returns base availability slots with all confirmed arrangements subtracted. Providers never manually update their calendar after booking; it stays accurate automatically.

**Arrangement confirmation** — when a provider confirms an arrangement, those time slots are automatically excluded from their public availability. The arrangement record is the source of truth for blocked time.

**Provider vetting** — every provider application starts in `pending` status. Admins approve via `/admin/providers/{id}/approve` before the profile appears in search results. Certifications have a separate `verified_by_admin` flag.

**Platform fee** — set via `STRIPE_PLATFORM_FEE_PERCENT` (default 15%). Applied as `application_fee_amount` on Stripe payment intents, transferred to the provider's Connect account.

**Roles** — set in Clerk `public_metadata.role` (`family` | `provider`). Synced to the local `users` table on `user.created` webhook. `admin` role is set directly in the database.

---

## Provider minimum rates

| Type | Minimum |
|---|---|
| Night Nanny / Babysitter | $35/hr |
| Newborn Care Specialist | $38/hr |
| Postpartum Doula | $45/hr |
| Registered Nurse | $65/hr |

Providers set their own rate at or above the minimum for their type. Enforced at the API level.

---

## Coverage area

DC, Maryland (Montgomery, Howard, Anne Arundel, Prince George's, Baltimore, Frederick counties), and Northern Virginia (Fairfax, Arlington, Loudoun, Prince William counties). Distance filtering uses PostGIS geography columns.
