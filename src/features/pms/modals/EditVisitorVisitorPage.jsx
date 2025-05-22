import axios from "axios";
import toast from "react-hot-toast";
import { useState, useEffect } from "react";
import { MdEdit } from "react-icons/md";
import { useAuth } from "@context/AuthProvider";
import { addEvent } from "@hooks/supabase";
import ModalContainer from "../../../components/UI/ModalContainer";
import InputBox from "@components/UI/InputBox";
import SelectOption from "@components/UI/SelectOption";
import ModalButton from "@components/UI/ModalButton";

export default function EditVisitorVisitorPage({
  setIsEditVisitorModalOpen,
  setVisitors,
  visitor,
}) {
  const [newVisitorData, setNewVisitorData] = useState(visitor);
  const [newVisitorName, setNewVisitorName] = useState({
    firstName: visitor.name.split(" ")[0],
    lastName: visitor.name.split(" ")[1],
  });
  const [timeProfiles, setTimeProfiles] = useState({});
  const [accessProfiles, setAccessProfiles] = useState({});
  const { currentFacility, user } = useAuth();

  const handleTimeProfiles = async () => {
    var tokenStageKey = "";
    var tokenEnvKey = "";
    if (currentFacility.environment === "cia-stg-1.aws.") {
      tokenStageKey = "cia-stg-1.aws.";
    } else {
      tokenEnvKey = currentFacility.environment;
    }

    const config = {
      method: "get",
      url: `https://accesscontrol.${tokenStageKey}insomniaccia${tokenEnvKey}.com/facilities/${currentFacility.id}/timegroups`,
      headers: {
        Authorization: "Bearer " + currentFacility?.token?.access_token,
        accept: "application/json",
        "api-version": "2.0",
      },
    };

    axios(config)
      .then(function (response) {
        setTimeProfiles(response.data);
      })
      .catch(function (error) {
        console.log(error);
      });
  };
  const handleAccessProfiles = async () => {
    var tokenStageKey = "";
    var tokenEnvKey = "";
    if (currentFacility.environment === "cia-stg-1.aws.") {
      tokenStageKey = "cia-stg-1.aws.";
    } else {
      tokenEnvKey = currentFacility.environment;
    }

    const config = {
      method: "get",
      url: `https://accesscontrol.${tokenStageKey}insomniaccia${tokenEnvKey}.com/facilities/${currentFacility.id}/accessprofiles`,
      headers: {
        Authorization: "Bearer " + currentFacility?.token?.access_token,
        accept: "application/json",
        "api-version": "2.0",
      },
    };

    axios(config)
      .then(function (response) {
        setAccessProfiles(response.data);
      })
      .catch(function (error) {
        console.log(error);
      });
  };
  const handleEditVisitor = () => {
    const requiredNames = {
      firstName: "First name",
      lastName: "Last name",
    };
    const requiredFields = {
      code: "Gate code",
      timeGroupId: "Time profile",
      accessProfileId: "Access profile",
    };
    for (const [key, label] of Object.entries(requiredNames)) {
      if (!newVisitorName[key] || newVisitorName[key].trim() === "") {
        toast.error(`${label} is required`);
        return;
      }
    }
    for (const [key, label] of Object.entries(requiredFields)) {
      if (
        newVisitorData[key] === undefined ||
        newVisitorData[key] === null ||
        newVisitorData[key] === ""
      ) {
        toast.error(`${label} is required`);
        return;
      }
    }

    if (newVisitorData.phone && newVisitorData.phone.length < 10) {
      toast.error("Phone number must be at least 10 digits");
      return;
    }
    if (newVisitorData.email && !/\S+@\S+\.\S+/.test(newVisitorData.email)) {
      toast.error("Email address is invalid");
      return;
    }
    var tokenStageKey = "";
    var tokenEnvKey = "";
    if (currentFacility.environment === "cia-stg-1.aws.") {
      tokenStageKey = "cia-stg-1.aws.";
    } else {
      tokenEnvKey = currentFacility.environment;
    }
    const data = {
      timeGroupId: newVisitorData.timeGroupId,
      accessProfileId: newVisitorData.accessProfileId,
      unitId: newVisitorData.unitId,
      accessCode: newVisitorData.code,
      lastName: newVisitorName.lastName,
      firstName: newVisitorName.firstName,
      email: newVisitorData.email || null,
      mobilePhoneNumber: newVisitorData.mobilePhoneNumber || null,
      suppressCommands: false,
    };

    const config = {
      method: "post",
      url: `https://accesscontrol.${tokenStageKey}insomniaccia${tokenEnvKey}.com/facilities/${currentFacility.id}/visitors/${visitor.id}/update`,
      headers: {
        Authorization: "Bearer " + currentFacility?.token?.access_token,
        accept: "application/json",
        "api-version": "2.0",
        "Content-Type": "application/json-patch+json",
      },
      data: data,
    };
    toast.promise(
      axios(config)
        .then(async function (response) {
          const newVisitorData = response.data;
          if (typeof setVisitors === "function") {
            await addEvent(
              "Edit Visitor",
              `${user.email} edited visitor ${visitor.id} at facility ${currentFacility.name}, ${currentFacility.id}`,
              true
            );
            setVisitors((prevVisitors) => {
              const updatedVisitors = prevVisitors.map((visitor) => {
                if (visitor.id === newVisitorData.id) {
                  return { ...visitor, ...newVisitorData };
                }
                return visitor;
              });
              return updatedVisitors.sort((a, b) => {
                if (a.unitNumber < b.unitNumber) return -1;
                if (a.unitNumber > b.unitNumber) return 1;
                return 0;
              });
            });
          }
        })

        .catch(function (error) {
          console.log(error);
          throw error;
        }),
      {
        loading: `Updating ${visitor.id}...`,
        success: <b> {visitor.id} successfully updated!</b>,
        error: <b>Failed to update {visitor.id}.</b>,
      }
    );

    // Close modal and clear input after submitting
    setIsEditVisitorModalOpen(false);
  };
  useEffect(() => {
    handleTimeProfiles();
    handleAccessProfiles();
  }, []);

  return (
    <ModalContainer
      title={`Editing Visitor ${visitor.id}`}
      icon={<MdEdit />}
      mainContent={
        <div className="min-w-96 flex flex-col pt-4 gap-3">
          <InputBox
            required={true}
            type={"text"}
            placeholder={"First Name"}
            onchange={(e) =>
              setNewVisitorName((prevState) => ({
                ...prevState,
                firstName: e.target.value,
              }))
            }
            value={newVisitorName.firstName || ""}
          />
          <InputBox
            required={true}
            type={"text"}
            placeholder={"Last Name"}
            onchange={(e) =>
              setNewVisitorName((prevState) => ({
                ...prevState,
                lastName: e.target.value,
              }))
            }
            value={newVisitorName.lastName || ""}
          />
          <InputBox
            type={"text"}
            placeholder={"Mobile Phone Number"}
            onchange={(e) =>
              setNewVisitorData((prevState) => ({
                ...prevState,
                mobilePhoneNumber: e.target.value,
              }))
            }
            value={newVisitorData.mobilePhoneNumber || ""}
          />
          <InputBox
            type={"text"}
            placeholder={"Email Address"}
            onchange={(e) =>
              setNewVisitorData((prevState) => ({
                ...prevState,
                email: e.target.value,
              }))
            }
            value={newVisitorData.email || ""}
          />
          <InputBox
            required={true}
            type={"text"}
            placeholder={"Gate Code"}
            onchange={(e) =>
              setNewVisitorData((prevState) => ({
                ...prevState,
                code: e.target.value,
              }))
            }
            value={newVisitorData.code || ""}
          />
          <SelectOption
            required={true}
            value={newVisitorData.timeGroupId}
            onChange={(e) =>
              setNewVisitorData((prev) => ({
                ...prev,
                timeGroupId: e.target.value,
              }))
            }
            options={Array.isArray(timeProfiles) ? timeProfiles : []}
            placeholder="Select a Time Profile"
          />
          <SelectOption
            required={true}
            value={newVisitorData.accessProfileId}
            onChange={(e) =>
              setNewVisitorData((prev) => ({
                ...prev,
                accessProfileId: e.target.value,
              }))
            }
            options={Array.isArray(accessProfiles) ? accessProfiles : []}
            placeholder="Select a Access Profile"
          />
        </div>
      }
      responseContent={
        <div className="flex justify-end">
          <ModalButton
            onclick={() => setIsEditVisitorModalOpen(false)}
            text="Cancel"
          />
          <ModalButton
            onclick={() => handleEditVisitor()}
            text="Submit"
            className={"bg-green-500 hover:bg-green-600"}
          />
        </div>
      }
    />
  );
}
