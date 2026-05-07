import React, { useState, useEffect } from "react";
import { auth } from "./firebase";
import { onAuthStateChanged } from "firebase/auth";
import UserView from "./components/UserView";
import VolunteerView from "./components/VolunteerView";
import VolunteerAuth from "./components/VolunteerAuth";
import AdminPanel from "./components/AdminPanel";

function App() {
  const [user, setUser] = useState(null);
  const [view, setView] = useState("home");
  
  // 📍 NEW: State for the Admin Login Modal
  const [showAdminModal, setShowAdminModal] = useState(false);
  const [adminCreds, setAdminCreds] = useState({ user: "", pass: "" });

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
      if (!currentUser) setView("home");
    });
    return () => unsubscribe();
  }, []);

  const handleAdminSubmit = (e) => {
    e.preventDefault();
    if (adminCreds.user === "User" && adminCreds.pass === "1234") {
      setView("admin");
      setShowAdminModal(false);
      setAdminCreds({ user: "", pass: "" }); // Reset
    } else {
      alert("Invalid Admin Credentials!");
    }
  };

  if (view === "home") {
    return (
      <div style={homeContainer}>
        {/* Admin Trigger Button */}
        <button onClick={() => setShowAdminModal(true)} style={adminTriggerBtn}>
          🛡️ Admin Panel
        </button>

        <h1 style={{ fontSize: "3rem", marginBottom: "10px" }}>Serene Safety</h1>
        <p style={{ color: "#666" }}>Choose your portal to continue:</p>

        <div style={portalGrid}>
          <button onClick={() => setView("user")} style={userBtn}>
            <div style={{ fontSize: "2rem" }}>🚨</div>
            <strong>I Need Help (SOS)</strong>
          </button>

          <button onClick={() => setView("volunteer")} style={volunteerBtn}>
            <div style={{ fontSize: "2rem" }}>🤝</div>
            <strong>I am a Volunteer</strong>
          </button>
        </div>

        {/* 📍 THE MODAL POPUP */}
        {showAdminModal && (
          <div style={modalOverlay}>
            <div style={modalContent}>
              <h3>Admin Authorization</h3>
              <form onSubmit={handleAdminSubmit}>
                <input
                  type="text"
                  placeholder="Admin Username"
                  style={modalInput}
                  value={adminCreds.user}
                  onChange={(e) => setAdminCreds({ ...adminCreds, user: e.target.value })}
                  required
                />
                <input
                  type="password"
                  placeholder="Password"
                  style={modalInput}
                  value={adminCreds.pass}
                  onChange={(e) => setAdminCreds({ ...adminCreds, pass: e.target.value })}
                  required
                />
                <div style={{ display: "flex", gap: "10px", marginTop: "10px" }}>
                  <button type="submit" style={btnPrimary}>Login</button>
                  <button type="button" onClick={() => setShowAdminModal(false)} style={btnSecondary}>Cancel</button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    );
  }

  return (
    <div style={{ backgroundColor: "#f9f9f9", minHeight: "100vh" }}>
      <button onClick={() => setView("home")} style={backBtn}>
        ← Back to Portal
      </button>

      {view === "user" && <UserView />}
      {view === "admin" && <AdminPanel />}
      {view === "volunteer" && (
        user ? <VolunteerView /> : <VolunteerAuth />
      )}
    </div>
  );
}

// --- Modern Styles ---

const homeContainer = {
  textAlign: "center",
  padding: "100px 20px",
  fontFamily: "'Inter', sans-serif",
  backgroundColor: "#fff",
  minHeight: "100vh",
};

const adminTriggerBtn = {
  position: "absolute",
  top: "20px",
  right: "20px",
  padding: "10px 20px",
  backgroundColor: "#f0f0f0",
  color: "#333",
  border: "1px solid #ddd",
  borderRadius: "8px",
  cursor: "pointer",
  fontWeight: "bold",
};

const portalGrid = {
  display: "flex",
  justifyContent: "center",
  gap: "20px",
  marginTop: "40px",
  flexWrap: "wrap",
};

const userBtn = {
  padding: "30px 50px",
  backgroundColor: "#ff4d4d",
  color: "white",
  border: "none",
  borderRadius: "15px",
  cursor: "pointer",
  boxShadow: "0 10px 20px rgba(255, 77, 77, 0.3)",
};

const volunteerBtn = {
  padding: "30px 50px",
  backgroundColor: "#4a90e2",
  color: "white",
  border: "none",
  borderRadius: "15px",
  cursor: "pointer",
  boxShadow: "0 10px 20px rgba(74, 144, 226, 0.3)",
};

// Modal Styles
const modalOverlay = {
  position: "fixed",
  top: 0,
  left: 0,
  width: "100%",
  height: "100%",
  backgroundColor: "rgba(0,0,0,0.6)",
  backdropFilter: "blur(5px)",
  display: "flex",
  justifyContent: "center",
  alignItems: "center",
  zIndex: 1000,
};

const modalContent = {
  backgroundColor: "#fff",
  padding: "30px",
  borderRadius: "12px",
  width: "100%",
  maxWidth: "350px",
  textAlign: "left",
  boxShadow: "0 20px 40px rgba(0,0,0,0.2)",
};

const modalInput = {
  width: "100%",
  padding: "12px",
  margin: "10px 0",
  borderRadius: "6px",
  border: "1px solid #ddd",
  boxSizing: "border-box",
};

const btnPrimary = {
  flex: 1,
  padding: "12px",
  backgroundColor: "#333",
  color: "white",
  border: "none",
  borderRadius: "6px",
  cursor: "pointer",
  fontWeight: "bold",
};

const btnSecondary = {
  flex: 1,
  padding: "12px",
  backgroundColor: "#eee",
  color: "#333",
  border: "none",
  borderRadius: "6px",
  cursor: "pointer",
};

const backBtn = {
  margin: "20px",
  padding: "8px 20px",
  backgroundColor: "#fff",
  border: "1px solid #ddd",
  borderRadius: "20px",
  cursor: "pointer",
  fontWeight: "bold",
};

export default App;