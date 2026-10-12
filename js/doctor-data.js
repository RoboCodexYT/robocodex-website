// robot doctor knowledge base.
// sources for everything here are in docs/robot-doctor-research.md, and each cause
// links the pages it came from. answers nudge causes up or down with a multiplier:
// >1 = points toward it, <1 = points away, 0 = rules it out.

(function () {
  const areas = {
    drive: { label: 'Drivetrain', icon: 'fa-car' },
    connection: { label: 'Connection', icon: 'fa-wifi' },
    power: { label: 'Power & wiring', icon: 'fa-bolt' },
    mechanisms: { label: 'Mechanisms', icon: 'fa-gears' },
    servos: { label: 'Servos', icon: 'fa-sliders' },
    code: { label: 'Code & OpModes', icon: 'fa-code' },
    sensors: { label: 'Sensors & odometry', icon: 'fa-compass' },
    vision: { label: 'Vision', icon: 'fa-eye' },
    auto: { label: 'Autonomous', icon: 'fa-route' },
  };

  const sources = {
    gm0_common: ['GM0 · Common software issues', 'https://gm0.org/en/latest/docs/software/getting-started/common-issues.html'],
    gm0_mecanum: ['GM0 · Mecanum teleop', 'https://gm0.org/en/latest/docs/software/tutorials/mecanum-drive.html'],
    gm0_bulk: ['GM0 · Bulk reads', 'https://gm0.org/en/latest/docs/software/tutorials/bulk-reads.html'],
    gm0_control: ['GM0 · Control loops', 'https://gm0.org/en/latest/docs/software/concepts/control-loops.html'],
    gm0_encoders: ['GM0 · Encoders', 'https://gm0.org/en/latest/docs/software/tutorials/encoders.html'],
    gm0_servo_tips: ['GM0 · Servo usage tips', 'https://gm0.org/en/latest/docs/power-and-electronics/servo-guide/usage-tips.html'],
    gm0_sdk_servos: ['GM0 · How the SDK drives servos', 'https://gm0.org/en/latest/docs/software/adv-control-system/sdk-servos.html'],
    gm0_wiring: ['GM0 · Wiring guide', 'https://gm0.org/en/latest/docs/power-and-electronics/wiring.html'],
    gm0_power_tips: ['GM0 · Power tips and tricks', 'https://gm0.org/en/latest/docs/power-and-electronics/tips-and-tricks.html'],
    gm0_chain: ['GM0 · Chain', 'https://gm0.org/en/latest/docs/common-mechanisms/power-transmission/chain.html'],
    gm0_belt: ['GM0 · Belt', 'https://gm0.org/en/latest/docs/common-mechanisms/power-transmission/belt.html'],
    gm0_build_tips: ['GM0 · Building tips', 'https://gm0.org/en/latest/docs/hardware-components/tips-and-tricks.html'],
    gm0_shafts: ['GM0 · Shaft retention', 'https://gm0.org/en/latest/docs/common-mechanisms/power-transmission/shaft-retention.html'],
    gm0_rigging: ['GM0 · Slide rigging', 'https://gm0.org/en/latest/docs/common-mechanisms/linear-motion-guide/rigging.html'],
    gm0_deadwheels: ['GM0 · Dead wheels', 'https://gm0.org/en/latest/docs/common-mechanisms/dead-wheels.html'],
    gm0_vision: ['GM0 · Vision', 'https://gm0.org/en/latest/docs/software/tutorials/vision.html'],
    ftc_common: ['FTC Docs · Troubleshooting common issues', 'https://ftc-docs.firstinspires.org/en/latest/control_system_troubleshooting/troubleshooting_common_issues/troubleshooting-common-issues.html'],
    ftc_esd: ['FTC Docs · Managing ESD', 'https://ftc-docs.firstinspires.org/en/latest/hardware_and_software_configuration/configuring/managing_esd/managing-esd.html'],
    ftc_wireless: ['FTC Docs · Wireless issues at events', 'https://ftc-docs.firstinspires.org/en/latest/control_system_troubleshooting/troubleshooting_wireless_at_events/troubleshooting-wireless-at-events.html'],
    ftc_logs: ['FTC Docs · Using log files', 'https://ftc-docs.firstinspires.org/en/latest/control_system_troubleshooting/using_log_files/using-log-files.html'],
    ftc_servo_power: ['FTC Docs · Servo power best practices', 'https://ftc-docs.firstinspires.org/en/latest/robot_building/best_practices/servo-power-usage.html'],
    ftc_power: ['FTC Docs · Power management', 'https://ftc-docs.firstinspires.org/en/latest/robot_building/best_practices/power-management.html'],
    ftc_versions: ['FTC Docs · Recommended software versions', 'https://ftc-docs.firstinspires.org/en/latest/robot_building/best_practices/control-system-software-management.html'],
    ftc_battery: ['FTC Docs · Battery care, charging, fuses', 'https://ftc-docs.firstinspires.org/en/latest/tech_tips/tech-tips/tech-tip-battery-care/tech-tip-battery-care.html'],
    ftc_maintenance: ['FTC Docs · Annual maintenance', 'https://ftc-docs.firstinspires.org/en/latest/tech_tips/tech-tips/tech-tip-annual-maintenance/tech-tip-annual-maintenance.html'],
    ftc_imu: ['FTC Docs · Universal IMU interface', 'https://ftc-docs.firstinspires.org/en/latest/programming_resources/imu/imu.html'],
    ftc_gamepad: ['FTC Docs · Gamepad best practices', 'https://ftc-docs.firstinspires.org/en/latest/robot_building/best_practices/gamepad.html'],
    ftc_rc_mount: ['FTC Docs · Robot Controller mounting', 'https://ftc-docs.firstinspires.org/en/latest/robot_building/best_practices/robot-controller-mounting.html'],
    ftc_camera_controls: ['FTC Docs · VisionPortal camera controls', 'https://ftc-docs.firstinspires.org/en/latest/apriltag/vision_portal/visionportal_camera_controls/index.html'],
    ftc_vision_cpu: ['FTC Docs · VisionPortal CPU and bandwidth', 'https://ftc-docs.firstinspires.org/en/latest/apriltag/vision_portal/visionportal_cpu_and_bandwidth/visionportal-cpu-and-bandwidth.html'],
    ftc_webcam: ['FTC Docs · Configuring a webcam', 'https://ftc-docs.firstinspires.org/en/latest/hardware_and_software_configuration/configuring/configuring_external_webcam/configuring-external-webcam.html'],
    ftc_dual_hubs: ['FTC Docs · Configuring two hubs', 'https://ftc-docs.firstinspires.org/en/latest/hardware_and_software_configuration/configuring/configuring_dual_hubs/configuring-dual-hubs.html'],
    rev_ch: ['REV · Control Hub troubleshooting', 'https://docs.revrobotics.com/duo-control/troubleshooting-the-control-system/control-hub-troubleshooting'],
    rev_eh: ['REV · Expansion Hub troubleshooting', 'https://docs.revrobotics.com/duo-control/troubleshooting-the-control-system/expansion-hub-troubleshooting'],
    rev_led: ['REV · Status LED blink codes', 'https://docs.revrobotics.com/duo-control/troubleshooting-the-control-system/led-blink-codes'],
    rev_battery: ['REV · 12V battery troubleshooting', 'https://docs.revrobotics.com/duo-control/troubleshooting-the-control-system/12v-battery-best-practices-and-troubleshooting'],
    rev_motor_port: ['REV · Testing a motor port', 'https://docs.revrobotics.com/duo-control/troubleshooting-the-control-system/control-hub-troubleshooting/dc-motor-port-voltage-testing'],
    rev_imu: ['REV · IMU', 'https://docs.revrobotics.com/duo-control/sensors/i2c/imu'],
    rev_general: ['REV · General troubleshooting', 'https://docs.revrobotics.com/duo-control/troubleshooting-the-control-system/troubleshooting-the-control-system'],
    pedro_faq: ['Pedro Pathing · Troubleshooting', 'https://pedropathing.com/docs/pathing/faq'],
    pedro_pinpoint: ['Pedro Pathing · Pinpoint tuning', 'https://pedropathing.com/docs/pathing/tuning/localization/pinpoint'],
    limelight: ['Limelight · FTC programming', 'https://docs.limelightvision.io/docs/docs-limelight/apis/ftc-programming'],
    pinpoint_guide: ['goBILDA · Pinpoint user guide (PDF)', 'https://www.gobilda.com/content/user_manuals/3110-0002-0001%20User%20Guide.pdf'],
  };

  // ---------------------------------------------------------------------------
  // causes
  // ---------------------------------------------------------------------------
  const causes = {
    // power & wiring ----------------------------------------------------------
    battery_low: {
      title: 'Battery is low or worn out',
      area: 'power',
      short: 'A tired battery sags under load, so motors slow down and the hub can brown out.',
      fix: [
        'Swap in a freshly charged battery and test again. That alone answers the question.',
        'Watch the voltage on the Driver Station while you drive hard. Healthy packs dip, but sitting around 9 V or lower under load is a problem.',
        'Charge at the rate the battery maker recommends (REV slim: 1.8 A on the REV charger; TETRIX: 0.9 A).',
        'Label every battery with your team number, the year, and a name, and tally charge cycles. NiMH packs get weak after roughly 200–300 cycles.',
        'Retire packs that drop fast even when full. A battery tester (like a Battery Beak) shows internal resistance.',
      ],
      time: '2 min',
      sources: ['ftc_battery', 'rev_ch', 'rev_battery'],
    },
    xt30_loose: {
      title: 'Loose power connection (XT30 / battery plug)',
      area: 'power',
      short: 'Compressed XT30 pins or a wiggly battery plug cut power for a split second when the robot gets bumped.',
      fix: [
        'With the robot on, wiggle the battery cable and each XT30 plug. If the hub light flickers or the DS beeps, you found it.',
        'Look at the male XT30 pins on the hub. Each pin has 4 tines with small gaps; if they are squeezed together, very gently spread them with an X-ACTO blade (REV\'s fix).',
        'Do not hot glue XT30 plugs. It only hides a bad contact, and the power still drops under impact.',
        'Strap the battery down so it cannot shift, and keep the cable away from sharp screws.',
        'Many teams swap the battery and switch leads to Anderson PowerPole connectors, which wear much better.',
      ],
      time: '10 min',
      sources: ['rev_ch', 'ftc_maintenance', 'gm0_power_tips'],
    },
    brownout: {
      title: 'Too much current draw (brownout)',
      area: 'power',
      short: 'Flywheels, many servos, or stalled motors pull the battery voltage down until the control system resets or disconnects.',
      fix: [
        'Check whether the problem only happens when a specific mechanism runs. REV lists a disconnect sound, ≤9 V on the DS while running, and motors slower than commanded as brownout signs.',
        'Look for stalled motors: a jammed intake, a slide pushing a hard stop, or an arm held against gravity at full power. Stalls draw huge current.',
        'Stagger big loads in code (spin the flywheel up before you drive hard, not at the same time).',
        'Spread servos across hubs and use a Servo Hub or servo power injector for heavy ones.',
        'Keep the total under the 20 A battery fuse. Flywheels, LEDs, servo injectors, and cameras all add up.',
      ],
      code: {
        label: 'Show battery voltage in telemetry',
        snippet: `VoltageSensor battery = hardwareMap.voltageSensor.iterator().next();
// in your loop:
telemetry.addData("Battery (V)", "%.2f", battery.getVoltage());`,
      },
      time: '15 min',
      sources: ['rev_ch', 'ftc_power', 'ftc_servo_power'],
    },
    fuse_blown: {
      title: 'Battery fuse is blown',
      area: 'power',
      short: 'Every legal battery has a 20 A blade fuse on the red wire. If it blows, the battery reads 0 V.',
      fix: [
        'Measure the battery with a multimeter or battery tester. A reading near 0 V points straight at the fuse.',
        'Open the black fuse housing on the red wire and look at the fuse. A broken bridge means it blew.',
        'Replace it with a 20 A automotive mini (ATM) blade fuse (yellow). Any auto parts store has them.',
        'Then find out why it blew: a short, a stalled motor, or too many loads at once.',
      ],
      time: '5 min',
      sources: ['ftc_battery', 'rev_battery'],
    },
    esd: {
      title: 'Static shock (ESD) from the field',
      area: 'power',
      short: 'Robots build static driving on tiles. When the frame touches metal, the discharge can reset the hub, the IMU, the camera, or Wi-Fi.',
      fix: [
        'Notice whether it happens right after touching a field element or another robot. That pattern is classic ESD.',
        'Install a FIRST-legal resistive grounding strap (REV-31-1269) from a spare XT30 port to the frame.',
        'Plug cameras and other USB devices into the Control Hub\'s USB 3.0 port. The USB 2.0 port has a known ESD issue that can knock out Wi-Fi.',
        'Mount electronics on a non-conductive panel (thin plywood, PVC) and keep exposed connector metal more than 3/8" (1 cm) from the frame. Arcs can jump that far.',
        'Snap ferrite chokes onto sensor, encoder, servo, and USB cables, and tape over exposed metal on servo extensions.',
        'Things touching the floor (foam wheels, a dragging intake) build static faster. Many teams wipe the robot with a dryer sheet between matches.',
      ],
      time: '30 min',
      sources: ['ftc_esd', 'rev_general', 'gm0_wiring'],
    },
    usb_strain: {
      title: 'USB or hub-to-hub cable working loose',
      area: 'power',
      short: 'Camera, Expansion Hub, and phone cables pull out a little when the robot gets hit.',
      fix: [
        'Push every USB and the hub-to-hub (RS485) cable in firmly and check that nothing hangs loose.',
        'Add strain relief: the REV USB retention mount, 3D printed clips, or zip ties so the cable cannot tug on the port.',
        'Do not wrap cables around the hub, and keep spares. USB ports wear out with repeated plugging.',
      ],
      time: '10 min',
      sources: ['rev_eh', 'gm0_power_tips', 'rev_general'],
    },
    // connection --------------------------------------------------------------
    wifi_stale: {
      title: 'Driver Station remembers other Wi-Fi networks',
      area: 'connection',
      short: 'If the Driver Hub was ever joined to school or home Wi-Fi (for updates), it can hop off the robot\'s network.',
      fix: [
        'On the Driver Hub / DS phone, forget every saved Wi-Fi network except the robot.',
        'Toggle Airplane mode on, then make sure Wi-Fi is on and Bluetooth is off.',
        'Re-pair to the robot from the Driver Station app.',
        'Do future updates with the REV Hardware Client instead of joining the DS to the internet.',
      ],
      time: '5 min',
      sources: ['ftc_wireless', 'rev_ch'],
    },
    wifi_interference: {
      title: 'Busy or blocked Wi-Fi channel',
      area: 'connection',
      short: 'Crowded channels, school Wi-Fi suppressors, or interference make the link slow and flaky.',
      fix: [
        'Look at the ping on the Driver Station. Around 5 ms is great, under 50 ms is fine, 250 ms+ means a bad link.',
        'If your Driver Station supports it, switch the Control Hub to 5 GHz (REV recommends it), or change to a quieter channel.',
        'At school, ask IT whether a Wi-Fi suppressor is running. It will knock out any robot network.',
        'At an event, tell the FTA or CSA. They can check the channel and move you.',
      ],
      time: '10 min',
      sources: ['ftc_wireless', 'rev_ch'],
    },
    rc_mounting: {
      title: 'Control Hub radio is buried in metal',
      area: 'connection',
      short: 'Metal plates and carbon fiber between the hub and the driver block and bounce the Wi-Fi signal.',
      fix: [
        'Move the Control Hub where it has a clear line toward the drivers, away from motors.',
        'Keep sheet metal and carbon fiber out of the path between the hub and the Driver Station.',
        'Do not set the Driver Station on a metal stand. FIRST measured about twice the retries on a metal music stand.',
      ],
      time: '20 min',
      sources: ['ftc_rc_mount', 'ftc_wireless'],
    },
    software_outdated: {
      title: 'Out-of-date or mismatched software',
      area: 'connection',
      short: 'Old Control Hub OS, hub firmware, or mismatched Robot Controller / Driver Station apps cause random drops and weird errors.',
      fix: [
        'Update with the REV Hardware Client (Windows) over USB.',
        'FIRST\'s recommended minimums: Control Hub OS 1.1.6, hub firmware 1.8.2, Robot Controller and Driver Station apps 12.0, Driver Hub OS 1.2.0.',
        'Make sure the Robot Controller and Driver Station app versions match.',
        'If you use Android Studio, update your project to the latest FtcRobotController SDK too.',
      ],
      time: '20 min',
      sources: ['ftc_versions', 'rev_ch', 'ftc_maintenance'],
    },
    code_blocking: {
      title: 'Your code is blocking the robot controller',
      area: 'code',
      short: 'A long loop or sleep can make the robot look disconnected: ping climbs and the controls stop responding even though Wi-Fi is fine.',
      fix: [
        'Check whether the problem only happens in one OpMode. An empty OpMode with good ping means the link is fine and the code is the issue.',
        'Never sleep or loop for a long time inside an iterative OpMode\'s loop(). Use a timer and check it each loop instead.',
        'In LinearOpMode, every while loop must check opModeIsActive().',
      ],
      time: '15 min',
      sources: ['ftc_wireless', 'gm0_common'],
    },
    exhub_address: {
      title: 'Two hubs share the same address',
      area: 'connection',
      short: 'Every Expansion Hub ships at address 2. Two hubs with the same address conflict.',
      fix: [
        'Connect each Expansion Hub alone and count the blue blinks every ~5 seconds on its LED. That number is its address.',
        'Change one hub\'s address (the Expansion Hub keeps 2 by convention; change the other), then reconfigure.',
        'Check the hub-to-hub RS485 cable is fully seated at both ends.',
      ],
      time: '15 min',
      sources: ['ftc_common', 'ftc_dual_hubs', 'rev_led'],
    },
    // gamepad -----------------------------------------------------------------
    gamepad_calibration: {
      title: 'Gamepad zeroed with a stick pushed',
      area: 'connection',
      short: 'The Driver Station sets stick center when the gamepad connects. If a stick was bumped then, the robot thinks you are always pushing.',
      fix: [
        'Stop the OpMode, unplug the gamepad, and plug it back in with both sticks untouched.',
        'If a gamepad dropped mid-match while a stick was pushed, wiggle the sticks and let them return to center before restarting.',
        'Re-assign the gamepad: START + A for driver 1, START + B for driver 2.',
      ],
      time: '1 min',
      sources: ['ftc_common'],
    },
    gamepad_mode: {
      title: 'Logitech MODE button is on',
      area: 'connection',
      short: 'On the F310, MODE swaps the left stick and D-pad. The green light next to it is lit.',
      fix: [
        'Look for the green LED next to MODE on the F310. Press MODE once to turn it off.',
        'Tape over the MODE button so nobody bumps it in a match.',
      ],
      time: '30 sec',
      sources: ['ftc_common'],
    },
    gamepad_unassigned: {
      title: 'Gamepad not assigned or not recognized',
      area: 'connection',
      short: 'The Driver Station needs to know which gamepad is driver 1 vs 2, and some controllers are not supported.',
      fix: [
        'Press START + A (driver 1) or START + B (driver 2). The gamepad icon on the DS lights up green when it is active.',
        'In SDK 12+, an orange gamepad icon means the controller is not a known FTC gamepad and buttons may be mapped wrong.',
        'Run the "Test Gamepads" utility OpMode to see what each button really reports.',
        'Use a supported gamepad: Logitech F310, Xbox 360, PS4 DualShock 4, PS5 DualSense, Etpark PS4, REV PS4-compatible.',
        'Add a short USB extension that stays plugged into the Driver Station so the port does not wear out.',
      ],
      time: '2 min',
      sources: ['ftc_common', 'ftc_gamepad'],
    },
    stick_drift: {
      title: 'Worn sticks with no deadzone',
      area: 'connection',
      short: 'Older gamepads rest slightly off center, so the robot creeps when nobody touches it.',
      fix: [
        'Print the raw stick values in telemetry while not touching anything. Anything above about 0.05 is drift.',
        'Add a small deadzone in code, or swap to a newer gamepad.',
      ],
      code: {
        label: 'Simple deadzone',
        snippet: `double deadzone(double v) {
    return Math.abs(v) < 0.08 ? 0 : v;
}

double y = deadzone(-gamepad1.left_stick_y);`,
      },
      time: '5 min',
      sources: ['ftc_gamepad'],
    },
    missing_waitforstart: {
      title: 'Missing waitForStart()',
      area: 'code',
      short: 'In a LinearOpMode, code before waitForStart() runs on INIT, so the robot can move before you press PLAY.',
      fix: [
        'Make sure every LinearOpMode calls waitForStart() before any movement code.',
        'Only do setup (hardwareMap, directions, resets) before it.',
      ],
      code: {
        label: 'Correct structure',
        snippet: `@Override
public void runOpMode() {
    // setup only
    leftDrive = hardwareMap.get(DcMotor.class, "leftDrive");

    waitForStart();

    while (opModeIsActive()) {
        // driving code goes here
    }
}`,
      },
      time: '2 min',
      sources: ['ftc_common'],
    },
    // drive -------------------------------------------------------------------
    motor_direction: {
      title: 'A drive motor is reversed',
      area: 'drive',
      short: 'Motors on opposite sides face opposite ways, so one side has to be reversed in code. One wrong direction makes the robot spin, drift, or strafe diagonally.',
      fix: [
        'Put the robot on a stand and command every drive motor forward at low power, one at a time.',
        'Every wheel should spin so the robot would go forward. Reverse any motor that spins backward.',
        'Some gearboxes and kits (goBILDA Strafer, REV mecanum kit) flip the direction again through gearing, so test instead of guessing.',
      ],
      code: {
        label: 'Reverse one side',
        snippet: `frontLeft.setDirection(DcMotorSimple.Direction.REVERSE);
backLeft.setDirection(DcMotorSimple.Direction.REVERSE);
// test each wheel on its own if anything still looks off`,
      },
      time: '5 min',
      sources: ['gm0_mecanum', 'pedro_faq'],
    },
    motor_config_swap: {
      title: 'Motor names don\'t match the ports',
      area: 'drive',
      short: 'If "frontLeft" in the configuration is actually plugged in where the back-left motor is, the drive math sends power to the wrong wheels.',
      fix: [
        'Run a test that powers one named motor at a time ("frontLeft" only, then "frontRight", ...) and watch which wheel actually moves.',
        'Fix either the wires or the configuration so names match the real wheel.',
        'After editing a configuration on the Driver Station, save it and make it the active configuration.',
      ],
      time: '10 min',
      sources: ['ftc_common', 'pedro_faq'],
    },
    mecanum_rollers: {
      title: 'Mecanum wheels mounted in the wrong pattern',
      area: 'drive',
      short: 'Mecanum wheels come in left and right versions. Swapped wheels make the robot spin or barely move instead of strafing.',
      fix: [
        'Look at the robot from above. The rollers touching the ground should form an X shape across the robot (goBILDA and REV diagrams show this).',
        'Swap any wheel that breaks the pattern to the diagonally opposite corner.',
        'Check that every roller spins freely. A stuck roller acts like a brake.',
      ],
      time: '15 min',
      sources: ['gm0_mecanum', 'pedro_faq'],
    },
    mecanum_math: {
      title: 'Drive math clips or isn\'t compensated',
      area: 'drive',
      short: 'Adding forward + strafe + turn can push a wheel past 1.0. The SDK clips it, which bends your direction. Strafing also needs a little extra power.',
      fix: [
        'Divide all four powers by the largest one whenever any goes over 1 (GM0\'s denominator trick).',
        'Multiply strafe input by about 1.1 to make up for mecanum strafe losses.',
        'Make sure forward is -gamepad.left_stick_y (the Y axis is reversed on gamepads).',
      ],
      code: {
        label: 'GM0-style mecanum drive',
        snippet: `double y  = -gamepad1.left_stick_y;      // forward is negative on the stick
double x  =  gamepad1.left_stick_x * 1.1; // counter imperfect strafing
double rx =  gamepad1.right_stick_x;

double denominator = Math.max(Math.abs(y) + Math.abs(x) + Math.abs(rx), 1);
frontLeft.setPower((y + x + rx) / denominator);
backLeft.setPower((y - x + rx) / denominator);
frontRight.setPower((y - x - rx) / denominator);
backRight.setPower((y + x - rx) / denominator);`,
      },
      time: '10 min',
      sources: ['gm0_mecanum'],
    },
    drive_friction: {
      title: 'Uneven friction or weight on one side',
      area: 'drive',
      short: 'A rubbing wheel, missing bearing, bent axle, or a heavy side makes one wheel slower, so the robot curves.',
      fix: [
        'Lift the robot and spin each wheel by hand. All four should feel the same and spin freely.',
        'Look for a wheel rubbing the frame, loose or missing bearings, bent shafts, and over-tight chain or belt.',
        'Check the weight balance. A battery or arm hanging off one side shifts traction.',
      ],
      time: '15 min',
      sources: ['gm0_mecanum', 'gm0_build_tips'],
    },
    no_velocity_control: {
      title: 'Motors running open loop',
      area: 'drive',
      short: 'With RUN_WITHOUT_ENCODER, the same power can turn different motors at slightly different speeds, so the robot curves.',
      fix: [
        'Use RUN_USING_ENCODER (or setVelocity on DcMotorEx) so each motor is speed-matched by its encoder.',
        'For autonomous, correct heading with the IMU or odometry rather than trusting equal power.',
      ],
      code: {
        label: 'Turn on velocity control',
        snippet: `for (DcMotorEx m : new DcMotorEx[]{frontLeft, frontRight, backLeft, backRight}) {
    m.setMode(DcMotor.RunMode.RUN_USING_ENCODER);
}`,
      },
      time: '5 min',
      sources: ['gm0_control', 'gm0_encoders'],
    },
    drive_geared_slow: {
      title: 'Gearing or motor choice is too torque-heavy',
      area: 'drive',
      short: 'A big reduction makes a strong but slow drivetrain.',
      fix: [
        'Use the RoboCodex drivetrain speed calculator to check your top speed from motor RPM, reduction, and wheel size.',
        'Most competitive mecanum drivetrains land around 300–435 RPM at the wheel. Much slower feels sluggish.',
      ],
      time: '5 min',
      sources: ['gm0_mecanum'],
    },
    power_scaled: {
      title: 'Code is scaling power down',
      area: 'code',
      short: 'A "slow mode" multiplier, a max speed constant, or squaring the inputs can cap your speed without you noticing.',
      fix: [
        'Print each wheel\'s commanded power in telemetry while pushing the stick all the way.',
        'Look for multipliers like 0.5 or 0.7, slow mode toggles stuck on, or setPower values capped by Range.clip.',
      ],
      time: '5 min',
      sources: ['gm0_mecanum'],
    },
  };

  window.DOCTOR = { areas, sources, causes };
})();

