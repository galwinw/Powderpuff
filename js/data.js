// Default content for the app. Coaches can change plays, roster, team name and rules
// in the app; this file is only the starting point (and the fallback when nothing is saved).
//
// Field coordinates are in yards. x runs 0 (left sideline) to 30 (right sideline),
// seen from behind the offense. y is yards from the line of scrimmage: negative is
// behind the line (backfield), positive is downfield.

export const OFFENSE_IDS = ["QB", "C", "RB", "LW", "LS", "RS", "RW"];
export const DEFENSE_IDS = ["RC", "RQ", "LF", "MID", "RF", "DL", "DR"];

export const POSITIONS = {
  // Offense
  QB: {
    side: "offense", short: "QB", name: "Quarterback", color: "#ffd23f",
    job: "Takes the snap, then throws the ball, hands it off, or runs with it. The QB can run past the line only once per set of downs, so save it for when it counts.",
    tips: ["Know where your first look is before the snap.", "Throw it early. Rushers start close, so you have about 2–3 seconds.", "If no one is open and there is space, take off (if your run is still available)."],
    good: "Calm under pressure, accurate on short throws, a loud clear voice.",
  },
  C: {
    side: "offense", short: "C", name: "Center", color: "#9b5de5",
    job: "Snaps the ball back to the QB, then is usually one of the two blockers. Blockers can catch passes too.",
    tips: ["Snap first, then turn and find the nearest rusher.", "Blocking = staying in front of the rusher. No hands, just shuffle your feet.", "Make the rusher go wide, away from the middle."],
    good: "Reliable snapper, quick feet, doesn't give up.",
  },
  RB: {
    side: "offense", short: "RB", name: "Running Back", color: "#ff8c42",
    job: "Lines up next to the QB. Is the second blocker on most plays, runs with the ball on handoffs, and slips out for short safety-valve catches.",
    tips: ["Block first, then look for open grass.", "On a lead block, get to the spot BEFORE the runner.", "When you release, turn around and show your hands to the QB."],
    good: "Hustles, quick, good hands on short catches.",
  },
  LW: {
    side: "offense", short: "LW", name: "Left Wide", color: "#ff5d73",
    job: "Lines up wide on the left near the sideline. Runs deep routes to stretch the defense and catches slants.",
    tips: ["Line up about 2–3 yards from the sideline.", "Run hard even when the ball isn't coming. It pulls defenders away.", "Look the ball all the way into your hands."],
    good: "One of your fastest players.",
  },
  LS: {
    side: "offense", short: "LS", name: "Left Slot", color: "#f4f4f4",
    job: "Lines up between the Left Wide and the center. Catches short passes and runs the jet sweep.",
    tips: ["Your routes are short and quick: get open fast.", "On the jet sweep, run full speed and take the ball on the move.", "After the catch, turn upfield right away."],
    good: "Quick, shifty, sure hands.",
  },
  RS: {
    side: "offense", short: "RS", name: "Right Slot", color: "#4cc9f0",
    job: "Lines up between the center and the Right Wide. Catches screens, crossing routes and outs.",
    tips: ["On the bubble screen, turn for the ball right away.", "On crossing routes, don't stop. Keep running across.", "Catch first, then run."],
    good: "Quick, good hands, not afraid of traffic.",
  },
  RW: {
    side: "offense", short: "RW", name: "Right Wide", color: "#4361ee",
    job: "Lines up wide on the right near the sideline. Runs deep routes to stretch the defense and catches slants.",
    tips: ["Line up about 2–3 yards from the sideline.", "Run hard even when the ball isn't coming. It pulls defenders away.", "Look the ball all the way into your hands."],
    good: "One of your fastest players.",
  },
  // Defense
  RC: {
    side: "defense", short: "CR", name: "Contain Rusher", color: "#ff5d73",
    job: "Rushes the QB from the outside. Your #1 job is to never let anyone (QB, sweep or screen) get around you to the outside.",
    tips: ["Start 2–3 yards from the blockers, on the outside shoulder.", "Go around blockers, never through them.", "If the play goes wide, chase it to the sideline."],
    good: "Disciplined, fast, good flag puller.",
  },
  RQ: {
    side: "defense", short: "QR", name: "Chase Rusher", color: "#ff8c42",
    job: "Rushes straight at the QB to hurry the throw. Even if you don't get the flag, making the QB throw early is a win.",
    tips: ["Pick a side of the blocker early and burst past.", "Fake one way, go the other. Blockers can't grab you.", "Can't get there? Get your hands up to block the throw."],
    good: "Quick first step, relentless.",
  },
  LF: {
    side: "defense", short: "LF", name: "Left Flat", color: "#ffd23f",
    job: "Guards the short area on the left side (about 5 yards deep). Stops quick passes and runs to your side.",
    tips: ["Stay in your area: anyone who comes into it is yours.", "Keep your eyes on the QB. Break on the ball when it's thrown.", "Pull flags with two hands, stay low, don't dive."],
    good: "Reliable flag puller.",
  },
  MID: {
    side: "defense", short: "M", name: "Middle", color: "#9b5de5",
    job: "Guards the short middle of the field. Stops crossing routes, the center, and QB runs up the middle.",
    tips: ["Line up about 5 yards back in the middle.", "Watch the QB. If they run, go get the flag.", "Crossing receivers come through your area: be ready."],
    good: "Smart, good at reading the QB.",
  },
  RF: {
    side: "defense", short: "RF", name: "Right Flat", color: "#4cc9f0",
    job: "Guards the short area on the right side (about 5 yards deep). Stops quick passes, screens and sweeps to your side.",
    tips: ["Stay in your area: anyone who comes into it is yours.", "See blockers running your way? A screen or sweep is coming.", "Pull flags with two hands, stay low, don't dive."],
    good: "Reliable flag puller.",
  },
  DL: {
    side: "defense", short: "DL", name: "Deep Left", color: "#f4f4f4",
    job: "Guards the deep left half of the field. Nobody gets behind you, ever.",
    tips: ["Start about 10–12 yards back.", "Back up as receivers run deep. Stay deeper than the deepest one.", "Short catches in front of you are OK. Come up and pull the flag."],
    good: "Fast, calm, good at tracking the ball.",
  },
  DR: {
    side: "defense", short: "DR", name: "Deep Right", color: "#4361ee",
    job: "Guards the deep right half of the field. Nobody gets behind you, ever.",
    tips: ["Start about 10–12 yards back.", "Back up as receivers run deep. Stay deeper than the deepest one.", "Short catches in front of you are OK. Come up and pull the flag."],
    good: "Fast, calm, good at tracking the ball.",
  },
};

