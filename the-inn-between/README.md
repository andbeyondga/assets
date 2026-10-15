# THE INN BETWEEN

A first-person liminal-horror exploration prototype. No combat, no weapons, no chases. You have stepped off the road into a 1970s motor inn that exists outside time. The inn is not haunted. It is administered.

One floor of twenty rooms around the front desk, a pool, an arcade, a dining room and four shifting exits; a six-story Garden Court north of the desk; and beyond it the Wings, corridors of rooms that are generated as you walk and never end. A single run takes 15 to 25 minutes, unless you get lost.

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
| F or Tab | Guest folio (inventory, stamps, rules on file) |
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

The game is built as a run of about 30 minutes: a hub, the hallways between, and the amenities, each run by a Manager. This build is the first playable slice, with one amenity open (the Pool). The other three are listed on the elevator as not yet in service.

1. **Check in.** Your room is assigned at the desk. The clerk answers questions with printed forms.
2. **Take the elevator** beside the front desk to an amenity.
3. **Walk the hallway between.** It is always the same corridor: eight crimson doors (401 to 408), five brass pendants, the Founder's portrait with his eyes closed, a clock, a guest reading on a bench, a snack machine, two ferns. Sometimes something is out of order. If anything is, turn back. If nothing is, continue. A correct call moves the count on the sign forward; a wrong one sends you back to zero. Five in a row the first time (two after that) and the last hallway ends at the amenity's doors. There are 19 kinds of anomaly, from a wrong door number to knocking from inside 407.
4. **Learn the house rules by watching.** Nothing is posted. The guests know the rules and follow them. The announcements lie about them.
5. **Beat the Manager** and get a stamp in your folio.
6. **Check out.** Four stamps and the Concierge will see you at the front desk. With fewer, the Concierge can arrange an early departure as a courtesy, after a few questions about the house rules.

### The Pool and the Lifeguard

- House rules, never posted: stand perfectly still at the signal, never look at the water, walk on the deck.
- Before the test, guests circle the deck with their heads turned away from the water and freeze at the signal. Look at the water too long and they all turn to look at you.
- Ring the bell by the entrance for the swim test: to the Lifeguard's chair and back, while the whistle blows, something splashes, and your reflection waves at you.
- After an incident the rules are revised: the signal becomes the Lifeguard's raised arm, the whistle now blows for nothing, and the announcements still say to stop at the whistle.

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
js/stay.js        the stay: hub, the hallway between and its anomalies, the Pool and the Lifeguard, NOTED, stamps, the Concierge
js/game.js        engine, input, time, zones, attention, folio, endings, main loop (and the original timer mode)
```

Narration uses the browser's built-in speech voice when available; switch to captions only on the registration card or in the pause menu.
