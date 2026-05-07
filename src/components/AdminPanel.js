import React, { useEffect, useState } from "react";
import { db, ref, onValue, update, remove } from "../firebase";

function AdminPanel() {
  const [volunteers, setVolunteers] = useState([]);
  const [history, setHistory] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterSector, setFilterSector] = useState("All");

  useEffect(() => {
    const volRef = ref(db, "volunteers");
    onValue(volRef, (snap) => {
      if (snap.val()) {
        const list = Object.entries(snap.val()).map(([id, val]) => ({ id, ...val }));
        setVolunteers(list);
      }
    });

    const historyRef = ref(db, "emergencies");
    onValue(historyRef, (snap) => {
      if (snap.val()) {
        const list = Object.entries(snap.val()).map(([id, val]) => ({ id, ...val }));
        setHistory(list.reverse());
      }
    });
  }, []);

  const handleApproval = (id, status) => {
    update(ref(db, `volunteers/${id}`), { isApproved: status });
  };

  const deleteVolunteer = (id) => {
    if (window.confirm("Are you sure you want to remove this volunteer?")) {
      remove(ref(db, `volunteers/${id}`));
    }
  };

  const filteredVolunteers = volunteers.filter(v => 
    v.isApproved && 
    (v.name.toLowerCase().includes(searchTerm.toLowerCase()) || (v.idNumber && v.idNumber.includes(searchTerm))) &&
    (filterSector === "All" || v.sector === filterSector)
  );

  const pendingRequests = volunteers.filter(v => !v.isApproved);

  return (
    <div style={containerStyle}>
      <header style={headerWrapper}>
        <h1 style={titleStyle}>🛡️ Control Center</h1>
        <p style={subtitleStyle}>Manage emergency volunteers and live incident logs.</p>
      </header>

      {/* QUICK STATS DASHBOARD */}
      <div style={statsGrid}>
        <div style={statCard}>
          <span style={statLabel}>Total Volunteers</span>
          <div style={statValue}>{volunteers.length}</div>
        </div>
        <div style={{...statCard, borderLeft: '4px solid #f44336'}}>
          <span style={statLabel}>Pending Approval</span>
          <div style={statValue}>{pendingRequests.length}</div>
        </div>
        <div style={{...statCard, borderLeft: '4px solid #4CAF50'}}>
          <span style={statLabel}>Total Rescues</span>
          <div style={statValue}>{history.filter(h => h.status === 'rescued').length}</div>
        </div>
      </div>

      <div style={mainLayout}>
        {/* LEFT COLUMN: MANAGEMENT */}
        <div style={columnStyle}>
          {/* PENDING REQUESTS */}
          <section style={cardStyle}>
            <h3 style={sectionTitle}>📥 Admission Queue</h3>
            {pendingRequests.length === 0 ? (
              <p style={emptyText}>No new applicants at the moment.</p>
            ) : (
              pendingRequests.map(v => (
                <div key={v.id} style={listItem}>
                  <div>
                    <strong style={{display: 'block'}}>{v.name}</strong>
                    <small style={idText}>{v.sector} • ID: [Redacted]</small>
                  </div>
                  <div style={actionGroup}>
                    <button onClick={() => handleApproval(v.id, true)} style={btnApprove}>Verify</button>
                    <button onClick={() => deleteVolunteer(v.id)} style={btnReject}>Decline</button>
                  </div>
                </div>
              ))
            )}
          </section>

          {/* VERIFIED VOLUNTEERS */}
          <section style={cardStyle}>
            <div style={flexSpace}>
              <h3 style={sectionTitle}>👥 Active Force</h3>
              <div style={{display: 'flex', gap: '5px'}}>
                <input 
                  placeholder="Search..." 
                  onChange={(e) => setSearchTerm(e.target.value)}
                  style={smallInput}
                />
                <select onChange={(e) => setFilterSector(e.target.value)} style={smallInput}>
                  <option value="All">All</option>
                  <option value="Ex-Army">Ex-Army</option>
                  <option value="Police">Police</option>
                  <option value="NGO">NGO</option>
                </select>
              </div>
            </div>
            <div style={scrollBox}>
              <table style={modernTable}>
                <thead>
                  <tr>
                    <th style={thStyle}>Name</th>
                    <th style={thStyle}>Contact</th>
                    <th style={thStyle}>Action</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredVolunteers.map(v => (
                    <tr key={v.id}>
                      <td style={tdStyle}><b>{v.name}</b><br/><small>{v.sector}</small></td>
                      <td style={tdStyle}>{v.phone}</td>
                      <td style={tdStyle}>
                        <button onClick={() => handleApproval(v.id, false)} style={btnRevoke}>Suspend</button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>
        </div>

        {/* RIGHT COLUMN: LIVE LOGS */}
        <div style={columnStyle}>
          <section style={cardStyle}>
            <h3 style={sectionTitle}>📜 Live Incident Logs</h3>
            <div style={logContainer}>
              {history.map(h => (
                <div key={h.id} style={logItem}>
                  <div style={flexSpace}>
                    <span style={h.status === 'rescued' ? badgeSuccess : badgePending}>
                      {h.status.toUpperCase()}
                    </span>
                    <small style={{color: '#999'}}>{new Date(h.createdAt || Date.now()).toLocaleTimeString()}</small>
                  </div>
                  <p style={{margin: '10px 0 5px 0'}}>
                    <strong>{h.userName}</strong> was assisted by <strong>{h.helperName || "Unassigned"}</strong>
                  </p>
                  <em style={evidenceText}>"{h.userEvidence || "Ongoing operation..."}"</em>
                </div>
              ))}
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}

// --- IMPROVISED STYLES ---
const containerStyle = { padding: "40px", fontFamily: "'Inter', sans-serif", backgroundColor: "#f0f2f5", minHeight: "100vh", color: "#1a1a1a" };
const headerWrapper = { marginBottom: '30px' };
const titleStyle = { margin: 0, fontSize: '28px', fontWeight: '800' };
const subtitleStyle = { margin: '5px 0 0 0', color: '#666' };

const statsGrid = { display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '20px', marginBottom: '30px' };
const statCard = { backgroundColor: '#fff', padding: '20px', borderRadius: '12px', boxShadow: '0 4px 6px rgba(0,0,0,0.05)', borderLeft: '4px solid #2196f3' };
const statLabel = { fontSize: '12px', color: '#888', textTransform: 'uppercase', fontWeight: 'bold' };
const statValue = { fontSize: '24px', fontWeight: 'bold', marginTop: '5px' };

const mainLayout = { display: 'grid', gridTemplateColumns: '1.2fr 1fr', gap: '30px' };
const columnStyle = { display: 'flex', flexDirection: 'column', gap: '30px' };
const cardStyle = { backgroundColor: "#fff", padding: "24px", borderRadius: "16px", boxShadow: "0 10px 15px -3px rgba(0,0,0,0.1)" };
const sectionTitle = { margin: '0 0 20px 0', fontSize: '18px', display: 'flex', alignItems: 'center', gap: '10px' };

const listItem = { display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '15px', borderBottom: '1px solid #f0f0f0', backgroundColor: '#fafafa', borderRadius: '8px', marginBottom: '10px' };
const idText = { color: '#888', fontSize: '12px' };
const actionGroup = { display: 'flex', gap: '8px' };

const modernTable = { width: "100%", borderCollapse: "collapse" };
const thStyle = { textAlign: 'left', padding: '12px', borderBottom: '2px solid #f0f0f0', color: '#888', fontSize: '13px' };
const tdStyle = { padding: '12px', borderBottom: '1px solid #f0f0f0', fontSize: '14px' };
const scrollBox = { maxHeight: '400px', overflowY: 'auto' };

const logContainer = { display: 'flex', flexDirection: 'column', gap: '15px', maxHeight: '750px', overflowY: 'auto', paddingRight: '10px' };
const logItem = { padding: '15px', borderLeft: '3px solid #ddd', backgroundColor: '#fdfdfd', borderRadius: '4px' };
const evidenceText = { fontSize: '13px', color: '#555', backgroundColor: '#eee', padding: '5px 10px', borderRadius: '4px', display: 'block', marginTop: '10px' };

const badgeSuccess = { backgroundColor: '#e8f5e9', color: '#2e7d32', padding: '4px 8px', borderRadius: '6px', fontSize: '10px', fontWeight: 'bold' };
const badgePending = { backgroundColor: '#fff3e0', color: '#ef6c00', padding: '4px 8px', borderRadius: '6px', fontSize: '10px', fontWeight: 'bold' };

const flexSpace = { display: 'flex', justifyContent: 'space-between', alignItems: 'center' };
const emptyText = { textAlign: 'center', color: '#999', padding: '20px' };
const smallInput = { padding: "6px 10px", borderRadius: "8px", border: "1px solid #ddd", fontSize: '12px' };

// Buttons
const btnApprove = { backgroundColor: "#4CAF50", color: "white", border: "none", padding: "8px 12px", borderRadius: '6px', cursor: "pointer", fontWeight: '600' };
const btnReject = { backgroundColor: "#fff", color: "#f44336", border: "1px solid #f44336", padding: "8px 12px", borderRadius: '6px', cursor: "pointer" };
const btnRevoke = { backgroundColor: "#fef2f2", color: "#dc2626", border: "none", padding: "6px 10px", borderRadius: '6px', cursor: "pointer", fontSize: '12px' };

export default AdminPanel;