import { RULE_DESCRIPTIONS } from "@views/smartspace/mapping/model/rules";

export default function RulesPanel() {
  return (
    <div className="space-y-3 p-4 text-sm">
      <p className="rounded bg-zinc-200 p-2 text-xs text-zinc-700 dark:bg-zinc-800 dark:text-zinc-300">
        These checks use the ranges and rules in the installation manuals. They are a planning aid, not a
        guarantee: the manuals give no signal-strength figures, and real coverage depends on the building. Confirm
        every device shows Online in the Control Center during install.
      </p>
      <ul className="space-y-2">
        {RULE_DESCRIPTIONS.map((rule) => (
          <li key={rule.label}>
            <div>{rule.label}</div>
            <div className="font-semibold">{rule.value}</div>
            <div className="text-xs text-zinc-500">{rule.source}</div>
          </li>
        ))}
      </ul>
    </div>
  );
}
