import { useState, useEffect } from "react";
import { FaCircleCheck } from "react-icons/fa6";
import { MdOutlineError } from "react-icons/md";
import toast from "react-hot-toast";
import InputBox from "../../../components/UI/InputBox";
import PropTypes from "prop-types";

AddAuthentication.propTypes = {
  isOpen: PropTypes.bool.isRequired, // Controls modal visibility
  onClose: PropTypes.func.isRequired, // Function to close the modal
  onSubmit: PropTypes.func.isRequired, // Function to submit the new authentication
  handleNewLogin: PropTypes.func.isRequired, // Function to validate credentials
};

export default function AddAuthentication({
  isOpen,
  onClose,
  onSubmit,
  handleNewLogin,
}) {
  const [name, setName] = useState("");
  const [api, setApi] = useState("");
  const [apiSecret, setApiSecret] = useState("");
  const [client, setClient] = useState("");
  const [clientSecret, setClientSecret] = useState("");
  const [environment, setEnvironment] = useState("-");
  const [isAuthenticated, setIsAuthenticated] = useState(null);

  useEffect(() => {
    const allFilled =
      api && apiSecret && client && clientSecret && environment !== "-";
    if (allFilled) {
      handleNewLogin(environment, { api, apiSecret, client, clientSecret })
        .then(() => setIsAuthenticated(true))
        .catch(() => setIsAuthenticated(false));
    } else {
      setIsAuthenticated(null);
    }
  }, [api, apiSecret, client, clientSecret, environment]);

  const handleSubmit = async () => {
    if (isAuthenticated) {
      await onSubmit({
        api,
        apiSecret,
        client,
        clientSecret,
        environment,
        name: name.trim() || "",
      });
      onClose();
      return { message: "Authentication added successfully!" };
    } else {
      throw new Error("Please authenticate before submitting.");
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      <div className="bg-white dark:bg-darkSecondary w-full max-w-lg rounded shadow-lg relative">
        <div className="pl-5 border-b-2 border-b-yellow-500 flex justify-between items-center h-10">
          <div className="flex items-center">
            <h2 className="ml-2 text-lg font-bold">Add Authentication</h2>
          </div>
          <button
            onClick={onClose}
            className="bg-gray-100 h-full px-5 cursor-pointer rounded-tr text-gray-600 dark:text-white dark:bg-gray-800 dark:hover:hover:bg-red-500 hover:bg-red-500 transition duration-300 ease-in-out"
          >
            x
          </button>
        </div>
        <div className="grid grid-cols-1 gap-4 p-3">
          <InputBox
            onchange={(e) => setName(e.target.value)}
            value={name}
            placeholder={"Optional Name"}
            type={"text"}
          />
          <InputBox
            onchange={(e) => setApi(e.target.value)}
            value={api}
            placeholder={"API Key"}
            type={"text"}
          />
          <InputBox
            onchange={(e) => setApiSecret(e.target.value)}
            value={apiSecret}
            placeholder={"API Secret"}
            type={"text"}
          />
          <InputBox
            onchange={(e) => setClient(e.target.value)}
            value={client}
            placeholder={"Client ID"}
            type={"text"}
          />
          <InputBox
            onchange={(e) => setClientSecret(e.target.value)}
            value={clientSecret}
            placeholder={"Client Secret"}
            type={"text"}
          />
          <select
            className="rounded-lg border border-zinc-300 dark:border-border dark:bg-darkNavSecondary p-3 text-sm w-full"
            value={environment}
            onChange={(e) => setEnvironment(e.target.value)}
          >
            <option value="-">-- Select Environment --</option>
            <option value="">Production</option>
            <option value="-dev">Development</option>
            <option value="-qa">QA</option>
            <option value="cia-stg-1.aws.">Staging</option>
          </select>
        </div>
        {/* Status */}
        <div className="flex items-center space-x-2 p-3">
          {isAuthenticated === true && (
            <FaCircleCheck className="text-green-500" />
          )}
          {isAuthenticated === false && (
            <MdOutlineError className="text-red-500" />
          )}
          <span className="text-sm text-gray-700 dark:text-gray-300">
            {isAuthenticated === true
              ? "Credentials are valid"
              : isAuthenticated === false
              ? "Invalid credentials"
              : "Enter credentials to continue..."}
          </span>
        </div>

        {/* Buttons */}
        <div className="p-3 flex justify-end space-x-2">
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-lg border border-gray-300 bg-white hover:bg-gray-100 dark:bg-darkNavSecondary dark:hover:bg-darkPrimary text-sm cursor-pointer"
          >
            Cancel
          </button>
          <button
            onClick={() =>
              toast.promise(handleSubmit, {
                loading: "Authenticating...",
                success: (data) => {
                  return <span>{data.message}</span>;
                },
                error: (error) => {
                  return <span>{error.message}</span>;
                },
              })
            }
            disabled={!isAuthenticated}
            className={`px-4 py-2 rounded-lg text-sm text-white ${
              isAuthenticated
                ? "bg-green-500 hover:bg-green-600 cursor-pointer"
                : "bg-green-300 cursor-not-allowed"
            }`}
          >
            Submit
          </button>
        </div>
      </div>
    </div>
  );
}
