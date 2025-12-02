import { FaScroll } from "react-icons/fa6";
import { useAuth } from "@context/AuthProvider";
import axios from "axios";
import { useState } from "react";
import ScriptConfirmation from "@features/pms/modals/ScriptConfirmation";
import GeneralButton from "@components/UI/GeneralButton";
import { addEvent } from "@hooks/supabase";

export default function Scripts() {
  const { currentFacility, user } = useAuth();
  const [logs, setLogs] = useState([]);
  const [message, setMessage] = useState("");
  const [units, setUnits] = useState("");
  const [isUnitModalOpen, setIsUnitModalOpen] = useState(false);
  const [isTenantModalOpen, setIsTenantModalOpen] = useState(false);

  const importUnits = async (units) => {
    if (!units) return;
    var tokenStageKey = "";
    var tokenEnvKey = "";
    if (currentFacility.environment === "cia-stg-1.aws.") {
      tokenStageKey = "cia-stg-1.aws.";
    } else {
      tokenEnvKey = currentFacility.environment;
    }
    const unitNumbersArray = units.split(",").flatMap((unit) => {
      unit = unit.trim();
      if (unit.includes("-")) {
        const [start, end] = unit.split("-").map((u) => u.trim());

        const prefixStart = start.match(/^[^\d]+/g)?.[0] || "";
        const prefixEnd = end.match(/^[^\d]+/g)?.[0] || "";

        const numStartStr = start.replace(prefixStart, "");
        const numEndStr = end.replace(prefixEnd, "");

        const numStart = parseInt(numStartStr);
        const numEnd = parseInt(numEndStr);
        const digitCount = numStartStr.length;

        if (
          prefixStart === prefixEnd &&
          !isNaN(numStart) &&
          !isNaN(numEnd) &&
          numStart <= numEnd &&
          numEnd - numStart < 1000
        ) {
          return Array.from({ length: numEnd - numStart + 1 }, (_, i) => {
            const num = (numStart + i).toString().padStart(digitCount, "0");
            return `${prefixStart}${num}`;
          });
        }

        return [unit];
      }

      return [unit];
    });

    await unitNumbersArray.map(async (unitNumber) => {
      const data = {
        unitNumber: unitNumber,
        extendedData: {
          additionalProp1: null,
          additionalProp2: null,
          additionalProp3: null,
        },
        suppressCommands: false,
      };
      // API call
      const config = {
        method: "post",
        url: `https://accesscontrol.${tokenStageKey}insomniaccia${tokenEnvKey}.com/facilities/${currentFacility.id}/units`,
        headers: {
          Authorization: "Bearer " + currentFacility?.token?.access_token,
          accept: "application/json",
          "api-version": "2.0",
          "Content-Type": "application/json",
        },
        data: data,
      };
      axios(config)
        .then(function (response) {
          const r = response.data;
          setLogs((prevLogs) => [
            ...prevLogs,
            `${new Date().toLocaleString()}: Unit ${r.unitNumber} (${
              r.id
            }) imported sucessfully`,
          ]);
        })
        .catch(function (error) {
          setLogs((prevLogs) => [
            ...prevLogs,
            `${new Date().toLocaleString()}: Unit ${unitNumber} failed to import! ${
              error.response.data.UnitNumber
            }`,
          ]);
          throw error;
        });
    });

    await addEvent(
      "Import Units",
      `${user.email} imported units at facility ${currentFacility.name}, ${currentFacility.id}`,
      true
    );
    setIsUnitModalOpen(false);
  };

  const importUnitsWTenants = async (units) => {
    if (!units) return;
    const handleRent = async (unit) => {
      var tokenStageKey = "";
      var tokenEnvKey = "";
      if (currentFacility.environment === "cia-stg-1.aws.") {
        tokenStageKey = "cia-stg-1.aws.";
      } else {
        tokenEnvKey = currentFacility.environment;
      }
      const data = {
        timeGroupId: 0,
        accessProfileId: 0,
        unitId: unit.id,
        accessCode:
          Math.floor(Math.random() * (999999999 - 100000 + 1)) + 100000,
        lastName: "Tenant",
        firstName: "Temporary",
        email: "automations@temp.com",
        mobilePhoneNumber: "9996666999",
        isTenant: true,
        extendedData: {
          additionalProp1: null,
          additionalProp2: null,
          additionalProp3: null,
        },
        suppressCommands: false,
      };

      const config = {
        method: "post",
        url: `https://accesscontrol.${tokenStageKey}insomniaccia${tokenEnvKey}.com/facilities/${currentFacility.id}/visitors`,

        headers: {
          Authorization: "Bearer " + currentFacility?.token?.access_token,
          accept: "application/json",
          "api-version": "2.0",
          "Content-Type": "application/json-patch+json",
        },
        data: data,
      };

      return axios(config)
        .then(async function (response) {
          const r = response.data.visitor;
          setLogs((prevLogs) => [
            ...prevLogs,
            `${new Date().toLocaleString()}: Tenant ${r.id} (Unit ${
              r.unitNumber
            }) imported sucessfully`,
          ]);
          return response;
        })
        .catch(function (error) {
          throw error;
        });
    };
    var tokenStageKey = "";
    var tokenEnvKey = "";
    if (currentFacility.environment === "cia-stg-1.aws.") {
      tokenStageKey = "cia-stg-1.aws.";
    } else {
      tokenEnvKey = currentFacility.environment;
    }
    const unitNumbersArray = units.split(",").flatMap((unit) => {
      unit = unit.trim();
      if (unit.includes("-")) {
        const [start, end] = unit.split("-").map((u) => u.trim());

        const prefixStart = start.match(/^[^\d]+/g)?.[0] || "";
        const prefixEnd = end.match(/^[^\d]+/g)?.[0] || "";

        const numStartStr = start.replace(prefixStart, "");
        const numEndStr = end.replace(prefixEnd, "");

        const numStart = parseInt(numStartStr);
        const numEnd = parseInt(numEndStr);
        const digitCount = numStartStr.length;

        if (
          prefixStart === prefixEnd &&
          !isNaN(numStart) &&
          !isNaN(numEnd) &&
          numStart <= numEnd &&
          numEnd - numStart < 1000
        ) {
          return Array.from({ length: numEnd - numStart + 1 }, (_, i) => {
            const num = (numStart + i).toString().padStart(digitCount, "0");
            return `${prefixStart}${num}`;
          });
        }

        return [unit];
      }

      return [unit];
    });

    await unitNumbersArray.map(async (unitNumber) => {
      const data = {
        unitNumber: unitNumber,
        extendedData: {
          additionalProp1: null,
          additionalProp2: null,
          additionalProp3: null,
        },
        suppressCommands: false,
      };
      // API call
      const config = {
        method: "post",
        url: `https://accesscontrol.${tokenStageKey}insomniaccia${tokenEnvKey}.com/facilities/${currentFacility.id}/units`,
        headers: {
          Authorization: "Bearer " + currentFacility?.token?.access_token,
          accept: "application/json",
          "api-version": "2.0",
          "Content-Type": "application/json",
        },
        data: data,
      };
      axios(config)
        .then(function (response) {
          const r = response.data;
          setLogs((prevLogs) => [
            ...prevLogs,
            `${new Date().toLocaleString()}: Unit ${r.unitNumber} (${
              r.id
            }) imported sucessfully`,
          ]);
          handleRent(r);
        })
        .catch(function (error) {
          setLogs((prevLogs) => [
            ...prevLogs,
            `${new Date().toLocaleString()}: Unit ${unitNumber} failed to import! ${
              error.response.data.UnitNumber
            }`,
          ]);
          throw error;
        });
    });

    await addEvent(
      "Import Units",
      `${user.email} imported units with tenants at facility ${currentFacility.name}, ${currentFacility.id}`,
      true
    );

    setIsTenantModalOpen(false);
  };

  return (
    <div className="relative overflow-auto h-full dark:text-white dark:bg-darkPrimary">
      {isUnitModalOpen && (
        <ScriptConfirmation
          title={"Confirm Unit Creation"}
          message={message}
          handleSubmit={() => importUnits(units)}
          setIsModalOpen={setIsUnitModalOpen}
        />
      )}
      {isTenantModalOpen && (
        <ScriptConfirmation
          title={"Confirm Unit W/ Tenant Creation"}
          message={message}
          handleSubmit={() => importUnitsWTenants(units)}
          setIsModalOpen={setIsTenantModalOpen}
        />
      )}
      <div className="flex h-12 bg-gray-200 items-center dark:border-border dark:bg-darkNavPrimary">
        <div className="ml-5 flex items-center text-sm">
          <FaScroll className="text-lg" />
          &ensp; Scripts
        </div>
      </div>
      <div className="w-full h-fit p-5 flex flex-col rounded-lg pb-10 gap-3">
        <h2>
          You currently have facility{" "}
          <span className="font-bold">{currentFacility.name}</span> selected
        </h2>
        <h3>Units</h3>
        <div className="flex flex-wrap gap-2">
          {[
            {
              title: `Import 100 A Units`,
              units: "A0001-A0100",
            },
            {
              title: `Import 100 B Units`,
              units: "B0001-B0100",
            },
            {
              title: `Import 100 C Units`,
              units: "C0001-C0100",
            },
            {
              title: `Import 100 D Units`,
              units: "D0001-D0100",
            },
            {
              title: `Import 100 E Units`,
              units: "E0001-E0100",
            },
            {
              title: `Import 100 F Units`,
              units: "F0001-F0100",
            },
            {
              title: `Import 1000 A Units`,
              units: "A0001-A1000",
            },
            {
              title: `Import 1000 B Units`,
              units: "B0001-B1000",
            },
            {
              title: `Import 1000 C Units`,
              units: "C0001-C1000",
            },
            {
              title: `Import 1000 D Units`,
              units: "D0001-D1000",
            },
            {
              title: `Import 1000 E Units`,
              units: "E0001-E1000",
            },
            {
              title: `Import 1000 F Units`,
              units: "F0001-F1000",
            },
          ].map((unit, idx) => {
            return (
              <GeneralButton
                key={idx}
                onclick={() => {
                  setUnits(unit.units);
                  setMessage(unit.title);
                  setIsUnitModalOpen(true);
                }}
                className="bg-yellow-500 hover:bg-amber-500"
                text={unit.title}
              />
            );
          })}
        </div>
        <h3>Units with Tenants</h3>
        <div className="flex flex-wrap gap-2">
          {[
            {
              title: `Import 100 A Units w/ tenants`,
              units: "A0001-A0100",
            },
            {
              title: `Import 100 B Units w/ tenants`,
              units: "B0001-B0100",
            },
            {
              title: `Import 100 C Units w/ tenants`,
              units: "C0001-C0100",
            },
            {
              title: `Import 100 D Units w/ tenants`,
              units: "D0001-D0100",
            },
            {
              title: `Import 100 E Units w/ tenants`,
              units: "E0001-E0100",
            },
            {
              title: `Import 100 F Units w/ tenants`,
              units: "F0001-F0010",
            },
            {
              title: `Import 1000 A Units w/ tenants`,
              units: "A0001-A1000",
            },
            {
              title: `Import 1000 B Units w/ tenants`,
              units: "B0001-B1000",
            },
            {
              title: `Import 1000 C Units w/ tenants`,
              units: "C0001-C1000",
            },
            {
              title: `Import 1000 D Units w/ tenants`,
              units: "D0001-D1000",
            },
            {
              title: `Import 1000 E Units w/ tenants`,
              units: "E0001-E1000",
            },
            {
              title: `Import 1000 F Units w/ tenants`,
              units: "F0001-F1000",
            },
          ].map((unit, idx) => {
            return (
              <GeneralButton
                key={idx}
                className="bg-yellow-500 hover:bg-amber-500"
                onclick={() => {
                  setUnits(unit.units);
                  setMessage(unit.title);
                  setIsTenantModalOpen(true);
                }}
                text={unit.title}
              />
            );
          })}
        </div>
        <h2>Log of Events</h2>
        <div className="w-full flex border rounded-2xl max-h-96 min-h-24 flex-col p-2 overflow-y-auto dark:border-border">
          {logs.map((log, idx) => (
            <div
              key={idx}
              className={`w-full ${log.includes("fail") ? "text-red-500" : ""}`}
            >
              {log}
            </div>
          ))}
          {logs.length < 1 && (
            <div className="w-full text-center">No events recieved...</div>
          )}
        </div>
      </div>
    </div>
  );
}
