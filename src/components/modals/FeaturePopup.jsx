import { useEffect, useState } from "react";
import New from "../../assets/New.png";

export default function FeaturePopup() {
  const [showPopup, setShowPopup] = useState(false);

  useEffect(() => {
    const hasSeenPopup = localStorage.getItem("hasSeenFeaturePopup");
    if (!hasSeenPopup) {
      setShowPopup(true);
    }
  }, []);

  const handleDismiss = () => {
    // Dismiss for now (session only)
    setShowPopup(false);
  };

  const handleDismissForever = () => {
    // Dismiss forever (localStorage flag)
    localStorage.setItem("hasSeenFeaturePopup", "true");
    setShowPopup(false);
  };

  if (!showPopup) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div
        className="bg-white dark:bg-zinc-800 p-6 rounded-lg shadow-xl w-[900px] text-center items-center justify-center
      flex flex-col"
      >
        <h2 className="text-2xl font-bold mb-3">🎉 New Platform!</h2>
        <img src={New} className="h-96"></img>
        <p className="text-md my-3">
          We've decided to go to a more structured platform. We will be
          converting this platform in the following few weeks. This will allow
          us to add more features and make the platform more powerful. If you
          would like to see the new platform before this website is fully
          converted, please check out this
          <a
            href="https://propertymanager-dev.netlify.app/login"
            target="_blank"
            rel="noopener noreferrer"
            className="text-teal-500 hover:underline"
          >
            {" "}
            Link.
          </a>
        </p>
        <p>
          Any questions or concerns please reach out to Cory on teams or via
          email cfishburn@opentechalliance.com
        </p>
        <div className="flex justify-between gap-4 mt-6 w-full">
          <button
            onClick={handleDismissForever}
            className="px-6 py-2 bg-zinc-300 dark:bg-zinc-700 text-black dark:text-white rounded-md hover:bg-zinc-400 dark:hover:bg-zinc-600 transition"
          >
            Dismiss Forever
          </button>
          <button
            onClick={handleDismiss}
            className="px-6 py-2 bg-teal-500 text-white rounded-md hover:bg-teal-600 transition"
          >
            Dismiss
          </button>
        </div>
      </div>
    </div>
  );
}