export const GROUPS = {
  offense: ["Quick", "Protect", "Screen", "Run"],
  defense: ["Zone", "Man"],
};

export const SITUATIONS = [
  { id: "first", side: "offense", label: "1st down", hint: "Start the set of downs with a safe gain." },
  { id: "short", side: "offense", label: "Short yardage", hint: "3rd or 4th down, 1–4 yards to go." },
  { id: "long", side: "offense", label: "Long yardage", hint: "Need a big chunk." },
  { id: "blitz", side: "offense", label: "They rush 2 every play", hint: "Make the rushers pay." },
  { id: "redzone", side: "offense", label: "Near the end zone", hint: "Little room, throw to open spots." },
  { id: "d-base", side: "defense", label: "Most downs", hint: "Our normal defense." },
  { id: "d-long", side: "defense", label: "They need a big gain", hint: "Take away the deep ball." },
];

// Route library shown on the Learn > Routes page. Demo coordinates use the field system above.
export const ROUTES = [
  { id: "go", name: "Go", steps: "Sprint straight down the field. Look back for the ball after about 10 steps.", use: "Pulls defenders deep and opens space underneath.", start: [22, -0.6], path: [[22, 17]] },
  { id: "slant", name: "Slant", steps: "3 hard steps forward, then cut at an angle toward the middle. Keep running.", use: "Quick throw that beats the rush.", start: [24, -0.6], path: [[24, 2.5], [16, 8.5]] },
  { id: "flat", name: "Flat", steps: "2–3 steps forward, then flatten out toward the sideline. Turn your head for the ball.", use: "Short, safe catch near the sideline.", start: [20, -1.2], path: [[20.5, 1.5], [28, 2.5]] },
  { id: "out", name: "Out", steps: "8–10 steps forward, plant your inside foot, cut straight to the sideline.", use: "Medium gain, hard to defend near the sideline.", start: [20, -0.6], path: [[20, 8.5], [28.5, 8.5]] },
  { id: "curl", name: "Curl", steps: "6–8 steps forward, stop, and turn back to face the QB.", use: "Find the open space in front of the defense.", start: [22, -0.6], path: [[22, 7.5], [21.2, 6]] },
  { id: "dig", name: "Dig (In)", steps: "8–10 steps forward, then cut straight across toward the middle.", use: "Gets open behind the short defenders.", start: [24, -0.6], path: [[24, 9], [14, 9]] },
  { id: "post", name: "Post", steps: "8 steps forward, then angle toward the middle of the end zone.", use: "Deep shot between the deep defenders.", start: [25, -0.6], path: [[25, 8], [17, 18]] },
  { id: "corner", name: "Corner", steps: "8 steps forward, then angle toward the back corner of the end zone.", use: "Deep shot toward the sideline.", start: [19, -0.6], path: [[19, 8], [27, 17]] },
  { id: "cross", name: "Shallow Cross", steps: "2 steps forward, then run across the field at about 5 yards deep. Don't stop.", use: "Used in Mesh. Defenders get stuck in traffic.", start: [25, -1.2], path: [[24, 4.5], [6, 5]] },
  { id: "bubble", name: "Bubble", steps: "Step back and out toward the sideline in a curve. Turn for the ball right away, then go upfield.", use: "The catch on the Bubble Screen.", start: [21, -1.2], path: [[22.5, -2.6], [25.5, -2.4], [26, 4]] },
  { id: "block", name: "Block", steps: "Stay between the rusher and the QB. Feet wide, hands crossed on your chest, shuffle your feet. No hands, no pushing.", use: "Keeps rushers away so the QB has time.", start: [15, -0.6], path: [[15, -1.8]], kind: "block", ghosts: [{ label: "R", start: [15, 2.2] }] },
  { id: "block-release", name: "Block & Release", steps: "Block for 2 seconds (count it out loud), then slip out to an open spot and turn for the ball.", use: "Blockers can catch, so you become the safety valve.", start: [13, -4], path: [[13.5, -3, 1], [8, 1]], kind: "blockRelease", ghosts: [{ label: "R", start: [12, 1.5] }] },
];

