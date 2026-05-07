import React from "react";

function Header({ role, setRole }) {
  return (
    <div className="header">
      <h2>Serene</h2>

      <div className="role-switch">
        <button
          className={role === "user" ? "active" : ""}
          onClick={() => setRole("user")}
        >
          I am a Woman
        </button>

        <button
          className={role === "volunteer" ? "active" : ""}
          onClick={() => setRole("volunteer")}
        >
          I am a Volunteer
        </button>
      </div>
    </div>
  );
}

export default Header;