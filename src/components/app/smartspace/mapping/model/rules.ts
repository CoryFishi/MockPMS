// Coverage rules from the installation manuals. analyzePlan reads these; the
// Rules tab shows them read-only.

export const RULES = {
  /** OpenNet ER/AP to ER/AP with clear line of sight (OpenNet manual p15, rule 2). */
  OPENNET_LOS_FT: 656,
  /** OpenNet ER/AP to ER/AP without line of sight (rule 3). */
  OPENNET_NLOS_FT: 328,
  /** SmartLock reach across, along the door's facing (SmartLock S manual p2). */
  LOCK_ACROSS_FT: 200,
  /** SmartLock reach laterally, along the row of doors. */
  LOCK_LATERAL_FT: 55,
  /** SmartMotion reach (SmartMotion manual p2, p7). */
  MOTION_FT: 100,
  /** Sensor reach multiplier when a link crosses a drawn wall. */
  WALL_FACTOR: 0.5,
  /** Smart devices per ER/AP (rule 4, "approximately"). */
  AP_CAPACITY: 100,
  /** OpenNet devices each ER/AP must reach (rule 1). */
  AP_MIN_OPENNET_NEIGHBOURS: 2,
  /** Smart devices with line of sight each ER/AP should have (rule 5). */
  AP_MIN_LOS_SENSORS: 2,
  /** Sensors each SmartLock needs in range when no ER/AP is (SmartLock p8, p11). */
  LOCK_MIN_SENSOR_NEIGHBOURS: 2,
  /** Sensors or ER/APs each SmartMotion needs in range (SmartMotion p7). */
  MOTION_MIN_NEIGHBOURS: 1,
  /** PoE+ budget per ER/AP (OpenNet p8). */
  POE_WATTS: 30,
} as const;

export interface RuleDescription {
  label: string;
  value: string;
  source: string;
}

export const RULE_DESCRIPTIONS: RuleDescription[] = [
  { label: "Edge Router / Access Point range, line of sight", value: `${RULES.OPENNET_LOS_FT} ft (200 m)`, source: "OpenNet manual p15, rule 2" },
  { label: "Edge Router / Access Point range, no line of sight", value: `${RULES.OPENNET_NLOS_FT} ft (100 m)`, source: "OpenNet manual p15, rule 3" },
  { label: "Each Edge Router / Access Point reaches", value: `≥ ${RULES.AP_MIN_OPENNET_NEIGHBOURS} other OpenNet devices`, source: "OpenNet manual p15, rule 1" },
  { label: "Smart devices per Edge Router / Access Point", value: `~${RULES.AP_CAPACITY} (warning above)`, source: "OpenNet manual p15, rule 4" },
  { label: "Line-of-sight smart devices per Edge Router / Access Point", value: `≥ ${RULES.AP_MIN_LOS_SENSORS} (warning below)`, source: "OpenNet manual p15, rule 5" },
  { label: "SmartLock range", value: `${RULES.LOCK_ACROSS_FT} ft across × ${RULES.LOCK_LATERAL_FT} ft laterally`, source: "SmartLock S manual p2" },
  { label: "Each SmartLock reaches", value: `≥ ${RULES.LOCK_MIN_SENSOR_NEIGHBOURS} sensors or an Edge Router / Access Point`, source: "SmartLock S manual p8, p11" },
  { label: "SmartMotion range", value: `${RULES.MOTION_FT} ft (30 m)`, source: "SmartMotion manual p2" },
  { label: "Each SmartMotion reaches", value: `≥ ${RULES.MOTION_MIN_NEIGHBOURS} sensor or an Edge Router / Access Point`, source: "SmartMotion manual p7" },
  { label: "Sensor range through a drawn wall", value: `× ${RULES.WALL_FACTOR}`, source: "Planning assumption" },
  { label: "PoE+ budget", value: `${RULES.POE_WATTS} W per Edge Router / Access Point`, source: "OpenNet manual p8" },
];