export const GLOSSARY = [
  ["Line of scrimmage", "The invisible line across the field where the ball starts each play. The offense lines up behind it."],
  ["Snap / hike", "The center handing the ball back to the QB to start the play."],
  ["Down", "One play. You get a set of downs to reach the next first-down line."],
  ["First down", "Reaching the next line to gain. Your league has two per drive, then you go for the touchdown."],
  ["Route", "The path a receiver runs. Each one has a name (slant, go, out…)."],
  ["Blocker", "An offensive player who keeps getting in front of a rusher so they can't reach the QB. No hands allowed. Blockers can still catch passes."],
  ["Rusher", "A defender who chases the QB. Starts 2–3 yards from the blockers and must go around them."],
  ["Pocket", "The space behind the blockers where the QB stands to throw."],
  ["Handoff", "The QB hands the ball to a runner instead of throwing it."],
  ["Screen", "A short pass behind the line with blockers out in front of the catcher."],
  ["Motion", "A player running sideways before the snap (like on the Jet Sweep)."],
  ["Zone defense", "Each defender guards an area of the field. Whoever comes into your area is yours."],
  ["Man defense", "Each defender follows one specific receiver everywhere."],
  ["Flat", "The short area near the sideline, close to the line of scrimmage."],
  ["Sideline", "The side edge of the field. Stepping on or over it ends the play."],
  ["Flag guarding", "Using your hand or arm to block a defender from your flag. It's a penalty."],
  ["Interception", "A defender catches a pass. The ball switches teams."],
];

const SPREAD = {
  QB: [15, -4.5], C: [15, -0.6], RB: [12.5, -4.5],
  LW: [2.5, -0.6], LS: [8, -1.2], RS: [22, -1.2], RW: [27.5, -0.6],
};
export const OFFENSE_TEMPLATE = SPREAD;
export const DEFENSE_TEMPLATE = {
  RC: [20, 2.5], RQ: [10, 2.5], LF: [5, 5], MID: [15, 5], RF: [25, 5], DL: [8, 12], DR: [22, 12],
};
const GHOSTS = Object.entries(SPREAD).map(([id, start]) => ({ label: POSITIONS[id].short, start }));

const o = (id, extra) => ({ id, start: SPREAD[id], path: [], kind: "route", note: "", ...extra });

