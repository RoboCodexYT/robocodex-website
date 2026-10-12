# robot doctor — research notes

the research behind `doctor.html`. every cause, check and fix in `js/doctor-data.js` traces back to one of the sources below, and each cause in the tool links its own sources so teams can verify.

## what we read

**official FIRST / FTC docs** (pulled straight from the ftcdocs source repo, not summaries)
- Control System Troubleshooting Guide: common issues (gamepad calibration, MODE button, sleep timer, "unable to find hardware device", null exceptions, `number XXX is invalid`, missing `waitForStart()`, uninterruptible loops, dual hub address conflicts, 5 second power cycle)
- Troubleshooting Wireless Issues at an Event: ping time thresholds (≈5 ms great, <50 ms ok, 250 ms+ poor), interference sources, Wi-Fi suppressors, metal blocking radios, busy OpModes inflating ping
- Managing ESD: how robots charge (triboelectric), arcs jump ~3/8", ferrite chokes, isolating electronics on non-conductive panels, insulating exposed connectors, the resistive grounding strap, and the Control Hub USB 2.0 port ESD issue (use USB 3.0)
- Best practices: servo power (2 A per port pair, 5 A total across servo ports + 5 V aux, use odd *or* even ports), power management (flywheels, servo injectors, LEDs, cameras vs the 20 A fuse), RC mounting away from motors and metal/carbon fiber, gamepads (SDK 12 orange indicator = unrecognized driver), recommended software versions (CH OS 1.1.6, hub firmware 1.8.2, RC/DS 12.0, matching versions)
- Tech tips: battery care (3000 mAh NiMH, 20 A ATM fuse, ~1%/day self discharge, 200–300 cycles), annual maintenance (no hot glue on XT30, compressed pins, charge cycling)
- Universal IMU interface (logo / USB facing directions)
- VisionPortal camera controls + CPU and bandwidth

**REV Robotics docs** (markdown versions of the pages)
- Control Hub troubleshooting: brownout signs (disconnect sound, ≤9 V under load, motors slow), school Wi-Fi blocking, compressed XT30 pins and the X-ACTO fix, solid blue LED > 30 s
- Expansion Hub troubleshooting, power cycle order, USB strain relief, hubs after Dec 2021 have no internal IMU
- LED blink codes (solid/blinking blue, blinking orange < 7 V, magenta/yellow Wi-Fi band reset, blue blink count = hub address)
- 12 V battery troubleshooting (fuse, damaged wires, aging), DC motor port voltage testing with a multimeter
- IMU page: BNO055 → BHI260AP switch in Sept 2022, ESD-related IMU resets, CH OS 1.1.4 fix, add a driver button to re-init the IMU

**Game Manual 0** (source .rst files)
- software common issues (NullPointer from hardwareMap at field init, TargetPositionNotSetException ordering, stuck in stop/loop timeouts — 5 s, 900 ms for stop)
- mecanum teleop math (normalize powers, ×1.1 strafe correction), bulk reads (AUTO caching), control loops (P→oscillation, D to damp, I usually 0, "motor goes full speed" = encoder cable or direction)
- encoders (RUN_WITHOUT_ENCODER doesn't disable the encoder, reset pattern), SDK servos (600–2400 µs default, `setPwmRange` up to 500–2500, servo 5 V rail is off until first servo command)
- servo usage tips (don't backdrive, side loads break servos, connector can go in rotated 180°, retaining clips, SPM failure warning → Servo Hub / power injector)
- wiring guide, power tips (XT30 wear, Tamiya connectors, PowerPole, grounding strap, USB retention, dryer sheets, foam wheels and dragging intakes build static)
- chain and belt (≥90° wrap, 180° best, tension, stretch, master links), shaft retention, build tips (set screws slip, locknuts, screws bottoming out), rigging (string tension, elastic retraction), dead wheels (spring tension, encoders)

**Pedro Pathing docs** (source .mdx)
- FAQ: inaccurate localization (pod names swapped, directions, offsets, Pinpoint mounted sticker side up), robot moves infinitely during tuning (localization wrong, motor directions), wrong direction, poorly tuned controllers (lower P if jittery/overshoots, static feedforward too high causes jitter), tune localization before following
- Pinpoint tuning: X pod in X port, push forward → x up, push left → y up

**community** (FTC Community forum, Chief Delphi, r/FTC threads, goBILDA Pinpoint guide, Limelight FTC API docs)
- stale Wi-Fi networks on the DS causing disconnects, gamepad re-zeroing after a drop, ESD from touching field elements, timed `sleep()` autos varying with battery, Pinpoint IMU zero offset drift if moved during power-up, flywheel vibration drift, servo port pairs browning out with high-torque servos, encoder pinouts on old NeveRest motors, Android Studio Ladybug + `adb connect 192.168.43.1:5555`, AprilTag decimation range vs fps (C920: ~10 ft at 1, ~6 ft at 2, ~4 ft at 3), low exposure + high gain for motion blur, Limelight 3A needs `start()` and draws power whenever the hub is on

## what we learned about making a good troubleshooter

there's no existing interactive FTC diagnosis tool — teams currently piece it together from REV flowcharts, FTC docs pages and Discord. so the bar is "better than asking in a Discord at 11pm before a qualifier."

1. **start from the symptom, in the team's words.** people know what they see ("it drifts left"), not the cause. search has to understand loose phrasing, and browsing by area has to be one tap.
2. **one question per screen**, with a "how do I check this?" for anyone who doesn't know how. every question offers *not sure* so nobody gets stuck guessing.
3. **cheapest checks first.** pit crews check the battery before rewiring the robot. questions are ordered by how much they narrow things down, with a small penalty for slow checks.
4. **show the reasoning live.** a running list of suspects that re-ranks as you answer makes the tool feel like a detective, teaches the system, and lets you bail out early when one cause is obviously winning.
5. **ranked causes with plain confidence words** (likely / possible / unlikely / ruled out), not a single verdict or fake-precise percentages.
6. **fixes you can act on:** step lists you can tick off, copyable code, time estimate, and links to the official source.
7. **a way forward when it isn't fixed:** "didn't fix it" moves to the next suspect; every result can be copied as a summary to paste into Discord or the FTC forum (answers + suspects), so asking for help is faster.
8. **back always works**, and the whole diagnosis lives in the url so it can be shared or reopened.
9. **pit-friendly:** works offline (the site is a PWA), dark, big tap targets, phone-first.

## extras that came out of the research

- **status light decoder** — REV's blink codes as an interactive picker
- **pre-match checkup** — a tickable checklist built from FIRST + REV best practices that remembers progress on the device