// motors, mechanisms, servos ---------------------------------------------------
(function () {
  Object.assign(window.DOCTOR.causes, {
    motor_unplugged: {
      title: 'Motor power wire or port problem',
      area: 'mechanisms',
      short: 'The motor\'s power plug is loose, in the wrong port, or the port is damaged.',
      fix: [
        'Follow the motor wire to the hub and push the power plug (JST VH) firmly in. Make sure it is in the port number the configuration says.',
        'Swap the motor into a port you know works. If it runs there, the old port or its configuration is the problem.',
        'To check a port, run it at full power and measure across the port pins with a multimeter. You should see roughly battery voltage. No voltage means the port is damaged (REV has a repair service).',
      ],
      time: '10 min',
      sources: ['rev_motor_port', 'gm0_wiring'],
    },
    motor_not_commanded: {
      title: 'The code never actually powers it',
      area: 'code',
      short: 'The motor is configured, but the code sets power 0, sets it in the wrong mode, or the button logic never runs.',
      fix: [
        'Add telemetry that prints the power you are sending and the motor\'s mode.',
        'With RUN_TO_POSITION, the motor only moves if you set a target, switch to RUN_TO_POSITION, and set power above 0.',
        'Watch for two parts of the code fighting, like one line setting power and another setting 0 later in the same loop.',
      ],
      code: {
        label: 'RUN_TO_POSITION in the right order',
        snippet: `arm.setTargetPosition(1120);                      // 1. target first
arm.setMode(DcMotor.RunMode.RUN_TO_POSITION);     // 2. then the mode
arm.setPower(0.6);                                // 3. then power > 0`,
      },
      time: '5 min',
      sources: ['gm0_common', 'gm0_encoders'],
    },
    motor_stall: {
      title: 'Mechanism is jammed or overloaded',
      area: 'mechanisms',
      short: 'If the mechanism binds or the load is too heavy for the gearing, the motor stalls. It hums, heats up, and drains the battery.',
      fix: [
        'Power off and move the mechanism by hand through its full range. It should move smoothly with no tight spots.',
        'Feel the motor after a run. Hot means it is stalling or working far too hard.',
        'Check for over-tightened chain or belt, misaligned shafts, screws hitting things, or a hard stop the code keeps pushing into.',
        'If the load really is too heavy, add reduction or a second motor. The RoboCodex gear ratio calculator helps size it.',
      ],
      time: '15 min',
      sources: ['gm0_build_tips', 'ftc_power'],
    },
    zero_power_float: {
      title: 'Motor set to FLOAT when idle',
      area: 'mechanisms',
      short: 'The default zero power behavior lets a motor spin freely at 0 power, so gravity pulls slides and arms down.',
      fix: [
        'Set slide and arm motors to BRAKE. It shorts the motor leads and resists motion when power is 0.',
        'BRAKE helps, but it is not a hold. Heavy loads still creep down, so add a small holding power or feedforward too.',
      ],
      code: {
        label: 'Brake when idle',
        snippet: `slide.setZeroPowerBehavior(DcMotor.ZeroPowerBehavior.BRAKE);`,
      },
      time: '2 min',
      sources: ['gm0_common', 'gm0_control'],
    },
    no_feedforward: {
      title: 'No gravity feedforward',
      area: 'mechanisms',
      short: 'Gravity is a constant load. Without a feedforward term, PID has to fall below the target before it pushes back, so the mechanism sags.',
      fix: [
        'Vertical slides: add a constant kG to the output. Raise it until the slide just holds still at mid-height.',
        'Arms: gravity changes with angle, so scale the term by cos(angle), with 0° pointing horizontally.',
        'Then tune PID on top for the remaining error.',
      ],
      code: {
        label: 'Feedforward + PID',
        snippet: `// vertical slide
double power = pid.calculate(target, slidePos) + kG;

// arm (angle in degrees, 0 = horizontal)
double power = pid.calculate(target, armAngle) + kCos * Math.cos(Math.toRadians(armAngle));`,
      },
      time: '20 min',
      sources: ['gm0_control'],
    },
    pid_gains: {
      title: 'Position control gains are off',
      area: 'mechanisms',
      short: 'Too much P makes it oscillate, too little leaves it short. D is what damps overshoot.',
      fix: [
        'GM0\'s tuning order: set I and D to 0, raise P until it oscillates around the target, then add D until the overshoot is gone.',
        'Oscillating around the target means not enough D. Reaching it very slowly means not enough P (or too much D).',
        'Leave I at 0 unless friction stops it short. If you use I, cap it so it cannot wind up.',
        'Use the RoboCodex PID tuner to get a feel for each gain before touching the real robot.',
      ],
      time: '30 min',
      sources: ['gm0_control'],
    },
    encoder_wrong_way: {
      title: 'Encoder counts the wrong way',
      area: 'sensors',
      short: 'If the encoder counts down while the motor drives up, the controller pushes harder the wrong way and runs away at full speed.',
      fix: [
        'Print the encoder in telemetry and move the mechanism by hand in the positive direction. The count should go up.',
        'If it goes down, reverse the motor (setDirection reverses the encoder too), or flip the sign in your code for external encoders.',
        'GM0: a motor that goes full speed regardless of the target is almost always a reversed motor or a bad encoder cable.',
      ],
      time: '5 min',
      sources: ['gm0_control', 'gm0_encoders'],
    },
    encoder_cable: {
      title: 'Encoder cable unplugged, wrong port, or wrong pinout',
      area: 'sensors',
      short: 'Encoders only work in the encoder port next to the matching motor port, with a good cable.',
      fix: [
        'Plug the encoder into the encoder port right next to its motor\'s power port (same number).',
        'Turn the shaft by hand with telemetry running. If the count never changes, it is hardware.',
        'If the count flickers between 0 and 1, the cable is bad or half seated.',
        'Old NeveRest motors use a different encoder pin order. Use the correct adapter cable.',
        '5 V Modern Robotics-style encoders need a REV Logic Level Converter on REV hubs.',
      ],
      time: '10 min',
      sources: ['gm0_encoders', 'gm0_control', 'ftc_common'],
    },
    encoder_not_reset: {
      title: 'Encoder wasn\'t reset at the start',
      area: 'sensors',
      short: 'Encoders keep their count between OpModes, so old numbers carry over unless you reset them.',
      fix: [
        'Reset in init with STOP_AND_RESET_ENCODER, then set the mode you actually want.',
        'Remember: RUN_WITHOUT_ENCODER does not turn the encoder off. It only stops the built-in velocity control.',
      ],
      code: {
        label: 'Reset pattern',
        snippet: `motor.setMode(DcMotor.RunMode.STOP_AND_RESET_ENCODER);
motor.setMode(DcMotor.RunMode.RUN_WITHOUT_ENCODER); // turns the motor back on`,
      },
      time: '2 min',
      sources: ['gm0_encoders'],
    },
    chain_tension: {
      title: 'Chain or belt tension is wrong',
      area: 'mechanisms',
      short: 'Too loose and it skips teeth or falls off. Too tight and it strains the motor.',
      fix: [
        'Press the middle of the run. It should flex a little but not sag.',
        'Add an adjustable tensioner. Chain stretches over time, faster on small sprockets.',
        'Over-tightening burns out motors and wears bearings, so do not crank it.',
      ],
      time: '15 min',
      sources: ['gm0_chain', 'gm0_belt'],
    },
    chain_wrap: {
      title: 'Not enough wrap or bad alignment',
      area: 'mechanisms',
      short: 'Chain and belt need at least 90° of contact on each sprocket (180°+ is best) and must run straight.',
      fix: [
        'Count how much of each sprocket or pulley the chain or belt touches. Under 90° skips easily. Add an idler to wrap more.',
        'Lay a straight edge across both sprockets. Misalignment walks the chain off and breaks belts.',
        'Replace master links with a chain breaker joint where you can. Master links can pop off.',
      ],
      time: '20 min',
      sources: ['gm0_chain', 'gm0_belt'],
    },
    set_screw_slip: {
      title: 'Hub or collar slipping on the shaft',
      area: 'mechanisms',
      short: 'Set screws work loose and chew the shaft, so the gear or sprocket spins while the shaft does not (or the reverse).',
      fix: [
        'Mark the shaft and hub with a marker line. If the lines separate after a run, it is slipping.',
        'Switch to clamping hubs and collars, or hex / D-shaft hubs, wherever possible.',
        'If you must use set screws, file a flat on round shafts and use blue threadlocker on metal (never on plastic).',
        'Use nylon locknuts everywhere. Plain nuts vibrate loose.',
      ],
      time: '15 min',
      sources: ['gm0_build_tips', 'gm0_shafts'],
    },
    string_rigging: {
      title: 'Slide string is slack, stretched, or mis-spooled',
      area: 'mechanisms',
      short: 'Loose string, string that stretched, or a spool that unwinds lets the slide drop, jump, or tangle.',
      fix: [
        'Re-tension: rig the extension string with the slide retracted and the retraction string with it fully extended (GM0).',
        'Clamp strings with a bolt instead of knots so you can re-tension quickly.',
        'Use the same spool diameter for extension and retraction in continuous rigging.',
        'With elastic retraction, watch for the spool unwinding past zero.',
        'Replace string that has stretched or frayed. Braided fishing line or Dyneema is the usual choice.',
      ],
      time: '20 min',
      sources: ['gm0_rigging'],
    },
    // servos ------------------------------------------------------------------
    servo_power_pairs: {
      title: 'Servo ports are overloaded',
      area: 'servos',
      short: 'Hub servo ports share power in pairs (0–1, 2–3, 4–5) at about 2 A per pair and 5 A total. Strong servos under load brown out their neighbors.',
      fix: [
        'Spread servos out: FIRST recommends using only the odd or only the even ports, so each servo gets its own pair (up to 3 per hub).',
        'Put heavily loaded servos on a REV Servo Hub or a goBILDA Servo Power Injector (6 V, much more current).',
        'Avoid the old REV Servo Power Module. GM0 warns it can fail and take the hub with it.',
      ],
      time: '15 min',
      sources: ['ftc_servo_power', 'gm0_servo_tips'],
    },
    servo_backwards: {
      title: 'Servo plugged in upside down',
      area: 'servos',
      short: 'Servo plugs fit both ways. Rotated 180°, the servo just sits there.',
      fix: [
        'Match the colors: black (or brown) wire goes to ground. The hub labels the pins.',
        'Check every extension joint too. Each one is another chance to flip it.',
        'Add retaining clips or tape on extensions so they cannot pull apart.',
      ],
      time: '2 min',
      sources: ['gm0_servo_tips'],
    },
    servo_config_type: {
      title: 'Servo configured as the wrong type or mode',
      area: 'servos',
      short: 'A continuous servo set up as a regular Servo (or the reverse) does not behave, and some servos have their own modes.',
      fix: [
        'In the configuration, pick "Servo" for position servos and "Continuous Rotation Servo" for spinning ones.',
        'goBILDA dual-mode and Axon servos can be switched between position and continuous with their programmer. Make sure the servo is in the mode your code expects.',
        'Continuous servos use setPower (CRServo). Position servos use setPosition between 0 and 1.',
      ],
      time: '5 min',
      sources: ['gm0_servo_tips', 'gm0_sdk_servos'],
    },
    servo_never_commanded: {
      title: 'Servo never gets a position',
      area: 'servos',
      short: 'Hub servo power stays off until the code sends a servo command, so a servo that is never commanded stays limp.',
      fix: [
        'Call setPosition at least once (for example in init) so the port powers up.',
        'Make sure the name in hardwareMap.get matches the configuration exactly.',
      ],
      time: '2 min',
      sources: ['gm0_sdk_servos'],
    },
    servo_fighting: {
      title: 'Code is sending changing positions',
      area: 'servos',
      short: 'Two parts of the code setting different positions in the same loop, or a position that flips every loop, makes the servo twitch.',
      fix: [
        'Search the code for every setPosition on that servo. Keep one place that decides the position.',
        'Print the position you send each loop. If it bounces between values, fix the logic (often a button toggle without edge detection).',
      ],
      code: {
        label: 'Toggle on press, not while held',
        snippet: `boolean lastA = false;
boolean clawOpen = false;
// in the loop:
if (gamepad1.a && !lastA) clawOpen = !clawOpen;
lastA = gamepad1.a;
claw.setPosition(clawOpen ? 0.6 : 0.2);`,
      },
      time: '10 min',
      sources: ['gm0_common'],
    },
    servo_hard_stop: {
      title: 'Servo pushing against a hard stop',
      area: 'servos',
      short: 'If the commanded position is past where the mechanism physically stops, the servo strains, buzzes, gets hot, and draws lots of current.',
      fix: [
        'Command the position slowly in small steps and find where the mechanism actually stops. Keep the endpoints just short of it.',
        'Re-index the horn or linkage so the full range fits the mechanism.',
      ],
      time: '10 min',
      sources: ['gm0_servo_tips'],
    },
    servo_damaged: {
      title: 'Servo gears are stripped or the servo is worn',
      area: 'servos',
      short: 'Backdriving a powered servo or side-loading its shaft strips the internal gears.',
      fix: [
        'Swap in a known-good servo. If the problem moves with the servo, the servo is the problem.',
        'Do not force a powered servo by hand.',
        'Support the output with a ServoBlock or bearing, and drive mechanisms through a linkage instead of hanging them right on the spline.',
      ],
      time: '10 min',
      sources: ['gm0_servo_tips'],
    },
    servo_pwm_range: {
      title: 'Default PWM range limits travel',
      area: 'servos',
      short: 'The SDK maps 0–1 to 600–2400 µs by default, so many servos (goBILDA, REV Smart Robot Servo) show less range than advertised.',
      fix: [
        'Widen the range with setPwmRange (up to 500–2500 µs). Then 0 and 1 cover the full travel.',
        'Check your servo\'s spec sheet for its real pulse range before going wider.',
        'Programmable servos (Axon, SRS) can also have their own range set with the programmer.',
      ],
      code: {
        label: 'Widen the PWM range',
        snippet: `ServoImplEx claw = hardwareMap.get(ServoImplEx.class, "claw");
claw.setPwmRange(new PwmControl.PwmRange(500, 2500));`,
      },
      time: '5 min',
      sources: ['gm0_sdk_servos', 'gm0_servo_tips'],
    },
    servo_horn_index: {
      title: 'Horn or linkage mounted at the wrong angle',
      area: 'servos',
      short: 'The servo is fine, but its range is not centered on the motion you need.',
      fix: [
        'Command 0.5, then mount the horn or arm at the middle of the motion you want.',
        'Then find your real endpoints with telemetry and a gamepad nudge.',
      ],
      time: '10 min',
      sources: ['gm0_servo_tips'],
    },
  });
})();

