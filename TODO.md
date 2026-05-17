# TODO - Realtime Farmer Dashboard

## Plan
- [ ] Add Supabase Realtime subscriptions for `orders` on the Farmer dashboard (`src/pages/Dashboard.tsx`).
- [ ] On realtime events, refresh/merge the farmer’s orders so listing details stay correct.
- [ ] Add the same realtime approach to `src/pages/OrdersForFarmer.tsx`.
- [ ] Add the same realtime approach to `src/pages/NotificationsForFarmer.tsx`.
- [ ] Ensure subscriptions filter by `farmer_id = current user id`.
- [ ] Unsubscribe on unmount/user change.
- [ ] Validate via manual testing: new customer order appears immediately; accept/decline updates immediately.

