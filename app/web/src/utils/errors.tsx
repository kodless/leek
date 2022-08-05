import { message, Typography } from "antd";
import React from "react";
import env from "../utils/vars";
import { navigate } from "@reach/router";
import getAuth from "../utils/firebase";

const Text = Typography.Text;

export function handleAPIResponse(response) {
  if (response.ok) {
    return Promise.resolve(response.json());
  }
  return Promise.resolve(response.json()).then((responseInJson) => {
    return Promise.reject(responseInJson.error);
  });
}

export function handleAPIError(error) {
  console.log(error);
  if (error && error.message) {
    // Network error (API DOWN / OFFLINE)
    if (error.name == "TypeError") {
      message.error(
        <>
          Unable to connect to backend{" "}
          <Text type="secondary">- retry in a while ...</Text>{" "}
        </>,
        10
      );
      //navigate('/503/');
    }
    // Authorization error
    else if (error.code == "401003") {
      message.error(
        <>
          <Text>{`${error.message}`}</Text>{" "}
          <Text type="secondary">- {error.reason}</Text>
        </>
      );
      // Logout
      const auth = getAuth();
      auth
        .signOut()
        .then(function () {})
        .catch(function (error) {
          console.log(error);
        });
    }
    // API Error
    else
      message.error(
        <>
          <Text>{`${error.message}`}</Text>{" "}
          <Text type="secondary">- {error.reason}</Text>
        </>
      );
  } else {
    message.error("Something went wrong");
  }
}
