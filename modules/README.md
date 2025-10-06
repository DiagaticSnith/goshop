# Modules

This folder contains four independent modules extracted from the goshop project for isolated testing and development:

- auth - Authentication (register, login, logout, role-based checks)
- products - Product listing, search, sort, cart/favorites operations
- orders-payment - Order placement and mock Stripe payment flow
- admin-profile - Admin CRUD and user profile update

Each module is self-contained with minimal dependencies (Node.js). Run the test script inside each module with `node test.js` to run a quick smoke test.

How to run (PowerShell on Windows):

```powershell
# from repo root
node modules\auth\test.js
node modules\products\test.js
node modules\orders-payment\test.js
node modules\admin-profile\test.js
```

Notes & next steps for integration:
- These modules are intentionally minimal and use in-memory data and a tiny local token helper for fast smoke testing.
- To integrate with the real backend:
	- Replace in-memory stores with calls to your Prisma client (see `backend/src/config/prisma-client.ts`).
	- Replace the token helpers with your real JWT logic and secret management.
	- Replace the mock payment in `orders-payment` with Stripe SDK calls; keep payment logic isolated in `paymentService`.
	- Wire module service functions into your existing controllers and routes (e.g., `backend/src/controllers/*`).
- Tests: these `test.js` files are smoke tests. For CI, convert them to unit tests using Jest or Vitest and mock external dependencies (DB, Stripe).

If you want, I can:
- Add Jest configs and real unit tests for each module (happy path + 1-2 edge cases).
- Replace the lightweight token helper with a pluggable adapter so you can switch between mock and real JWT seamlessly.

Files added by this scaffold (summary):
- `modules/auth` - auth service + smoke test (register/login/verify/logout)
- `modules/products` - product listing/search/sort + cart/favorites helpers + smoke test
- `modules/orders-payment` - createOrder + mock charge + payOrder smoke test
- `modules/admin-profile` - admin CRUD and profile update + smoke test

Verified: smoke tests run locally under Node.js v22 on Windows PowerShell.

Happy to continue and convert these smoke tests into proper unit tests or integrate them into the backend—tell me which to do next.
