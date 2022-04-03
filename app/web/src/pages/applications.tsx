import React from "react";
import { Helmet } from "react-helmet-async";

import Applications from "../containers/apps/Applications";

const ApplicationsPage = () => {
  return (
    <>
      <Helmet>
        <html lang="en" />
        <title>Applications</title>
        <meta name="description" content="Leek applications" />
        <meta name="keywords" content="leek, applications" />
      </Helmet>

      <Applications />
    </>
  );
};

export default ApplicationsPage;
