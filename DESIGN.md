# Golf Course Manager Simulator — Game Design Document

**Version:** 0.1 (Draft)  
**Status:** In Progress  
**Platform:** Browser (iPhone Safari + Desktop)  
**Tech Stack:** Phaser 3, GitHub Pages, Tiled  

---

## 1. Vision

A top-down 2D pixel art golf course management and creation game. Players take over existing courses or build from scratch, balancing the artistry of course design with the business of running a thriving golf operation. Inspired by the depth of Two Point games, the charm of Stardew Valley, and the golf aesthetic of Pixel Pro Golf.

---

## 2. Core Pillars

| Pillar | Description |
|---|---|
| **Design** | Place and shape holes, terrain, hazards, and landscaping |
| **Manage** | Hire staff, set pricing, maintain the course, serve guests |
| **Grow** | Expand facilities, unlock amenities, improve reputation |
| **Play** | Abstract golfer simulation with optional visual flair |

---

## 3. Game Modes

### 3.1 Career Mode
- **Opening:** Player inherits a neglected 9-hole course from a distant relative — no debt, clean slate, small starting budget
- Learn core systems with light guidance (no heavy tutorial — learn by doing)
- Loans available for equipment, expansion, and property purchases
- Earn revenue, improve reputation, expand to new properties
- No hard end state — open-ended growth with milestone achievements
- **Future:** Scenario Mode with specific objectives (e.g., "Turn this swamp into a 4-star course in 3 years")

### 3.2 Sandbox Mode
- Blank property or pre-shaped terrain
- Unlimited budget toggle
- Design freely — place holes, shape terrain, add amenities
- **Future:** Share course layout via link

---

## 4. Core Systems

### 4.1 Grid & Tile System
- Top-down 2D grid (tile size TBD — suggest 16×16px tiles)
- Tile categories:
  - **Terrain:** Fairway, Rough, Tee Box, Green, Fringe
  - **Hazards:** Sand Bunker, Water (pond/creek), Out of Bounds
  - **Nature:** Trees (Oak, Pine, Palm), Flowers, Hedges, Rocks
  - **Paths:** Cart Path, Walking Path, Bridges
  - **Infrastructure:** Clubhouse, Pro Shop, Maintenance Shed, Restrooms, Cart Barn
  - **Amenities:** Drink/Snack Cart stops, Benches, Signage, Flags

### 4.2 Hole Design
- Each hole has: Tee Box → Fairway → Green
- Configurable par (3, 4, or 5)
- Hazard placement affects hole difficulty rating
- Hole length, width, and shape contribute to variety score
- A full course = 9 or 18 holes (9-hole courses unlocked first)

### 4.3 Course Rating System
A composite score (1–5 stars) built from sub-scores:

| Category | Factors |
|---|---|
| **Variety** | Par mix, hole length range, layout uniqueness |
| **Challenge** | Hazard placement, elevation changes (future), dogleg frequency |
| **Condition** | Mowing schedule, turf health, bunker raking, water features |
| **Amenities** | Cart options, food/drink access per hole, restroom proximity |
| **Aesthetics** | Landscaping density, theme consistency, seasonal upkeep |

Stars unlock higher green fees and attract better clientele.

### 4.4 Economy System

**Revenue streams:**
- Green fees (per round, set by player)
- Cart rentals (standard, GPS-equipped, premium)
- Pro shop sales
- Food & drink cart revenue
- Membership fees (recurring)
- Event hosting (tournaments, charity rounds) — future

**Expenses:**
- Staff wages (greenskeepers, cart staff, pro shop clerks, F&B staff)
- Equipment maintenance (mowers, carts)
- Turf upkeep supplies
- Utility costs (irrigation, lighting)
- Loan repayments (for property/equipment purchases)

**Loan System:**
- Player can take loans from an in-game bank for large purchases (equipment, land, buildings)
- Fixed repayment schedules with interest
- Defaulting on loans triggers negative reputation events
- No starting debt in Career mode — loans are opt-in

**Balance goal:** Casual enough that the player isn't buried in spreadsheets, meaningful enough that decisions feel consequential (Two Point tone).

### 4.5 Staff System
- Hire staff with varying skill levels and costs
- Staff types:
  - **Greenskeeper** — maintains turf condition
  - **Cart Attendant** — manages cart fleet
  - **Pro Shop Clerk** — boosts merchandise revenue
  - **Beverage Cart Driver** — serves golfers on course
  - **Groundskeeper** — landscaping, trees, paths