export const DEFAULT_PLAYBOOK = {
  plays: [
    {
      id: "slant-flat", side: "offense", name: "Slant-Flat", group: "Quick",
      situations: ["first", "short"],
      summary: "Our safe, go-to play. The ball is out in about 1 second.",
      why: "Rushers start close, so we throw before they arrive. A slant and a flat on each side means one of them is almost always open. Against zone, the flat defender can't cover both. Against man, the slant beats them inside.",
      qbRead: "Pick a side before the snap. Look at the slant first. If a defender jumps it, throw the flat. Safety valve: the RB after 2 seconds.",
      ball: { type: "pass", to: "RW", at: 1.0 },
      players: [
        o("QB", { kind: "carry", path: [[15, -5.3]], note: "Catch the snap, take one step back, throw to the slant or the flat on your chosen side." }),
        o("C", { kind: "block", path: [[15, -1.7, 1.6]], note: "Snap, then block the nearest rusher. Stay in front of them." }),
        o("RB", { kind: "blockRelease", path: [[13.2, -3.3, 1.2], [10, 0.5], [9.5, 2.5]], route: "block-release", note: "Block the other rusher, count to 2, then slip out to the left as the safety valve." }),
        o("LW", { path: [[2.5, 2.5], [9, 7.5], [12, 13]], route: "slant", note: "3 hard steps forward, then cut at an angle toward the middle. Keep running." }),
        o("LS", { path: [[7.5, 1.5], [2, 2.5]], route: "flat", note: "2 steps forward, then flatten out toward the left sideline. Turn for the ball." }),
        o("RS", { path: [[22.5, 1.5], [28, 2.5]], route: "flat", note: "2 steps forward, then flatten out toward the right sideline. Turn for the ball." }),
        o("RW", { path: [[27.5, 2.5], [21, 7.5], [18, 13]], route: "slant", note: "3 hard steps forward, then cut at an angle toward the middle. Keep running." }),
      ],
    },
    {
      id: "bubble-screen", side: "offense", name: "Bubble Screen", group: "Screen",
      situations: ["blitz", "first"],
      summary: "Throw it right away to the Right Slot with two blockers out in front.",
      why: "When the defense sends 2 rushers, they run right past the play. Our two blockers lead the way, and defenders have to go AROUND them. A catch in open space with escorts is very hard to stop.",
      qbRead: "Catch the snap and throw immediately to the Right Slot. Don't wait, don't look anywhere else.",
      ball: { type: "pass", to: "RS", at: 0.35 },
      players: [
        o("QB", { kind: "carry", path: [[15, -5]], note: "Catch and throw right away to the Right Slot. Throw it a little in front of them." }),
        o("C", { kind: "block", speed: 5, path: [[19.5, -0.4], [25, 2]], note: "Snap, then run right and get in front of the Right Slot. Get in the way of the nearest defender." }),
        o("RB", { kind: "block", speed: 5, path: [[19, -3], [24.5, -0.6]], note: "Run right behind the line and get in front of the Right Slot. Get in the way of the first defender who comes." }),
        o("LW", { path: [[2.5, 16]], route: "go", note: "Run a Go straight downfield. You pull defenders away from the screen." }),
        o("LS", { path: [[9, 16]], route: "go", note: "Run a Go straight downfield. You pull defenders away from the screen." }),
        o("RS", { path: [[24, -2.6], [26.5, -2.4], [27, 4], [26, 14]], route: "bubble", note: "Step back and out toward the sideline. Turn for the ball right away, catch it, then follow your blockers upfield." }),
        o("RW", { path: [[27.5, 12]], route: "go", note: "Run a Go to pull your defender away from the screen." }),
      ],
    },
    {
      id: "mesh", side: "offense", name: "Mesh", group: "Protect",
      situations: ["redzone", "blitz"],
      summary: "Two slots cross each other 5 yards downfield. Defenders get stuck in traffic.",
      why: "Defenders who follow a receiver run into each other or the other receiver. That's legal, because our receivers are just running routes, not blocking. It also beats zones: the crossers keep moving into open gaps. It's the best play against a 2-rusher defense, which only has 5 players left to cover.",
      qbRead: "Watch the Left Slot crossing to the right first. If covered, look for the Right Slot crossing left. Safety valve: the RB in the middle.",
      ball: { type: "pass", to: "LS", at: 1.25 },
      players: [
        o("QB", { kind: "carry", path: [[15, -5.3]], note: "Take one step back. Throw to whichever crosser comes open first. The RB is your safety valve." }),
        o("C", { kind: "block", path: [[15, -1.7, 1.8]], note: "Snap, then block the nearest rusher." }),
        o("RB", { kind: "blockRelease", path: [[13.2, -3.3, 1.2], [15.5, 1.5]], route: "block-release", note: "Block the other rusher for 2 seconds, then step into the middle just past the line and turn around." }),
        o("LW", { path: [[2.5, 17]], route: "go", note: "Run a Go straight downfield. You pull the deep defender away." }),
        o("LS", { path: [[9, 3.5], [26, 4.5], [27, 12]], route: "cross", note: "Run 4 yards, then cut across to the right at about 4 yards deep. Run just UNDER the Right Slot. Don't stop." }),
        o("RS", { path: [[21, 5], [4, 5.8], [3, 12]], route: "cross", note: "Run 5 yards, then cut across to the left at about 5 yards deep. Run just OVER the Left Slot. Don't stop." }),
        o("RW", { path: [[27.5, 17]], route: "go", note: "Run a Go straight downfield. You pull the deep defender away." }),
      ],
    },
    {
      id: "flood", side: "offense", name: "Flood", group: "Protect",
      situations: ["long"],
      summary: "Three receivers on the right at three depths: short, medium, deep.",
      why: "Zone defenders guard one area each. With three receivers on one side at three depths, one defender ends up trying to cover two players, so somebody is open. Our two blockers give the QB time for the medium throw.",
      qbRead: "Look deep first (Right Wide), then medium (Right Slot out), then short (RB in the flat).",
      ball: { type: "pass", to: "RS", at: 1.75 },
      players: [
        o("QB", { kind: "carry", path: [[15, -5.5]], note: "Take two steps back. Read deep to short on the right side: Right Wide, then Right Slot, then the RB." }),
        o("C", { kind: "block", path: [[15, -1.7, 2]], note: "Snap, then block the nearest rusher." }),
        o("RB", { kind: "blockRelease", path: [[13.5, -3.3, 1.2], [22, -1], [28.5, 1.5]], route: "block-release", note: "Block for 2 seconds, then run to the right flat near the sideline. You're the short option." }),
        o("LW", { path: [[2.5, 9], [13, 10]], route: "dig", note: "Run 9 yards, then cut across toward the middle. If the right side is covered, you're open behind the defense." }),
        o("LS", { path: [[10, 17]], route: "go", note: "Run a Go up the middle. Pull the deep defenders with you." }),
        o("RS", { path: [[22, 8], [28.5, 8.5], [29, 12]], route: "out", note: "Run 8–9 yards, plant, and cut straight to the right sideline. You're the medium option." }),
        o("RW", { path: [[27.5, 18]], route: "go", note: "Run a Go straight downfield as fast as you can. You're the deep option and you push the defense back." }),
      ],
    },
    {
      id: "jet-sweep", side: "offense", name: "Jet Sweep", group: "Run",
      situations: ["first", "short"],
      summary: "The Left Slot runs across before the snap and takes the handoff at full speed around the right edge.",
      why: "Rushers and defenders chase the QB, but the ball is already going the other way at full speed. The RB leads the way to the edge, and defenders have to go around them. A runner moving fast toward the sideline is very hard to pull a flag from.",
      qbRead: "Snap the ball when the Left Slot is about to pass the center. Hand it off, then fake running left to fool the defense.",
      ball: { type: "handoff", to: "LS", at: 0.3 },
      players: [
        o("QB", { kind: "carry", speed: 3, path: [[15.5, -3.4], [11, -5]], note: "Catch the snap, hand the ball to the Left Slot as they run past, then fake rolling left." }),
        o("C", { kind: "block", path: [[17.5, -0.3]], note: "Snap when the QB calls it, then step right and block the nearest rusher." }),
        o("RB", { kind: "block", start: [17.5, -4.5], path: [[23, -2], [26, 2.5]], note: "Line up on the RIGHT of the QB. At the snap, sprint to the right edge and get in front of the first defender. Get there before the runner." }),
        o("LW", { path: [[2.5, 14]], route: "go", note: "Run a Go. Make your defender think it's a pass." }),
        o("LS", { delay: -1.1, speed: 6.5, path: [[14, -2.6], [21, -2.6], [27, 1], [27.5, 13]], note: "Before the snap, run full speed to the right behind the line. Take the handoff on the move, follow the RB around the right edge, then turn upfield." }),
        o("RS", { path: [[22, 15]], route: "go", note: "Run a Go to take your defender away from the sweep." }),
        o("RW", { path: [[27.5, 14]], route: "go", note: "Run a Go to pull your defender away from the edge." }),
      ],
    },
    {
      id: "qb-draw", side: "offense", name: "QB Draw", group: "Run",
      situations: ["short", "blitz"],
      summary: "Looks like a pass, then the QB runs straight up the middle. Uses our one QB run.",
      why: "When 2 rushers come, our blockers steer them wide and everyone else runs deep, so the middle of the field is empty. The QB can only run once per set of downs, so this is the best time to use it: short yardage, or when they rush 2.",
      qbRead: "Drop back like you're passing and count 'one-one-thousand'. When the rushers are pushed wide, run straight up the middle.",
      ball: { type: "keep" },
      players: [
        o("QB", { kind: "carry", speed: 4.5, path: [[15, -5.6, 0.9], [15.5, 1], [15, 12]], note: "Drop back like it's a pass, wait a moment, then run straight up the middle. Only call this if the QB run is still available." }),
        o("C", { kind: "block", path: [[13, -1.8]], note: "Snap, then block the rusher on your LEFT and steer them wide to the left." }),
        o("RB", { kind: "block", start: [17.5, -4.5], path: [[18.5, -2.5]], note: "Line up on the RIGHT of the QB. Block the rusher on the right and steer them wide to the right." }),
        o("LW", { path: [[2.5, 16]], route: "go", note: "Run a Go and take your defender deep." }),
        o("LS", { path: [[8.5, 16]], route: "go", note: "Run a Go and take your defender deep. Clear out the middle." }),
        o("RS", { path: [[21.5, 16]], route: "go", note: "Run a Go and take your defender deep. Clear out the middle." }),
        o("RW", { path: [[27.5, 16]], route: "go", note: "Run a Go and take your defender deep." }),
      ],
    },
    {
      id: "two-rush-zone", side: "defense", name: "2-Rush Zone", group: "Zone",
      situations: ["d-base"],
      summary: "Our normal defense. 2 rushers, 3 short zones, 2 deep zones.",
      why: "If we rush only 1, they have 2 blockers on them and the QB has all day. Rushing 2 forces fast throws. Everyone else guards an area, so nobody is stuck chasing the fastest receiver. Give up short gains, never the deep one.",
      qbRead: "",
      ball: null,
      ghosts: GHOSTS,
      players: [
        { id: "RC", start: [20, 2.5], kind: "rush", path: [[22, -2], [17.5, -5]], note: "Rush from the outside. Go around the blocker, never through. Don't let anyone get outside of you." },
        { id: "RQ", start: [10, 2.5], kind: "rush", path: [[11.5, -2.5], [14.5, -5]], note: "Rush straight at the QB. Fake one way, burst the other. Hands up if you can't get there." },
        { id: "LF", start: [5, 5], kind: "zone", path: [[4.5, 6]], zone: { x: 4.5, y: 6, rx: 4.5, ry: 3 }, note: "Guard the short left area. Anyone who comes into it is yours. Watch the QB." },
        { id: "MID", start: [15, 5], kind: "zone", path: [[15, 6.5]], zone: { x: 15, y: 6.5, rx: 5, ry: 3 }, note: "Guard the short middle. Stop crossing routes and QB runs up the middle." },
        { id: "RF", start: [25, 5], kind: "zone", path: [[25.5, 6]], zone: { x: 25.5, y: 6, rx: 4.5, ry: 3 }, note: "Guard the short right area. Blockers running your way = screen. Yell it!" },
        { id: "DL", start: [8, 12], kind: "zone", path: [[8, 15]], zone: { x: 8, y: 15, rx: 7, ry: 4.5 }, note: "Guard the deep left half. Back up and stay deeper than the deepest receiver." },
        { id: "DR", start: [22, 12], kind: "zone", path: [[22, 15]], zone: { x: 22, y: 15, rx: 7, ry: 4.5 }, note: "Guard the deep right half. Back up and stay deeper than the deepest receiver." },
      ],
    },
    {
      id: "man-safety", side: "defense", name: "Man + Safety", group: "Man",
      situations: ["d-long"],
      summary: "1 rusher. Five defenders each follow one player, plus a deep safety.",
      why: "Use it when they need a big gain or have one star receiver. Put your fastest defender on their best player, and the safety helps deep. Watch out: crossing plays like Mesh beat man coverage. If you see receivers crossing, switch back to zone.",
      qbRead: "",
      ball: null,
      ghosts: GHOSTS,
      players: [
        { id: "RQ", start: [12, 2.5], kind: "rush", path: [[13, -2.5], [15, -5]], note: "You're the only rusher. Go straight at the QB, around the blocker." },
        { id: "RC", label: "Safety", start: [15, 12], kind: "zone", path: [[15, 15]], zone: { x: 15, y: 15, rx: 9, ry: 5 }, note: "You're the SAFETY today: play deep in the middle and help on any deep pass." },
        { id: "LF", start: [8, 3], kind: "man", path: [[9, 10]], note: "Follow the Left Slot everywhere they go. Stay close." },
        { id: "MID", start: [15, 4.5], kind: "man", path: [[14, 5.5]], note: "Follow the RB. If the QB runs, go get the flag." },
        { id: "RF", start: [22, 3], kind: "man", path: [[21, 10]], note: "Follow the Right Slot everywhere they go. Stay close." },
        { id: "DL", start: [3.5, 4], kind: "man", path: [[3, 14]], note: "Follow the Left Wide everywhere. Stay a step deeper than them." },
        { id: "DR", start: [26.5, 4], kind: "man", path: [[27, 14]], note: "Follow the Right Wide everywhere. Stay a step deeper than them." },
      ],
    },
  ],
};

