# TODO

## Dashboard role-based access
- [ ] Update `src/pages/Dashboard.tsx` to render farmer vs customer dashboards based on `roles`.
- [ ] Remove/adjust redirect to `/marketplace` for non-farmers.
- [ ] For customers: query orders with `customer_id = user.id`.
- [ ] For customers: show order status (pending/accepted/declined/etc.) and allow viewing what happened (no accept/decline buttons).
- [ ] Add customer button "Chart Me" that opens the farmer chart/diagnosis UI in the system (route to be determined/implemented).
- [ ] Ensure farmer dashboard still functions (accept/decline calls and analytics).
- [ ] Smoke-test by logging in as customer and farmer.

