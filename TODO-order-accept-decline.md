# TODO: Order accept/decline + notifications + customer popup

- [ ] Create Supabase Edge Function: `update-order-response` to let farmer accept/decline and update order status + payment_status if needed.
- [ ] Create Supabase Edge Function: `send-order-response-notification` to email/notify customer about farmer decision.
- [ ] Create new page: `src/pages/OrdersForFarmer.tsx`
  - [ ] Show only orders where `orders.farmer_id === current user id`
  - [ ] Allow accept/decline buttons
  - [ ] Ensure farmer can only act on their own orders
- [ ] Create new page/component: customer contact popup
  - [ ] When farmer clicks Accept, open modal showing customer full name, email, phone (if available)
  - [ ] Include text instructing farmer to contact customer for delivery + payment
- [ ] Create new page: `src/pages/OrdersForCustomer.tsx` (or integrate in existing Marketplace)
  - [ ] Show orders for `orders.customer_id === current user id`
  - [ ] Display current farmer response (accepted/declined) from `orders.status`
  - [ ] Show toast/modal to customer with response
- [ ] Add routes in `src/App.tsx` for both farmer + customer order pages.
- [ ] (If missing) Update/verify database `orders` status enum to include `confirmed` (accepted) and `cancelled` (declined) mapping to UI.
- [ ] Basic UX polish + error handling.

