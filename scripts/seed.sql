-- GENERATED FILE — do not edit by hand.
-- Source: src/worker/db/seed-data.ts
-- Regenerate: npm run db:seed:generate

DELETE FROM application_messages;
DELETE FROM applications;
DELETE FROM sits;
DELETE FROM vessels;
DELETE FROM support_requests;

INSERT INTO vessels (
  id,
  name,
  type,
  length,
  home_port,
  image,
  gallery,
  owner,
  owner_image,
  rating,
  reviews,
  description,
  home,
  systems,
  engine_type,
  voltage_type,
  stove_fuel_type,
  amenities
) VALUES
  ('solstice-boat', 'Solstice', 'Sailing yacht', '42 ft', 'Lefkada, Greece', 'https://images.unsplash.com/photo-1540946485063-a40da27545f8?auto=format&fit=crop&w=1400&q=85', '["https://images.unsplash.com/photo-1569263979104-865ab7cd8d13?auto=format&fit=crop&w=900&q=85","https://images.unsplash.com/photo-1567899378494-47b22a2ae96a?auto=format&fit=crop&w=900&q=85"]', 'Maya & Finn', 'https://i.pravatar.cc/160?img=47', 4.9, 18, 'Solstice is our much-loved bluewater cruiser, tucked into a quiet marina on Lefkada. We need a confident liveaboard to keep her aired, secure and happy while we visit family.', 'Private aft cabin, full galley and a bright saloon. The marina has showers, laundry, a pool and tavernas a short walk away.', '["Yanmar diesel","12V / solar","Watermaker","Electric windlass"]', 'Inboard diesel', '12 V DC', 'LPG / propane', '["Bathroom","Full kitchen","Air conditioning","Wi-Fi","Swimming pool","Tender","Paddleboard","Shore power"]'),
  ('blue-hour-boat', 'Blue Hour', 'Catamaran', '46 ft', 'St. George''s, Grenada', 'https://images.unsplash.com/photo-1569263979104-865ab7cd8d13?auto=format&fit=crop&w=1400&q=85', '[]', 'Jonas', 'https://i.pravatar.cc/160?img=12', 5, 11, 'A spacious Lagoon catamaran on a sheltered mooring. Ideal for a couple who know tropical weather routines and are comfortable using a dinghy.', 'Owner''s hull, island galley, water views from every window and reliable marina Wi-Fi.', '["Twin Yanmar diesels","Lithium bank","Solar array","Dinghy outboard"]', 'Inboard diesel', '24 V DC', 'LPG / propane', '["Bathroom","Full kitchen","Wi-Fi","Kayak","Tender","Outdoor BBQ","Washing machine"]'),
  ('northern-light-boat', 'Northern Light', 'Motor yacht', '38 ft', 'Bergen, Norway', 'https://images.unsplash.com/photo-1544551763-46a013bb70d5?auto=format&fit=crop&w=1400&q=85', '["https://images.unsplash.com/photo-1520645521318-f03a712f0e67?auto=format&fit=crop&w=900&q=85"]', 'Ingrid', 'https://i.pravatar.cc/160?img=32', 4.7, 6, 'Winter berth in a working harbour. The job is mostly about heat, humidity and shore power — she must not be left to freeze.', 'Heated saloon with a diesel stove, compact galley, and a short walk into town.', '["Volvo Penta diesel","Diesel heater","Shore power","Dehumidifier"]', 'Inboard diesel', '12 V DC', 'Diesel', '["Bathroom","Full kitchen","Wi-Fi","Heating","Shore power"]'),
  ('kingfisher-boat', 'Kingfisher', 'Sailing yacht', '36 ft', 'Whangarei, New Zealand', 'https://images.unsplash.com/photo-1502680390469-be75c86b636f?auto=format&fit=crop&w=1400&q=85', '[]', 'Tama & Ruth', 'https://i.pravatar.cc/160?img=68', 4.8, 24, 'Our steel ketch sits on a quiet river mooring while we head to the South Island. Cyclone season, so weather awareness matters more than sailing miles.', 'Full run of the boat, wood stove, and a dinghy for the short row ashore.', '["Ford Lehman diesel","Wind generator","Solar","Wood stove"]', 'Inboard diesel', '12 V DC', 'Diesel', '["Wi-Fi","Tender","Bicycles"]'),
  ('saltwood-boat', 'Saltwood', 'Sailing yacht', '31 ft', 'Falmouth, United Kingdom', 'https://images.unsplash.com/photo-1567899378494-47b22a2ae96a?auto=format&fit=crop&w=1400&q=85', '[]', 'Peter', 'https://i.pravatar.cc/160?img=59', 4.6, 9, 'A wooden sloop on a pontoon berth. She needs someone patient who understands that a timber hull wants watching, not fixing.', 'Snug forepeak berth, kettle, and the sailing club showers two minutes away.', '["Beta 20 diesel","12V system","Manual bilge pump"]', 'Inboard diesel', '12 V DC', 'Not specified', '["Shore power","Wi-Fi"]');

