-- GENERATED FILE — do not edit by hand.
-- Source: src/worker/db/seed-data.ts
-- Regenerate: npm run db:seed:generate

-- Domain listings are fully reset (test data).
DELETE FROM application_messages;
DELETE FROM applications;
DELETE FROM sits;
DELETE FROM vessels;
DELETE FROM support_requests;
-- Seed-owned rows only: scoped so real accounts/profiles/windows are untouched.
-- (Safe to run against production.)
DELETE FROM reviews WHERE id LIKE 'seed-%';
DELETE FROM sitter_availability WHERE id LIKE 'seed-%';
DELETE FROM profiles WHERE user_id LIKE 'seed-%';
DELETE FROM `user` WHERE id LIKE 'seed-%';

INSERT INTO `user` (
  id,
  name,
  email,
  email_verified,
  image,
  created_at,
  updated_at
) VALUES
  ('seed-user-maya-finn', 'Maya & Finn', 'maya.finn@seed.boatstead.test', 1, 'https://i.pravatar.cc/160?img=32', 1735689600, 1735689600),
  ('seed-user-jonas', 'Jonas', 'jonas@seed.boatstead.test', 1, 'https://i.pravatar.cc/160?img=12', 1735689600, 1735689600),
  ('seed-user-ingrid', 'Ingrid', 'ingrid@seed.boatstead.test', 1, 'https://i.pravatar.cc/160?img=47', 1735689600, 1735689600),
  ('seed-user-tama-ruth', 'Tama & Ruth', 'tama.ruth@seed.boatstead.test', 1, 'https://i.pravatar.cc/160?img=53', 1735689600, 1735689600),
  ('seed-user-peter', 'Peter', 'peter@seed.boatstead.test', 1, 'https://i.pravatar.cc/160?img=15', 1735689600, 1735689600),
  ('seed-user-priya', 'Priya', 'priya@seed.boatstead.test', 1, 'https://i.pravatar.cc/160?img=44', 1735689600, 1735689600),
  ('seed-user-alex', 'Alex Morgan', 'alex.morgan@seed.boatstead.test', 1, 'https://i.pravatar.cc/160?img=11', 1735689600, 1735689600),
  ('seed-user-samira', 'Samira Costa', 'samira.costa@seed.boatstead.test', 1, 'https://i.pravatar.cc/160?img=45', 1735689600, 1735689600),
  ('seed-user-noah', 'Noah Bennett', 'noah.bennett@seed.boatstead.test', 1, 'https://i.pravatar.cc/160?img=13', 1735689600, 1735689600),
  ('seed-user-lena', 'Lena Fischer', 'lena.fischer@seed.boatstead.test', 1, 'https://i.pravatar.cc/160?img=48', 1735689600, 1735689600),
  ('seed-user-sofia-moreau', 'Sofia Moreau', 'sofia-moreau@seed.boatstead.test', 1, 'https://i.pravatar.cc/160?img=20', 1735689600, 1735689600),
  ('seed-user-liam-o-connor', 'Liam O''Connor', 'liam-o-connor@seed.boatstead.test', 1, 'https://i.pravatar.cc/160?img=21', 1735689600, 1735689600),
  ('seed-user-yuki-tanaka', 'Yuki Tanaka', 'yuki-tanaka@seed.boatstead.test', 1, 'https://i.pravatar.cc/160?img=22', 1735689600, 1735689600),
  ('seed-user-diego-alvarez', 'Diego Alvarez', 'diego-alvarez@seed.boatstead.test', 1, 'https://i.pravatar.cc/160?img=23', 1735689600, 1735689600),
  ('seed-user-freya-larsen', 'Freya Larsen', 'freya-larsen@seed.boatstead.test', 1, 'https://i.pravatar.cc/160?img=24', 1735689600, 1735689600),
  ('seed-user-marco-rossi', 'Marco Rossi', 'marco-rossi@seed.boatstead.test', 1, 'https://i.pravatar.cc/160?img=25', 1735689600, 1735689600),
  ('seed-user-amara-okafor', 'Amara Okafor', 'amara-okafor@seed.boatstead.test', 1, 'https://i.pravatar.cc/160?img=26', 1735689600, 1735689600),
  ('seed-user-ben-whitfield', 'Ben Whitfield', 'ben-whitfield@seed.boatstead.test', 1, 'https://i.pravatar.cc/160?img=27', 1735689600, 1735689600),
  ('seed-user-elena-petrova', 'Elena Petrova', 'elena-petrova@seed.boatstead.test', 1, 'https://i.pravatar.cc/160?img=28', 1735689600, 1735689600),
  ('seed-user-tom-harper', 'Tom Harper', 'tom-harper@seed.boatstead.test', 1, 'https://i.pravatar.cc/160?img=30', 1735689600, 1735689600),
  ('seed-user-nadia-rahman', 'Nadia Rahman', 'nadia-rahman@seed.boatstead.test', 1, 'https://i.pravatar.cc/160?img=31', 1735689600, 1735689600),
  ('seed-user-oskar-nowak', 'Oskar Nowak', 'oskar-nowak@seed.boatstead.test', 1, 'https://i.pravatar.cc/160?img=32', 1735689600, 1735689600),
  ('seed-user-chloe-dubois', 'Chloe Dubois', 'chloe-dubois@seed.boatstead.test', 1, 'https://i.pravatar.cc/160?img=33', 1735689600, 1735689600),
  ('seed-user-rafael-santos', 'Rafael Santos', 'rafael-santos@seed.boatstead.test', 1, 'https://i.pravatar.cc/160?img=34', 1735689600, 1735689600),
  ('seed-user-mei-lin', 'Mei Lin', 'mei-lin@seed.boatstead.test', 1, 'https://i.pravatar.cc/160?img=35', 1735689600, 1735689600);