// code, sensors, vision, autonomous --------------------------------------------
(function () {
  Object.assign(window.DOCTOR.causes, {
    hw_name_mismatch: {
      title: 'Name in code doesn\'t match the configuration',
      area: 'code',
      short: '"Unable to find a hardware device with the name ..." means the string in hardwareMap.get is not exactly the name in the active configuration.',
      fix: [
        'Open the configuration on the Driver Station and compare names letter by letter. They are case sensitive ("leftDrive" is not "LeftDrive").',
        'Make sure the configuration you edited is the active one (its name shows on the DS main screen) and that you saved it.',
        'Watch for trailing spaces in config names.',
      ],
      time: '5 min',
      sources: ['ftc_common'],
    },
    hw_at_field_init: {
      title: 'hardwareMap used before init',
      area: 'code',
      short: 'hardwareMap is null when your class fields are created, so calling hardwareMap.get there throws a NullPointerException.',
      fix: [
        'Declare hardware as fields, but call hardwareMap.get inside init() or runOpMode().',
        'The robot log shows the exact line: Robot Controller → View Logs, scroll up to the red text, and find YourOpMode.java:LINE.',
      ],
      code: {
        label: 'Get hardware inside init',
        snippet: `public class MyTeleOp extends OpMode {
    Servo claw;                       // declare here

    @Override
    public void init() {
        claw = hardwareMap.get(Servo.class, "claw");   // get here
    }
}`,
      },
      time: '5 min',
      sources: ['gm0_common', 'ftc_common'],
    },
    null_object: {
      title: 'Using an object that was never created',
      area: 'code',
      short: 'A NullPointerException means you called a method on something that is still null, like a timer or a subsystem you never made.',
      fix: [
        'Find the line from the robot log (View Logs → red text → YourOpMode.java:LINE).',
        'Make sure everything used on that line was assigned first (for example timer = new ElapsedTime();).',
      ],
      time: '10 min',
      sources: ['ftc_common', 'gm0_common'],
    },
    value_out_of_range: {
      title: 'Power or position out of range',
      area: 'code',
      short: '"number XXX is invalid" means setPower got something outside -1 to 1 or setPosition got something outside 0 to 1.',
      fix: [
        'Clip the value before sending it with Range.clip.',
        'Look at where the value comes from. Often it is a PID output or drive math that was never normalized.',
      ],
      code: {
        label: 'Clip values',
        snippet: `motor.setPower(Range.clip(power, -1.0, 1.0));
servo.setPosition(Range.clip(pos, 0.0, 1.0));`,
      },
      time: '5 min',
      sources: ['ftc_common'],
    },
    rtp_order: {
      title: 'RUN_TO_POSITION set before a target',
      area: 'code',
      short: 'TargetPositionNotSetException means you switched to RUN_TO_POSITION before calling setTargetPosition.',
      fix: ['Call setTargetPosition first, then setMode(RUN_TO_POSITION), then setPower.'],
      code: {
        label: 'Right order',
        snippet: `motor.setTargetPosition(1120);
motor.setMode(DcMotor.RunMode.RUN_TO_POSITION);
motor.setPower(0.5);`,
      },
      time: '2 min',
      sources: ['gm0_common'],
    },
    uninterruptible_loop: {
      title: 'A loop that ignores STOP',
      area: 'code',
      short: 'A while loop without opModeIsActive() keeps running after STOP. The SDK gives up after a few seconds ("stuck in stop") and restarts the app.',
      fix: [
        'Every while loop in a LinearOpMode must include opModeIsActive() (or !isStopRequested() before start).',
        'In an iterative OpMode, never loop or sleep inside loop(). It must return quickly, every time.',
        'Long threads you start yourself must also check for stop.',
      ],
      code: {
        label: 'Cooperative loop',
        snippet: `while (opModeIsActive() && !touch.isPressed()) {
    // keep driving until the sensor is pressed or STOP is hit
}`,
      },
      time: '5 min',
      sources: ['ftc_common', 'gm0_common'],
    },
    opmode_annotation: {
      title: 'OpMode isn\'t registered',
      area: 'code',
      short: 'The Driver Station only lists OpModes with an @TeleOp or @Autonomous annotation and no @Disabled.',
      fix: [
        'Add @TeleOp(name = "...") or @Autonomous(name = "...") right above the class.',
        'Remove @Disabled if it is there.',
        'The class must be public and must not be abstract.',
        'OnBot Java: press Build Everything. Android Studio: make sure the deploy actually finished.',
      ],
      time: '2 min',
      sources: ['ftc_common'],
    },
    build_not_deployed: {
      title: 'New code never made it to the robot',
      area: 'code',
      short: 'The build failed or was installed on a different device, so the robot is still running old code.',
      fix: [
        'Read the bottom of the Android Studio Build / Run window for errors. A failed build installs nothing.',
        'Check the device dropdown in Android Studio shows your Control Hub before pressing Run.',
        'Add a version line to telemetry ("build 12") so you can always tell which code is on the robot.',
      ],
      time: '5 min',
      sources: ['ftc_common'],
    },
    adb_connection: {
      title: 'Laptop isn\'t connected to the Control Hub',
      area: 'code',
      short: 'Wireless deploy needs your laptop on the robot\'s Wi-Fi and adb connected to it.',
      fix: [
        'Join the laptop to the Control Hub\'s Wi-Fi network.',
        'In a terminal run adb connect 192.168.43.1:5555, then adb devices to confirm it shows up.',
        'If it shows "offline", run adb disconnect and connect again, or power cycle the hub.',
        'Leaving the REV Hardware Client open makes it connect adb to Control Hubs automatically.',
        'Over USB-C, use a cable that carries data, not a charge-only one.',
      ],
      code: {
        label: 'Terminal',
        snippet: `adb connect 192.168.43.1:5555
adb devices`,
      },
      time: '5 min',
      sources: ['ftc_common'],
    },
    android_studio_setup: {
      title: 'Android Studio or SDK project is out of date',
      area: 'code',
      short: 'New Android Studio releases (Ladybug and later) changed things, and old SDK projects can fail to build or deploy.',
      fix: [
        'Update to the latest FtcRobotController SDK from GitHub and sync Gradle.',
        'Use an Android Studio version the current SDK supports (see the FtcRobotController README).',
        'Check the FTC Community forum for the current season\'s Android Studio threads. They come up every year.',
      ],
      time: '30 min',
      sources: ['ftc_versions'],
    },
    no_bulk_reads: {
      title: 'Every sensor read is a separate trip to the hub',
      area: 'code',
      short: 'Without bulk reads, each encoder or sensor read costs its own round trip, so loops crawl.',
      fix: [
        'Turn on bulk caching in AUTO mode. One line, big speedup.',
        'Measure your loop time in telemetry so you can see the difference.',
      ],
      code: {
        label: 'Bulk reads + loop timer',
        snippet: `for (LynxModule hub : hardwareMap.getAll(LynxModule.class)) {
    hub.setBulkCachingMode(LynxModule.BulkCachingMode.AUTO);
}

ElapsedTime loopTimer = new ElapsedTime();
// in the loop:
telemetry.addData("Loop (ms)", loopTimer.milliseconds());
loopTimer.reset();`,
      },
      time: '5 min',
      sources: ['gm0_bulk'],
    },
    slow_i2c: {
      title: 'Slow I2C sensors in the loop',
      area: 'code',
      short: 'I2C sensors (color, distance, external IMU) are not part of bulk reads, and each read takes a few milliseconds.',
      fix: [
        'Only read I2C sensors when you need them, not every loop.',
        'Cache the reading once per loop instead of calling it several times.',
      ],
      time: '15 min',
      sources: ['gm0_bulk'],
    },
    vision_cpu: {
      title: 'Vision is eating the processor',
      area: 'vision',
      short: 'A camera at high resolution with live preview and several processors can slow the whole robot down.',
      fix: [
        'Turn off the live view for matches, and lower the camera resolution.',
        'Disable processors you are not using with setProcessorEnabled(..., false), or stop streaming when vision is not needed.',
      ],
      time: '10 min',
      sources: ['ftc_vision_cpu'],
    },
    imu_orientation: {
      title: 'IMU told the wrong hub orientation',
      area: 'sensors',
      short: 'The universal IMU needs to know which way the hub\'s logo and USB ports face. Wrong values give a heading that is off by 90/180° or turns the wrong way.',
      fix: [
        'Look at how your Control Hub is really mounted: which way the REV logo faces and which way the USB ports face (left and right as seen from behind the robot).',
        'Put exactly those directions in RevHubOrientationOnRobot.',
        'Test: reset yaw, turn the robot 90° left by hand, and yaw should read about +90.',
      ],
      code: {
        label: 'Universal IMU setup',
        snippet: `IMU imu = hardwareMap.get(IMU.class, "imu");
imu.initialize(new IMU.Parameters(new RevHubOrientationOnRobot(
        RevHubOrientationOnRobot.LogoFacingDirection.UP,
        RevHubOrientationOnRobot.UsbFacingDirection.FORWARD)));
imu.resetYaw();

double heading = imu.getRobotYawPitchRollAngles().getYaw(AngleUnit.DEGREES);`,
      },
      time: '10 min',
      sources: ['ftc_imu', 'rev_imu'],
    },
    imu_legacy: {
      title: 'Using the old BNO055 code on a newer hub',
      area: 'sensors',
      short: 'Control Hubs since Sept 2022 have a BHI260AP IMU, which the legacy BNO055IMU interface does not support. Expansion Hubs since Dec 2021 have no IMU at all.',
      fix: [
        'Switch to the universal IMU interface (SDK 8.1+), which works with both chips.',
        'Use the IMU on the Control Hub, since newer Expansion Hubs do not have one.',
        'Let the configuration auto-detect the IMU type on I2C port 0.',
      ],
      time: '15 min',
      sources: ['rev_imu', 'ftc_imu'],
    },
    imu_reset_esd: {
      title: 'IMU reset mid-match',
      area: 'sensors',
      short: 'Static shocks or a battery dip can reset the IMU, so heading jumps back to 0 halfway through a match.',
      fix: [
        'Update the Control Hub OS. Version 1.1.4 reduced these resets on BHI260AP hubs.',
        'Use the ESD fixes (grounding strap, USB 3.0 port, insulated electronics) and secure the battery.',
        'Add a driver button that re-zeros the IMU while the robot is lined up with the tile seams.',
      ],
      code: {
        label: 'Driver re-zero button',
        snippet: `if (gamepad1.options) {
    imu.resetYaw();   // line the robot up straight first
}`,
      },
      time: '10 min',
      sources: ['rev_imu', 'ftc_esd'],
    },
    angle_wrap: {
      title: 'Heading error isn\'t wrapped',
      area: 'sensors',
      short: 'Heading jumps from +180° to -180°. If the error is not wrapped, the robot spins the long way around.',
      fix: ['Normalize the heading error to -180..180 before feeding it to your controller.'],
      code: {
        label: 'Wrap the error',
        snippet: `double error = AngleUnit.normalizeDegrees(targetHeading - currentHeading);`,
      },
      time: '5 min',
      sources: ['gm0_control'],
    },
    odo_directions: {
      title: 'Odometry pod direction is reversed',
      area: 'sensors',
      short: 'If a pod counts backward, position runs off the opposite way as soon as you move.',
      fix: [
        'Run a localization test and push the robot by hand.',
        'Forward should make X go up, pushing left should make Y go up, and turning counter-clockwise should make heading go up.',
        'Reverse whichever pod is wrong (Pinpoint: setEncoderDirections).',
      ],
      time: '10 min',
      sources: ['pedro_faq', 'pinpoint_guide', 'pedro_pinpoint'],
    },
    odo_offsets: {
      title: 'Pod offsets are wrong or swapped',
      area: 'sensors',
      short: 'Offsets tell the localizer where each pod sits from the robot\'s turning center. Wrong ones show up as drift when the robot turns.',
      fix: [
        'Spin the robot in place several times. If X/Y wander far from 0, the offsets are off.',
        'Measure from the center of rotation and follow your library\'s sign convention exactly (Pinpoint: X offset is how far sideways the forward pod is, left positive; Y offset is how far forward the strafe pod is, forward positive).',
        'Make sure the forward and strafe pods are not swapped (Pinpoint: forward pod in the X port).',
        'Pedro Pathing\'s Pinpoint auto-tuner can measure offsets for you.',
      ],
      time: '20 min',
      sources: ['pedro_faq', 'pinpoint_guide', 'pedro_pinpoint'],
    },
    pinpoint_mount: {
      title: 'Pinpoint mounted or calibrated wrong',
      area: 'sensors',
      short: 'The Pinpoint must be mounted sticker side up, and its IMU calibrates at power-on. Moving the robot then gives a heading that drifts while sitting still.',
      fix: [
        'Mount the Pinpoint flat, sticker side (with the ports) facing up.',
        'Keep the robot still when it powers on, or call recalibrateIMU() / resetPosAndIMU() while the robot is still at the start of your OpMode.',
        'If you run a flywheel, isolate the Pinpoint from vibration. It can cause slow drift.',
      ],
      code: {
        label: 'Recalibrate while still',
        snippet: `odo.resetPosAndIMU();   // robot must be completely still
sleep(300);`,
      },
      time: '10 min',
      sources: ['pinpoint_guide', 'pedro_faq'],
    },
    pod_contact: {
      title: 'Dead wheel loses contact with the floor',
      area: 'sensors',
      short: 'Without enough spring force, a pod skips or lifts over seams and stops counting accurately.',
      fix: [
        'Push down on each pod. It should spring back firmly and always touch the tiles.',
        'Add spring or rubber band tension so the wheel stays planted, and make sure it moves freely up and down.',
        'Check the pod wheel spins freely and the encoder cable has slack for the pod to move.',
      ],
      time: '20 min',
      sources: ['gm0_deadwheels'],
    },
    drive_encoder_slip: {
      title: 'Tracking with drive-motor encoders',
      area: 'sensors',
      short: 'Mecanum wheels slip, especially when accelerating hard, so drive encoders lose track over a match.',
      fix: [
        'Limit acceleration in autonomous so wheels do not slip.',
        'For accurate autos, add dead wheels or a Pinpoint / OTOS, and correct with AprilTags when you can see them.',
      ],
      time: 'varies',
      sources: ['gm0_deadwheels'],
    },
    exposure_blur: {
      title: 'Motion blur or bad exposure',
      area: 'vision',
      short: 'Auto exposure blurs tags when the robot moves. Short exposure plus high gain keeps tags sharp.',
      fix: [
        'Set exposure to manual, start very low, and raise gain. FIRST\'s ConceptAprilTagOptimizeExposure sample walks through it.',
        'Raise exposure only until tags are detected reliably at your real driving distance.',
        'Some webcams do not support manual control. The Logitech C920 supports all of the SDK camera controls.',
      ],
      code: {
        label: 'Manual exposure + gain',
        snippet: `ExposureControl exposure = visionPortal.getCameraControl(ExposureControl.class);
exposure.setMode(ExposureControl.Mode.Manual);
exposure.setExposure(6, TimeUnit.MILLISECONDS);
GainControl gain = visionPortal.getCameraControl(GainControl.class);
gain.setGain(250);   // only once the camera reports STREAMING`,
      },
      time: '15 min',
      sources: ['ftc_camera_controls'],
    },
    decimation_range: {
      title: 'Decimation too high for the distance',
      area: 'vision',
      short: 'Decimation trades range for speed. Higher decimation runs faster but loses far-away tags.',
      fix: [
        'Lower decimation when you need range. In one FTC test with a C920 and 2" tags: about 10 ft at decimation 1, 6 ft at 2, 4 ft at 3.',
        'You can switch decimation at runtime, low when far and higher when close.',
      ],
      code: {
        label: 'Set decimation',
        snippet: `aprilTag.setDecimation(2);   // lower = more range, fewer frames per second`,
      },
      time: '5 min',
      sources: ['ftc_camera_controls', 'gm0_vision'],
    },
    camera_calibration: {
      title: 'Camera lens isn\'t calibrated',
      area: 'vision',
      short: 'Without lens calibration for your exact camera and resolution, tag distance and angle come out wrong even when tags are detected.',
      fix: [
        'Use a resolution the SDK has calibration for (it logs a warning when it does not).',
        'Otherwise, calibrate your camera and pass the lens intrinsics to the AprilTag processor.',
      ],
      time: '45 min',
      sources: ['ftc_webcam', 'gm0_vision'],
    },
    camera_port_power: {
      title: 'Camera on the wrong port or underpowered',
      area: 'vision',
      short: 'Cameras drop out from ESD on the USB 2.0 port, from too many USB devices, or from loose cables.',
      fix: [
        'Use the Control Hub\'s USB 3.0 port.',
        'FIRST recommends powering at most 2 cameras directly over USB. Use a powered USB hub for more.',
        'Add strain relief and a ferrite choke to the camera cable.',
        'Check the webcam name in the configuration matches your code (often "Webcam 1").',
      ],
      time: '10 min',
      sources: ['ftc_webcam', 'ftc_esd', 'ftc_power'],
    },
    limelight_setup: {
      title: 'Limelight not configured or started',
      area: 'vision',
      short: 'The Limelight 3A needs to be in the configuration and started in code before it returns results.',
      fix: [
        'Add it to the Robot Controller configuration (Limelight3A) and use the same name in code.',
        'Call pipelineSwitch(...) and limelight.start() before reading results.',
        'Always check result != null && result.isValid() before using the data.',
        'It draws power whenever the hub is on, even with no OpMode running, so keep the battery charged.',
      ],
      code: {
        label: 'Limelight basics',
        snippet: `Limelight3A limelight = hardwareMap.get(Limelight3A.class, "limelight");
limelight.setPollRateHz(100);
limelight.pipelineSwitch(0);
limelight.start();

LLResult result = limelight.getLatestResult();
if (result != null && result.isValid()) {
    double tx = result.getTx();
}`,
      },
      time: '10 min',
      sources: ['limelight', 'ftc_webcam'],
    },
    timed_moves: {
      title: 'Autonomous drives by time',
      area: 'auto',
      short: 'sleep()-timed driving goes a different distance every time because battery voltage and traction change.',
      fix: [
        'Replace "drive for 1.2 seconds" with "drive until the encoder or odometry says 24 inches".',
        'Correct heading with the IMU while driving straight.',
        'Best: use odometry with a path follower like Pedro Pathing or Road Runner.',
      ],
      time: '1 hr',
      sources: ['gm0_encoders', 'gm0_deadwheels'],
    },
    start_position: {
      title: 'Robot starts in a slightly different spot',
      area: 'auto',
      short: 'An inch or a few degrees off at the start becomes much more by the end of the path.',
      fix: [
        'Line the robot up against the wall and a tile seam the same way every time. Mark it in your notebook.',
        'Build a simple alignment jig or use the robot\'s flat sides against field features.',
      ],
      time: '15 min',
      sources: ['gm0_deadwheels'],
    },
    accel_slip: {
      title: 'Wheels slip under hard acceleration',
      area: 'auto',
      short: 'Slamming to full power makes mecanum wheels slip, so the robot ends somewhere different each run.',
      fix: [
        'Ramp power up and down instead of jumping to full, or use a motion profile.',
        'Lower the max acceleration in your path follower.',
      ],
      time: '20 min',
      sources: ['gm0_control'],
    },
    localization_first: {
      title: 'Localization isn\'t accurate yet',
      area: 'auto',
      short: 'A path follower can only be as good as its position estimate. Bad localization looks exactly like bad tuning.',
      fix: [
        'Tune localization before any follower or PID tuning.',
        'Run the localization test: push forward 48" and check X ≈ 48, push left and check Y goes up, spin and check heading.',
        'Only move on once every check passes.',
      ],
      time: '30 min',
      sources: ['pedro_faq'],
    },
    follower_gains: {
      title: 'Follower correction is too aggressive',
      area: 'auto',
      short: 'Overshoot and jitter usually mean the translational or heading P is too high, or the static feedforward is too big.',
      fix: [
        'Work out which part is misbehaving: heading, forward, or sideways correction.',
        'Overshooting or jittery: lower that controller\'s P. Too lazy: raise it.',
        'A static feedforward that is too high also causes jitter and overshoot.',
        'Run the auto-tuners on a full battery, several times, and average the results.',
      ],
      time: '45 min',
      sources: ['pedro_faq'],
    },
  });
})();

