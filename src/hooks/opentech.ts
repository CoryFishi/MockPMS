import axios from "axios";
import qs from "qs";

export async function handleSingleLogin(facility: any) {
  let tokenStageKey = "";
  let tokenEnvKey = "";
  if (facility.environment === "staging") {
    tokenStageKey = "cia-stg-1.aws.";
  } else {
    tokenEnvKey = facility.environment;
  }

  const data = qs.stringify({
    grant_type: "password",
    username: facility.api,
    password: facility.apiSecret,
    client_id: facility.client,
    client_secret: facility.clientSecret,
  });

  const config = {
    method: "post",
    url: `https://auth.${tokenStageKey}insomniaccia${tokenEnvKey}.com/auth/token`,
    headers: {
      accept: "application/json",
      "Content-Type": "application/x-www-form-urlencoded",
    },
    data,
  };

  return axios(config)
    .then((response) => {
      return { message: "Successfully authenticated!", token: response.data };
    })
    .catch((error) => {
      console.error("Error during single login:", error);
      return { error: "Failed to authenticate." };
    });
}

export async function handleMultiLogin(facilities: any) {
  let tokenStageKey = "";
  let tokenEnvKey = "";
  if (facilities.environment === "staging") {
    tokenStageKey = "cia-stg-1.aws.";
  } else {
    tokenEnvKey = facilities.environment;
  }

  const data = qs.stringify({
    grant_type: "password",
    username: facilities.api,
    password: facilities.apiSecret,
    client_id: facilities.client,
    client_secret: facilities.clientSecret,
  });

  const config = {
    method: "post",
    url: `https://auth.${tokenStageKey}insomniaccia${tokenEnvKey}.com/auth/token`,
    headers: {
      accept: "application/json",
      "Content-Type": "application/x-www-form-urlencoded",
    },
    data,
  };

  return axios(config)
    .then((response) => {
      return { message: "Successfully authenticated!", token: response.data };
    })
    .catch((error) => {
      console.error("Error during single login:", error);
      throw error;
    });
}