INSERT INTO profiles (
  user_id,
  name,
  email,
  image,
  location,
  bio,
  languages,
  preferred_countries,
  skills,
  years_experience,
  certifications,
  member_since
) VALUES
  ('seed-user-maya-finn', 'Maya & Finn', 'maya.finn@seed.boatstead.test', 'https://i.pravatar.cc/160?img=32', 'Athens, Greece', 'Owners of Solstice, cruising the Aegean.', '["English","Greek"]', '[]', '[]', 0, '[]', 2022),
  ('seed-user-jonas', 'Jonas', 'jonas@seed.boatstead.test', 'https://i.pravatar.cc/160?img=12', 'Bergen, Norway', 'Keeps Blue Hour ready for the fjords.', '["Norwegian","English"]', '[]', '[]', 0, '[]', 2021),
  ('seed-user-ingrid', 'Ingrid', 'ingrid@seed.boatstead.test', 'https://i.pravatar.cc/160?img=47', 'Stockholm, Sweden', 'Northern Light''s caretaker in the archipelago.', '["Swedish","English"]', '[]', '[]', 0, '[]', 2023),
  ('seed-user-tama-ruth', 'Tama & Ruth', 'tama.ruth@seed.boatstead.test', 'https://i.pravatar.cc/160?img=53', 'Auckland, New Zealand', 'Kingfisher owners, Hauraki Gulf regulars.', '["English","Māori"]', '[]', '[]', 0, '[]', 2020),
  ('seed-user-peter', 'Peter', 'peter@seed.boatstead.test', 'https://i.pravatar.cc/160?img=15', 'Falmouth, United Kingdom', 'Saltwood''s owner on the Cornish coast.', '["English"]', '[]', '[]', 0, '[]', 2019),
  ('seed-user-priya', 'Priya', 'priya@seed.boatstead.test', 'https://i.pravatar.cc/160?img=44', 'Mumbai, India', 'Sea Glass owner, warm-water sailor.', '["English","Hindi"]', '[]', '[]', 0, '[]', 2023),
  ('seed-user-alex', 'Alex Morgan', 'alex.morgan@seed.boatstead.test', 'https://i.pravatar.cc/160?img=11', 'Brighton, United Kingdom', 'Calm liveaboard sailor with practical diesel and electrical experience.', '["English","French"]', '["Greece","Croatia","Italy"]', '["Diesel troubleshooting","12V electrical","Mooring & lines","Pet care"]', 7, '["RYA Day Skipper","VHF / SRC","First aid"]', 2021),
  ('seed-user-samira', 'Samira Costa', 'samira.costa@seed.boatstead.test', 'https://i.pravatar.cc/160?img=45', 'Lisbon, Portugal', 'Offshore crew member and experienced pet sitter who works remotely.', '["Portuguese","English","Spanish"]', '["Portugal","Spain","Greece"]', '["Mooring & lines","Storm preparation","Pet care","Tender handling"]', 4, '["ICC","VHF / SRC","First aid"]', 2022),
  ('seed-user-noah', 'Noah Bennett', 'noah.bennett@seed.boatstead.test', 'https://i.pravatar.cc/160?img=13', 'Cape Town, South Africa', 'Bluewater sailor happy anywhere with a swell.', '["English"]', '[]', '["Rigging","Navigation","Engine maintenance"]', 5, '["Yachtmaster Offshore"]', 2020),
  ('seed-user-lena', 'Lena Fischer', 'lena.fischer@seed.boatstead.test', 'https://i.pravatar.cc/160?img=48', 'Hamburg, Germany', 'Careful coastal sitter, loves boat cats.', '["German","English"]', '["Germany","Netherlands","Denmark"]', '["Pet care","Cleaning","Mooring & lines"]', 3, '["First aid"]', 2024),
  ('seed-user-sofia-moreau', 'Sofia Moreau', 'sofia-moreau@seed.boatstead.test', 'https://i.pravatar.cc/160?img=20', 'Antibes, France', 'Charter skipper turned owner on the Côte d''Azur.', '["French","English"]', '[]', '[]', 0, '[]', 2020),
  ('seed-user-liam-o-connor', 'Liam O''Connor', 'liam-o-connor@seed.boatstead.test', 'https://i.pravatar.cc/160?img=21', 'Southampton, United Kingdom', 'Weekend racer who keeps a tidy bilge.', '["English"]', '[]', '[]', 0, '[]', 2021),
  ('seed-user-yuki-tanaka', 'Yuki Tanaka', 'yuki-tanaka@seed.boatstead.test', 'https://i.pravatar.cc/160?img=22', 'Auckland, New Zealand', 'Bluewater cruiser, Pacific bound.', '["Japanese","English"]', '[]', '[]', 0, '[]', 2022),
  ('seed-user-diego-alvarez', 'Diego Alvarez', 'diego-alvarez@seed.boatstead.test', 'https://i.pravatar.cc/160?img=23', 'Barcelona, Spain', 'Med sailor who loves a long lunch at anchor.', '["Spanish","Catalan","English"]', '[]', '[]', 0, '[]', 2023),
  ('seed-user-freya-larsen', 'Freya Larsen', 'freya-larsen@seed.boatstead.test', 'https://i.pravatar.cc/160?img=24', 'Gothenburg, Sweden', 'Archipelago explorer, summer sailor.', '["Swedish","English"]', '[]', '[]', 0, '[]', 2024),
  ('seed-user-marco-rossi', 'Marco Rossi', 'marco-rossi@seed.boatstead.test', 'https://i.pravatar.cc/160?img=25', 'Naples, Italy', 'Restored a classic ketch by hand.', '["Italian","English"]', '[]', '[]', 0, '[]', 2020),
  ('seed-user-amara-okafor', 'Amara Okafor', 'amara-okafor@seed.boatstead.test', 'https://i.pravatar.cc/160?img=26', 'Valletta, Malta', 'Liveaboard owner, warm-water wanderer.', '["English"]', '[]', '[]', 0, '[]', 2021),
  ('seed-user-ben-whitfield', 'Ben Whitfield', 'ben-whitfield@seed.boatstead.test', 'https://i.pravatar.cc/160?img=27', 'Fort Lauderdale, United States', 'Motor-yacht owner, ICW regular.', '["English"]', '[]', '[]', 0, '[]', 2022),
  ('seed-user-elena-petrova', 'Elena Petrova', 'elena-petrova@seed.boatstead.test', 'https://i.pravatar.cc/160?img=28', 'Marmaris, Türkiye', 'Gulet lover cruising the Turquoise Coast.', '["Russian","Turkish","English"]', '[]', '[]', 0, '[]', 2023),
  ('seed-user-tom-harper', 'Tom Harper', 'tom-harper@seed.boatstead.test', 'https://i.pravatar.cc/160?img=30', 'Falmouth, United Kingdom', 'Detail-oriented liveaboard sitter, ex-delivery crew.', '["English"]', '["United Kingdom","France","Spain"]', '["Diesel troubleshooting","Rigging","Mooring & lines"]', 8, '["RYA Yachtmaster","VHF / SRC"]', 2019),
  ('seed-user-nadia-rahman', 'Nadia Rahman', 'nadia-rahman@seed.boatstead.test', 'https://i.pravatar.cc/160?img=31', 'Valletta, Malta', 'Marine biologist who house-sits between projects.', '["English","Arabic"]', '["Malta","Italy","Greece"]', '["Pet care","Cleaning","Snorkel checks"]', 3, '["First aid"]', 2020),
  ('seed-user-oskar-nowak', 'Oskar Nowak', 'oskar-nowak@seed.boatstead.test', 'https://i.pravatar.cc/160?img=32', 'Gdańsk, Poland', 'Baltic sailor, calm in heavy weather.', '["Polish","English","German"]', '["Sweden","Denmark","Germany"]', '["Storm preparation","Navigation","Engine maintenance"]', 6, '["ICC","VHF / SRC"]', 2021),
  ('seed-user-chloe-dubois', 'Chloe Dubois', 'chloe-dubois@seed.boatstead.test', 'https://i.pravatar.cc/160?img=33', 'Nice, France', 'Riviera local, tidy and reliable.', '["French","English","Italian"]', '["France","Italy","Monaco"]', '["Pet care","Tender handling","Cleaning"]', 4, '["First aid"]', 2022),
  ('seed-user-rafael-santos', 'Rafael Santos', 'rafael-santos@seed.boatstead.test', 'https://i.pravatar.cc/160?img=34', 'Lisbon, Portugal', 'Atlantic crossing under his belt; loves boat dogs.', '["Portuguese","English","Spanish"]', '["Portugal","Spain","Cabo Verde"]', '["Diesel troubleshooting","Mooring & lines","Pet care"]', 5, '["RYA Day Skipper","First aid"]', 2023),
  ('seed-user-mei-lin', 'Mei Lin', 'mei-lin@seed.boatstead.test', 'https://i.pravatar.cc/160?img=35', 'Auckland, New Zealand', 'Southern-hemisphere sitter, flexible and handy.', '["English","Mandarin"]', '["New Zealand","Australia"]', '["12V electrical","Cleaning","Mooring & lines"]', 4, '["VHF / SRC"]', 2024);

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
  amenities,
  private_access,
  owner_user_id
) VALUES
  ('solstice-boat', 'Solstice', 'Sailing yacht', '42 ft', 'Lefkada, Greece', 'https://images.unsplash.com/photo-1540946485063-a40da27545f8?auto=format&fit=crop&w=1400&q=85', '["https://images.unsplash.com/photo-1569263979104-865ab7cd8d13?auto=format&fit=crop&w=900&q=85","https://images.unsplash.com/photo-1567899378494-47b22a2ae96a?auto=format&fit=crop&w=900&q=85"]', 'Maya & Finn', 'https://i.pravatar.cc/160?img=47', 4.9, 18, 'Solstice is our much-loved bluewater cruiser, tucked into a quiet marina on Lefkada. We need a confident liveaboard to keep her aired, secure and happy while we visit family.', 'Private aft cabin, full galley and a bright saloon. The marina has showers, laundry, a pool and tavernas a short walk away.', '["Yanmar diesel","12V / solar","Watermaker","Electric windlass"]', 'Inboard diesel', '12 V DC', 'LPG / propane', '["Bathroom","Full kitchen","Air conditioning","Wi-Fi","Swimming pool","Tender","Paddleboard","Shore power"]', '{"wifiNetwork":"Solstice-Guest","wifiPassword":"aegean-sun-42","accessCodes":"Marina pedestrian gate: 4821#\nLockbox on starboard winch: 3391\nCompanionway padlock: 2048","otherNotes":"Spare ignition key with marina office under Maya Ellison."}', 'seed-user-maya-finn'),
  ('blue-hour-boat', 'Blue Hour', 'Catamaran', '46 ft', 'St. George''s, Grenada', 'https://images.unsplash.com/photo-1569263979104-865ab7cd8d13?auto=format&fit=crop&w=1400&q=85', '[]', 'Jonas', 'https://i.pravatar.cc/160?img=12', 5, 11, 'A spacious Lagoon catamaran on a sheltered mooring. Ideal for a couple who know tropical weather routines and are comfortable using a dinghy.', 'Owner''s hull, island galley, water views from every window and reliable marina Wi-Fi.', '["Twin Yanmar diesels","Lithium bank","Solar array","Dinghy outboard"]', 'Inboard diesel', '24 V DC', 'LPG / propane', '["Bathroom","Full kitchen","Wi-Fi","Kayak","Tender","Outdoor BBQ","Washing machine"]', NULL, 'seed-user-jonas'),
  ('northern-light-boat', 'Northern Light', 'Motor yacht', '38 ft', 'Bergen, Norway', 'https://images.unsplash.com/photo-1544551763-46a013bb70d5?auto=format&fit=crop&w=1400&q=85', '["https://images.unsplash.com/photo-1520645521318-f03a712f0e67?auto=format&fit=crop&w=900&q=85"]', 'Ingrid', 'https://i.pravatar.cc/160?img=32', 4.7, 6, 'Winter berth in a working harbour. The job is mostly about heat, humidity and shore power — she must not be left to freeze.', 'Heated saloon with a diesel stove, compact galley, and a short walk into town.', '["Volvo Penta diesel","Diesel heater","Shore power","Dehumidifier"]', 'Inboard diesel', '12 V DC', 'Diesel', '["Bathroom","Full kitchen","Wi-Fi","Heating","Shore power"]', NULL, 'seed-user-ingrid'),
  ('kingfisher-boat', 'Kingfisher', 'Sailing yacht', '36 ft', 'Whangarei, New Zealand', 'https://images.unsplash.com/photo-1502680390469-be75c86b636f?auto=format&fit=crop&w=1400&q=85', '[]', 'Tama & Ruth', 'https://i.pravatar.cc/160?img=68', 4.8, 24, 'Our steel ketch sits on a quiet river mooring while we head to the South Island. Cyclone season, so weather awareness matters more than sailing miles.', 'Full run of the boat, wood stove, and a dinghy for the short row ashore.', '["Ford Lehman diesel","Wind generator","Solar","Wood stove"]', 'Inboard diesel', '12 V DC', 'Diesel', '["Wi-Fi","Tender","Bicycles"]', NULL, 'seed-user-tama-ruth'),
  ('saltwood-boat', 'Saltwood', 'Sailing yacht', '31 ft', 'Falmouth, United Kingdom', 'https://images.unsplash.com/photo-1567899378494-47b22a2ae96a?auto=format&fit=crop&w=1400&q=85', '[]', 'Peter', 'https://i.pravatar.cc/160?img=59', 4.6, 9, 'A wooden sloop on a pontoon berth. She needs someone patient who understands that a timber hull wants watching, not fixing.', 'Snug forepeak berth, kettle, and the sailing club showers two minutes away.', '["Beta 20 diesel","12V system","Manual bilge pump"]', 'Inboard diesel', '12 V DC', 'Not specified', '["Shore power","Wi-Fi"]', NULL, 'seed-user-peter'),
  ('sea-glass-boat', 'Sea Glass', 'Motor yacht', '34 ft', 'Sausalito, United States', 'https://images.unsplash.com/photo-1567899378494-47b22a2ae96a?auto=format&fit=crop&w=1400&q=85', '[]', 'Priya', 'https://i.pravatar.cc/160?img=20', 4.8, 7, 'A tidy motor yacht on the Sausalito waterfront. We need daytime checks while we travel — no overnight stays required.', 'Day access only: check systems, wipe condensation, and confirm shore power.', '["Shore power","Battery monitor","Bilge alarm"]', 'Inboard diesel', '12 V DC', 'Electric / induction', '["Shore power","Wi-Fi","Gated access"]', NULL, 'seed-user-priya'),
  ('seed-vessel-1', 'Aurora', 'Sailing yacht', '32 ft', 'Palma, Spain', 'https://images.unsplash.com/photo-1540946485063-a40da27545f8?auto=format&fit=crop&w=1400&q=85', '["https://images.unsplash.com/photo-1569263979104-865ab7cd8d13?auto=format&fit=crop&w=900&q=85","https://images.unsplash.com/photo-1516132006923-6cf348e5dee2?auto=format&fit=crop&w=900&q=85"]', 'Sofia Moreau', 'https://i.pravatar.cc/160?img=20', 4.2, 3, 'A well-kept sailing yacht based in Palma. Ready for a careful sitter to keep her happy between trips.', 'Comfortable cabin with a proper berth, galley and everything you need aboard.', '["Volvo Penta diesel","Solar array","AIS"]', 'Inboard diesel', '12 V DC', 'LPG / propane', '["Wi-Fi","Shore power","Dinghy"]', NULL, 'seed-user-sofia-moreau'),
  ('seed-vessel-2', 'Tempest', 'Catamaran', '38 ft', 'Split, Croatia', 'https://images.unsplash.com/photo-1569263979104-865ab7cd8d13?auto=format&fit=crop&w=1400&q=85', '["https://images.unsplash.com/photo-1516132006923-6cf348e5dee2?auto=format&fit=crop&w=900&q=85","https://images.unsplash.com/photo-1502680390469-be75c86b636f?auto=format&fit=crop&w=900&q=85"]', 'Liam O''Connor', 'https://i.pravatar.cc/160?img=21', 4.3, 4, 'A well-kept catamaran based in Split. Ready for a careful sitter to keep her happy between trips.', 'Comfortable cabin with a proper berth, galley and everything you need aboard.', '["Yanmar diesel","Wind generator","Radar","Chartplotter"]', 'Outboard', '24 V DC', 'Diesel', '["Wi-Fi","Bicycles","Paddleboard"]', NULL, 'seed-user-liam-o-connor'),
  ('seed-vessel-3', 'Meridian', 'Motor yacht', '41 ft', 'Antibes, France', 'https://images.unsplash.com/photo-1516132006923-6cf348e5dee2?auto=format&fit=crop&w=1400&q=85', '["https://images.unsplash.com/photo-1502680390469-be75c86b636f?auto=format&fit=crop&w=900&q=85","https://images.unsplash.com/photo-1544551763-46a013bb70d5?auto=format&fit=crop&w=900&q=85"]', 'Yuki Tanaka', 'https://i.pravatar.cc/160?img=22', 4.4, 5, 'A well-kept motor yacht based in Antibes. Ready for a careful sitter to keep her happy between trips.', 'Comfortable cabin with a proper berth, galley and everything you need aboard.', '["Solar array","Watermaker","Bow thruster"]', 'Saildrive', '12 V DC', 'Electric', '["Shore power","Air conditioning","Fridge/freezer"]', NULL, 'seed-user-yuki-tanaka'),
  ('seed-vessel-4', 'Halcyon', 'Trawler', '46 ft', 'Naples, Italy', 'https://images.unsplash.com/photo-1502680390469-be75c86b636f?auto=format&fit=crop&w=1400&q=85', '["https://images.unsplash.com/photo-1544551763-46a013bb70d5?auto=format&fit=crop&w=900&q=85","https://images.unsplash.com/photo-1473116763249-2faaef81ccda?auto=format&fit=crop&w=900&q=85"]', 'Diego Alvarez', 'https://i.pravatar.cc/160?img=23', 4.5, 6, 'A well-kept trawler based in Naples. Ready for a careful sitter to keep her happy between trips.', 'Comfortable cabin with a proper berth, galley and everything you need aboard.', '["Inboard diesel","Chartplotter","Autopilot"]', 'Inboard diesel', '24 V DC', 'LPG / propane', '["Wi-Fi","Heating","Dinghy","Snorkel gear"]', NULL, 'seed-user-diego-alvarez'),
  ('seed-vessel-5', 'Odyssey', 'Ketch', '52 ft', 'Lisbon, Portugal', 'https://images.unsplash.com/photo-1544551763-46a013bb70d5?auto=format&fit=crop&w=1400&q=85', '["https://images.unsplash.com/photo-1473116763249-2faaef81ccda?auto=format&fit=crop&w=900&q=85","https://images.unsplash.com/photo-1567899378494-47b22a2ae96a?auto=format&fit=crop&w=900&q=85"]', 'Freya Larsen', 'https://i.pravatar.cc/160?img=24', 4.6, 7, 'A well-kept ketch based in Lisbon. Ready for a careful sitter to keep her happy between trips.', 'Comfortable cabin with a proper berth, galley and everything you need aboard.', '["Volvo Penta diesel","Solar array","AIS"]', 'Outboard', '12 V DC', 'Diesel', '["Wi-Fi","Shore power","Dinghy"]', NULL, 'seed-user-freya-larsen'),
  ('seed-vessel-6', 'Zephyr', 'Sloop', '58 ft', 'Valletta, Malta', 'https://images.unsplash.com/photo-1473116763249-2faaef81ccda?auto=format&fit=crop&w=1400&q=85', '["https://images.unsplash.com/photo-1567899378494-47b22a2ae96a?auto=format&fit=crop&w=900&q=85","https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&w=900&q=85"]', 'Marco Rossi', 'https://i.pravatar.cc/160?img=25', 4.7, 8, 'A well-kept sloop based in Valletta. Ready for a careful sitter to keep her happy between trips.', 'Comfortable cabin with a proper berth, galley and everything you need aboard.', '["Yanmar diesel","Wind generator","Radar","Chartplotter"]', 'Saildrive', '24 V DC', 'Electric', '["Wi-Fi","Bicycles","Paddleboard"]', NULL, 'seed-user-marco-rossi'),
  ('seed-vessel-7', 'Nimbus', 'Sailing yacht', '32 ft', 'Corfu, Greece', 'https://images.unsplash.com/photo-1567899378494-47b22a2ae96a?auto=format&fit=crop&w=1400&q=85', '["https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&w=900&q=85","https://images.unsplash.com/photo-1540946485063-a40da27545f8?auto=format&fit=crop&w=900&q=85"]', 'Amara Okafor', 'https://i.pravatar.cc/160?img=26', 4.8, 9, 'A well-kept sailing yacht based in Corfu. Ready for a careful sitter to keep her happy between trips.', 'Comfortable cabin with a proper berth, galley and everything you need aboard.', '["Solar array","Watermaker","Bow thruster"]', 'Inboard diesel', '12 V DC', 'LPG / propane', '["Shore power","Air conditioning","Fridge/freezer"]', NULL, 'seed-user-amara-okafor'),
  ('seed-vessel-8', 'Corsair', 'Catamaran', '38 ft', 'Dubrovnik, Croatia', 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&w=1400&q=85', '["https://images.unsplash.com/photo-1540946485063-a40da27545f8?auto=format&fit=crop&w=900&q=85","https://images.unsplash.com/photo-1569263979104-865ab7cd8d13?auto=format&fit=crop&w=900&q=85"]', 'Ben Whitfield', 'https://i.pravatar.cc/160?img=27', 4.9, 10, 'A well-kept catamaran based in Dubrovnik. Ready for a careful sitter to keep her happy between trips.', 'Comfortable cabin with a proper berth, galley and everything you need aboard.', '["Inboard diesel","Chartplotter","Autopilot"]', 'Outboard', '24 V DC', 'Diesel', '["Wi-Fi","Heating","Dinghy","Snorkel gear"]', NULL, 'seed-user-ben-whitfield'),
  ('seed-vessel-9', 'Marlin', 'Motor yacht', '41 ft', 'Barcelona, Spain', 'https://images.unsplash.com/photo-1540946485063-a40da27545f8?auto=format&fit=crop&w=1400&q=85', '["https://images.unsplash.com/photo-1569263979104-865ab7cd8d13?auto=format&fit=crop&w=900&q=85","https://images.unsplash.com/photo-1516132006923-6cf348e5dee2?auto=format&fit=crop&w=900&q=85"]', 'Elena Petrova', 'https://i.pravatar.cc/160?img=28', 4.2, 11, 'A well-kept motor yacht based in Barcelona. Ready for a careful sitter to keep her happy between trips.', 'Comfortable cabin with a proper berth, galley and everything you need aboard.', '["Volvo Penta diesel","Solar array","AIS"]', 'Saildrive', '12 V DC', 'Electric', '["Wi-Fi","Shore power","Dinghy"]', NULL, 'seed-user-elena-petrova'),
  ('seed-vessel-10', 'Serenity', 'Trawler', '46 ft', 'Marmaris, Türkiye', 'https://images.unsplash.com/photo-1569263979104-865ab7cd8d13?auto=format&fit=crop&w=1400&q=85', '["https://images.unsplash.com/photo-1516132006923-6cf348e5dee2?auto=format&fit=crop&w=900&q=85","https://images.unsplash.com/photo-1502680390469-be75c86b636f?auto=format&fit=crop&w=900&q=85"]', 'Sofia Moreau', 'https://i.pravatar.cc/160?img=20', 4.3, 12, 'A well-kept trawler based in Marmaris. Ready for a careful sitter to keep her happy between trips.', 'Comfortable cabin with a proper berth, galley and everything you need aboard.', '["Yanmar diesel","Wind generator","Radar","Chartplotter"]', 'Inboard diesel', '24 V DC', 'LPG / propane', '["Wi-Fi","Bicycles","Paddleboard"]', NULL, 'seed-user-sofia-moreau'),
  ('seed-vessel-11', 'Albatross', 'Ketch', '52 ft', 'Auckland, New Zealand', 'https://images.unsplash.com/photo-1516132006923-6cf348e5dee2?auto=format&fit=crop&w=1400&q=85', '["https://images.unsplash.com/photo-1502680390469-be75c86b636f?auto=format&fit=crop&w=900&q=85","https://images.unsplash.com/photo-1544551763-46a013bb70d5?auto=format&fit=crop&w=900&q=85"]', 'Liam O''Connor', 'https://i.pravatar.cc/160?img=21', 4.4, 3, 'A well-kept ketch based in Auckland. Ready for a careful sitter to keep her happy between trips.', 'Comfortable cabin with a proper berth, galley and everything you need aboard.', '["Solar array","Watermaker","Bow thruster"]', 'Outboard', '12 V DC', 'Diesel', '["Shore power","Air conditioning","Fridge/freezer"]', NULL, 'seed-user-liam-o-connor'),
  ('seed-vessel-12', 'Nautilus', 'Sloop', '58 ft', 'Fort Lauderdale, United States', 'https://images.unsplash.com/photo-1502680390469-be75c86b636f?auto=format&fit=crop&w=1400&q=85', '["https://images.unsplash.com/photo-1544551763-46a013bb70d5?auto=format&fit=crop&w=900&q=85","https://images.unsplash.com/photo-1473116763249-2faaef81ccda?auto=format&fit=crop&w=900&q=85"]', 'Yuki Tanaka', 'https://i.pravatar.cc/160?img=22', 4.5, 4, 'A well-kept sloop based in Fort Lauderdale. Ready for a careful sitter to keep her happy between trips.', 'Comfortable cabin with a proper berth, galley and everything you need aboard.', '["Inboard diesel","Chartplotter","Autopilot"]', 'Saildrive', '24 V DC', 'Electric', '["Wi-Fi","Heating","Dinghy","Snorkel gear"]', NULL, 'seed-user-yuki-tanaka'),
  ('seed-vessel-13', 'Osprey', 'Sailing yacht', '32 ft', 'Gothenburg, Sweden', 'https://images.unsplash.com/photo-1544551763-46a013bb70d5?auto=format&fit=crop&w=1400&q=85', '["https://images.unsplash.com/photo-1473116763249-2faaef81ccda?auto=format&fit=crop&w=900&q=85","https://images.unsplash.com/photo-1567899378494-47b22a2ae96a?auto=format&fit=crop&w=900&q=85"]', 'Diego Alvarez', 'https://i.pravatar.cc/160?img=23', 4.6, 5, 'A well-kept sailing yacht based in Gothenburg. Ready for a careful sitter to keep her happy between trips.', 'Comfortable cabin with a proper berth, galley and everything you need aboard.', '["Volvo Penta diesel","Solar array","AIS"]', 'Inboard diesel', '12 V DC', 'LPG / propane', '["Wi-Fi","Shore power","Dinghy"]', NULL, 'seed-user-diego-alvarez'),
  ('seed-vessel-14', 'Mistral', 'Catamaran', '38 ft', 'Southampton, United Kingdom', 'https://images.unsplash.com/photo-1473116763249-2faaef81ccda?auto=format&fit=crop&w=1400&q=85', '["https://images.unsplash.com/photo-1567899378494-47b22a2ae96a?auto=format&fit=crop&w=900&q=85","https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&w=900&q=85"]', 'Freya Larsen', 'https://i.pravatar.cc/160?img=24', 4.7, 6, 'A well-kept catamaran based in Southampton. Ready for a careful sitter to keep her happy between trips.', 'Comfortable cabin with a proper berth, galley and everything you need aboard.', '["Yanmar diesel","Wind generator","Radar","Chartplotter"]', 'Outboard', '24 V DC', 'Diesel', '["Wi-Fi","Bicycles","Paddleboard"]', NULL, 'seed-user-freya-larsen');

INSERT INTO sits (
  id,
  vessel_id,
  dates,
  date_start,
  duration,
  location,
  country,
  full_address,
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
  published,
  sit_type
) VALUES
  ('solstice', 'solstice-boat', '12 Sep – 4 Oct', '2026-09-12', '22 nights', 'Lefkada', 'Greece', 'Berth B12, Lefkas Marina, Lefkada 311 00, Greece', 38.7066, 20.7019, '["Check bilges and battery monitor each morning","Run engine and watermaker weekly","Adjust lines and fenders after strong weather","Flush heads and air cabins regularly"]', '["5+ years sailing","Diesel basics","Liveaboard experience"]', 5, '["Liveaboard"]', '[]', '["Diesel troubleshooting","Mooring & lines"]', 6, 'Pip, a sea-loving terrier', 1, 1, 'liveaboard'),
  ('blue-hour', 'blue-hour-boat', '3 Nov – 1 Dec', '2026-11-03', '28 nights', 'St. George''s', 'Grenada', NULL, 12.0561, -61.7488, '["Daily mooring and chafe inspection","Monitor solar, batteries and fridge","Start both engines weekly","Secure deck before squalls"]', '["Catamaran experience","Dinghy handling","Storm awareness"]', 3, '["Catamaran","Tropical weather"]', '[]', '["Tender handling","Storm preparation"]', 9, NULL, 0, 1, 'liveaboard'),
  ('northern-light', 'northern-light-boat', '5 Jan – 2 Feb', '2027-01-05', '28 nights', 'Bergen', 'Norway', NULL, 60.3913, 5.3221, '["Verify shore power and heater daily","Check for ice around the hull","Run dehumidifier and log readings","Clear snow from decks and covers"]', '["Cold weather experience","Comfortable alone","Basic electrics"]', 2, '["Cold-weather boating"]', '[]', '["Shore power"]', 3, NULL, 0, 1, 'liveaboard'),
  ('kingfisher', 'kingfisher-boat', '18 Feb – 20 Mar', '2027-02-18', '30 nights', 'Whangarei', 'New Zealand', NULL, -35.7251, 174.3237, '["Check mooring bridle for chafe weekly","Monitor forecast for cyclone activity","Run engine and charge batteries","Ventilate to keep damp down"]', '["Anchoring experience","Weather routing","Dinghy handling"]', 4, '["Bluewater / offshore"]', '[]', '["Tender handling","Storm preparation"]', 12, 'Two cats, Rigging and Halyard', 1, 1, 'liveaboard'),
  ('saltwood', 'saltwood-boat', '1 Apr – 15 Apr', '2027-04-01', '14 nights', 'Falmouth', 'United Kingdom', NULL, 50.1533, -5.0656, '["Check bilge twice daily — she takes up slowly","Inspect topside seams after dry spells","Tend lines on spring tides","Keep her covered and aired"]', '["Wooden boat experience preferred","Tidal berth awareness"]', 0, '[]', '[]', '["Mooring & lines"]', 2, NULL, 0, 1, 'liveaboard'),
  ('sea-glass', 'sea-glass-boat', '8 Aug – 22 Aug', '2026-08-08', '14 nights', 'Sausalito', 'United States', NULL, 37.8591, -122.4853, '["Daytime systems check and bilge look","Confirm shore power and battery state","Wipe condensation and air the cabin","Send a short mid-week update"]', '["Reliable daytime availability","Basic electrics"]', 1, '[]', '[]', '["Shore power"]', 4, NULL, 0, 1, 'daytimeChecks'),
  ('seed-sit-1', 'seed-vessel-1', '1 May – 8 May', '2026-05-01', '7 nights', 'Palma', 'Spain', NULL, 39.5696, 2.6502, '["Check bilge daily","Run engine weekly","Monitor batteries"]', '["Some sailing experience"]', 0, '[]', '[]', '[]', 0, 'Cat', 1, 1, 'daytimeChecks'),
  ('seed-sit-2', 'seed-vessel-2', '14 May – 24 May', '2026-05-14', '10 nights', 'Split', 'Croatia', NULL, 43.5081, 16.4402, '["Water the plants","Wipe down teak","Check mooring lines"]', '["Comfortable with pets","Non-smoker"]', 1, '[]', '[]', '[]', 1, NULL, 1, 1, 'liveaboard'),
  ('seed-sit-3', 'seed-vessel-3', '27 May – 10 Jun', '2026-05-27', '14 nights', 'Antibes', 'France', NULL, 43.5808, 7.1251, '["Feed the cat","Ventilate the cabin","Monitor batteries"]', '["Some sailing experience"]', 2, '[]', '[]', '[]', 2, NULL, 1, 1, 'liveaboard'),
  ('seed-sit-4', 'seed-vessel-4', '9 Jun – 30 Jun', '2026-06-09', '21 nights', 'Naples', 'Italy', NULL, 40.8518, 14.2681, '["Run engine weekly","Check mooring lines","Rinse decks after rain"]', '["Comfortable with pets","Non-smoker"]', 0, '[]', '[]', '[]', 0, NULL, 0, 1, 'daytimeChecks'),
  ('seed-sit-5', 'seed-vessel-5', '22 Jun – 20 Jul', '2026-06-22', '28 nights', 'Lisbon', 'Portugal', NULL, 38.7223, -9.1393, '["Check bilge daily","Run engine weekly","Monitor batteries"]', '["Some sailing experience"]', 1, '[]', '[]', '[]', 1, 'Cat', 0, 1, 'liveaboard'),
  ('seed-sit-6', 'seed-vessel-6', '5 Jul – 12 Jul', '2026-07-05', '7 nights', 'Valletta', 'Malta', NULL, 35.8989, 14.5146, '["Water the plants","Wipe down teak","Check mooring lines"]', '["Comfortable with pets","Non-smoker"]', 2, '[]', '[]', '[]', 2, NULL, 0, 1, 'liveaboard'),
  ('seed-sit-7', 'seed-vessel-7', '18 Jul – 28 Jul', '2026-07-18', '10 nights', 'Corfu', 'Greece', NULL, 39.6243, 19.9217, '["Feed the cat","Ventilate the cabin","Monitor batteries"]', '["Some sailing experience"]', 0, '[]', '[]', '[]', 0, NULL, 0, 1, 'daytimeChecks'),
  ('seed-sit-8', 'seed-vessel-8', '31 Jul – 14 Aug', '2026-07-31', '14 nights', 'Dubrovnik', 'Croatia', NULL, 42.6507, 18.0944, '["Run engine weekly","Check mooring lines","Rinse decks after rain"]', '["Comfortable with pets","Non-smoker"]', 1, '[]', '[]', '[]', 1, NULL, 0, 1, 'liveaboard'),
  ('seed-sit-9', 'seed-vessel-9', '13 Aug – 3 Sept', '2026-08-13', '21 nights', 'Barcelona', 'Spain', NULL, 41.3874, 2.1686, '["Check bilge daily","Run engine weekly","Monitor batteries"]', '["Some sailing experience"]', 2, '[]', '[]', '[]', 2, 'Cat', 0, 1, 'liveaboard'),
  ('seed-sit-10', 'seed-vessel-10', '26 Aug – 23 Sept', '2026-08-26', '28 nights', 'Marmaris', 'Türkiye', NULL, 36.855, 28.274, '["Water the plants","Wipe down teak","Check mooring lines"]', '["Comfortable with pets","Non-smoker"]', 0, '[]', '[]', '[]', 0, NULL, 0, 1, 'daytimeChecks'),
  ('seed-sit-11', 'seed-vessel-11', '8 Sept – 15 Sept', '2026-09-08', '7 nights', 'Auckland', 'New Zealand', NULL, -36.8485, 174.7633, '["Feed the cat","Ventilate the cabin","Monitor batteries"]', '["Some sailing experience"]', 1, '[]', '[]', '[]', 1, NULL, 0, 1, 'liveaboard'),
  ('seed-sit-12', 'seed-vessel-12', '21 Sept – 1 Oct', '2026-09-21', '10 nights', 'Fort Lauderdale', 'United States', NULL, 26.1224, -80.1373, '["Run engine weekly","Check mooring lines","Rinse decks after rain"]', '["Comfortable with pets","Non-smoker"]', 2, '[]', '[]', '[]', 2, NULL, 0, 1, 'liveaboard'),
  ('seed-sit-13', 'seed-vessel-13', '4 Oct – 18 Oct', '2026-10-04', '14 nights', 'Gothenburg', 'Sweden', NULL, 57.7089, 11.9746, '["Check bilge daily","Run engine weekly","Monitor batteries"]', '["Some sailing experience"]', 0, '[]', '[]', '[]', 0, 'Cat', 0, 1, 'daytimeChecks'),
  ('seed-sit-14', 'seed-vessel-14', '17 Oct – 7 Nov', '2026-10-17', '21 nights', 'Southampton', 'United Kingdom', NULL, 50.9097, -1.4044, '["Water the plants","Wipe down teak","Check mooring lines"]', '["Comfortable with pets","Non-smoker"]', 1, '[]', '[]', '[]', 1, NULL, 0, 1, 'liveaboard');

INSERT INTO applications (
  id,
  sit_id,
  boat_name,
  owner_name,
  applicant,
  applicant_name,
  applicant_user_id,
  initial_message,
  status,
  created_at
) VALUES
  ('application-alex-solstice', 'solstice', 'Solstice', 'Maya & Finn', '{"name":"Alex Morgan","image":"https://i.pravatar.cc/160?img=11","location":"Brighton, United Kingdom","bio":"Calm liveaboard sailor with practical diesel and electrical experience.","languages":["English","French"],"preferredCountries":["Greece","Croatia","Italy"],"skills":["Diesel troubleshooting","12V electrical","Mooring & lines","Pet care"],"yearsExperience":7,"certifications":["RYA Day Skipper","VHF / SRC","First aid"]}', 'Alex Morgan', 'seed-user-alex', 'Hi Maya and Finn, I would love to care for Solstice. I have seven years of liveaboard sailing experience and can confidently handle routine diesel, battery, bilge and line checks.', 'shortlisted', '2026-07-18T09:30:00.000Z'),
  ('application-samira-solstice', 'solstice', 'Solstice', 'Maya & Finn', '{"name":"Samira Costa","image":"https://i.pravatar.cc/160?img=45","location":"Lisbon, Portugal","bio":"Offshore crew member and experienced pet sitter who works remotely.","languages":["Portuguese","English","Spanish"],"preferredCountries":["Portugal","Spain","Greece"],"skills":["Mooring & lines","Storm preparation","Pet care","Tender handling"],"yearsExperience":4,"certifications":["ICC","VHF / SRC","First aid"]}', 'Samira Costa', 'seed-user-samira', 'Hello, Solstice looks wonderful. I have completed several Mediterranean passages and have cared for boats and pets in Portugal, Spain and Greece.', 'new', '2026-07-19T16:45:00.000Z'),
  ('seed-app-2-1', 'seed-sit-2', 'Tempest', 'Liam O''Connor', '{"name":"Nadia Rahman","image":"https://i.pravatar.cc/160?img=31","location":"Valletta, Malta","bio":"Marine biologist who house-sits between projects.","languages":["English","Arabic"],"preferredCountries":["Malta","Italy","Greece"],"skills":["Pet care","Cleaning","Snorkel checks"],"yearsExperience":3,"certifications":["First aid"]}', 'Nadia Rahman', 'seed-user-nadia-rahman', 'Hi Liam, I''d love to look after Tempest. I have 3 years of experience and I''m confident with the routine checks.', 'shortlisted', '2026-04-11T09:30:00.000Z'),
  ('seed-app-3-1', 'seed-sit-3', 'Meridian', 'Yuki Tanaka', '{"name":"Oskar Nowak","image":"https://i.pravatar.cc/160?img=32","location":"Gdańsk, Poland","bio":"Baltic sailor, calm in heavy weather.","languages":["Polish","English","German"],"preferredCountries":["Sweden","Denmark","Germany"],"skills":["Storm preparation","Navigation","Engine maintenance"],"yearsExperience":6,"certifications":["ICC","VHF / SRC"]}', 'Oskar Nowak', 'seed-user-oskar-nowak', 'Hi Yuki, I''d love to look after Meridian. I have 6 years of experience and I''m confident with the routine checks.', 'accepted', '2026-04-12T09:30:00.000Z'),
  ('seed-app-3-2', 'seed-sit-3', 'Meridian', 'Yuki Tanaka', '{"name":"Chloe Dubois","image":"https://i.pravatar.cc/160?img=33","location":"Nice, France","bio":"Riviera local, tidy and reliable.","languages":["French","English","Italian"],"preferredCountries":["France","Italy","Monaco"],"skills":["Pet care","Tender handling","Cleaning"],"yearsExperience":4,"certifications":["First aid"]}', 'Chloe Dubois', 'seed-user-chloe-dubois', 'Hi Yuki, I''d love to look after Meridian. I have 4 years of experience and I''m confident with the routine checks.', 'declined', '2026-04-13T09:30:00.000Z'),
  ('seed-app-5-1', 'seed-sit-5', 'Odyssey', 'Freya Larsen', '{"name":"Rafael Santos","image":"https://i.pravatar.cc/160?img=34","location":"Lisbon, Portugal","bio":"Atlantic crossing under his belt; loves boat dogs.","languages":["Portuguese","English","Spanish"],"preferredCountries":["Portugal","Spain","Cabo Verde"],"skills":["Diesel troubleshooting","Mooring & lines","Pet care"],"yearsExperience":5,"certifications":["RYA Day Skipper","First aid"]}', 'Rafael Santos', 'seed-user-rafael-santos', 'Hi Freya, I''d love to look after Odyssey. I have 5 years of experience and I''m confident with the routine checks.', 'new', '2026-04-14T09:30:00.000Z'),
  ('seed-app-6-1', 'seed-sit-6', 'Zephyr', 'Marco Rossi', '{"name":"Mei Lin","image":"https://i.pravatar.cc/160?img=35","location":"Auckland, New Zealand","bio":"Southern-hemisphere sitter, flexible and handy.","languages":["English","Mandarin"],"preferredCountries":["New Zealand","Australia"],"skills":["12V electrical","Cleaning","Mooring & lines"],"yearsExperience":4,"certifications":["VHF / SRC"]}', 'Mei Lin', 'seed-user-mei-lin', 'Hi Marco, I''d love to look after Zephyr. I have 4 years of experience and I''m confident with the routine checks.', 'new', '2026-04-15T09:30:00.000Z'),
  ('seed-app-6-2', 'seed-sit-6', 'Zephyr', 'Marco Rossi', '{"name":"Tom Harper","image":"https://i.pravatar.cc/160?img=30","location":"Falmouth, United Kingdom","bio":"Detail-oriented liveaboard sitter, ex-delivery crew.","languages":["English"],"preferredCountries":["United Kingdom","France","Spain"],"skills":["Diesel troubleshooting","Rigging","Mooring & lines"],"yearsExperience":8,"certifications":["RYA Yachtmaster","VHF / SRC"]}', 'Tom Harper', 'seed-user-tom-harper', 'Hi Marco, I''d love to look after Zephyr. I have 8 years of experience and I''m confident with the routine checks.', 'shortlisted', '2026-04-16T09:30:00.000Z'),
  ('seed-app-8-1', 'seed-sit-8', 'Corsair', 'Ben Whitfield', '{"name":"Nadia Rahman","image":"https://i.pravatar.cc/160?img=31","location":"Valletta, Malta","bio":"Marine biologist who house-sits between projects.","languages":["English","Arabic"],"preferredCountries":["Malta","Italy","Greece"],"skills":["Pet care","Cleaning","Snorkel checks"],"yearsExperience":3,"certifications":["First aid"]}', 'Nadia Rahman', 'seed-user-nadia-rahman', 'Hi Ben, I''d love to look after Corsair. I have 3 years of experience and I''m confident with the routine checks.', 'accepted', '2026-04-17T09:30:00.000Z'),
  ('seed-app-9-1', 'seed-sit-9', 'Marlin', 'Elena Petrova', '{"name":"Oskar Nowak","image":"https://i.pravatar.cc/160?img=32","location":"Gdańsk, Poland","bio":"Baltic sailor, calm in heavy weather.","languages":["Polish","English","German"],"preferredCountries":["Sweden","Denmark","Germany"],"skills":["Storm preparation","Navigation","Engine maintenance"],"yearsExperience":6,"certifications":["ICC","VHF / SRC"]}', 'Oskar Nowak', 'seed-user-oskar-nowak', 'Hi Elena, I''d love to look after Marlin. I have 6 years of experience and I''m confident with the routine checks.', 'declined', '2026-04-18T09:30:00.000Z'),
  ('seed-app-9-2', 'seed-sit-9', 'Marlin', 'Elena Petrova', '{"name":"Chloe Dubois","image":"https://i.pravatar.cc/160?img=33","location":"Nice, France","bio":"Riviera local, tidy and reliable.","languages":["French","English","Italian"],"preferredCountries":["France","Italy","Monaco"],"skills":["Pet care","Tender handling","Cleaning"],"yearsExperience":4,"certifications":["First aid"]}', 'Chloe Dubois', 'seed-user-chloe-dubois', 'Hi Elena, I''d love to look after Marlin. I have 4 years of experience and I''m confident with the routine checks.', 'new', '2026-04-19T09:30:00.000Z'),
  ('seed-app-11-1', 'seed-sit-11', 'Albatross', 'Liam O''Connor', '{"name":"Rafael Santos","image":"https://i.pravatar.cc/160?img=34","location":"Lisbon, Portugal","bio":"Atlantic crossing under his belt; loves boat dogs.","languages":["Portuguese","English","Spanish"],"preferredCountries":["Portugal","Spain","Cabo Verde"],"skills":["Diesel troubleshooting","Mooring & lines","Pet care"],"yearsExperience":5,"certifications":["RYA Day Skipper","First aid"]}', 'Rafael Santos', 'seed-user-rafael-santos', 'Hi Liam, I''d love to look after Albatross. I have 5 years of experience and I''m confident with the routine checks.', 'new', '2026-04-20T09:30:00.000Z'),
  ('seed-app-12-1', 'seed-sit-12', 'Nautilus', 'Yuki Tanaka', '{"name":"Mei Lin","image":"https://i.pravatar.cc/160?img=35","location":"Auckland, New Zealand","bio":"Southern-hemisphere sitter, flexible and handy.","languages":["English","Mandarin"],"preferredCountries":["New Zealand","Australia"],"skills":["12V electrical","Cleaning","Mooring & lines"],"yearsExperience":4,"certifications":["VHF / SRC"]}', 'Mei Lin', 'seed-user-mei-lin', 'Hi Yuki, I''d love to look after Nautilus. I have 4 years of experience and I''m confident with the routine checks.', 'shortlisted', '2026-04-21T09:30:00.000Z'),
  ('seed-app-12-2', 'seed-sit-12', 'Nautilus', 'Yuki Tanaka', '{"name":"Tom Harper","image":"https://i.pravatar.cc/160?img=30","location":"Falmouth, United Kingdom","bio":"Detail-oriented liveaboard sitter, ex-delivery crew.","languages":["English"],"preferredCountries":["United Kingdom","France","Spain"],"skills":["Diesel troubleshooting","Rigging","Mooring & lines"],"yearsExperience":8,"certifications":["RYA Yachtmaster","VHF / SRC"]}', 'Tom Harper', 'seed-user-tom-harper', 'Hi Yuki, I''d love to look after Nautilus. I have 8 years of experience and I''m confident with the routine checks.', 'accepted', '2026-04-22T09:30:00.000Z'),
  ('seed-app-14-1', 'seed-sit-14', 'Mistral', 'Freya Larsen', '{"name":"Nadia Rahman","image":"https://i.pravatar.cc/160?img=31","location":"Valletta, Malta","bio":"Marine biologist who house-sits between projects.","languages":["English","Arabic"],"preferredCountries":["Malta","Italy","Greece"],"skills":["Pet care","Cleaning","Snorkel checks"],"yearsExperience":3,"certifications":["First aid"]}', 'Nadia Rahman', 'seed-user-nadia-rahman', 'Hi Freya, I''d love to look after Mistral. I have 3 years of experience and I''m confident with the routine checks.', 'declined', '2026-04-23T09:30:00.000Z');

INSERT INTO application_messages (
  id,
  application_id,
  sender_name,
  text,
  created_at
) VALUES
  ('message-alex-initial', 'application-alex-solstice', 'Alex Morgan', 'Hi Maya and Finn, I would love to care for Solstice. I have seven years of liveaboard sailing experience and can confidently handle routine diesel, battery, bilge and line checks.', '2026-07-18T09:30:00.000Z'),
  ('message-maya-reply', 'application-alex-solstice', 'Maya & Finn', 'Thanks Alex. Your systems experience looks like a strong fit. Are you available for a video handover next week?', '2026-07-18T13:15:00.000Z'),
  ('message-samira-initial', 'application-samira-solstice', 'Samira Costa', 'Hello, Solstice looks wonderful. I have completed several Mediterranean passages and have cared for boats and pets in Portugal, Spain and Greece.', '2026-07-19T16:45:00.000Z'),
  ('seed-msg-2-1', 'seed-app-2-1', 'Nadia Rahman', 'Hi Liam, I''d love to look after Tempest. I have 3 years of experience and I''m confident with the routine checks.', '2026-04-11T09:30:00.000Z'),
  ('seed-msg-3-1', 'seed-app-3-1', 'Oskar Nowak', 'Hi Yuki, I''d love to look after Meridian. I have 6 years of experience and I''m confident with the routine checks.', '2026-04-12T09:30:00.000Z'),
  ('seed-msg-3-2', 'seed-app-3-2', 'Chloe Dubois', 'Hi Yuki, I''d love to look after Meridian. I have 4 years of experience and I''m confident with the routine checks.', '2026-04-13T09:30:00.000Z'),
  ('seed-msg-5-1', 'seed-app-5-1', 'Rafael Santos', 'Hi Freya, I''d love to look after Odyssey. I have 5 years of experience and I''m confident with the routine checks.', '2026-04-14T09:30:00.000Z'),
  ('seed-msg-6-1', 'seed-app-6-1', 'Mei Lin', 'Hi Marco, I''d love to look after Zephyr. I have 4 years of experience and I''m confident with the routine checks.', '2026-04-15T09:30:00.000Z'),
  ('seed-msg-6-2', 'seed-app-6-2', 'Tom Harper', 'Hi Marco, I''d love to look after Zephyr. I have 8 years of experience and I''m confident with the routine checks.', '2026-04-16T09:30:00.000Z'),
  ('seed-msg-8-1', 'seed-app-8-1', 'Nadia Rahman', 'Hi Ben, I''d love to look after Corsair. I have 3 years of experience and I''m confident with the routine checks.', '2026-04-17T09:30:00.000Z'),
  ('seed-msg-9-1', 'seed-app-9-1', 'Oskar Nowak', 'Hi Elena, I''d love to look after Marlin. I have 6 years of experience and I''m confident with the routine checks.', '2026-04-18T09:30:00.000Z'),
  ('seed-msg-9-2', 'seed-app-9-2', 'Chloe Dubois', 'Hi Elena, I''d love to look after Marlin. I have 4 years of experience and I''m confident with the routine checks.', '2026-04-19T09:30:00.000Z'),
  ('seed-msg-11-1', 'seed-app-11-1', 'Rafael Santos', 'Hi Liam, I''d love to look after Albatross. I have 5 years of experience and I''m confident with the routine checks.', '2026-04-20T09:30:00.000Z'),
  ('seed-msg-12-1', 'seed-app-12-1', 'Mei Lin', 'Hi Yuki, I''d love to look after Nautilus. I have 4 years of experience and I''m confident with the routine checks.', '2026-04-21T09:30:00.000Z'),
  ('seed-msg-12-2', 'seed-app-12-2', 'Tom Harper', 'Hi Yuki, I''d love to look after Nautilus. I have 8 years of experience and I''m confident with the routine checks.', '2026-04-22T09:30:00.000Z'),
  ('seed-msg-14-1', 'seed-app-14-1', 'Nadia Rahman', 'Hi Freya, I''d love to look after Mistral. I have 3 years of experience and I''m confident with the routine checks.', '2026-04-23T09:30:00.000Z');

INSERT INTO sitter_availability (
  id,
  sitter_user_id,
  sitter_name,
  date_start,
  date_end,
  regions,
  notes,
  status
) VALUES
  ('seed-avail-alex', 'seed-user-alex', 'Alex Morgan', '2026-08-01', '2026-11-30', '["Greece","Croatia","Italy"]', 'Free through autumn, Med only. Happy with liveaboard sits.', 'open'),
  ('seed-avail-samira', 'seed-user-samira', 'Samira Costa', '2026-07-01', '2026-10-31', '["Portugal","Spain","Greece"]', 'Remote worker, flexible on exact dates.', 'open'),
  ('seed-avail-noah', 'seed-user-noah', 'Noah Bennett', '2026-08-15', '2026-12-31', '[]', 'Open to anywhere — will travel for the right boat.', 'open'),
  ('seed-avail-tom-harper', 'seed-user-tom-harper', 'Tom Harper', '2026-05-01', '2026-07-30', '["United Kingdom","France","Spain"]', 'Flexible on exact dates for the right boat.', 'open'),
  ('seed-avail-nadia-rahman', 'seed-user-nadia-rahman', 'Nadia Rahman', '2026-05-10', '2026-08-08', '["Malta","Italy","Greece"]', 'Available for liveaboard sits.', 'open'),
  ('seed-avail-oskar-nowak', 'seed-user-oskar-nowak', 'Oskar Nowak', '2026-05-19', '2026-08-17', '[]', 'Flexible on exact dates for the right boat.', 'open'),
  ('seed-avail-chloe-dubois', 'seed-user-chloe-dubois', 'Chloe Dubois', '2026-05-28', '2026-08-26', '["France","Italy","Monaco"]', 'Available for liveaboard sits.', 'open'),
  ('seed-avail-rafael-santos', 'seed-user-rafael-santos', 'Rafael Santos', '2026-06-06', '2026-09-04', '["Portugal","Spain","Cabo Verde"]', 'Flexible on exact dates for the right boat.', 'open'),
  ('seed-avail-mei-lin', 'seed-user-mei-lin', 'Mei Lin', '2026-06-15', '2026-09-13', '[]', 'Available for liveaboard sits.', 'open');

INSERT INTO reviews (
  id,
  sit_id,
  boat_name,
  application_id,
  sitter_name,
  sitter_user_id,
  owner_name,
  owner_user_id,
  owner_image,
  rating,
  text,
  location,
  created_at
) VALUES
  ('seed-review-1', 'seed-sit-1', 'Aurora', 'seed-review-app-1', 'Tom Harper', 'seed-user-tom-harper', 'Sofia Moreau', 'seed-user-sofia-moreau', 'https://i.pravatar.cc/160?img=20', 4, 'Left the boat spotless and kept us updated the whole time. Would have back in a heartbeat.', 'Palma, Spain', '2026-03-05T12:00:00.000Z'),
  ('seed-review-2', 'seed-sit-2', 'Tempest', 'seed-review-app-2', 'Nadia Rahman', 'seed-user-nadia-rahman', 'Liam O''Connor', 'seed-user-liam-o-connor', 'https://i.pravatar.cc/160?img=21', 5, 'Handled a surprise storm calmly and looked after every system. Total peace of mind.', 'Split, Croatia', '2026-03-06T12:00:00.000Z'),
  ('seed-review-3', 'seed-sit-3', 'Meridian', 'seed-review-app-3', 'Oskar Nowak', 'seed-user-oskar-nowak', 'Yuki Tanaka', 'seed-user-yuki-tanaka', 'https://i.pravatar.cc/160?img=22', 4, 'Wonderful with our cat and meticulous with the checks. Highly recommended.', 'Antibes, France', '2026-03-07T12:00:00.000Z'),
  ('seed-review-4', 'seed-sit-4', 'Halcyon', 'seed-review-app-4', 'Chloe Dubois', 'seed-user-chloe-dubois', 'Diego Alvarez', 'seed-user-diego-alvarez', 'https://i.pravatar.cc/160?img=23', 5, 'Practical, reliable and easy to communicate with. A brilliant sitter.', 'Naples, Italy', '2026-03-08T12:00:00.000Z'),
  ('seed-review-5', 'seed-sit-5', 'Odyssey', 'seed-review-app-5', 'Rafael Santos', 'seed-user-rafael-santos', 'Freya Larsen', 'seed-user-freya-larsen', 'https://i.pravatar.cc/160?img=24', 4, 'Treated the boat like their own. Everything ship-shape on our return.', 'Lisbon, Portugal', '2026-03-09T12:00:00.000Z'),
  ('seed-review-6', 'seed-sit-6', 'Zephyr', 'seed-review-app-6', 'Mei Lin', 'seed-user-mei-lin', 'Marco Rossi', 'seed-user-marco-rossi', 'https://i.pravatar.cc/160?img=25', 5, 'Left the boat spotless and kept us updated the whole time. Would have back in a heartbeat.', 'Valletta, Malta', '2026-03-10T12:00:00.000Z'),
  ('seed-review-7', 'seed-sit-7', 'Nimbus', 'seed-review-app-7', 'Tom Harper', 'seed-user-tom-harper', 'Amara Okafor', 'seed-user-amara-okafor', 'https://i.pravatar.cc/160?img=26', 4, 'Handled a surprise storm calmly and looked after every system. Total peace of mind.', 'Corfu, Greece', '2026-03-11T12:00:00.000Z'),
  ('seed-review-8', 'seed-sit-8', 'Corsair', 'seed-review-app-8', 'Nadia Rahman', 'seed-user-nadia-rahman', 'Ben Whitfield', 'seed-user-ben-whitfield', 'https://i.pravatar.cc/160?img=27', 5, 'Wonderful with our cat and meticulous with the checks. Highly recommended.', 'Dubrovnik, Croatia', '2026-03-12T12:00:00.000Z'),
  ('seed-review-9', 'seed-sit-9', 'Marlin', 'seed-review-app-9', 'Oskar Nowak', 'seed-user-oskar-nowak', 'Elena Petrova', 'seed-user-elena-petrova', 'https://i.pravatar.cc/160?img=28', 4, 'Practical, reliable and easy to communicate with. A brilliant sitter.', 'Barcelona, Spain', '2026-03-13T12:00:00.000Z'),
  ('seed-review-10', 'seed-sit-10', 'Serenity', 'seed-review-app-10', 'Chloe Dubois', 'seed-user-chloe-dubois', 'Sofia Moreau', 'seed-user-sofia-moreau', 'https://i.pravatar.cc/160?img=20', 5, 'Treated the boat like their own. Everything ship-shape on our return.', 'Marmaris, Türkiye', '2026-03-14T12:00:00.000Z'),
  ('seed-review-11', 'seed-sit-11', 'Albatross', 'seed-review-app-11', 'Rafael Santos', 'seed-user-rafael-santos', 'Liam O''Connor', 'seed-user-liam-o-connor', 'https://i.pravatar.cc/160?img=21', 4, 'Left the boat spotless and kept us updated the whole time. Would have back in a heartbeat.', 'Auckland, New Zealand', '2026-03-15T12:00:00.000Z'),
  ('seed-review-12', 'seed-sit-12', 'Nautilus', 'seed-review-app-12', 'Mei Lin', 'seed-user-mei-lin', 'Yuki Tanaka', 'seed-user-yuki-tanaka', 'https://i.pravatar.cc/160?img=22', 5, 'Handled a surprise storm calmly and looked after every system. Total peace of mind.', 'Fort Lauderdale, United States', '2026-03-16T12:00:00.000Z');