// questions --------------------------------------------------------------------
// yes / no hold multipliers per cause. "not sure" is always neutral.
// cost: 1 = look at it, 2 = quick test, 3 = takes some setup.
// fact: true = a question about how the robot is set up (independent of causes it
// doesn't mention). everything else is an observation, where causes it doesn't
// mention expect the normal, healthy answer.
(function () {
  window.DOCTOR.questions = {
    // power
    q_fresh_battery: {
      text: 'Does it still happen with a freshly charged battery?',
      help: 'Swap to a battery straight off the charger and repeat the exact same thing.',
      cost: 2,
      yes: { battery_low: 0.15 },
      no: { battery_low: 6 },
    },
    q_voltage_low: {
      text: 'Does the Driver Station show the voltage dropping to about 9 V or less when it happens?',
      help: 'The battery voltage is at the top of the Driver Station screen. Watch it while you drive hard or run the mechanism.',
      cost: 1,
      yes: { brownout: 4, battery_low: 3, xt30_loose: 1.5 },
      no: { brownout: 0.3, battery_low: 0.4 },
    },
    q_when_mechanism: {
      text: 'Does it happen mostly when a big mechanism runs (flywheel, slides, intake) or when you push into something?',
      help: 'Try driving around with nothing else running, then run the mechanism by itself.',
      cost: 2,
      yes: { brownout: 4, motor_stall: 2.5, servo_power_pairs: 2 },
      no: { brownout: 0.4, motor_stall: 0.5 },
    },
    q_on_bump: {
      text: 'Does it happen when the robot gets hit or jolted?',
      help: 'Push the robot or tap the frame with your hand while it is running and see if it cuts out.',
      cost: 1,
      yes: { xt30_loose: 5, usb_strain: 3, esd: 1.3 },
      no: { xt30_loose: 0.4, usb_strain: 0.5 },
    },
    q_wiggle: {
      text: 'If you wiggle the battery and power cables while it\'s on, does the hub light flicker or the robot cut out?',
      help: 'Gently wiggle the battery plug, the switch wires, and each XT30 at the hub one at a time.',
      cost: 2,
      yes: { xt30_loose: 8 },
      no: { xt30_loose: 0.3 },
    },
    q_touch_field: {
      text: 'Does it happen right after touching a field wall, field element, or another robot?',
      help: 'Think about the last few times. Was the robot touching something metal just before?',
      cost: 1,
      yes: { esd: 6, imu_reset_esd: 3, camera_port_power: 2 },
      no: { esd: 0.4, imu_reset_esd: 0.6 },
    },
    q_ground_strap: {
      fact: true,
      text: 'Do you have a grounding strap and all USB devices in the USB 3.0 port?',
      help: 'The grounding strap is a short wire with a resistor from a spare XT30 port to the frame. The Control Hub\'s USB 3.0 port is the blue one.',
      cost: 1,
      yes: { esd: 0.5, camera_port_power: 0.6 },
      no: { esd: 2, camera_port_power: 1.5 },
    },
    q_battery_zero: {
      text: 'Does the battery read close to 0 V on a tester or multimeter?',
      help: 'A battery tester or multimeter across the battery plug. A dead-but-working battery still reads about 10–12 V.',
      cost: 2,
      yes: { fuse_blown: 15, battery_low: 0.5 },
      no: { fuse_blown: 0 },
    },
    q_battery_old: {
      fact: true,
      text: 'Is the battery more than a season old or used a lot?',
      help: 'NiMH packs usually get weak after roughly 200–300 charge cycles.',
      cost: 1,
      yes: { battery_low: 2 },
      no: { battery_low: 0.7 },
    },
    // connection
    q_ping_high: {
      text: 'Is the ping on the Driver Station high (over ~50 ms) or jumping around?',
      help: 'Ping is shown at the top of the Driver Station app while connected. About 5 ms is great.',
      cost: 1,
      yes: { wifi_interference: 3, rc_mounting: 2.5, code_blocking: 2, wifi_stale: 1.5 },
      no: { wifi_interference: 0.4, rc_mounting: 0.5 },
    },
    q_empty_opmode: {
      text: 'Does it still drop with no OpMode running (or a simple OpMode that does nothing)?',
      help: 'Connect and just sit on the main Driver Station screen, or run an empty OpMode for a couple of minutes.',
      cost: 2,
      yes: { code_blocking: 0.1, wifi_stale: 2, wifi_interference: 2, software_outdated: 1.5 },
      no: { code_blocking: 5, brownout: 2, wifi_stale: 0.6 },
    },
    q_ds_other_wifi: {
      fact: true,
      text: 'Has your Driver Hub / DS phone ever been connected to school or home Wi-Fi?',
      help: 'For example, to download an update. Check its saved networks in Android Wi-Fi settings.',
      cost: 1,
      yes: { wifi_stale: 4 },
      no: { wifi_stale: 0.3 },
    },
    q_school_only: {
      fact: true,
      text: 'Is it much worse at one place (like school) than elsewhere?',
      help: 'School Wi-Fi suppressors and crowded channels only affect certain locations.',
      cost: 1,
      yes: { wifi_interference: 4 },
      no: { wifi_interference: 0.6 },
    },
    q_hub_buried: {
      fact: true,
      text: 'Is the Control Hub surrounded by metal or carbon fiber, or mounted next to motors?',
      help: 'Look at where the hub sits and what is between it and the drivers.',
      cost: 1,
      yes: { rc_mounting: 4 },
      no: { rc_mounting: 0.4 },
    },
    q_updated: {
      fact: true,
      text: 'Is everything updated this season (Control Hub OS, hub firmware, Robot Controller and Driver Station apps)?',
      help: 'The REV Hardware Client shows every version and whether an update is available.',
      cost: 2,
      yes: { software_outdated: 0.3, android_studio_setup: 0.5 },
      no: { software_outdated: 4, android_studio_setup: 2 },
    },
    q_two_hubs: {
      fact: true,
      text: 'Are you using a second Expansion Hub?',
      help: 'A second REV hub connected to the Control Hub with the small RS485 cable.',
      cost: 1,
      yes: { exhub_address: 3, usb_strain: 1.5 },
      no: { exhub_address: 0 },
    },
    q_led_not_green: {
      text: 'Is the hub status light anything other than solid green while connected?',
      help: 'Solid green = talking normally. Blue = waiting or lost communication. Blinking orange = battery under 7 V. (The Status light tab decodes every pattern.)',
      cost: 1,
      yes: { software_outdated: 1.5, battery_low: 2, exhub_address: 2, xt30_loose: 1.5 },
      no: { exhub_address: 0.5 },
    },
    // gamepad
    q_moves_before_touch: {
      text: 'Does the robot move as soon as you press PLAY, before anyone touches the gamepad?',
      help: 'Press PLAY with hands off the gamepad.',
      cost: 1,
      yes: { gamepad_calibration: 3, stick_drift: 2, missing_waitforstart: 0.6 },
      no: { gamepad_calibration: 0.6 },
    },
    q_moves_on_init: {
      text: 'Does it start moving when you press INIT, before PLAY?',
      help: 'Select the OpMode, press INIT, and watch the robot.',
      cost: 1,
      yes: { missing_waitforstart: 10, gamepad_calibration: 0.4 },
      no: { missing_waitforstart: 0.1 },
    },
    q_replug_fixes: {
      text: 'If you unplug the gamepad and plug it back in with the sticks untouched, does it stop?',
      help: 'Stop the OpMode first, then replug, then reassign with START + A.',
      cost: 1,
      yes: { gamepad_calibration: 10, stick_drift: 0.4 },
      no: { gamepad_calibration: 0.2 },
    },
    q_mode_light: {
      fact: true,
      text: 'Is it a Logitech F310 with the green light next to MODE turned on?',
      help: 'The small green LED next to the MODE button in the middle of the F310.',
      cost: 1,
      yes: { gamepad_mode: 20 },
      no: { gamepad_mode: 0.1 },
    },
    q_gamepad_icon: {
      text: 'Does the gamepad icon on the Driver Station light up when you press buttons?',
      help: 'Top right of the Driver Station screen. Green = recognized and active, orange (SDK 12+) = unknown controller.',
      cost: 1,
      yes: { gamepad_unassigned: 0.3 },
      no: { gamepad_unassigned: 6, gamepad_mode: 0.5 },
    },
    q_sticks_drift_values: {
      text: 'With hands off, does telemetry show stick values that aren\'t 0?',
      help: 'Print gamepad1.left_stick_x, left_stick_y, right_stick_x in telemetry and leave the gamepad alone.',
      cost: 2,
      yes: { stick_drift: 4, gamepad_calibration: 3 },
      no: { stick_drift: 0.2, gamepad_calibration: 0.4 },
    },
    // drive
    q_wheels_on_stand: {
      text: 'On a stand, does each wheel spin "forward" when you command forward?',
      help: 'Lift the robot so the wheels are off the ground and drive forward slowly. Every wheel should turn the way that would move the robot forward.',
      cost: 2,
      yes: { motor_direction: 0.1, motor_config_swap: 0.6 },
      no: { motor_direction: 8, motor_config_swap: 3 },
    },
    q_one_motor_test: {
      text: 'If you power one named motor at a time, does the expected wheel move?',
      help: 'Command only "frontLeft", then only "frontRight", and so on, and watch which wheel turns.',
      cost: 2,
      yes: { motor_config_swap: 0.1 },
      no: { motor_config_swap: 10, motor_direction: 0.8 },
    },
    q_rollers_x: {
      text: 'Looking from above, do the bottom rollers of the four wheels form an X across the robot?',
      help: 'Compare to the goBILDA / REV mecanum diagram. Each wheel is left- or right-handed.',
      cost: 1,
      yes: { mecanum_rollers: 0.1 },
      no: { mecanum_rollers: 12 },
    },
    q_spin_free: {
      text: 'Lifted up, do all wheels spin freely and feel the same by hand?',
      help: 'Turn each wheel by hand. Look for rubbing, grinding, tight spots, or one wheel that is harder to turn.',
      cost: 1,
      yes: { drive_friction: 0.3, motor_stall: 0.5 },
      no: { drive_friction: 6, motor_stall: 1.5 },
    },
    q_mecanum_normalized: {
      fact: true,
      text: 'Does your drive code divide the powers so none go over 1?',
      help: 'Look for a "denominator" or "max" step in the mecanum math before setPower.',
      cost: 1,
      yes: { mecanum_math: 0.3 },
      no: { mecanum_math: 4 },
    },
    q_run_using_encoder: {
      fact: true,
      text: 'Are your drive motors in RUN_USING_ENCODER (or using setVelocity)?',
      help: 'Search the code for setMode on the drive motors.',
      cost: 1,
      yes: { no_velocity_control: 0.2 },
      no: { no_velocity_control: 3 },
    },
    q_drift_same_dir: {
      text: 'Does it always drift the same way, even at slow speed?',
      help: 'Drive straight forward slowly across the field a few times.',
      cost: 2,
      yes: { drive_friction: 2, motor_direction: 1.5, no_velocity_control: 1.5 },
      no: { drive_friction: 0.6, accel_slip: 2, timed_moves: 1.5 },
    },
    q_always_slow: {
      text: 'Has it always been this slow, since the day it was built?',
      help: 'Or did it get slower over time or suddenly?',
      cost: 1,
      yes: { drive_geared_slow: 6, power_scaled: 2, battery_low: 0.4, brownout: 0.5, xt30_loose: 0.4, drive_friction: 0.7 },
      no: { drive_geared_slow: 0.1 },
    },
    q_full_stick_slow: {
      text: 'With the stick pushed all the way, does telemetry show the wheels getting less than full power?',
      help: 'Print the power you send to each motor while holding the stick fully forward.',
      cost: 2,
      yes: { power_scaled: 10, drive_geared_slow: 0.3 },
      no: { power_scaled: 0.1 },
    },
    // motor / mechanism
    q_motor_hums: {
      text: 'Does the motor hum or get hot without moving?',
      help: 'Listen and carefully feel the motor after trying to run it.',
      cost: 1,
      yes: { motor_stall: 6, motor_unplugged: 0.2, motor_not_commanded: 0.2 },
      no: { motor_stall: 0.4 },
    },
    q_other_port: {
      text: 'Does the motor work if you plug it into a different port (and update the config)?',
      help: 'Move the motor to a spare port you know works and change the configuration to match.',
      cost: 3,
      yes: { motor_unplugged: 5, motor_not_commanded: 0.3 },
      no: { motor_unplugged: 0.4, motor_stall: 1.5 },
    },
    q_telemetry_power: {
      text: 'Does telemetry show the code sending non-zero power to it?',
      help: 'Print motor.getPower() (and the mode) in your loop.',
      cost: 2,
      yes: { motor_not_commanded: 0.1, motor_unplugged: 2, motor_stall: 1.5 },
      no: { motor_not_commanded: 10 },
    },
    q_moves_by_hand: {
      text: 'With power off, does the mechanism move smoothly by hand through its whole range?',
      help: 'Backdrive it slowly. Feel for tight spots, grinding, or places it catches.',
      cost: 1,
      yes: { motor_stall: 0.4, set_screw_slip: 0.8 },
      no: { motor_stall: 5, chain_tension: 2 },
    },
    q_sags_powered: {
      text: 'Does it sag while the code is trying to hold it (not just when power is off)?',
      help: 'Hold a position in code and watch whether it slowly drops.',
      cost: 1,
      yes: { no_feedforward: 4, pid_gains: 2, string_rigging: 1.5 },
      no: { zero_power_float: 2, no_feedforward: 0.6 },
    },
    q_brake_mode: {
      fact: true,
      text: 'Is the motor set to BRAKE zero power behavior?',
      help: 'Search for setZeroPowerBehavior on that motor.',
      cost: 1,
      yes: { zero_power_float: 0 },
      no: { zero_power_float: 5 },
    },
    q_has_ff: {
      fact: true,
      text: 'Does your control code add a gravity term (kG / feedforward)?',
      help: 'A constant added to the output for slides, or kCos × cos(angle) for arms.',
      cost: 1,
      yes: { no_feedforward: 0.2 },
      no: { no_feedforward: 4 },
    },
    q_string_slack: {
      text: 'Is the string loose, frayed, or wrapped messily on the spool?',
      help: 'Look at the string with the slide retracted and extended.',
      cost: 1,
      yes: { string_rigging: 8 },
      no: { string_rigging: 0.3 },
    },
    q_oscillates: {
      text: 'Does it shake back and forth around the target?',
      help: 'Command a position and watch what happens right at the end.',
      cost: 1,
      yes: { pid_gains: 4, encoder_wrong_way: 0.5 },
      no: { pid_gains: 0.8 },
    },
    q_runs_away: {
      text: 'Does it slam to full speed and blow past the target?',
      help: 'It does not slow down near the target. It just keeps going.',
      cost: 1,
      yes: { encoder_wrong_way: 6, encoder_cable: 3, pid_gains: 0.6 },
      no: { encoder_wrong_way: 0.2, encoder_cable: 0.5 },
    },
    q_encoder_changes: {
      text: 'If you turn the shaft by hand, does the encoder number in telemetry change smoothly?',
      help: 'Print motor.getCurrentPosition() and turn the motor or mechanism by hand.',
      cost: 2,
      yes: { encoder_cable: 0.1 },
      no: { encoder_cable: 10, encoder_wrong_way: 0.5 },
    },
    q_encoder_counts_up: {
      text: 'Moving it the "positive" direction by hand, does the count go up?',
      help: 'Decide which way is positive (up, out, forward), then move it that way.',
      cost: 2,
      yes: { encoder_wrong_way: 0.1, odo_directions: 0.2 },
      no: { encoder_wrong_way: 8, odo_directions: 5 },
    },
    q_encoder_reset: {
      fact: true,
      text: 'Do you reset the encoder (STOP_AND_RESET_ENCODER) in init?',
      help: 'Search the code for STOP_AND_RESET_ENCODER.',
      cost: 1,
      yes: { encoder_not_reset: 0.1 },
      no: { encoder_not_reset: 4 },
    },
    q_chain_sag: {
      text: 'Does the chain or belt feel loose or sag in the middle?',
      help: 'Press the middle of the run with a finger.',
      cost: 1,
      yes: { chain_tension: 6 },
      no: { chain_tension: 0.4, chain_wrap: 1.3 },
    },
    q_chain_wrap: {
      text: 'Does the chain or belt wrap less than a quarter of any sprocket or pulley?',
      help: 'Look at how much of each sprocket the chain actually touches.',
      cost: 1,
      yes: { chain_wrap: 5 },
      no: { chain_wrap: 0.4 },
    },
    q_marker_line: {
      text: 'If you draw a marker line across the hub and shaft, does it split after running?',
      help: 'Draw one straight line over the hub (or collar) and the shaft, run it a few times, and look again.',
      cost: 2,
      yes: { set_screw_slip: 12 },
      no: { set_screw_slip: 0.1 },
    },
    q_set_screws: {
      fact: true,
      text: 'Is that part held on with a set screw?',
      help: 'A small headless screw that presses against the shaft.',
      cost: 1,
      yes: { set_screw_slip: 3 },
      no: { set_screw_slip: 0.5 },
    },
    // servos
    q_servo_colors: {
      fact: true,
      text: 'Is the servo plug the right way around (black/brown wire on ground) at the hub and at every extension?',
      help: 'Check the hub label and every joint along the wire.',
      cost: 1,
      yes: { servo_backwards: 0 },
      no: { servo_backwards: 20 },
    },
    q_servo_holds: {
      text: 'Does the servo resist when you gently try to turn it while the OpMode runs?',
      help: 'A powered position servo holds firmly. A limp one turns easily.',
      cost: 1,
      yes: { servo_never_commanded: 0.1, servo_backwards: 0.1, servo_power_pairs: 0.6 },
      no: { servo_never_commanded: 3, servo_backwards: 2, servo_config_type: 1.5 },
    },
    q_servo_continuous: {
      fact: true,
      text: 'Is it supposed to spin continuously (like an intake roller)?',
      help: 'Continuous servos spin; position servos go to an angle.',
      cost: 1,
      yes: { servo_config_type: 3, servo_pwm_range: 0.3, servo_horn_index: 0.2 },
      no: { servo_config_type: 1 },
    },
    q_servo_swap: {
      text: 'Does a known-good servo work in the same spot?',
      help: 'Swap in a spare servo without changing anything else.',
      cost: 3,
      yes: { servo_damaged: 10 },
      no: { servo_damaged: 0.1 },
    },
    q_servo_many: {
      fact: true,
      text: 'Are several busy servos sharing neighboring ports (0–1, 2–3, 4–5) on the same hub?',
      help: 'Count which ports your strong or heavily loaded servos use.',
      cost: 1,
      yes: { servo_power_pairs: 5 },
      no: { servo_power_pairs: 0.4 },
    },
    q_servo_at_end: {
      text: 'Does it buzz or jitter only at one end of its travel?',
      help: 'Move it to each end position and listen.',
      cost: 1,
      yes: { servo_hard_stop: 8, servo_fighting: 0.5 },
      no: { servo_hard_stop: 0.3 },
    },
    q_servo_position_changes: {
      text: 'Does the position you send keep changing even when nobody touches the controls?',
      help: 'Print the value you pass to setPosition every loop.',
      cost: 2,
      yes: { servo_fighting: 10 },
      no: { servo_fighting: 0.2 },
    },
    q_servo_hot: {
      text: 'Does the servo get warm even when the mechanism isn\'t moving?',
      help: 'Carefully touch the servo case after a minute of holding.',
      cost: 1,
      yes: { servo_hard_stop: 3, servo_power_pairs: 1.5 },
      no: { servo_hard_stop: 0.6 },
    },
    q_pwm_range_set: {
      fact: true,
      text: 'Have you widened the PWM range (setPwmRange) or programmed the servo\'s range?',
      help: 'By default the SDK uses 600–2400 µs.',
      cost: 1,
      yes: { servo_pwm_range: 0.1 },
      no: { servo_pwm_range: 4 },
    },
    q_range_off_center: {
      text: 'Does it move the right amount but in the wrong spot (shifted)?',
      help: 'The total swing is fine, it is just not lined up with the mechanism.',
      cost: 1,
      yes: { servo_horn_index: 8, servo_pwm_range: 0.4 },
      no: { servo_horn_index: 0.3 },
    },
    // code
    q_error_device_name: {
      text: 'Does the error say "Unable to find a hardware device with the name ..."?',
      help: 'The red error text at the bottom of the Driver Station.',
      cost: 1,
      yes: { hw_name_mismatch: 15 },
      no: { hw_name_mismatch: 0.2 },
    },
    q_error_null: {
      text: 'Does the error mention null or NullPointerException?',
      help: 'The red error text, or the robot log (Robot Controller → View Logs).',
      cost: 1,
      yes: { hw_at_field_init: 4, null_object: 4 },
      no: { hw_at_field_init: 0.1, null_object: 0.1 },
    },
    q_error_invalid: {
      text: 'Does the error say "number ... is invalid"?',
      help: 'This one appears when a motor or servo gets a value out of range.',
      cost: 1,
      yes: { value_out_of_range: 15 },
      no: { value_out_of_range: 0.1 },
    },
    q_error_target: {
      text: 'Does the error mention TargetPositionNotSet?',
      help: 'Shows up when switching to RUN_TO_POSITION too early.',
      cost: 1,
      yes: { rtp_order: 15 },
      no: { rtp_order: 0.1 },
    },
    q_crash_on_init: {
      text: 'Does it crash the moment you press INIT?',
      help: 'Before PLAY, right as the OpMode starts.',
      cost: 1,
      yes: { hw_at_field_init: 3, hw_name_mismatch: 2 },
      no: { hw_at_field_init: 0.3 },
    },
    q_while_true: {
      fact: true,
      text: 'Is there a while loop that doesn\'t check opModeIsActive(), or a sleep/loop inside an iterative loop()?',
      help: 'Search for "while (" and check every loop.',
      cost: 1,
      yes: { uninterruptible_loop: 8, code_blocking: 3 },
      no: { uninterruptible_loop: 0.2 },
    },
    q_annotation: {
      fact: true,
      text: 'Does the class have @TeleOp or @Autonomous above it, and no @Disabled?',
      help: 'Look at the lines right above "public class".',
      cost: 1,
      yes: { opmode_annotation: 0.1 },
      no: { opmode_annotation: 15 },
    },
    q_build_ok: {
      text: 'Did the build finish without errors and install on the Control Hub?',
      help: 'Check the Build / Run panel at the bottom of Android Studio, or the OnBot Java build messages.',
      cost: 1,
      yes: { build_not_deployed: 0.2 },
      no: { build_not_deployed: 6, android_studio_setup: 2 },
    },
    q_adb_devices: {
      text: 'Does the Control Hub show up in Android Studio\'s device list (or in "adb devices")?',
      help: 'The device dropdown next to the Run button.',
      cost: 1,
      yes: { adb_connection: 0.1, android_studio_setup: 2 },
      no: { adb_connection: 6 },
    },
    q_laptop_on_robot_wifi: {
      fact: true,
      text: 'Is the laptop connected to the robot\'s Wi-Fi network?',
      help: 'Your laptop has to be on the Control Hub\'s network (or plugged in over USB-C).',
      cost: 1,
      yes: { adb_connection: 0.7 },
      no: { adb_connection: 6 },
    },
    q_loop_time: {
      text: 'Is your loop time above ~30 ms?',
      help: 'Add a loop timer to telemetry (the fix below shows how). Snappy robots run around 5–20 ms.',
      cost: 2,
      yes: { no_bulk_reads: 2, slow_i2c: 2, vision_cpu: 2, code_blocking: 1.5 },
      no: { no_bulk_reads: 0.3, slow_i2c: 0.3, vision_cpu: 0.4 },
    },
    q_bulk_on: {
      fact: true,
      text: 'Do you turn on bulk reads (LynxModule BulkCachingMode)?',
      help: 'Search the code for setBulkCachingMode.',
      cost: 1,
      yes: { no_bulk_reads: 0.1 },
      no: { no_bulk_reads: 5 },
    },
    q_i2c_sensors: {
      fact: true,
      text: 'Do you read color, distance, or other I2C sensors every loop?',
      help: 'REV color/distance sensors, external IMUs, and similar.',
      cost: 1,
      yes: { slow_i2c: 4 },
      no: { slow_i2c: 0.2 },
    },
    q_camera_running: {
      fact: true,
      text: 'Is a camera or vision pipeline running during teleop?',
      help: 'A VisionPortal, AprilTag processor, or Limelight streaming.',
      cost: 1,
      yes: { vision_cpu: 3 },
      no: { vision_cpu: 0 },
    },
    // sensors
    q_heading_wrong_amount: {
      text: 'When you turn the robot 90° left by hand, does heading read about +90?',
      help: 'Reset yaw, turn left a quarter turn, read telemetry.',
      cost: 2,
      yes: { imu_orientation: 0.1 },
      no: { imu_orientation: 8, imu_legacy: 2 },
    },
    q_heading_jumps: {
      text: 'Does heading suddenly jump back to 0 during a match?',
      help: 'Like the robot "forgets" where it was pointing.',
      cost: 1,
      yes: { imu_reset_esd: 8 },
      no: { imu_reset_esd: 0.3 },
    },
    q_legacy_imu: {
      fact: true,
      text: 'Does your code use BNO055IMU instead of the newer IMU class?',
      help: 'Search for "BNO055IMU".',
      cost: 1,
      yes: { imu_legacy: 8 },
      no: { imu_legacy: 0.1 },
    },
    q_spins_long_way: {
      text: 'When turning to a heading, does it sometimes spin almost a full circle the long way?',
      help: 'Common when the target is near ±180°.',
      cost: 1,
      yes: { angle_wrap: 15 },
      no: { angle_wrap: 0.2 },
    },
    q_push_forward_x: {
      text: 'Pushing the robot forward by hand, does X go up (and pushing left, does Y go up)?',
      help: 'Run your localization test and watch telemetry while you push.',
      cost: 2,
      yes: { odo_directions: 0.1, localization_first: 0.6 },
      no: { odo_directions: 10, localization_first: 3 },
    },
    q_spin_drift: {
      text: 'If you spin in place a few times, do X and Y drift far from 0?',
      help: 'Turn the robot several full circles in place and look at X/Y.',
      cost: 2,
      yes: { odo_offsets: 6, pinpoint_mount: 1.5, localization_first: 2 },
      no: { odo_offsets: 0.2 },
    },
    q_drift_still: {
      text: 'Does heading slowly change while the robot sits perfectly still?',
      help: 'Leave it alone for 30 seconds with telemetry up.',
      cost: 2,
      yes: { pinpoint_mount: 8 },
      no: { pinpoint_mount: 0.4 },
    },
    q_uses_pinpoint: {
      fact: true,
      text: 'Are you using a goBILDA Pinpoint?',
      help: 'The small odometry computer the dead wheels plug into.',
      cost: 1,
      yes: { pinpoint_mount: 2 },
      no: { pinpoint_mount: 0 },
    },
    q_pods_planted: {
      text: 'Do the dead wheels spring firmly onto the floor everywhere on the field?',
      help: 'Push each pod up and let go, and watch it over tile seams.',
      cost: 1,
      yes: { pod_contact: 0.2 },
      no: { pod_contact: 8 },
    },
    q_dead_wheels: {
      fact: true,
      text: 'Do you track position with dead wheels or a Pinpoint / OTOS (not just drive motor encoders)?',
      help: 'Dead wheels are small unpowered omni wheels with encoders.',
      cost: 1,
      yes: { drive_encoder_slip: 0.1 },
      no: { drive_encoder_slip: 5, pod_contact: 0, odo_offsets: 0.3, pinpoint_mount: 0 },
    },
    // vision
    q_detect_still_only: {
      text: 'Does it detect tags when the robot is still, but not while moving?',
      help: 'Park in front of a tag, then drive past it.',
      cost: 2,
      yes: { exposure_blur: 8, decimation_range: 0.5 },
      no: { exposure_blur: 0.5 },
    },
    q_detect_close_only: {
      text: 'Does it detect tags up close but not from farther away?',
      help: 'Move back from the tag a foot at a time.',
      cost: 2,
      yes: { decimation_range: 6, exposure_blur: 1.2 },
      no: { decimation_range: 0.3 },
    },
    q_pose_wrong: {
      text: 'Are tags detected, but the distance or angle numbers are wrong?',
      help: 'Measure the real distance with a tape measure and compare.',
      cost: 2,
      yes: { camera_calibration: 8, exposure_blur: 0.3, decimation_range: 0.3 },
      no: { camera_calibration: 0.2 },
    },
    q_camera_disappears: {
      text: 'Does the camera disappear until you power cycle the robot?',
      help: 'The camera stops showing up or vision returns nothing until a restart.',
      cost: 1,
      yes: { camera_port_power: 5, esd: 2 },
      no: { camera_port_power: 0.7 },
    },
    q_limelight: {
      fact: true,
      text: 'Is it a Limelight 3A?',
      help: 'The Limelight smart camera, rather than a USB webcam.',
      cost: 1,
      yes: { limelight_setup: 4, camera_calibration: 0.3 },
      no: { limelight_setup: 0 },
    },
    q_limelight_start: {
      fact: true,
      text: 'Does your code call limelight.start() and check result.isValid()?',
      help: 'Search the code for "start()" on the Limelight.',
      cost: 1,
      yes: { limelight_setup: 0.3 },
      no: { limelight_setup: 6 },
    },
    // auto
    q_auto_sleep: {
      fact: true,
      text: 'Does your autonomous move by time (power + sleep) instead of distance?',
      help: 'For example: setPower(0.5); sleep(1200);',
      cost: 1,
      yes: { timed_moves: 8 },
      no: { timed_moves: 0.1 },
    },
    q_start_jig: {
      fact: true,
      text: 'Do you line the robot up exactly the same way every time?',
      help: 'Same wall, same tile seam, same angle, ideally with a jig or a mark.',
      cost: 1,
      yes: { start_position: 0.3 },
      no: { start_position: 4 },
    },
    q_full_power_start: {
      fact: true,
      text: 'Does it jump straight to full power at the start of moves?',
      help: 'No ramp-up or motion profile.',
      cost: 1,
      yes: { accel_slip: 3 },
      no: { accel_slip: 0.5 },
    },
    q_path_follower: {
      fact: true,
      text: 'Are you using a path follower (Pedro Pathing, Road Runner)?',
      help: 'A library that follows paths using odometry.',
      cost: 1,
      yes: { localization_first: 2, follower_gains: 2, timed_moves: 0.1 },
      no: { localization_first: 0.3, follower_gains: 0 },
    },
    q_localization_test: {
      text: 'Does the localization test pass (push 48" forward → X ≈ 48, left → Y up, heading correct)?',
      help: 'Run your library\'s localization test OpMode and push the robot by hand.',
      cost: 2,
      yes: { localization_first: 0.1, odo_directions: 0.1, odo_offsets: 0.4 },
      no: { localization_first: 8, odo_directions: 2, odo_offsets: 2 },
    },
    q_jitter_overshoot: {
      text: 'Does it reach the end of the path but overshoot or jitter around it?',
      help: 'It gets there, just not cleanly.',
      cost: 1,
      yes: { follower_gains: 6, localization_first: 0.6 },
      no: { follower_gains: 0.5 },
    },
  };
})();

