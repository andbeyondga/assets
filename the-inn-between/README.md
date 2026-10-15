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

If the page is embedded somewhere that refuses mouse capture, the game falls back to click-and-drag to look.

### On a phone or tablet

Touch controls switch on automatically on devices without a mouse (keyboard and mouse play is unchanged). Hold the phone sideways.

- Left thumb, anywhere on the left half: a thumbstick appears where you touch. Push lightly to walk slowly.
- Right thumb: drag to look. A quick tap uses whatever is under the dot.
- USE, RUN (toggle), FOLIO, and pause buttons sit on the right. Tap the watch to raise it.
- Tap the screen during the opening broadcast to fast-forward.

Phones get a lighter picture (smaller internal resolution, one bloom pass, fewer lights, a shorter view distance into the Wings) to hold frame rate.

## How a stay works

1. **Claim a room.** Any door with a key hanging beside it is available. Taking the key starts that room's clock.
2. **The 48-hour rule.** One game hour is ten real seconds. Housekeeping arrives exactly 48 hours after you take the key (the red hand on your watch). You must not be in the room, or in the hallway within sight of its door. You will hear the cart. You will never see it.
3. **Breakfast.** A bell at 6:00 each cycle. Miss two in a row and your composure starts draining. Vending machines sell food that is almost right; eating it has wrong effects (lost hours, a corridor that repeats, colors that drift, footsteps that follow yours). Three wrong foods and you stay.
4. **Common areas have posted rules.** Read the plaque by each door. Breaking a rule never triggers a scare. It triggers attention: guests stop ignoring you, turn to face you when you enter, and one of them starts appearing at the end of corridors.
5. **Check out.** One exit is live at a time, marked by a lit green lamp. It moves. An attendant appears there only once your folio shows a housekeeping service, a breakfast, and your key hung back on its door. Answer the attendant's questions correctly. A wrong answer stamps your folio EXTENDED STAY and the loop restarts, harder.

## Rules as enforced (from `js/data.js`, checked in `js/game.js`)

| Area | Rule | How it is enforced |
| --- | --- | --- |
| Atrium | Walk. Do not run. | Hurrying in the atrium for half a second |
| Atrium | Do not speak to seated guests. | Using E on a seated atrium guest |
| Pool | Do not look at your reflection for more than five seconds. | Camera ray hitting the water from the edge for 5 s |
| Pool | Closes at 11:00. Do not remain after closing. | In the pool zone 23:00 to 05:00 for 8 s |
| Arcade | Do not interrupt a machine playing itself. | Using a cabinet in self-play |
| Arcade | One game per cycle. | A second game before the next breakfast bell |
| Dining | One plate per cycle. | A second plate in the same service |
| Dining | Do not enter the kitchen. | Pushing the kitchen door |
| Garden Court | Keep to the paths. | Standing in a planting bed |
| Garden Court | Do not call the glass elevator. | Pressing its call button |

The broadcast states a subtly false rule at most twice per stay (pool reflection "ten seconds", arcade "take a turn", and so on). The plaques are always right, and the checkout attendant asks about the rules as posted.

## The Garden Court and the Wings

Walk north from the front desk down the promenade. The Garden Court is a six-story atrium court: stacked balconies of rooms on every side, planters trailing vines, palms, a fountain, a glass elevator that moves on its own, and a skylight with nothing above it. Some guests watch from the balconies.

Openings on the west, east and north sides of the court lead into the Wings. They are a lattice of corridors built in chunks around you as you move and dropped behind you, like a voxel world. Every corridor is decided by a hash of its grid position, so the same crossing is always in the same place. Some stretches have gone dark. Some doors stand open onto nothing. Once in a while a door carries your own room number. Every crossing has a hanging sign pointing back to the lobby.

## Things the broadcast never mentions

Four rooms carry a DO NOT DISTURB placard. Nothing stops you opening them. Looking costs composure; taking anything costs much more, and the attendant will ask about it.

- **101**: an exact copy of the corridor, running somewhere it should not. The stairs at the end are the only shortcut to an exit.
- **106**: every wall covered in clocks set to your check-in time.
- **111**: a room furnished for something with different anatomy.
- **114**: rows of empty seats facing a television that shows you, from behind.

## Losing

Composure runs out, housekeeping finds you, or you eat three wrong things. There is no death screen. The broadcast returns: THE GUEST HAS DECIDED TO STAY WITH US. Your name is engraved on the brass plaque beside the front desk for the next broadcast (stored in your browser's local storage).

## Files

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
js/game.js        time, rules, housekeeping, breakfast, attention, checkout, main loop
```

Narration uses the browser's built-in speech voice when available; switch to captions only on the registration card or in the pause menu.
