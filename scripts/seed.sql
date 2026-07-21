-- GENERATED FILE — do not edit by hand.
-- Source: src/worker/db/seed-data.ts
-- Regenerate: npm run db:seed:generate

DELETE FROM boats;

INSERT INTO boats (
  id,
  name,
  type,
  length,
  location,
  country,
  region,
  dates,
  date_start,
  date_end,
  duration,
  nights,
  image,
  gallery,
  owner,
  owner_image,
  rating,
  reviews,
  applicants,
  description,
  home,
  responsibilities,
  systems,
  requirements,
  amenities,
  pet,
  featured,
  published
) VALUES
  ('solstice', 'Solstice', 'Sailing yacht', '42 ft', 'Lefkada, Greece', 'Greece', 'Mediterranean', '12 Sep – 4 Oct', '2026-09-12', '2026-10-04', '22 nights', 22, 'https://images.unsplash.com/photo-1540946485063-a40da27545f8?auto=format&fit=crop&w=1400&q=85', '["https://images.unsplash.com/photo-1566847438217-76e82d383f84?auto=format&fit=crop&w=900&q=85","https://images.unsplash.com/photo-1500375592092-40eb2168fd21?auto=format&fit=crop&w=900&q=85"]', 'Maya & Finn', 'https://i.pravatar.cc/160?img=47', 4.9, 18, 6, 'Solstice is our much-loved bluewater cruiser, tucked into a quiet marina on Lefkada. We need a confident liveaboard to keep her aired, secure and happy while we visit family.', 'Private aft cabin, full galley and a bright saloon. The marina has showers, laundry, a pool and tavernas a short walk away.', '["Check bilges and battery monitor each morning","Run engine and watermaker weekly","Adjust lines and fenders after strong weather","Flush heads and air cabins regularly"]', '["Yanmar diesel","12V / solar","Watermaker","Electric windlass"]', '["5+ years sailing","Diesel basics","Liveaboard experience"]', '["Shore power","Wi-Fi","Tender","Paddleboard","Air conditioning"]', 'Pip, a sea-loving terrier', 1, 1),
  ('blue-hour', 'Blue Hour', 'Catamaran', '46 ft', 'St. George''s, Grenada', 'Grenada', 'Caribbean', '3 Nov – 1 Dec', '2026-11-03', '2026-12-01', '28 nights', 28, 'https://images.unsplash.com/photo-1569263979104-865ab7cd8d13?auto=format&fit=crop&w=1400&q=85', '[]', 'Jonas', 'https://i.pravatar.cc/160?img=12', 5, 11, 9, 'A spacious Lagoon catamaran on a sheltered mooring. Ideal for a couple who know tropical weather routines and are comfortable using a dinghy.', 'Owner''s hull, island galley, water views from every window and reliable marina Wi-Fi.', '["Daily mooring and chafe inspection","Monitor solar, batteries and fridge","Start both engines weekly","Secure deck before squalls"]', '["Twin Yanmar diesels","Lithium bank","Solar array","Dinghy outboard"]', '["Catamaran experience","Dinghy handling","Storm awareness"]', '["Wi-Fi","Kayaks","Tender","BBQ","Washer"]', NULL, 0, 1),
  ('northern-light', 'Northern Light', 'Motor yacht', '38 ft', 'Bergen, Norway', 'Norway', 'Northern Europe', '5 Jan – 2 Feb', '2027-01-05', '2027-02-02', '28 nights', 28, 'https://images.unsplash.com/photo-1544551763-46a013bb70d5?auto=format&fit=crop&w=1400&q=85', '["https://images.unsplash.com/photo-1520645521318-f03a712f0e67?auto=format&fit=crop&w=900&q=85"]', 'Ingrid', 'https://i.pravatar.cc/160?img=32', 4.7, 6, 3, 'Winter berth in a working harbour. The job is mostly about heat, humidity and shore power — she must not be left to freeze.', 'Heated saloon with a diesel stove, compact galley, and a short walk into town.', '["Verify shore power and heater daily","Check for ice around the hull","Run dehumidifier and log readings","Clear snow from decks and covers"]', '["Volvo Penta diesel","Diesel heater","Shore power","Dehumidifier"]', '["Cold weather experience","Comfortable alone","Basic electrics"]', '["Shore power","Wi-Fi","Heating","Bicycle"]', NULL, 0, 1),
  ('kingfisher', 'Kingfisher', 'Sailing yacht', '36 ft', 'Whangarei, New Zealand', 'New Zealand', 'South Pacific', '18 Feb – 20 Mar', '2027-02-18', '2027-03-20', '30 nights', 30, 'https://images.unsplash.com/photo-1502680390469-be75c86b636f?auto=format&fit=crop&w=1400&q=85', '[]', 'Tama & Ruth', 'https://i.pravatar.cc/160?img=68', 4.8, 24, 12, 'Our steel ketch sits on a quiet river mooring while we head to the South Island. Cyclone season, so weather awareness matters more than sailing miles.', 'Full run of the boat, wood stove, and a dinghy for the short row ashore.', '["Check mooring bridle for chafe weekly","Monitor forecast for cyclone activity","Run engine and charge batteries","Ventilate to keep damp down"]', '["Ford Lehman diesel","Wind generator","Solar","Wood stove"]', '["Anchoring experience","Weather routing","Dinghy handling"]', '["Wi-Fi","Tender","Bicycle","Wood stove"]', 'Two cats, Rigging and Halyard', 1, 1),
  ('saltwood', 'Saltwood', 'Classic sloop', '31 ft', 'Falmouth, England', 'United Kingdom', 'Northern Europe', '1 Apr – 15 Apr', '2027-04-01', '2027-04-15', '14 nights', 14, 'https://images.unsplash.com/photo-1567899378494-47b22a2ae96a?auto=format&fit=crop&w=1400&q=85', '[]', 'Peter', 'https://i.pravatar.cc/160?img=59', 4.6, 9, 2, 'A wooden sloop on a pontoon berth. She needs someone patient who understands that a timber hull wants watching, not fixing.', 'Snug forepeak berth, kettle, and the sailing club showers two minutes away.', '["Check bilge twice daily — she takes up slowly","Inspect topside seams after dry spells","Tend lines on spring tides","Keep her covered and aired"]', '["Beta 20 diesel","12V system","Manual bilge pump"]', '["Wooden boat experience preferred","Tidal berth awareness"]', '["Shore power","Wi-Fi","Club facilities"]', NULL, 0, 1);