export const DEFAULT_ROSTER = { players: [] };

export const DEFAULT_SETTINGS = {
  teamName: "Powderpuff Playbook",
  rules: [
    "7 vs 7. Each drive gets two first downs: cross the first-down line twice, then go score.",
    "The QB can run past the line only once per set of downs.",
    "The offense can have up to 2 blockers. Blockers can't use their hands. They keep getting in front of the rushers.",
    "Blockers are allowed to catch passes.",
    "The defense can send up to 2 rushers. Rushers start about 2–3 yards from the blockers.",
    "Rushers must go around blockers, never run through them. Rushers can only touch the flag, not the player.",
    "A play ends when the ball carrier's flag is pulled, they step out of bounds, or a pass hits the ground.",
    "Flag guarding (using your hand or arm to protect your flag) is a penalty.",
  ],
};

// Learn > Positions: the simple roles players need to know. The play diagrams still
// show each spot separately (so everyone can find their own route), but these are the jobs.
export const POSITION_GROUPS = [
  {
    id: "qb", side: "offense", name: "Quarterback", ids: ["QB"],
    job: "Takes the snap, then throws the ball, hands it off, or runs with it. The QB can run past the line only once per set of downs, so save it for when it counts.",
    tips: ["Know where your first look is before the snap.", "Throw it early. Rushers start close, so you have about 2–3 seconds.", "If no one is open and there's space, take off (if your run is still available)."],
    good: "Calm under pressure, accurate on short throws, a loud clear voice.",
  },
  {
    id: "center", side: "offense", name: "Center", ids: ["C"],
    job: "Snaps the ball back to the QB, then is usually one of the two blockers. Blockers can catch passes too.",
    tips: ["Snap first, then turn and find the nearest rusher.", "Blocking = keep getting in front of the rusher. No hands, just shuffle your feet.", "Make the rusher go wide, away from the middle."],
    good: "Reliable snapper, quick feet, doesn't give up.",
  },
  {
    id: "rb", side: "offense", name: "Running Back", ids: ["RB"],
    job: "Lines up next to the QB. The second blocker on most plays, runs with the ball on handoffs, and slips out for short safety-valve catches.",
    tips: ["Block first, then look for open grass.", "On a lead block, get to the spot BEFORE the runner.", "When you slip out, turn around and show your hands to the QB."],
    good: "Hustles, quick, good hands on short catches.",
  },
  {
    id: "receivers", side: "offense", name: "Receivers", ids: ["LW", "LS", "RS", "RW"],
    job: "Line up where the play shows, run your route exactly, get open, catch, and run. Your route is written on every play, so your main job is knowing the routes.",
    tips: ["Wide receivers line up near the sideline; slot receivers line up between them and the center. Same job, different spot.", "Run full speed even when the ball isn't coming. It pulls defenders away from your teammates.", "After your cut, eyes on the QB and hands up.", "Catch with your hands first, then run. Don't guard your flag."],
    good: "Quick, sure hands, listens.",
    routesLink: true,
  },
  {
    id: "rushers", side: "defense", name: "Rushers", ids: ["RC", "RQ"],
    job: "Start 2–3 yards from the blockers and chase the QB. One rusher (Contain) stays on the outside so nobody gets around them. The other (Chase) goes straight at the QB.",
    tips: ["Go around blockers, never through them. Flags only, no touching players.", "Fake one way, burst the other. Blockers can't grab you.", "Can't get there? Get your hands up to block the throw.", "Contain rusher: if the play goes wide, chase it to the sideline."],
    good: "Quick first step, relentless, good flag puller.",
  },
  {
    id: "short", side: "defense", name: "Short Defenders", ids: ["LF", "MID", "RF"],
    job: "Guard the short area, about 5 yards deep: left, middle, or right. Whoever comes into your area is yours. In Man + Safety, you follow one receiver instead.",
    tips: ["Eyes on the QB. Break toward the ball when it's thrown.", "See blockers running your way? A screen or sweep is coming. Yell it!", "Pull flags with two hands, stay low, don't dive."],
    good: "Reliable flag puller, reads the QB.",
  },
  {
    id: "deep", side: "defense", name: "Deep Defenders", ids: ["DL", "DR"],
    job: "Guard the deep half of the field on your side. Nobody gets behind you, ever.",
    tips: ["Start about 10–12 yards back.", "Back up as receivers run deep. Stay deeper than the deepest one.", "Short catches in front of you are OK. Come up and pull the flag."],
    good: "Fast, calm, good at tracking the ball.",
  },
];

