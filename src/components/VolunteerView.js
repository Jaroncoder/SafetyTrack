import React, { useEffect, useState } from "react";
import { db, auth, ref, onValue, update } from "../firebase";
import LiveTrackingMap from "./LiveTrackingMap";
import { estimateEtaMinutes, formatEta, getDistanceMiles } from "../utils/tracking";

function VolunteerView() {
  const [profile, setProfile] = useState(null);
  const [activeAlerts, setActiveAlerts] = useState([]);
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [liveLocation, setLiveLocation] = useState(null);
  
  // 📍 NEW: State for live location tracking
  const [isOnline, setIsOnline] = useState(false);

  useEffect(() => {
    const user = auth.currentUser;
    if (!user) {
      setLoading(false);
      return;
    }

    const profileRef = ref(db, `volunteers/${user.uid}`);
    onValue(profileRef, (snap) => {
      const data = snap.val();
      setProfile(data);
      // Sync local state with database online status
      if (data) setIsOnline(data.isOnline || false);
    });

    const emergenciesRef = ref(db, "emergencies");
    onValue(emergenciesRef, (snap) => {
      const data = snap.val();
      if (data) {
        const allList = Object.entries(data).map(([id, details]) => ({ id, ...details }));
        const active = allList.filter(item => 
          item.status === "pending" || 
          (item.status === "accepted" && item.helperUid === user.uid)
        );
        const past = allList.filter(item => 
          item.status === "rescued" && item.helperUid === user.uid
        );
        setActiveAlerts(active.reverse());
        setHistory(past.reverse());
      }
      setLoading(false);
    });
  }, [profile?.name]);

  // 📍 NEW: Effect to track location when Online
  useEffect(() => {
    let watchId;
    if (isOnline && auth.currentUser) {
      watchId = navigator.geolocation.watchPosition(
        (pos) => {
          const position = {
            lat: pos.coords.latitude,
            lng: pos.coords.longitude,
          };

          setLiveLocation(position);
          update(ref(db, `volunteers/${auth.currentUser.uid}`), {
            lat: position.lat,
            lng: position.lng,
            lastSeen: Date.now()
          });
        },
        (err) => console.error(err),
        { enableHighAccuracy: true }
      );
    }
    return () => {
      if (watchId) navigator.geolocation.clearWatch(watchId);
    };
  }, [isOnline]);

  const currentUser = auth.currentUser;
  const trackedAlert = activeAlerts.find((item) => item.status === "accepted" && item.helperUid === currentUser?.uid);

  // 📍 NEW: Toggle Function
  const toggleOnline = () => {
    const newStatus = !isOnline;
    update(ref(db, `volunteers/${auth.currentUser.uid}`), {
      isOnline: newStatus
    });
    setIsOnline(newStatus);
  };

  // ... existing imports

const sendNotification = (id) => {
    // 📍 REMOVED: mockDistance (We calculate this live on the user side now)
    const generatedSafeCode = Math.floor(1000 + Math.random() * 9000).toString();

    update(ref(db, `emergencies/${id}`), {
      status: "accepted",
      helperName: profile.name,
      helperPhone: profile.phone,
      helperSector: profile.sector,
      helperUid: auth.currentUser.uid,
      // 📍 CHANGED: We send the code, but distance is handled by live GPS
      safeCode: generatedSafeCode,
      acceptedAt: Date.now()
    }).then(() => {
      alert(`Request Accepted! Your verification Safe Code is: ${generatedSafeCode}`);
    });
};

// ... rest of the component

  const locateUser = (lat, lng) => {
    const mapUrl = `https://www.google.com/maps?q=${lat},${lng}`;
    window.open(mapUrl, "_blank");
  };

  if (loading) return <div style={{ textAlign: 'center', marginTop: '50px' }}>Loading Dashboard...</div>;

  if (profile && !profile.isApproved) {
    return (
      <div style={{ textAlign: 'center', padding: '50px', fontFamily: 'sans-serif' }}>
        <div style={{ fontSize: '4rem' }}>🛡️</div>
        <h2>Awaiting Admin Approval</h2>
        <p>Your account is under review.</p>
        <button onClick={() => auth.signOut()} style={{ marginTop: '20px', padding: '10px 20px' }}>Logout</button>
      </div>
    );
  }

  return (
    <div className="volunteer-view" style={{ padding: "20px", fontFamily: "sans-serif", maxWidth: '700px', margin: '0 auto' }}>
      
      <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '2px solid #eee', paddingBottom: '10px' }}>
        <div>
          <h2 style={{ margin: 0 }}>Volunteer Dashboard</h2>
          <span style={{ color: isOnline ? '#2e7d32' : '#f44336', fontWeight: 'bold' }}>
            {isOnline ? "● Live & Online" : "○ Currently Offline"}
          </span>
        </div>
        <button onClick={() => auth.signOut()} style={{ backgroundColor: '#f44336', color: 'white', border: 'none', padding: '8px 15px', borderRadius: '5px', cursor: 'pointer' }}>
          Logout
        </button>
      </header>

      {/* 📍 NEW: SHARE LOCATION TOGGLE */}
      <div style={{ 
        margin: '20px 0', padding: '20px', borderRadius: '10px', 
        backgroundColor: isOnline ? '#e8f5e9' : '#ffebee', 
        border: `2px solid ${isOnline ? '#4CAF50' : '#f44336'}`,
        display: 'flex', justifyContent: 'space-between', alignItems: 'center'
      }}>
        <div>
          <strong style={{ fontSize: '1.1rem' }}>Share Live Location</strong>
          <p style={{ margin: '5px 0 0 0', fontSize: '0.85rem', color: '#666' }}>
            {isOnline ? "Users can see you're nearby to help." : "You are hidden from the map."}
          </p>
        </div>
        <button 
          onClick={toggleOnline}
          style={{ 
            backgroundColor: isOnline ? '#4CAF50' : '#f44336', 
            color: 'white', border: 'none', padding: '12px 20px', borderRadius: '30px', 
            fontWeight: 'bold', cursor: 'pointer', boxShadow: '0 2px 5px rgba(0,0,0,0.2)' 
          }}
        >
          {isOnline ? "GO OFFLINE" : "GO ONLINE"}
        </button>
      </div>

      <div style={{ padding: '15px', backgroundColor: '#f5f5f5', borderRadius: '8px', margin: '20px 0' }}>
        <p style={{ margin: 0 }}>Logged in: <strong>{profile?.name}</strong></p>
        <p style={{ margin: 0, fontSize: '0.9rem', color: '#555' }}>Sector: {profile?.sector}</p>
      </div>

      {trackedAlert && (
        <LiveTrackingMap
          title="Linked SOS Case"
          userPosition={trackedAlert.lat && trackedAlert.lng ? { lat: trackedAlert.lat, lng: trackedAlert.lng } : null}
          volunteerPosition={liveLocation || (profile?.lat && profile?.lng ? { lat: profile.lat, lng: profile.lng } : null)}
          userLabel={`User: ${trackedAlert.userName}`}
          volunteerLabel={`Volunteer: ${profile?.name || "You"}`}
        />
      )}

      <h3 style={{ borderLeft: '5px solid #ff4d4d', paddingLeft: '10px' }}>🚨 Live SOS Signals</h3>
      {activeAlerts.length === 0 ? (
        <p style={{ color: '#888' }}>📡 Scanning for emergencies...</p>
      ) : (
        activeAlerts.map((alert) => (
          <div key={alert.id} className="alert-card" style={{ 
              border: alert.status === "accepted" ? "2px solid #4CAF50" : "2px solid #ff4d4d", 
              borderRadius: "10px", padding: "15px", marginBottom: "15px", backgroundColor: "#fff" 
          }}>
            <h4 style={{ margin: "0 0 10px 0", color: alert.status === "accepted" ? "#2e7d32" : "#d32f2f" }}>
                {alert.status === "accepted" ? "✅ Handling Request" : "🚨 EMERGENCY REQUEST"}
            </h4>
            <p><strong>User:</strong> {alert.userName}</p>

            {alert.status === "accepted" && (
              <div style={{ backgroundColor: '#fff3e0', padding: '10px', borderRadius: '8px', border: '1px solid #ff9800', marginBottom: '15px' }}>
                <p style={{ margin: 0, fontWeight: 'bold', color: '#e65100' }}>
                  🔐 SAFE CODE: <span style={{ fontSize: '1.4rem', letterSpacing: '2px' }}>{alert.safeCode}</span>
                </p>
                <p style={{ fontSize: '0.8rem', margin: '5px 0 0 0', color: '#666' }}>
                  Recite this code to the user upon arrival.
                </p>
                {alert.lat && alert.lng && profile?.lat && profile?.lng && (
                  <p style={{ fontSize: '0.8rem', margin: '6px 0 0 0', color: '#666' }}>
                    {formatEta(estimateEtaMinutes(getDistanceMiles(alert.lat, alert.lng, profile.lat, profile.lng)))}
                  </p>
                )}
              </div>
            )}
            
            <div style={{ display: 'flex', gap: '10px', marginTop: '15px' }}>
                <button 
                  disabled={alert.status === "accepted"}
                  onClick={() => sendNotification(alert.id)}
                  style={{ 
                      flex: 1, backgroundColor: alert.status === "accepted" ? "#ccc" : "#4a90e2", 
                      color: "white", border: "none", padding: "12px", borderRadius: "5px", 
                      fontWeight: "bold", cursor: alert.status === "accepted" ? "default" : "pointer"
                  }}
                >
                  {alert.status === "accepted" ? "ACCEPTED" : "ACCEPT REQUEST"}
                </button>

                <button 
                  onClick={() => locateUser(alert.lat, alert.lng)}
                  style={{ 
                      flex: 1, backgroundColor: "white", color: "#333", border: "2px solid #333", 
                      padding: "12px", borderRadius: "5px", fontWeight: "bold", cursor: "pointer"
                  }}
                >
                  LOCATE USER
                </button>
            </div>
          </div>
        ))
      )}

      <h3 style={{ borderLeft: '5px solid #2196f3', paddingLeft: '10px', marginTop: '40px' }}>📜 Your Rescue History</h3>
      {history.map((item) => (
        <div key={item.id} style={{ padding: '15px', backgroundColor: '#e3f2fd', borderRadius: '10px', marginBottom: '10px', border: '1px solid #bbdefb' }}>
          <p style={{ margin: 0 }}><strong>Saved:</strong> {item.userName}</p>
          <p style={{ margin: '5px 0', fontStyle: 'italic', fontSize: '0.9rem' }}>
              "{item.userEvidence || "Mission completed successfully."}"
          </p>
          <p style={{ margin: 0, fontSize: '0.75rem', color: '#666' }}>
              Resolved: {new Date(item.resolvedAt).toLocaleString()}
          </p>
        </div>
      ))}
    </div>
  );
}

export default VolunteerView;