- Staff happiness affects performance
- **Future:** Staff leveling, specializations

### 4.6 Maintenance & Condition System
- Course condition degrades over time (turf grows, bunkers get messy, paths wear)
- Greenskeepers assigned zones; mowing patterns visible as pixel art animation
- Equipment matters: push mower vs. riding mower vs. fairway mower
- Irrigation system upgrades reduce manual upkeep
- Seasonal effects (future): grass grows faster in summer, frost in winter

### 4.7 Guest Simulation
- Golfer groups spawn based on tee time slots
- Represented as small pixel golfer sprites visibly walking the course hole-to-hole
- Satisfaction score generated per round based on:
  - Wait time at tee
  - Course condition encountered
  - Amenity access during round
  - Pace of play (congestion)
- Reviews feed into reputation score
- Guest tiers: casual weekend golfers, club members, tournament players

---

## 5. Progression & Unlocks

### Early Game
- 9-hole course takeover
- Basic tile set, push mower, one cart type
- Hire 1–2 staff

### Mid Game
- Expand to 18 holes
- Unlock GPS carts, beverage cart, irrigation systems
- Build clubhouse, pro shop
- First membership tier

### Late Game / Ongoing
- Buy new property and design from scratch
- Premium amenities (driving range, putting green, event pavilion)
- Scenario mode objectives
- Course theming (links, tropical, mountain, desert)

### Unlock Philosophy
- Unlocks tied to milestone achievements, not time gates
- New features introduced through natural gameplay moments ("Your members are asking about cart GPS...")

---

## 6. Art Direction

### Style
- Pixel art, top-down 2D
- Warm, saturated palette — lush greens, sandy bunkers, bright flags
- UI inspired by classic management games (clean, readable, not cluttered)
- Character sprites: small (~8×8 or 16×16), readable silhouettes

### Tile Size
- **Suggestion:** 16×16px tiles, 2× or 3× render scale for iPhone
- Grid large enough to feel like a real course layout

### Animations
- Mowers leaving cut-grass trail patterns
- Flags waving
- Water shimmering
- Cart paths with moving carts
- Golfers walking hole-to-hole

### Palette (Draft)
- Fairway green, rough green, fringe green (three distinct shades)
- Sand beige for bunkers
- Deep blue/teal for water
- Brown for paths
- Warm whites and grays for buildings

---

## 7. UI / UX

- **Main toolbar:** Build mode, Manage mode, Finance, Staff, Settings
- **Build mode:** Tile palette panel (categorized), drag-to-place, undo/redo
- **Info panels:** Click any tile/object for details and upgrade options
- **HUD:** Reputation stars, cash balance, current date/season
- **Mobile-first:** Large tap targets, swipe to pan, pinch to zoom
- **Speed controls:** Pause, normal, fast-forward

---

## 8. Technical Notes

- **Engine:** Phaser 3 (JavaScript)
- **Map Editor:** Tiled (.tmx → Phaser tilemap loader)
- **Hosting:** GitHub Pages (free, collaborative via shared repo)
- **Save System:** LocalStorage for now; JSON export/import for sharing
- **Rendering:** Pixel-perfect scaling for crisp art on all screen sizes
- **Mobile:** Touch input via Phaser's pointer system; responsive canvas

---

## 9. Feature Backlog (Future Releases)

- [ ] Scenario mode with objectives
- [ ] Course sharing via URL
- [ ] Seasonal weather effects
- [ ] Driving range mini-facility
- [ ] Elevation / slope terrain
- [ ] Tournament event hosting
- [ ] Course theming (links, desert, tropical)
- [ ] Staff leveling and specializations
- [ ] Golfer feedback/review log
- [ ] Leaderboards for sandbox course ratings

---

## 10. Resolved Design Decisions

| Question | Decision |
|---|---|
| Time scale | Stardew Valley style (~14 real minutes per in-game day) |
| Golfer visuals | Small pixel golfer sprites walk the course visibly hole-to-hole |
| Career start | Inherited course — no debt, clean slate, loans available as opt-in mechanic |
| Co-op | No multiplayer — solo game, dev collaboration handled via GitHub |

---

*Last updated: 2026-05-15 — Open questions resolved, career narrative set*
