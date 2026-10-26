import { Link } from "react-router-dom";

const HELP_URL =
  "https://opentechalliancesupport.zendesk.com/hc/en-us/categories/115001966887-OpenTech-IoE";

const itemClass = "w-full p-2 cursor-pointer hover:bg-zinc-900"; // sidebar is dark in both themes

export default function SidebarFooter({ onLogout }: { onLogout: () => void }) {
  return (
    <div className="absolute bottom-0 w-full hidden md:flex justify-between text-sm text-center">
      <Link to="/user-settings" className={itemClass}>
        Settings
      </Link>
      <a href={HELP_URL} target="_blank" rel="noopener noreferrer" className={itemClass}>
        Help
      </a>
      <button type="button" onClick={onLogout} className={itemClass}>
        Logout
      </button>
    </div>
  );
}
