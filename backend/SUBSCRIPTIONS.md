# User subscriptions

Superadmins use Users → Set subscription to replace a user's subscription with a positive whole number of days, months or years, or an inclusive last-access date. Subscription changes do not approve accounts or verify emails.

`PATCH /api/users/:userId/subscription` accepts `{ "value": 8, "unit": "days" }`, units `months` or `years`, or `{ "unit": "date", "endDate": "2026-09-22" }`. Only superadmins can assign subscriptions; superadmin accounts are exempt.

The user record stores `subscriptionDuration.value`, `subscriptionDuration.unit`, `subscriptionStartsAt`, and `subscriptionExpiresAt`. Expiry is an exclusive UTC timestamp at Nepal midnight. A one-day subscription covers today; eight days covers today and the next seven days. Calendar month/year additions clamp to the final valid day of the target month. Setting a subscription replaces the previous period starting today, rather than extending it. An explicit end date is recorded as the exact number of inclusive calendar days.

Login and every protected API request read and enforce expiry. Missing subscriptions return HTTP 403 with `SUBSCRIPTION_REQUIRED`; expired subscriptions return `SUBSCRIPTION_EXPIRED`. The frontend clears the session and displays the server message on login.

Existing admin and counselor accounts have no subscription until assigned and will be blocked immediately when this change is deployed. Assign their subscriptions using a verified, approved superadmin account. No automatic trial or migration is applied.