// symptoms ---------------------------------------------------------------------
// causes map to a starting likelihood (how often it's the culprit for this symptom).
(function () {
  window.DOCTOR.symptoms = [
    // drivetrain
    {
      id: 'drift', area: 'drive', icon: 'fa-route',
      title: 'Robot drifts or curves when driving straight',
      sub: 'Pulls left or right, or arcs instead of going straight.',
      keywords: 'drift curve veer pull left right straight crooked arc not straight wobble',
      causes: { motor_direction: 2, drive_friction: 4, no_velocity_control: 3, mecanum_rollers: 1.5, motor_config_swap: 1.5, mecanum_math: 1.5, stick_drift: 1.5, battery_low: 1 },
      questions: ['q_wheels_on_stand', 'q_spin_free', 'q_drift_same_dir', 'q_run_using_encoder', 'q_rollers_x', 'q_sticks_drift_values', 'q_mecanum_normalized', 'q_one_motor_test', 'q_fresh_battery'],
    },
    {
      id: 'strafe', area: 'drive', icon: 'fa-arrows-up-down',
      title: 'Strafing is wrong — it spins, goes diagonal, or barely moves',
      sub: 'Mecanum robot won\'t slide sideways cleanly.',
      keywords: 'strafe strafing sideways mecanum diagonal spins slide lateral holonomic',
      causes: { mecanum_rollers: 4, motor_direction: 4, motor_config_swap: 3, mecanum_math: 3, drive_friction: 1.5, no_velocity_control: 1 },
      questions: ['q_rollers_x', 'q_wheels_on_stand', 'q_one_motor_test', 'q_mecanum_normalized', 'q_spin_free', 'q_run_using_encoder'],
    },
    {
      id: 'wrong_way', area: 'drive', icon: 'fa-shuffle',
      title: 'Controls are backwards or mixed up',
      sub: 'Forward goes backward, turning goes the wrong way, sticks do the wrong thing.',
      keywords: 'backwards inverted reversed wrong way controls mixed opposite turning wrong joystick',
      causes: { motor_direction: 5, motor_config_swap: 4, mecanum_math: 2, gamepad_mode: 2, gamepad_unassigned: 1 },
      questions: ['q_mode_light', 'q_wheels_on_stand', 'q_one_motor_test', 'q_mecanum_normalized', 'q_gamepad_icon'],
    },
    {
      id: 'moves_alone', area: 'drive', icon: 'fa-person-running',
      title: 'Robot moves on its own',
      sub: 'Creeps or drives when nobody is touching the controls.',
      keywords: 'moves by itself own creeping creep ghost drifting without input runaway starts moving init',
      causes: { gamepad_calibration: 5, stick_drift: 3, missing_waitforstart: 2 },
      questions: ['q_moves_on_init', 'q_moves_before_touch', 'q_replug_fixes', 'q_sticks_drift_values'],
    },
    {
      id: 'slow_drive', area: 'drive', icon: 'fa-gauge-high',
      title: 'Drivetrain is slow or weak',
      sub: 'Feels sluggish, can\'t push, or slower than it used to be.',
      keywords: 'slow weak sluggish no power speed pushing slower than before torque',
      causes: { battery_low: 4, power_scaled: 3, drive_friction: 3, drive_geared_slow: 2, brownout: 1.5, xt30_loose: 1 },
      questions: ['q_always_slow', 'q_fresh_battery', 'q_full_stick_slow', 'q_spin_free', 'q_voltage_low', 'q_wiggle', 'q_battery_old'],
    },
    // connection
    {
      id: 'disconnect', area: 'connection', icon: 'fa-wifi',
      title: 'Robot disconnects or loses the Driver Station mid-match',
      sub: 'Connection drops, the DS beeps, the robot stops, then comes back (or not).',
      keywords: 'disconnect disconnects lost connection drops dropped mid match robot stops wifi beep comes back lose connection',
      causes: { xt30_loose: 4, esd: 3.5, brownout: 3, wifi_stale: 2.5, wifi_interference: 2, usb_strain: 1.5, code_blocking: 1.5, rc_mounting: 1, software_outdated: 1.5 },
      questions: ['q_on_bump', 'q_touch_field', 'q_when_mechanism', 'q_wiggle', 'q_ds_other_wifi', 'q_empty_opmode', 'q_ping_high', 'q_voltage_low', 'q_ground_strap', 'q_updated', 'q_hub_buried'],
    },
    {
      id: 'cant_connect', area: 'connection', icon: 'fa-tower-broadcast',
      title: 'Driver Station won\'t connect to the robot at all',
      sub: 'Never pairs, or connects to Wi-Fi but shows no ping.',
      keywords: 'cant connect cannot connect pair pairing no connection driver hub wont connect not showing network ssid',
      causes: { wifi_stale: 4, wifi_interference: 3, software_outdated: 3, battery_low: 1, rc_mounting: 0.5 },
      questions: ['q_ds_other_wifi', 'q_school_only', 'q_updated', 'q_led_not_green', 'q_hub_buried', 'q_fresh_battery'],
    },
    {
      id: 'gamepad', area: 'connection', icon: 'fa-gamepad',
      title: 'Gamepad doesn\'t respond or buttons are wrong',
      sub: 'Nothing happens, a stick is dead, or buttons do the wrong thing.',
      keywords: 'gamepad controller joystick not working buttons wrong dead stick logitech ps4 ps5 xbox',
      causes: { gamepad_unassigned: 4, gamepad_mode: 3, gamepad_calibration: 2, motor_not_commanded: 1 },
      questions: ['q_gamepad_icon', 'q_mode_light', 'q_replug_fixes', 'q_telemetry_power'],
    },
    // power
    {
      id: 'reboots', area: 'power', icon: 'fa-power-off',
      title: 'Robot loses power or reboots when things run',
      sub: 'Everything cuts out for a second, the hub restarts, or motors stutter.',
      keywords: 'reboot restart brownout loses power cuts out shuts off resets stutter dies power loss',
      causes: { brownout: 4, xt30_loose: 4, battery_low: 3, esd: 2, motor_stall: 1.5 },
      questions: ['q_when_mechanism', 'q_on_bump', 'q_wiggle', 'q_voltage_low', 'q_fresh_battery', 'q_touch_field', 'q_motor_hums'],
    },
    {
      id: 'battery', area: 'power', icon: 'fa-car-battery',
      title: 'Battery dies fast or shows low voltage',
      sub: 'Doesn\'t last a match, or the voltage looks too low.',
      keywords: 'battery dies fast drains low voltage dead battery charge wont hold short life 12v',
      causes: { battery_low: 5, motor_stall: 2, brownout: 2, fuse_blown: 1, xt30_loose: 1 },
      questions: ['q_battery_zero', 'q_battery_old', 'q_fresh_battery', 'q_motor_hums', 'q_when_mechanism', 'q_wiggle'],
    },
    // mechanisms
    {
      id: 'motor_dead', area: 'mechanisms', icon: 'fa-gear',
      title: 'A motor won\'t spin',
      sub: 'One motor does nothing, or only hums.',
      keywords: 'motor not spinning wont spin dead motor not moving doesnt turn hum nothing happens',
      causes: { motor_not_commanded: 4, motor_unplugged: 4, hw_name_mismatch: 1.5, motor_stall: 2, rtp_order: 1 },
      questions: ['q_telemetry_power', 'q_motor_hums', 'q_moves_by_hand', 'q_other_port', 'q_error_device_name', 'q_error_target'],
    },
    {
      id: 'slides_sag', area: 'mechanisms', icon: 'fa-arrows-alt-v',
      title: 'Slides or arm sag, slip, or won\'t hold',
      sub: 'Drops when you let go, creeps down, or can\'t hold height.',
      keywords: 'slides sag sagging falls drops slip wont hold linear slide lift arm droop gravity creeps down',
      causes: { zero_power_float: 3, no_feedforward: 4, string_rigging: 3, set_screw_slip: 2, chain_tension: 1.5, pid_gains: 1.5 },
      questions: ['q_sags_powered', 'q_brake_mode', 'q_has_ff', 'q_string_slack', 'q_marker_line', 'q_chain_sag'],
    },
    {
      id: 'arm_oscillates', area: 'mechanisms', icon: 'fa-wave-square',
      title: 'Arm or slide shakes, overshoots, or runs away',
      sub: 'Bounces around the target, overshoots, or slams to full speed.',
      keywords: 'oscillates oscillation shakes bounces overshoot overshoots jerky runs away full speed pid run to position jitter',
      causes: { pid_gains: 5, encoder_wrong_way: 3, encoder_cable: 2, no_feedforward: 2, set_screw_slip: 1 },
      questions: ['q_runs_away', 'q_oscillates', 'q_encoder_changes', 'q_encoder_counts_up', 'q_has_ff', 'q_marker_line'],
    },
    {
      id: 'chain_skip', area: 'mechanisms', icon: 'fa-link',
      title: 'Chain or belt skips or falls off',
      sub: 'Clicking, slipping teeth, or the chain jumps off.',
      keywords: 'chain belt skips skipping falls off slips teeth clicking derail sprocket pulley',
      causes: { chain_tension: 5, chain_wrap: 4, set_screw_slip: 1.5, motor_stall: 1 },
      questions: ['q_chain_sag', 'q_chain_wrap', 'q_marker_line', 'q_moves_by_hand'],
    },
    {
      id: 'part_slips', area: 'mechanisms', icon: 'fa-screwdriver-wrench',
      title: 'Something works, then loosens or slips over time',
      sub: 'A gear, wheel, or mechanism stops turning with its shaft.',
      keywords: 'loose loosens slips shaft spinning freely set screw gear wheel hub comes loose vibrates',
      causes: { set_screw_slip: 6, chain_tension: 1.5, motor_stall: 1 },
      questions: ['q_marker_line', 'q_set_screws', 'q_moves_by_hand'],
    },
    // servos
    {
      id: 'servo_dead', area: 'servos', icon: 'fa-sliders',
      title: 'Servo doesn\'t move',
      sub: 'Limp, silent, or does nothing when commanded.',
      keywords: 'servo not moving doesnt move dead servo limp nothing claw',
      causes: { servo_backwards: 3, servo_never_commanded: 3, servo_config_type: 2, hw_name_mismatch: 2, servo_damaged: 2, servo_power_pairs: 1.5 },
      questions: ['q_servo_colors', 'q_servo_holds', 'q_error_device_name', 'q_servo_continuous', 'q_servo_swap', 'q_servo_many'],
    },
    {
      id: 'servo_jitter', area: 'servos', icon: 'fa-wave-square',
      title: 'Servo jitters, buzzes, or twitches',
      sub: 'Shakes, hums, or randomly moves.',
      keywords: 'servo jitter jitters buzz buzzing twitch twitching shake humming random movement',
      causes: { servo_hard_stop: 4, servo_power_pairs: 3, servo_fighting: 3, servo_damaged: 2, battery_low: 1 },
      questions: ['q_servo_at_end', 'q_servo_position_changes', 'q_servo_many', 'q_servo_hot', 'q_servo_swap', 'q_fresh_battery'],
    },
    {
      id: 'servo_range', area: 'servos', icon: 'fa-compass',
      title: 'Servo doesn\'t reach full range or the right angle',
      sub: 'Moves less than advertised or ends up in the wrong place.',
      keywords: 'servo range angle not enough travel short wrong position 180 270 degrees',
      causes: { servo_pwm_range: 5, servo_horn_index: 4, servo_config_type: 1.5, servo_hard_stop: 1.5 },
      questions: ['q_range_off_center', 'q_pwm_range_set', 'q_servo_continuous', 'q_servo_at_end'],
    },
    // code
    {
      id: 'err_device', area: 'code', icon: 'fa-triangle-exclamation',
      title: 'Error: "Unable to find a hardware device"',
      sub: 'The OpMode crashes looking for a motor, servo, or sensor.',
      keywords: 'unable to find hardware device error hardwaremap name configuration config not found',
      causes: { hw_name_mismatch: 8 },
      questions: ['q_error_device_name'],
    },
    {
      id: 'crash', area: 'code', icon: 'fa-bug',
      title: 'OpMode crashes with an error',
      sub: 'Red text on the Driver Station and the OpMode stops.',
      keywords: 'crash error exception null nullpointer invalid number red text stops targetpositionnotset stack trace',
      causes: { hw_at_field_init: 3, null_object: 3, hw_name_mismatch: 3, value_out_of_range: 2.5, rtp_order: 2 },
      questions: ['q_error_device_name', 'q_error_null', 'q_error_invalid', 'q_error_target', 'q_crash_on_init'],
    },
    {
      id: 'stuck_stop', area: 'code', icon: 'fa-hand-paper',
      title: 'Robot won\'t stop when I press STOP',
      sub: 'Keeps running, "stuck in stop", or the app restarts.',
      keywords: 'wont stop stuck in stop stop button doesnt stop keeps running app restarts runaway opmode',
      causes: { uninterruptible_loop: 6, code_blocking: 3 },
      questions: ['q_while_true'],
    },
    {
      id: 'opmode_missing', area: 'code', icon: 'fa-list-check',
      title: 'OpMode doesn\'t show up on the Driver Station',
      sub: 'You wrote it, but it isn\'t in the list.',
      keywords: 'opmode missing not showing not in list doesnt appear teleop autonomous list',
      causes: { opmode_annotation: 5, build_not_deployed: 4, adb_connection: 1 },
      questions: ['q_annotation', 'q_build_ok', 'q_adb_devices'],
    },
    {
      id: 'deploy', area: 'code', icon: 'fa-terminal',
      title: 'Can\'t deploy code from Android Studio',
      sub: 'Control Hub not found, or the build won\'t install.',
      keywords: 'deploy android studio adb control hub not found install upload build gradle cant upload',
      causes: { adb_connection: 5, android_studio_setup: 3, build_not_deployed: 2 },
      questions: ['q_laptop_on_robot_wifi', 'q_adb_devices', 'q_build_ok', 'q_updated'],
    },
    {
      id: 'laggy', area: 'code', icon: 'fa-stopwatch',
      title: 'Controls feel laggy or the loop is slow',
      sub: 'Delay between the stick and the robot.',
      keywords: 'lag laggy slow loop delay latency unresponsive loop time hz',
      causes: { no_bulk_reads: 4, slow_i2c: 3, vision_cpu: 3, code_blocking: 2, wifi_interference: 1.5 },
      questions: ['q_loop_time', 'q_bulk_on', 'q_i2c_sensors', 'q_camera_running', 'q_ping_high'],
    },
    // sensors
    {
      id: 'encoder', area: 'sensors', icon: 'fa-ruler',
      title: 'Encoder reads 0, jumps, or counts wrong',
      sub: 'Position doesn\'t change, starts at a weird number, or goes the wrong way.',
      keywords: 'encoder reads zero 0 not changing wrong count getcurrentposition ticks jumps negative',
      causes: { encoder_cable: 5, encoder_not_reset: 3, encoder_wrong_way: 3 },
      questions: ['q_encoder_changes', 'q_encoder_counts_up', 'q_encoder_reset'],
    },
    {
      id: 'heading', area: 'sensors', icon: 'fa-compass',
      title: 'IMU heading is wrong or field-centric is broken',
      sub: 'Heading off by 90/180°, turns the wrong way, or resets.',
      keywords: 'imu heading yaw gyro field centric wrong angle resets jumps 90 180 turning wrong',
      causes: { imu_orientation: 5, imu_reset_esd: 2.5, imu_legacy: 2, angle_wrap: 2 },
      questions: ['q_heading_wrong_amount', 'q_heading_jumps', 'q_legacy_imu', 'q_spins_long_way', 'q_touch_field'],
    },
    {
      id: 'odometry', area: 'sensors', icon: 'fa-crosshairs',
      title: 'Odometry / Pinpoint position is wrong or drifts',
      sub: 'Robot thinks it\'s somewhere it isn\'t.',
      keywords: 'odometry pinpoint dead wheels position wrong drift localization otos pods xy',
      causes: { odo_directions: 4, odo_offsets: 4, pinpoint_mount: 3, pod_contact: 3, drive_encoder_slip: 2 },
      questions: ['q_dead_wheels', 'q_push_forward_x', 'q_spin_drift', 'q_uses_pinpoint', 'q_drift_still', 'q_pods_planted'],
    },
    // vision
    {
      id: 'apriltag', area: 'vision', icon: 'fa-eye',
      title: 'AprilTags aren\'t detected or are unreliable',
      sub: 'Missed detections, short range, or wrong distance.',
      keywords: 'apriltag april tag detect detection not detecting camera vision range distance blur',
      causes: { exposure_blur: 4, decimation_range: 3, camera_calibration: 2, camera_port_power: 1.5, vision_cpu: 1 },
      questions: ['q_detect_still_only', 'q_detect_close_only', 'q_pose_wrong', 'q_camera_disappears', 'q_ground_strap', 'q_camera_running'],
    },
    {
      id: 'camera_missing', area: 'vision', icon: 'fa-camera',
      title: 'Camera or Limelight isn\'t detected',
      sub: 'Not found in code, drops out, or returns nothing.',
      keywords: 'camera not detected webcam limelight missing not found disappears no results',
      causes: { camera_port_power: 4, limelight_setup: 3, hw_name_mismatch: 2.5, esd: 1.5 },
      questions: ['q_limelight', 'q_limelight_start', 'q_error_device_name', 'q_camera_disappears', 'q_ground_strap'],
    },
    // auto
    {
      id: 'auto_inconsistent', area: 'auto', icon: 'fa-route',
      title: 'Autonomous is different every run',
      sub: 'Works once, then misses. Ends in a different spot each time.',
      keywords: 'autonomous auto inconsistent different every time unreliable random misses sometimes works',
      causes: { timed_moves: 4, start_position: 3, accel_slip: 2.5, battery_low: 2, drive_encoder_slip: 2, localization_first: 2, pod_contact: 1 },
      questions: ['q_auto_sleep', 'q_start_jig', 'q_dead_wheels', 'q_full_power_start', 'q_fresh_battery', 'q_path_follower', 'q_localization_test'],
    },
    {
      id: 'follower', area: 'auto', icon: 'fa-bars-staggered',
      title: 'Path follower overshoots, oscillates, or runs away',
      sub: 'Pedro Pathing / Road Runner misbehaves while following a path.',
      keywords: 'pedro pathing road runner roadrunner follower overshoot oscillates runs away tuning path following infinitely',
      causes: { localization_first: 5, odo_directions: 3, motor_direction: 3, follower_gains: 3, odo_offsets: 2, battery_low: 1 },
      questions: ['q_localization_test', 'q_push_forward_x', 'q_wheels_on_stand', 'q_jitter_overshoot', 'q_spin_drift', 'q_fresh_battery'],
    },
  ];

  // REV status LED patterns (REV docs, Control Hub on RC app 6.0+, Expansion Hub firmware 1.7.0+)
  window.DOCTOR.led = [
    { color: 'green', pattern: 'solid', hub: 'Control or Expansion Hub', title: 'All good', meaning: 'Powered and talking to the Robot Controller. On an Expansion Hub you\'ll also see one or more quick blue blinks every ~5 seconds — the number of blinks is its address (2 by default).', tone: 'ok' },
    { color: 'blue', pattern: 'solid', hub: 'Control or Expansion Hub', title: 'Waiting', meaning: 'Powered with the battery above 7 V, but not talking yet. Normal while booting. On a Control Hub, solid blue for more than 30 seconds means the Robot Controller isn\'t talking to the hub — update the OS and firmware with the REV Hardware Client.', tone: 'warn', symptom: 'cant_connect' },
    { color: 'blue', pattern: 'blinking', hub: 'Control or Expansion Hub', title: 'Communication timed out', meaning: 'The keep-alive timed out: the hub lost contact with the Robot Controller. It clears when communication comes back. Check cables, power, and whether your code is stalling.', tone: 'bad', symptom: 'disconnect' },
    { color: 'orange', pattern: 'blinking', hub: 'Control or Expansion Hub', title: 'Battery under 7 V', meaning: 'The hub sees less than 7 V — the battery is flat, unplugged (USB power only), or the connection is bad. Clears above 7 V.', tone: 'bad', symptom: 'battery' },
    { color: 'magenta', pattern: 'blinking', hub: 'Control Hub', title: 'Switched to 5 GHz', meaning: 'The Wi-Fi reset button was pressed and the Wi-Fi band changed to 5 GHz.', tone: 'info' },
    { color: 'yellow', pattern: 'blinking', hub: 'Control Hub', title: 'Switched to 2.4 GHz', meaning: 'The Wi-Fi reset button was pressed and the Wi-Fi band changed to 2.4 GHz.', tone: 'info' },
    { color: 'off', pattern: 'off', hub: 'Control or Expansion Hub', title: 'No light at all', meaning: 'No power reaching the hub: check the switch, the battery (and its 20 A fuse), and the XT30 connections. On an Expansion Hub that stays dark after a failed update, REV suggests reflashing firmware.', tone: 'bad', symptom: 'reboots' },
  ];

  // pre-match checkup (FIRST best practices, REV, GM0)
  window.DOCTOR.checkup = [
    { group: 'Power', items: [
      'Battery fully charged and labeled — shows well above 12 V on the Driver Station at rest',
      'Battery strapped down, cable away from sharp screws',
      'Every XT30 and the battery plug click in firmly — no wiggle, no hot glue',
      'Spare charged battery and a spare 20 A fuse in the pit',
    ] },
    { group: 'Wiring', items: [
      'Motor, servo, and encoder plugs pushed all the way in',
      'Servo extensions clipped or taped together',
      'USB cables strain-relieved; camera in the USB 3.0 port',
      'Grounding strap from a spare XT30 port to the frame',
      'No wires near wheels, chains, or pinch points',
    ] },
    { group: 'Mechanical', items: [
      'Wheels spin freely by hand; no rubbing',
      'Chain and belts tensioned, nothing skipping',
      'Shaft collars and hubs tight — marker lines still lined up',
      'Mechanisms move smoothly through their full range',
      'Nothing loose: give the robot a firm shake and listen',
    ] },
    { group: 'Software & Driver Station', items: [
      'Driver Station charged and sleep set to 10–30 minutes',
      'Driver Station has no other saved Wi-Fi networks',
      'Correct configuration is active',
      'Gamepads assigned (START+A / START+B), sticks centered when plugged in, F310 MODE light off',
      'Autonomous selected and robot lined up the same way as practice',
      'IMU re-zero button works',
    ] },
  ];
})();
