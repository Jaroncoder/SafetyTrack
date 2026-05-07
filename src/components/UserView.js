import React, { useEffect, useState } from "react";
import { db, ref, set, push, onValue, update } from "../firebase";
import LiveTrackingMap from "./LiveTrackingMap";
import { estimateEtaMinutes, formatEta, getDistanceMiles } from "../utils/tracking";

function UserView() {
  const [userName, setUserName] = useState(localStorage.getItem("safety_user_name") || "");
  const [isRegistered, setIsRegistered] = useState(!!localStorage.getItem("safety_user_name"));

  const [status, setStatus] = useState("Press in emergency.");
  const [buttonText, setButtonText] = useState("SOS");
  const [volunteers, setVolunteers] = useState([]); 
  const [assignedHelper, setAssignedHelper] = useState(null);
  const [expectedSafeCode, setExpectedSafeCode] = useState("");
  const [emergencyId, setEmergencyId] = useState(null);
  const [isRescued, setIsRescued] = useState(false);
  const [inputCode, setInputCode] = useState("");

  const [userLocation, setUserLocation] = useState({ lat: 28.6139, lng: 77.2090 });

  // 1. Initial location fetch for the "Nearby" list
  useEffect(() => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition((pos) => {
        setUserLocation({ lat: pos.coords.latitude, lng: pos.coords.longitude });
      }, (err) => console.error("Location access denied"), { enableHighAccuracy: true });
    }
  }, []);

  // 2. Listen to Real Online Volunteers (Background List)
  useEffect(() => {
    const volunteersRef = ref(db, "volunteers");
    const unsubscribe = onValue(volunteersRef, (snapshot) => {
      const data = snapshot.val();
      if (data) {
        const list = Object.values(data)
          .filter(v => v.isOnline === true && v.isApproved === true)
          .map(v => ({
            ...v,
            distMiles: getDistanceMiles(userLocation.lat, userLocation.lng, v.lat, v.lng)
          }))
          .filter(v => v.distMiles !== null)
          .sort((a, b) => a.distMiles - b.distMiles);
        setVolunteers(list);
      } else {
        setVolunteers([]);
      }
    });
    return () => unsubscribe();
  }, [userLocation]);

  // 3. Live emergency tracking
  useEffect(() => {
    if (!emergencyId) return;

    const emergencyRef = ref(db, `emergencies/${emergencyId}`);
    let unsubscribeVolunteer = null;
    
    // Listen for changes to the emergency request
    const unsubscribeEmergency = onValue(emergencyRef, (snapshot) => {
      const emData = snapshot.val();
      
      if (emData && emData.status === "accepted" && emData.helperUid) {
        setExpectedSafeCode(emData.safeCode || "");
        // Now listen to the specific volunteer's LIVE location
        const volunteerRef = ref(db, `volunteers/${emData.helperUid}`);

        if (unsubscribeVolunteer) {
          unsubscribeVolunteer();
        }

        unsubscribeVolunteer = onValue(volunteerRef, (vSnap) => {
          const vData = vSnap.val();
          if (vData && vData.lat) {
            // Recalculate distance dynamically as the volunteer moves
            setAssignedHelper({
              name: vData.name,
              phone: vData.phone,
              sector: vData.sector,
              lat: vData.lat,
              lng: vData.lng,
            });

            setButtonText("HELP COMING");
            setStatus(`Volunteer ${vData.name} is on the way!`);
          }
        });
      }
      
      if (emData && emData.status === "rescued") {
        setIsRescued(true);
      }
    });

    return () => {
      if (unsubscribeVolunteer) unsubscribeVolunteer();
      unsubscribeEmergency();
    };
  }, [emergencyId]);

  // 4. Keep the user's emergency location live in Firebase while active
  useEffect(() => {
    if (!emergencyId || isRescued) return;

    if (!navigator.geolocation) {
      return;
    }

    const watchId = navigator.geolocation.watchPosition(
      (position) => {
        const liveLat = position.coords.latitude;
        const liveLng = position.coords.longitude;
        setUserLocation({ lat: liveLat, lng: liveLng });

        update(ref(db, `emergencies/${emergencyId}`), {
          lat: liveLat,
          lng: liveLng,
          userUpdatedAt: Date.now(),
        });
      },
      (error) => console.error("Live location update failed", error),
      { enableHighAccuracy: true, maximumAge: 0, timeout: 10000 }
    );

    return () => navigator.geolocation.clearWatch(watchId);
  }, [emergencyId, isRescued]);

  // 5. Send SOS Function
  const sendSOS = () => {
    setButtonText("LOCATING...");
    setStatus("Fetching high-accuracy location...");

    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const liveLat = position.coords.latitude;
          const liveLng = position.coords.longitude;
          setUserLocation({ lat: liveLat, lng: liveLng });

          setButtonText("SENDING...");
          setStatus("Broadcasting SOS to nearby volunteers...");

          const emergenciesRef = ref(db, "emergencies");
          const newEmergencyRef = push(emergenciesRef);
          const id = newEmergencyRef.key;
          setEmergencyId(id);

          set(newEmergencyRef, {
            id: id,
            userName: userName,
            lat: liveLat,
            lng: liveLng,
            status: "pending",
            isRescued: false,
            createdAt: Date.now(),
          }).then(() => {
            setButtonText("WAITING...");
          });
        },
        (error) => {
          alert("Error: Please enable location services to send SOS.");
          setButtonText("SOS");
          setStatus("Location Error. Try again.");
        },
        { enableHighAccuracy: true, timeout: 10000 }
      );
    }
  };

  const handleUserLogin = (e) => {
    e.preventDefault();
    if (userName.trim()) {
      localStorage.setItem("safety_user_name", userName);
      setIsRegistered(true);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem("safety_user_name");
    setUserName("");
    setIsRegistered(false);
  };

  const handleRescue = () => {
    if (!emergencyId || !assignedHelper) return;
    if (!expectedSafeCode || inputCode.trim() !== expectedSafeCode) {
      alert("Invalid Safe Code!");
      return;
    }
    update(ref(db, `emergencies/${emergencyId}`), {
      status: "rescued",
      isRescued: true,
      resolvedAt: Date.now()
    }).then(() => {
      setIsRescued(true);
      setStatus("Case Closed. We are glad you are safe!");
    });
  };

  if (!isRegistered) {
    return (
      <div style={{ padding: '50px 20px', textAlign: 'center', fontFamily: 'sans-serif' }}>
        <h2>Setup Emergency Profile</h2>
        <form onSubmit={handleUserLogin}>
          <input 
            type="text" 
            placeholder="Your Full Name" 
            value={userName} 
            onChange={(e) => setUserName(e.target.value)}
            style={{ padding: '12px', width: '80%', maxWidth: '300px', borderRadius: '5px', border: '1px solid #ccc' }}
            required
          />
          <br />
          <button type="submit" style={{ marginTop: '20px', padding: '12px 30px', backgroundColor: '#ff4d4d', color: 'white', border: 'none', borderRadius: '5px', fontWeight: 'bold', cursor: 'pointer' }}>
            Save & Continue
          </button>
        </form>
      </div>
    );
  }

  return (
    <div className="user-view" style={{ textAlign: 'center', padding: '20px', fontFamily: 'sans-serif' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '20px' }}>
        <span style={{ fontSize: '0.9rem', color: '#666' }}>Welcome, <b>{userName}</b></span>
        <button onClick={handleLogout} style={{ border: 'none', background: 'none', color: '#ff4d4d', cursor: 'pointer', textDecoration: 'underline' }}>Logout</button>
      </div>

      {!isRescued ? (
        <>
          <button 
            onClick={sendSOS}
            disabled={buttonText === "HELP COMING" || buttonText === "LOCATING..." || buttonText === "SENDING..."}
            style={{ 
                backgroundColor: buttonText === "HELP COMING" ? '#4CAF50' : '#ff4d4d', 
                color: 'white', border: 'none', width: '130px', height: '130px', borderRadius: '50%',
                fontSize: '1.1rem', fontWeight: 'bold', cursor: 'pointer', boxShadow: '0 4px 15px rgba(0,0,0,0.3)',
                transition: '0.3s'
            }}
          >
            {buttonText}
          </button>

          <p style={{ marginTop: '20px', color: assignedHelper ? '#2e7d32' : '#333' }}>
            <strong>{status}</strong>
          </p>

          {emergencyId && !assignedHelper && (
            <LiveTrackingMap
              title="Your Live SOS Location"
              userPosition={userLocation}
              userLabel={`You: ${userName}`}
              volunteerPosition={null}
            />
          )}

          {assignedHelper && (
            <div style={{ backgroundColor: '#e8f5e9', padding: '20px', borderRadius: '15px', margin: '20px auto', maxWidth: '350px', border: '2px solid #4CAF50' }}>
              <LiveTrackingMap
                title="Linked Rescue Map"
                userPosition={userLocation}
                volunteerPosition={assignedHelper.lat && assignedHelper.lng ? { lat: assignedHelper.lat, lng: assignedHelper.lng } : null}
                userLabel={`You: ${userName}`}
                volunteerLabel={`Volunteer: ${assignedHelper.name}`}
              />
              <h3 style={{ margin: '0 0 10px 0', color: '#2e7d32' }}>Volunteer is Coming!</h3>
              {assignedHelper.lat && assignedHelper.lng && (
                <p>
                  <strong>{assignedHelper.name}</strong> • <span style={{ color: '#d32f2f', fontWeight: 'bold' }}>
                    {formatEta(estimateEtaMinutes(getDistanceMiles(userLocation.lat, userLocation.lng, assignedHelper.lat, assignedHelper.lng)))}
                  </span>
                </p>
              )}
              <p>📞 {assignedHelper.phone}</p>
              
              <input 
                  type="text"
                  placeholder="Enter code from volunteer"
                  value={inputCode}
                  onChange={(e) => setInputCode(e.target.value)}
                  maxLength="4"
                  style={{ width: '100%', padding: '12px', marginBottom: '10px', borderRadius: '5px', border: '2px solid #2e7d32', textAlign: 'center', fontWeight: 'bold' }}
              />
              <button 
                  onClick={handleRescue}
                  style={{ backgroundColor: '#2e7d32', color: 'white', border: 'none', width: '100%', padding: '15px', borderRadius: '8px', fontWeight: 'bold', cursor: 'pointer' }}
              >
                  VERIFY & I AM SAFE
              </button>
            </div>
          )}

          <h4 style={{ marginTop: '40px' }}>Nearby Potential Helpers</h4>
          {volunteers.length === 0 ? (
            <p style={{ color: '#999', fontSize: '0.9rem' }}>Searching for active volunteers...</p>
          ) : (
            volunteers.map((v, i) => (
              <div key={i} style={{ border: '1px solid #eee', borderRadius: '8px', margin: '5px', padding: '10px', backgroundColor: '#f9f9f9', textAlign: 'left' }}>
                <h4 style={{ margin: '0 0 5px 0' }}>{v.name} <span style={{ color: '#4CAF50', fontSize: '0.7rem' }}>● ONLINE</span></h4>
                <p style={{ margin: 0, fontSize: '0.9rem', color: '#666' }}>
                  {v.sector} • {v.distMiles.toFixed(1)} miles away • {formatEta(estimateEtaMinutes(v.distMiles))}
                </p>
              </div>
            ))
          )}
        </>
      ) : (
        <div style={{ padding: '40px 20px' }}>
            <div style={{ fontSize: '5rem' }}>✅</div>
            <h2 style={{ color: '#2e7d32' }}>Safe & Sound</h2>
            <p>Verification successful. Case closed.</p>
            <button onClick={() => window.location.reload()} style={{ padding: '10px 20px', marginTop: '20px', cursor: 'pointer' }}>New Session</button>
        </div>
      )}
    </div>
  );
}

export default UserView;