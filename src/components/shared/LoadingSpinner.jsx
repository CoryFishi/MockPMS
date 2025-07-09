import PropTypes from "prop-types";

LoadingSpinner.propTypes = {
  loadingText: PropTypes.string, // Optional text to display below the spinner
};

export default function LoadingSpinner({ loadingText }) {
  return (
    <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/50 z-30 min-h-auto">
      <div className="w-16 h-16 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
      {loadingText && <p className="mt-4">{loadingText}</p>}
    </div>
  );
}
