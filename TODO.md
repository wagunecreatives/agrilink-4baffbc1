# TODO - Farm Location on Map (GPS + Distance + Directions)

## Step 1: Repo / DB verification
- [ ] Inspect `src/types/database.ts` for `MarketListing` and `Profile` fields (latitude/longitude/county/etc)
- [ ] Inspect existing Supabase migrations for whether GPS columns already exist on `market_listings` and/or `profiles`

## Step 2: Plan + implement DB schema (Supabase)
- [ ] Add `latitude`/`longitude` columns to BOTH:
  - [ ] `profiles` (farm-level)
  - [ ] `market_listings` (listing-level)
- [ ] Add optional area fields (county/subcounty/village/ward) to BOTH tables
- [ ] Update any RLS/policies if needed


## Step 3: Update TypeScript types
- [ ] Update `src/types/database.ts` so frontend can read/write new columns

## Step 4: Farmer location selection UI (map click)
- [ ] Add `LocationPickerMap` component (Leaflet + OpenStreetMap)
- [ ] Update `CreateListingForm` to:
  - [ ] let farmer click the map and pick exact location
  - [ ] save lat/lng to `market_listings`
  - [ ] also persist area fields (if derived)
- [ ] Update farmer profile/farm setup page to store lat/lng + area fields to `profiles`

## Step 5: Customer display on product page
- [ ] Add embedded map with marker on `src/pages/ProductDetail.tsx` using listing coords (fallback to profile coords)
- [ ] Show area text (county/subcounty/etc)

## Step 6: Distance + Directions
- [ ] Implement Haversine distance between buyer and farm coords on `ProductDetail`
- [ ] Add “Get Directions” button using Google Maps directions URL

## Step 7: Testing
- [ ] Typecheck/build
- [ ] Verify creation flow saves coords
- [ ] Verify product page renders map/distance/directions without crashing

