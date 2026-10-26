// Coverage rules. Neighbour/capacity rules come from the installation manuals;
// the ranges are conservative planning values, well under the manuals' figures.
// analyzePlan reads these; the Rules tab shows them read-only.

export const RULES = {
  /** OpenNet ER/AP to ER/AP with clear line of sight (manual: 656 ft / 200 m). */
  OPENNET_LOS_FT: 250,
  /** OpenNet ER/AP to ER/AP without line of sight (manual: 328 ft / 100 m). */
  OPENNET_NLOS_FT: 75,
  /** SmartLock reach across, along the door's facing (manual: 200 ft / 60 m). */
  LOCK_ACROSS_FT: 100,
  /** SmartLock reach laterally, along the row of doors (manual: 55 ft / 16 m). */
  LOCK_LATERAL_FT: 25,
  /** SmartMotion reach (manual: 100 ft / 30 m). */
  MOTION_FT: 50,
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
  { label: "Edge Router / Access Point range, line of sight", value: `${RULES.OPENNET_LOS_FT} ft`, source: "Planning value (manual: 656 ft / 200 m)" },
  { label: "Edge Router / Access Point range, no line of sight", value: `${RULES.OPENNET_NLOS_FT} ft`, source: "Planning value (manual: 328 ft / 100 m)" },
  { label: "Each Edge Router / Access Point reaches", value: `≥ ${RULES.AP_MIN_OPENNET_NEIGHBOURS} other OpenNet devices`, source: "OpenNet manual p15, rule 1" },
  { label: "Smart devices per Edge Router / Access Point", value: `~${RULES.AP_CAPACITY} (warning above)`, source: "OpenNet manual p15, rule 4" },
  { label: "Line-of-sight smart devices per Edge Router / Access Point", value: `≥ ${RULES.AP_MIN_LOS_SENSORS} (warning below)`, source: "OpenNet manual p15, rule 5" },
  { label: "SmartLock range", value: `${RULES.LOCK_ACROSS_FT} ft across × ${RULES.LOCK_LATERAL_FT} ft laterally`, source: "Planning value (manual: 200 × 55 ft)" },
  { label: "Each SmartLock reaches", value: `≥ ${RULES.LOCK_MIN_SENSOR_NEIGHBOURS} sensors or an Edge Router / Access Point`, source: "SmartLock S manual p8, p11" },
  { label: "SmartMotion range", value: `${RULES.MOTION_FT} ft`, source: "Planning value (manual: 100 ft / 30 m)" },
  { label: "Each SmartMotion reaches", value: `≥ ${RULES.MOTION_MIN_NEIGHBOURS} sensor or an Edge Router / Access Point`, source: "SmartMotion manual p7" },
  { label: "Sensor range through a drawn wall", value: `× ${RULES.WALL_FACTOR}`, source: "Planning assumption" },
  { label: "PoE+ budget", value: `${RULES.POE_WATTS} W per Edge Router / Access Point`, source: "OpenNet manual p8" },
];
