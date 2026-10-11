// THE INN BETWEEN — posted rules, room ledger, vending stock, forms and broadcast copy.
// Every rule posted here is enforced by game.js. The broadcast lies, at most twice per stay.
window.INN = window.INN || {};
(function (INN) {
  'use strict';

  INN.RULES = {
    atrium: {
      title: 'THE ATRIUM',
      lines: ['Walk. Do not run in the atrium.', 'Do not speak to seated guests.'],
      short: ['Walk in the atrium. Do not run.', 'Do not speak to seated guests in the atrium.'],
    },
    pool: {
      title: 'THE POOL',
      lines: ['Do not look at your reflection for more than five seconds.', 'The pool closes at eleven o’clock. Do not remain after closing.'],
      short: ['Reflection: five seconds, no more.', 'Pool closes at 11:00. Leave by then. Reopens 5:00.'],
    },
    arcade: {
      title: 'THE ARCADE',
      lines: ['If a machine is already playing itself, do not interrupt it.', 'One game per guest per cycle.'],
      short: ['Do not interrupt a machine that is playing itself.', 'One game per cycle.'],
    },
    dining: {
      title: 'THE DINING ROOM',
      lines: ['One plate per guest per cycle.', 'Do not enter the kitchen.'],
      short: ['One plate per cycle.', 'Do not enter the kitchen.'],
    },
  };

  // Room ledger. Keys hang on a random selection of the "key" rooms each stay.
  INN.ROOMS = {
    101: { kind: 'dnd', dnd: 'copy' },
    106: { kind: 'dnd', dnd: 'clocks' },
    111: { kind: 'dnd', dnd: 'anatomy' },
    114: { kind: 'dnd', dnd: 'audience' },
    103: { kind: 'occupied' }, 108: { kind: 'occupied' }, 110: { kind: 'occupied' },
    115: { kind: 'occupied' }, 118: { kind: 'occupied' },
  };
  for (let n = 101; n <= 120; n++) if (!INN.ROOMS[n]) INN.ROOMS[n] = { kind: 'key' };

  INN.DND_ITEMS = {
    clock: { name: 'A CLOCK SET TO YOUR CHECK-IN TIME', note: 'It is still ticking. It is not moving.' },
    garment: { name: 'A GARMENT WITH SIX SLEEVES', note: 'It is warm, as if just taken off.' },
    tape: { name: 'A VIDEOCASSETTE BEARING YOUR NAME', note: 'The label is in your handwriting.' },
    blankkey: { name: 'A KEY WITH NO NUMBER', note: 'It fits every door. You do not try it.' },
  };

  INN.VENDING = {
    snax: {
      title: 'SNAX', accent: '#b0402a',
      items: [
        { name: 'POTATO CRISPS', desc: 'Salted on one side only.', effect: 'skip', color: '#d8a040' },
        { name: 'CHOCOLATE BAR', desc: 'Warm all the way through.', effect: 'hue', color: '#5a2a12' },
        { name: 'PEANUT BRITTLE', desc: 'No peanuts. Something brittle.', effect: 'loop', color: '#c98a3a' },
        { name: 'PEPPERMINTS', desc: 'There is one more than you counted.', effect: 'echo', color: '#e8e0e0' },
        { name: 'CHEESE CRACKERS', desc: 'The orange is a little too orange.', effect: 'slow', color: '#e8742a' },
      ],
    },
    provisions: {
      title: 'PROVISIONS', accent: '#2f8a7e',
      items: [
        { name: 'COFFEE, BLACK', desc: 'Blacker than that.', effect: 'slow', color: '#2a1a0a' },
        { name: 'CANNED PEACHES', desc: 'In syrup. The syrup is cold, and moves.', effect: 'skip', color: '#e8a050' },
        { name: 'HARD-BOILED EGG', desc: 'It has been boiling for some time.', effect: 'loop', color: '#f0ece0' },
        { name: 'SALTINES', desc: 'Sweet.', effect: 'hue', color: '#d8c8a0' },
        { name: 'ORANGE SODA', desc: 'Not orange. Not soda. Cold.', effect: 'echo', color: '#e86a1a' },
      ],
    },
    shoes: {
      title: 'SHOES', accent: '#6b7a2a', shoes: true,
      items: [
        { name: 'LOAFER, BROWN, LEFT', desc: 'Worn in. By someone.', color: '#5a3418' },
        { name: 'LOAFER, BROWN, LEFT', desc: 'Also left.', color: '#5a3418' },
        { name: 'OXFORD, BLACK', desc: 'Your size exactly.', color: '#1a1a1a' },
        { name: 'HOUSE SLIPPER', desc: 'Monogrammed with your initials.', color: '#9a4a22' },
        { name: 'SANDAL', desc: 'Still warm.', color: '#c99a2a' },
      ],
    },
  };

  INN.ARCADE_TITLES = ['LUNAR MOTEL', 'KEYCATCHER', 'NIGHT AUDIT', 'ROOM SERVICE', 'DOVE', 'HALLWAY'];

  INN.EXIT_NAMES = { west: 'WEST STAIRWELL', east: 'EAST VESTIBULE', pool: 'POOL GATE', service: 'SERVICE DOOR' };

  // The front desk answers questions with printed forms.
  INN.FORMS = [
    { q: 'How do I check out?', form: 'FORM 3-C', body: 'CHECK-OUT IS AVAILABLE TO GUESTS WHO HAVE:\n(A) REMAINED THROUGH ONE HOUSEKEEPING SERVICE,\n(B) TAKEN BREAKFAST,\n(C) RETURNED THEIR KEY TO ITS DOOR.\n\nAN ATTENDANT WILL MEET QUALIFYING GUESTS AT THE LIVE EXIT. PLEASE HAVE YOUR ANSWERS READY.' },
    { q: 'Where is the exit?', form: 'FORM 7', body: 'EXITS ARE MAINTAINED AT:\nWEST STAIRWELL · EAST VESTIBULE · POOL GATE · SERVICE DOOR.\n\nONE EXIT IS LIVE AT ANY TIME. A LIVE EXIT IS INDICATED BY A LIT GREEN LAMP.\n\nEXITS ARE RELOCATED FOR YOUR CONVENIENCE.' },
    { q: 'What is housekeeping?', form: 'FORM 48-H', body: 'HOUSEKEEPING IS A SERVICE.\n\nHOUSEKEEPING ARRIVES FORTY-EIGHT HOURS AFTER A KEY IS TAKEN. THE GUEST SHOULD NOT BE PRESENT IN THE ROOM, OR VISIBLE IN THE HALLWAY OUTSIDE IT.\n\nTHIS FORM IS NOT A DESCRIPTION OF HOUSEKEEPING.' },
    { q: 'When is breakfast?', form: 'FORM 6-A', body: 'THE CONTINENTAL BREAKFAST IS SERVED IN THE DINING ROOM AT THE BELL, ONCE EACH CYCLE, FROM SIX O’CLOCK.\n\nA GUEST WHO MISSES TWO BREAKFASTS IN A ROW WILL FEEL IT.\n\nVENDING IS PROVIDED AS A COURTESY. VENDING IS NOT BREAKFAST.' },
    { q: 'Who else is staying here?', form: 'FORM 9-G', body: 'OTHER GUESTS ARE NOT YOUR CONCERN, AND YOU ARE NOT THEIRS.\n\nPLEASE KEEP IT THAT WAY.\n\nSEE POSTED RULES.' },
    { q: 'What is behind the doors marked Do Not Disturb?', form: 'FORM 0', body: '\n\n\n\n(THIS FORM HAS BEEN LEFT BLANK.)' },
    { q: 'Can I trust the announcements?', form: 'FORM 11-B', body: 'ANNOUNCEMENTS ARE PROVIDED FOR YOUR COMFORT.\n\nTHE POSTED RULES ARE THE RULES.' },
  ];

  // The opening broadcast. A routine highway safety film.
  INN.INTRO = [
    'Good evening, traveler.',
    'You have stepped off the road. This is normal. Many do.',
    'You are now a guest of the Inn Between.',
    'The Inn is not haunted. The Inn is administered.',
    'Please observe the following.',
    'One. A key hanging on a door means the room is available. Take the key, and the room is yours.',
    'Two. Housekeeping arrives forty-eight hours after you take your key. Do not be in the room. Do not be seen in the hallway outside it.',
    'Three. Breakfast is served at the bell, once each cycle. A guest who misses two breakfasts will feel it.',
    'Four. Our common areas have rules. They are posted by the door. The posted rules are the rules.',
    'Five. To leave, find an attendant at a live exit. You will need one housekeeping service, one breakfast, and your key returned to its door.',
    '@LETHALITY',
    'Thank you. Please complete your registration card.',
  ];

  // Subtly false. At most two are broadcast per stay. Each contradicts a plaque.
  INN.FALSE_RULES = [
    { id: 'pool', text: 'A reminder from the pool deck. Guests may enjoy their reflection for up to ten seconds.' },
    { id: 'arcade', text: 'Arcade cabinets in demonstration mode welcome a challenger. Please, take a turn.' },
    { id: 'atrium', text: 'During the evening program, guests may hurry through the atrium.' },
    { id: 'dining', text: 'The kitchen is pleased to offer a second plate to every guest this cycle.' },
    { id: 'poolclose', text: 'For your enjoyment, the pool will remain open until midnight.' },
  ];

  // Checkout questions. One correct answer each. "pa" marks the answer the broadcast may have taught.
  INN.CHECKOUT_RULE_Q = {
    pool: { q: 'For how long may a guest regard their reflection at the pool?', a: ['Five seconds.', 'Ten seconds.', 'As long as they like.'], correct: 0, pa: 1 },
    arcade: { q: 'A cabinet is playing itself. What does a guest do?', a: ['Leaves it be.', 'Takes a turn.', 'Unplugs it.'], correct: 0, pa: 1 },
    atrium: { q: 'How does a guest cross the atrium?', a: ['At a walk.', 'Quickly, in the evening.', 'Along the walls.'], correct: 0, pa: 1 },
    dining: { q: 'How many plates may a guest take at breakfast?', a: ['One.', 'Two.', 'As many as are offered.'], correct: 0, pa: 1 },
    poolclose: { q: 'At what hour does the pool close?', a: ['Eleven o’clock.', 'Midnight.', 'It does not close.'], correct: 0, pa: 1 },
  };

  INN.SUBLIMINAL = ['STAY', 'KEY', 'WELCOME', '48', 'RETURN', 'ROOM', 'YOU', 'SERVICE', 'REMAIN'];
})(window.INN);
