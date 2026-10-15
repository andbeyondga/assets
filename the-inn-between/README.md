# THE INN BETWEEN

A first-person liminal-horror exploration prototype. No combat, no weapons, no chases. You have stepped off the road into a 1970s motor inn that exists outside time. The inn is not haunted. It is administered.

One floor of twenty rooms around the front desk, a pool, an arcade, a dining room and four shifting exits; a six-story Garden Court north of the desk; and beyond it the Wings, corridors of rooms that are generated as you walk and never end. A stay takes about 30 minutes, unless you get lost.

## Running it

Plain static files, no build step. Three.js r149 is vendored in `vendor/`.

- Open `index.html` directly in Chrome, Edge or Firefox, or
- serve the folder: `npx http-server the-inn-between` and open the printed URL.

Use headphones. The sound design is half the game.

## Controls

| Key | Action |
| --- | --- |
| W A S D / arrows | Walk |
| Mouse | Look (click the picture to capture the mouse) |
| Shift | Sprint (mind the atrium) |
| E | Use, take, speak, read |
| F or Tab | Guest folio (stamps, conduct, notes) |
| Q (hold) | Raise your wristwatch |
| Esc | Pause the broadcast |
| Space | Fast-forward the opening broadcast |
| Esc / Enter / SKIP button | Skip the opening broadcast |

If the page is embedded somewhere that refuses mouse capture, the game falls back to click-and-drag to look.

### On a phone or tablet

Touch controls switch on automatically on devices without a mouse (keyboard and mouse play is unchanged). Hold the phone sideways.

- Left thumb, anywhere on the left half: a thumbstick appears where you touch. Push lightly to walk slowly.
- Right thumb: drag to look. A quick tap uses whatever is under the dot.
- USE, RUN (toggle), FOLIO, and pause buttons sit on the right. Tap the watch to raise it.
- Tap the screen during the opening broadcast to fast-forward.

Phones get a lighter picture (smaller internal resolution, one bloom pass, fewer lights, a shorter view distance into the Wings) to hold frame rate.

## How a stay works

A run is about 30 minutes, and the whole inn is open from the start. Nothing is roped off. Walk wherever you like; each amenity is run by a Manager, and each Manager has rules nobody posts.

1. **Check in.** Your room is assigned at the desk. The clerk answers questions with printed forms.
2. **Explore.** The Pool is east of the front desk, the Arcade beyond it, the Dining Room south. The Garden Court is north, through the Hallway Between. Beyond the Garden Court, the Wings go on forever.
3. **The Hallway Between.** The long hall from the desk to the Garden Court. It is always the same corridor: eight crimson doors, five brass pendants, the Founder's portrait with his eyes closed, a clock, a guest on a bench, a snack machine, two ferns. Sometimes something is out of order. If anything is, turn back. If nothing is, continue. Five right calls in a row and it lets you through, and stays open after that. There are 19 kinds of anomaly.
4. **Learn the house rules by watching.** The guests know the rules and follow them. The announcements lie about them. Free arcade cabinets print tickets with clues, kept as NOTES in your folio.
5. **Ring a Manager's bell** to be tested. Pass, and you get a stamp. Break a rule and the broadcast suffers technical difficulties: you wake in your room, your folio is marked NOTED, and that Manager revises its rules. Three NOTED and your stay is extended permanently.
6. **The elevator** beside the front desk returns you to any amenity you have already found.
7. **Check out.** Four stamps and the Concierge will see you at the front desk, after a few questions about the house rules. With fewer, the Concierge can arrange an early departure, as a courtesy. It does not go where you expect.

### The Managers

- **The Lifeguard (Pool).** Stand perfectly still at the signal, never look at the water, walk on the deck. The test is a lap to the chair and back. After an incident the signal becomes a raised arm and the whistle blows for nothing.
- **Attract Mode (Arcade).** Never touch a machine that is playing itself. The test is three rounds of finding the one cabinet that is waiting for you while the screens shuffle.
- **The Head Chef (Dining Room).** Each kind of guest takes one thing at breakfast. Watch their plates, then serve every guest the right dish before service ends.
- **The Groundskeeper (Garden Court).** Guests step only on one colour of the checkered floor, and never in the beds. Cross the court to the Groundskeeper without putting a foot wrong.

### Files

```
index.html        page shell, broadcast and paperwork styling
js/textures.js    every texture, painted on canvases at boot (carpet, paneling, emblem, test card)
js/data.js        posted rules, room ledger, vending stock, desk forms, broadcast copy
js/audio.js       synthesized sound: hum, hiss, muzak, bells, PA chime, housekeeping cart, whispers
js/vhs.js         post-process: bloom, then a light videotape treatment (grain, chroma, tracking, desaturation)
js/batch.js       merges static geometry per material to keep draw calls low
js/world.js       floor plan, room modules, common areas, Garden Court, exits, colliders, zones
js/wings.js       the endless generated corridors, streamed in chunks
js/entities.js    guests, staff, and the player's body for the television in 114
js/ui.js          captions, wristwatch, folio and forms, test cards, subliminal frames
js/ending.js      the highway at dawn
js/stay.js        the stay: the Hallway Between and its anomalies, the four Managers, NOTED, stamps, the elevator, the Concierge
js/game.js        engine, input, time, zones, attention, folio, endings, main loop (and the original timer mode)
```

Narration uses the browser's built-in speech voice when available; switch to captions only on the registration card or in the pause menu.
