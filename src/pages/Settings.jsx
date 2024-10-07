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

  const [settingsSavedFacilities, setSettingsSavedFacilities] = useState();

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
    console.log(savedFacilities);
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
    <div className="h-screen w-screen flex flex-col overflow-x-hidden overflow-hidden font-roboto">
      <Navbar />
      <div className="flex items-center h-screen place-content-center bg-slate-100">
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 p-4">
          {savedFacilities.map((facility, index) => (
            <div
              key={index}
              className="flex flex-col items-center bg-slate-600 p-5 rounded-lg shadow-lg"
            >
              <label htmlFor="api" className="w-64">
                API Key
              </label>
              <input
                type="text"
                className="w-64"
                value={facility.api}
                disabled
              />

              <label htmlFor="apiSecret" className="w-64 mt-2">
                API Secret
              </label>
              <input
                type="text"
                className="w-64"
                value={facility.apiSecret}
                disabled
              />

              <label htmlFor="client" className="w-64 mt-2">
                Client ID
              </label>
              <input
                type="text"
                className="w-64"
                value={facility.client}
                disabled
              />

              <label htmlFor="clientSecret" className="w-64  mt-2">
                Client Secret
              </label>
              <input
                type="text"
                className="w-64"
                value={facility.clientSecret}
                disabled
              />

              <label htmlFor="environment" className="w-64  mt-2">
                Environment
              </label>
              <input
                type="text"
                className="w-64"
                value={facility.environment}
                disabled
              />
            </div>
          ))}

          <div className="flex flex-col items-center bg-slate-600 p-5 rounded-lg shadow-lg">
            <label htmlFor="api" className="w-64 mt-2">
              API Key
            </label>
            <input
              type="text"
              className="w-64"
              value={api}
              onChange={(e) => setApi(e.target.value)}
            />

            <label htmlFor="apiSecret" className="w-64 mt-2">
              API Secret
            </label>
            <input
              type="text"
              className="w-64"
              value={apiSecret}
              onChange={(e) => setApiSecret(e.target.value)}
            />

            <label htmlFor="client" className="w-64 mt-2">
              Client ID
            </label>
            <input
              type="text"
              className="w-64"
              value={client}
              onChange={(e) => setClient(e.target.value)}
            />

            <label htmlFor="clientSecret" className="w-64  mt-2">
              Client Secret
            </label>
            <input
              type="text"
              className="w-64"
              value={clientSecret}
              onChange={(e) => setClientSecret(e.target.value)}
            />

            <div className="flex flex-col">
              <label htmlFor="environment" className="w-64  mt-2">
                Environment
              </label>
              <select
                value={environment}
                onChange={(e) => setEnvironment(e.target.value)}
                className="w-64 p-0.5"
              >
                <option value="">--Select an Environment--</option>
                <option value="-dev">Development</option>
                <option value="-qa">QA</option>
                <option value="cia-stg-1.aws.">Staging</option>
                <option value="">Production</option>
              </select>
            </div>

            <button
              onClick={submitNewFacility}
              className="m-4 bg-green-400 w-36"
            >
              Submit
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