// Learn > Routes: the routes the team has been taught, explained in depth.
// Demo coordinates use the field system above; the QB throws to the receiver at `throwAt`.
export const ROUTE_LESSONS = [
  {
    id: "slant", name: "Slant",
    summary: "3 hard steps forward, then cut at an angle toward the middle and keep running.",
    start: [24, -0.6], path: [[24, 2.5], [16, 8.5], [12.5, 11]], throwAt: 0.55,
    marks: [{ at: [24, 2.5], label: "Step 3: cut!", side: "left" }],
    steps: [
      "Line up where the play shows you, outside foot back, weight forward.",
      "Explode off the line: 3 quick, hard steps straight ahead. Count them: 1, 2, 3.",
      "On step 3, plant your outside foot hard and cut toward the middle on a diagonal.",
      "Look for the ball right away. It comes fast, in about 1 second. Hands up, thumbs together.",
      "Catch it and keep running the same direction, then turn upfield.",
    ],
    tips: ["Make the cut sharp. Plant and go, don't curve around.", "Stay on your diagonal. Don't drift flat across the field.", "Run through the catch. Never stop and wait for the ball."],
    mistakes: ["Running too deep before cutting. The QB needs it fast.", "Slowing down to look for the ball.", "Cutting straight across instead of on an angle."],
    beats: "The rushers, because the ball is out before they get there. It also works when your defender lines up on your outside or backs off you.",
    qbTip: "Throw as the receiver plants on step 3, aimed just in front of them.",
  },
  {
    id: "out", name: "Out",
    summary: "Run 8 steps straight, plant your inside foot, and cut straight to the sideline.",
    start: [19, -0.6], path: [[19, 8], [28.5, 8], [29, 10]], throwAt: 1.35,
    marks: [{ at: [19, 8], label: "Step 8: plant & cut", side: "left" }],
    steps: [
      "Line up where the play shows you.",
      "Run 8 strong steps straight down the field. Make it look like a Go.",
      "On step 8, drop your hips and plant your INSIDE foot (the one closer to the middle).",
      "Snap your head and shoulders toward the sideline and run straight at it.",
      "Catch the ball facing the QB, then turn upfield. Stay in bounds!",
    ],
    tips: ["Sell the Go. The faster you run the first 8 steps, the more open you'll be.", "Cut flat. Don't drift deeper or float back.", "Know where the sideline is. Catch first, then worry about the line."],
    mistakes: ["Slowing down before the cut. That tells the defender what's coming.", "Rounding the cut into a slow curve.", "Drifting out of bounds before the catch."],
    beats: "Defenders playing deep or backing up. Near the sideline, only the receiver can get to a good throw. It's good on long yardage.",
    qbTip: "Throw it as the receiver plants, toward the sideline, so only they can catch it.",
  },
  {
    id: "curl", name: "Curl",
    summary: "Run 6 steps, stop fast, turn back to face the QB, and come back toward the ball.",
    start: [22, -0.6], path: [[22, 6.5], [21.2, 5.2, 0.6]], throwAt: 0.95,
    marks: [{ at: [22, 6.5], label: "Step 6: stop & turn", side: "left" }],
    steps: [
      "Line up where the play shows you.",
      "Run 6 hard steps straight ahead, like it's a Go.",
      "On step 6, drop your hips and stop as fast as you can.",
      "Turn toward the inside (toward the QB), not the sideline.",
      "Come back 1–2 steps toward the QB with your hands up. Catch, turn, run.",
    ],
    tips: ["The harder you run the first 6 steps, the more room you'll have when you stop.", "Stop on a dime. Short, choppy steps into the stop.", "Always come back to the ball. Defenders are behind you."],
    mistakes: ["Drifting slowly into the stop. The defender catches up.", "Turning toward the sideline instead of the QB.", "Standing still waiting for the ball."],
    beats: "Defenders who back up because they're scared of the Go. Against a zone, stop in the open space between two defenders.",
    qbTip: "Throw as the receiver stops and turns, right at their chest.",
  },
  {
    id: "go", name: "Go",
    summary: "Sprint straight down the field as fast as you can. Look back for the ball after about 10 steps.",
    start: [24, -0.6], path: [[24, 19]], throwAt: 1.0,
    marks: [{ at: [24, 10], label: "Look for the ball", side: "left" }],
    steps: [
      "Line up where the play shows you. Leave 2–3 yards between you and the sideline.",
      "Explode off the line and run full speed, straight ahead.",
      "Stay on your line. Don't drift toward the middle or the sideline.",
      "After about 10 steps, look over your inside shoulder for the ball without slowing down.",
      "Track the ball into your hands and keep running to the end zone.",
    ],
    tips: ["Full speed the whole way. Slowing down to look kills the play.", "Even if the ball isn't coming, a hard Go pulls defenders deep and opens space for teammates.", "Catch it with your hands, pinkies together for a ball over your shoulder."],
    mistakes: ["Slowing down or looking back too early.", "Drifting toward the sideline and running out of room.", "Jogging when you're not the target. Defenders notice."],
    beats: "Defenders playing too close to you, or man defense without a deep safety. Even when it's not thrown, it makes room for short routes.",
    qbTip: "Throw it deep and out in front. Let the receiver run under it, never make them stop.",
  },
];
