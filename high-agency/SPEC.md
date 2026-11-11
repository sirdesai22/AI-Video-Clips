# SPEC — "The 59 seconds" (storyline A)

GOAL:    The viewer leaves believing agency is a skill: clear thinking + bias to action + disagreeability, proven by how two "nuts" on a beach learned to fly.
OUTPUT:  HyperFrames, 1920 x 1080, 30 fps. No voiceover: large on-screen lines carry the words. Music + SFX added in the sound pass.
TIME:    ~54 s x 30 = 1620 frames.
SOURCE:  https://www.highagency.com/ (George Mack, "High Agency in 30 Minutes", Part 2). Facts used: NYT "Man won't fly for a million years"; 0% success rate; birds fly → so can humans; Kitty Hawk; ~200 wing shapes in a homemade wind tunnel; engines too heavy → built a 180 lb aluminium engine; four years of crashes; Wilbur: "Not in a thousand years will man fly", sketching again next morning; Dec 17 1903, 59 s flight; 5.58 billion passenger seats flown last year; the tricycle.
         Left out: the flight distance (page says 582 ft; history says 852 ft).

LOOK:    Medium = an engineer's blueprint.
         ground  #1D5AA6 flat, with a 48 px grid of 1 px lines at rgba(255,255,255,.07) and a 240 px major grid at .14. Never darker.
         ink     #F3EFE4 (chalk white): every line drawing (3 px stroke, round caps) and every word.
         accent  #FFAD4A signal amber: numbers only (0:59, 0%, 200, 180 lb, 5.58 billion) and the one key word per line. Max one accent focus per frame.
         world 2 (newspaper, shot 2 only): ground #ECE6D6 newsprint, ink #141414, accent stamp #D7261E.
         display: Archivo Black, numbers at 220–360 px, lines at 72–96 px, tracking -2%.
         body/labels: Inter 700 at 34–40 px, sentence case, on the part they name.
         depth: none. Flat drawing; no shadows, no glow.
OBJECTS: stopwatch (crown, ring, 60 ticks, one hand); a folded newspaper front page; a bird in profile with an outstretched wing; a wind tunnel box (open-ended rectangle, fan circle, airflow lines) with a wing profile inside; a balance scale with an engine block on one pan; a crumpled glider sketch; the 1903 Flyer (biplane: two long wings, struts, front elevator, twin propellers); a world arc full of flight routes; a tricycle (three wheels, frame, handlebar).
MOTION:  drawings draw on (stroke-dashoffset), 0.6–1.1 s, power2.inOut; arrivals expo.out 0.5 s; exits power3.in 0.25 s; lines enter per word blur 6→0 px, 0.13 s each, 0.07 s apart; numbers count on power2.out; held lines dead still.
         Transitions (each caused by something on screen): colour flood (blueprint → newsprint and back), match cut (bird's wing → wing profile; flight path → route line), blur swap on one stage, whip (engine scale → crash sketches).

SHOTS (seconds):
1  0.0–5.0   Stopwatch already half drawn on frame 0; hand sweeps 0→59, "0:59" lands in orange. Line: "59 seconds in the air." → stopwatch blur-swaps out.
2  5.0–11.0  Colour flood to newsprint. Headline prints: "MAN WON'T FLY FOR A MILLION YEARS". Red stamp slams: "SUCCESS RATE 0%". → flood back to blueprint.
3  11.0–18.0 One diagram grows: bird drawn → "Birds fly" → "so flight obeys physics" → "so humans can fly" → "so I can." (last word accent). → the wing match-cuts into shot 4.
4  18.0–25.0 Wind tunnel drawn around the wing; wing profile morphs through shapes as a counter runs 1→200. Line: "So they tested 200 wing shapes."
5  25.0–31.0 Balance scale: stock engine sinks the pan ("Too heavy"); swap to their engine, scale balances, "180 lb" lands. Line: "Engines were too heavy. So they built one." → whip.
6  31.0–37.0 Glider sketches crash and cross out on the beat. Quote: "Not in a thousand years will man fly." → struck through → "The next morning, he was sketching again."
7  37.0–44.0 Payoff at normal speed: the Flyer draws on, lifts along a long flight path; timer 0→59 under it; "December 17, 1903".
8  44.0–49.0 Flight path pulls back to one line among hundreds of routes over a world arc; "5.58 billion" + "seats flown last year".
9  49.0–54.0 Tricycle draws wheel by wheel with labels: clear thinking / bias to action / disagreeability. Line: "That's high agency. It can be learned." Small credit: "From 'High Agency in 30 Minutes' by George Mack · highagency.com".

BANNED:  the spec.md defaults; navy/black void; glow; three cards in a row; bullet lists; drifting titles; logo end card; any number not in SOURCE.
QA:      t=0 (thumbnail: stopwatch reads, not blank), 4.5, 8.5, 17, 23, 29, 35, 42, 47.5, 53.5.