INSERT INTO sits (
  id,
  vessel_id,
  dates,
  date_start,
  duration,
  location,
  country,
  region,
  latitude,
  longitude,
  responsibilities,
  requirements,
  min_years_experience,
  required_experience,
  required_certifications,
  required_skills,
  applicants,
  pet,
  featured,
  published
) VALUES
  ('solstice', 'solstice-boat', '12 Sep – 4 Oct', '2026-09-12', '22 nights', 'Lefkada', 'Greece', 'Mediterranean', 38.7066, 20.7019, '["Check bilges and battery monitor each morning","Run engine and watermaker weekly","Adjust lines and fenders after strong weather","Flush heads and air cabins regularly"]', '["5+ years sailing","Diesel basics","Liveaboard experience"]', 5, '["Liveaboard"]', '[]', '["Diesel troubleshooting","Mooring & lines"]', 6, 'Pip, a sea-loving terrier', 1, 1),
  ('blue-hour', 'blue-hour-boat', '3 Nov – 1 Dec', '2026-11-03', '28 nights', 'St. George''s', 'Grenada', 'Caribbean', 12.0561, -61.7488, '["Daily mooring and chafe inspection","Monitor solar, batteries and fridge","Start both engines weekly","Secure deck before squalls"]', '["Catamaran experience","Dinghy handling","Storm awareness"]', 3, '["Catamaran","Tropical weather"]', '[]', '["Tender handling","Storm preparation"]', 9, NULL, 0, 1),
  ('northern-light', 'northern-light-boat', '5 Jan – 2 Feb', '2027-01-05', '28 nights', 'Bergen', 'Norway', 'Northern Europe', 60.3913, 5.3221, '["Verify shore power and heater daily","Check for ice around the hull","Run dehumidifier and log readings","Clear snow from decks and covers"]', '["Cold weather experience","Comfortable alone","Basic electrics"]', 2, '["Cold-weather boating"]', '[]', '["Shore power"]', 3, NULL, 0, 1),
  ('kingfisher', 'kingfisher-boat', '18 Feb – 20 Mar', '2027-02-18', '30 nights', 'Whangarei', 'New Zealand', 'South Pacific', -35.7251, 174.3237, '["Check mooring bridle for chafe weekly","Monitor forecast for cyclone activity","Run engine and charge batteries","Ventilate to keep damp down"]', '["Anchoring experience","Weather routing","Dinghy handling"]', 4, '["Bluewater / offshore"]', '[]', '["Tender handling","Storm preparation"]', 12, 'Two cats, Rigging and Halyard', 1, 1),
  ('saltwood', 'saltwood-boat', '1 Apr – 15 Apr', '2027-04-01', '14 nights', 'Falmouth', 'United Kingdom', 'Northern Europe', 50.1533, -5.0656, '["Check bilge twice daily — she takes up slowly","Inspect topside seams after dry spells","Tend lines on spring tides","Keep her covered and aired"]', '["Wooden boat experience preferred","Tidal berth awareness"]', 0, '[]', '[]', '["Mooring & lines"]', 2, NULL, 0, 1);

INSERT INTO applications (
  id,
  sit_id,
  boat_name,
  owner_name,
  applicant,
  applicant_name,
  initial_message,
  status,
  created_at
) VALUES
  ('application-alex-solstice', 'solstice', 'Solstice', 'Maya & Finn', '{"name":"Alex Morgan","image":"https://i.pravatar.cc/160?img=11","location":"Brighton, United Kingdom","bio":"Calm liveaboard sailor with practical diesel and electrical experience.","languages":["English","French"],"preferredCountries":["Greece","Croatia","Italy"],"skills":["Diesel troubleshooting","12V electrical","Mooring & lines","Pet care"],"yearsExperience":7,"certifications":["RYA Day Skipper","VHF / SRC","First aid"]}', 'Alex Morgan', 'Hi Maya and Finn, I would love to care for Solstice. I have seven years of liveaboard sailing experience and can confidently handle routine diesel, battery, bilge and line checks.', 'shortlisted', '2026-07-18T09:30:00.000Z'),
  ('application-samira-solstice', 'solstice', 'Solstice', 'Maya & Finn', '{"name":"Samira Costa","image":"https://i.pravatar.cc/160?img=45","location":"Lisbon, Portugal","bio":"Offshore crew member and experienced pet sitter who works remotely.","languages":["Portuguese","English","Spanish"],"preferredCountries":["Portugal","Spain","Greece"],"skills":["Mooring & lines","Storm preparation","Pet care","Tender handling"],"yearsExperience":4,"certifications":["ICC","VHF / SRC","First aid"]}', 'Samira Costa', 'Hello, Solstice looks wonderful. I have completed several Mediterranean passages and have cared for boats and pets in Portugal, Spain and Greece.', 'new', '2026-07-19T16:45:00.000Z');

INSERT INTO application_messages (
  id,
  application_id,
  sender_name,
  text,
  created_at
) VALUES
  ('message-alex-initial', 'application-alex-solstice', 'Alex Morgan', 'Hi Maya and Finn, I would love to care for Solstice. I have seven years of liveaboard sailing experience and can confidently handle routine diesel, battery, bilge and line checks.', '2026-07-18T09:30:00.000Z'),
  ('message-maya-reply', 'application-alex-solstice', 'Maya & Finn', 'Thanks Alex. Your systems experience looks like a strong fit. Are you available for a video handover next week?', '2026-07-18T13:15:00.000Z'),
  ('message-samira-initial', 'application-samira-solstice', 'Samira Costa', 'Hello, Solstice looks wonderful. I have completed several Mediterranean passages and have cared for boats and pets in Portugal, Spain and Greece.', '2026-07-19T16:45:00.000Z');
