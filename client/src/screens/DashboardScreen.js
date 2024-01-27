import React, { useEffect } from "react";
import { v1 as uuid } from "uuid";
import useAuthentication from "../hooks/useAuthentication";

import M from "materialize-css";

const DashboardScreen = (props) => {
  let isAuthenticated = useAuthentication();
  const createRoom = () => {
    const id = uuid();
    props.history.push(`/room/${id}`);
  };

  useEffect(() => {
    if (!isAuthenticated) {
      M.toast({ html: "Login first", classes: "red" });
      props.history.push("/login");
    }
    //eslint-disable-next-line
  }, [isAuthenticated]);

  const logout = () => {
    localStorage.removeItem("Token");
    props.history.push("/login");
  };

  return (
    <div className="container">
      <div className="card-container">
        <div className="card">
          <button onClick={createRoom}>Create room</button>
          <button onClick={logout}>Logout</button>
        </div>
      </div>
    </div>
  );
};

export default DashboardScreen;
