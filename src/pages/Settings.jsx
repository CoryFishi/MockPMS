import { useState, useEffect } from "react";
import Navbar from "../components/Navbar";

export default function Settings({
  setCurrentFacility,
  currentFacility,
  savedFacilities = [],
  setSavedFacilities,
}) {
  // Create state for each input field
  const [api, setApi] = useState("");
  const [apiSecret, setApiSecret] = useState("");
  const [client, setClient] = useState("");
  const [clientSecret, setClientSecret] = useState("");
  const [environment, setEnvironment] = useState("");

  const submitNewFacility = () => {
    // Update the saved facilities state
    setSavedFacilities((prevState) => {
      const updatedFacilities = [
        ...(prevState || []),
        {
          api: api,
          apiSecret: apiSecret,
          client: client,
          clientSecret: clientSecret,
          environment: environment,
        },
      ];

      localStorage.setItem(
        "savedFacilities",
        JSON.stringify(updatedFacilities)
      );
      return updatedFacilities;
    });

    console.log("New saved facilities:", savedFacilities);
  };

  useEffect(() => {
    const storedFacilities = JSON.parse(
      localStorage.getItem("savedFacilities")
    );
    if (Array.isArray(storedFacilities)) {
      setSavedFacilities(storedFacilities);
    } else {
      setSavedFacilities([]);
    }
  }, [setSavedFacilities]);

  return (
    <div className="font-roboto">
      <Navbar />
      <div className="flex flex-col w-full p-5 bg-slate-200 h-full items-center font-roboto">
        <div className="flex flex-col items-center">
          <label htmlFor="api" className="w-96 ml-4 mt-2">
            API Key
          </label>
          <input
            type="text"
            className="w-96 ml-4"
            value={api}
            onChange={(e) => setApi(e.target.value)}
          />

          <label htmlFor="apiSecret" className="w-96 ml-4 mt-2">
            API Secret
          </label>
          <input
            type="text"
            className="w-96 ml-4"
            value={apiSecret}
            onChange={(e) => setApiSecret(e.target.value)}
          />

          <label htmlFor="client" className="w-96 ml-4 mt-2">
            Client ID
          </label>
          <input
            type="text"
            className="w-96 ml-4"
            value={client}
            onChange={(e) => setClient(e.target.value)}
          />

          <label htmlFor="clientSecret" className="w-96 ml-4 mt-2">
            Client Secret
          </label>
          <input
            type="text"
            className="w-96 ml-4"
            value={clientSecret}
            onChange={(e) => setClientSecret(e.target.value)}
          />

          <div className="flex flex-col">
            <label htmlFor="environemnt" className="w-96 ml-4 mt-2">
              Environment
            </label>
            <select
              value={environment}
              onChange={(e) => setEnvironment(e.target.value)}
              className="w-96 ml-4"
            >
              <option value="">--Select an Environment--</option>
              <option value="-dev">Development</option>
              <option value="-qa">QA</option>
              <option value="cia-stg-1.aws.">Staging</option>
              <option value="">Production</option>
            </select>
          </div>

          <button onClick={submitNewFacility} className="m-4 bg-green-400 w-36">
            Submit
          </button>
        </div>
      </div>
    </div>
  );
}
