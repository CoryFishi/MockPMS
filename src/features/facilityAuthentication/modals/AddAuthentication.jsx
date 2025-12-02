import { useState, useEffect } from "react";
import { FaCircleCheck } from "react-icons/fa6";
import { MdOutlineError } from "react-icons/md";
import toast from "react-hot-toast";
import InputBox from "@components/UI/InputBox";
import ModalButton from "@components/UI/ModalButton";
import ModalContainer from "@components/UI/ModalContainer";
import SelectOption from "@components/UI/SelectOption";

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
  const [environment, setEnvironment] = useState("");
  const [isAuthenticated, setIsAuthenticated] = useState(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    var allFilled = false;
    if (api && apiSecret && client && clientSecret && environment) {
      allFilled = true;
    } else {
      allFilled = false;
    }
    if (allFilled === true) {
      handleAuthRequest(environment, {
        api,
        apiSecret,
        client,
        clientSecret,
      });
    }
  }, [api, apiSecret, client, clientSecret, environment]);

  const handleAuthRequest = (environment, creds) => {
    setLoading(true);
    handleNewLogin(environment, creds).then((data) => {
      if (data.message) {
        setIsAuthenticated(true);
      } else {
        setIsAuthenticated(false);
      }
      setLoading(false);
    });
  };

  const handleSubmit = async () => {
    if (isAuthenticated) {
      await onSubmit({
        api,
        apiSecret,
        client,
        clientSecret,
        environment: environment === "prod" ? "" : environment,
        name: name.trim() || "",
      });
      onClose();
      return { message: "Authentication added successfully!" };
    } else {
      throw new Error("Please provide valid credentials.");
    }
  };

  if (!isOpen) return null;

  return (
    <ModalContainer
      title="Add Authentication"
      onClose={onClose}
      mainContent={
        <>
          <div className="grid grid-cols-1 gap-4 p-3 min-w-96">
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
              required={true}
            />
            <InputBox
              onchange={(e) => setApiSecret(e.target.value)}
              value={apiSecret}
              placeholder={"API Secret"}
              type={"text"}
              required={true}
            />
            <InputBox
              onchange={(e) => setClient(e.target.value)}
              value={client}
              placeholder={"Client ID"}
              type={"text"}
              required={true}
            />
            <InputBox
              onchange={(e) => setClientSecret(e.target.value)}
              value={clientSecret}
              placeholder={"Client Secret"}
              type={"text"}
              required={true}
            />
            <SelectOption
              value={environment}
              onChange={(e) => setEnvironment(e.target.value)}
              options={[
                { id: "prod", name: "Production" },
                { id: "dev", name: "Development" },
                { id: "qa", name: "QA" },
                { id: "staging", name: "Staging" },
              ]}
              placeholder="Environment"
              required={true}
            />
          </div>
          {/* Status */}
          <div className="flex items-center space-x-2 p-3">
            {loading ? (
              <div className="w-5 h-5 border-4 border-blue-500 border-t-transparent border-solid rounded-full animate-spin"></div>
            ) : isAuthenticated === true ? (
              <FaCircleCheck className="text-green-500" />
            ) : (
              <MdOutlineError className="text-red-500" />
            )}
            <span className="text-sm text-zinc-700 dark:text-zinc-300">
              {loading
                ? " Authenticating..."
                : isAuthenticated === true
                ? "Credentials are valid"
                : isAuthenticated === false
                ? "Invalid credentials"
                : "Enter credentials to continue..."}
            </span>
          </div>
        </>
      }
      responseContent={
        <div className="p-3 flex justify-end space-x-2">
          <ModalButton text="Cancel" onclick={() => onClose()} />
          <ModalButton
            text="Add"
            onclick={() =>
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
          />
        </div>
      }
    />
  );
}
