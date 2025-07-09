import { useNavigate } from "react-router-dom";
import { useState, useEffect } from "react";

export default function NotFound() {
  const navigate = useNavigate();
  const [show404, setShow404] = useState(false);

  useEffect(() => {
    // Show the 404 content after 1 second
    const timer = setTimeout(() => {
      setShow404(true);
    }, 1000);

    // Cleanup the timer
    return () => clearTimeout(timer);
  }, []);

  const handleRedirect = () => {
    navigate("/login");
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gray-50 dark:bg-darkPrimary text-gray-900 dark:text-gray-100">
      {show404 ? (
        // 404 content
        <>
          <h1 className="text-6xl font-bold mb-4">404</h1>
          <p className="text-2xl mb-6">Page Not Found</p>
          <p className="mb-8">
            The page you&apos;re looking for doesn&apos;t exist.
          </p>
          <button
            onClick={handleRedirect}
            className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-500 focus:outline-hidden"
          >
            Go to Login
          </button>
        </>
      ) : (
        // Spinner
        <div className="animate-spin rounded-full h-16 w-16 border-t-4 border-blue-500"></div>
      )}
    </div>
  );
}
