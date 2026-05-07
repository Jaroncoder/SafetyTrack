import React, { useState } from "react";
import { auth, db, ref, set } from "../firebase";
import { createUserWithEmailAndPassword, signInWithEmailAndPassword } from "firebase/auth";

function VolunteerAuth() {
  const [isLogin, setIsLogin] = useState(true);
  const [formData, setFormData] = useState({ 
    email: "", 
    password: "", 
    name: "", 
    sector: "", 
    idNumber: "", // Aadhaar or Government ID
    phone: "" 
  });

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (isLogin) {
        await signInWithEmailAndPassword(auth, formData.email, formData.password);
      } else {
        const userCred = await createUserWithEmailAndPassword(auth, formData.email, formData.password);
        const user = userCred.user;

        // Save all info as text in the Database
        await set(ref(db, `volunteers/${user.uid}`), {
          uid: user.uid,
          name: formData.name,
          sector: formData.sector,
          email: formData.email,
          idNumber: formData.idNumber, // Text-based ID
          phone: formData.phone,
          isApproved: false, // Default to false for vetting
          joinedAt: Date.now()
        });
      }
    } catch (err) {
      alert(err.message);
    }
  };

  return (
    <div style={{ padding: "40px", maxWidth: "400px", margin: "0 auto", fontFamily: 'sans-serif' }}>
      <h2 style={{ textAlign: 'center' }}>Volunteer {isLogin ? "Login" : "Register"}</h2>
      <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
        {!isLogin && (
          <>
            <input placeholder="Full Name" onChange={e => setFormData({...formData, name: e.target.value})} required />
            <input placeholder="Sector (Ex-Police, NGO)" onChange={e => setFormData({...formData, sector: e.target.value})} required />
            <input placeholder="ID Number (Aadhaar/License)" onChange={e => setFormData({...formData, idNumber: e.target.value})} required />
            <input placeholder="Phone Number" onChange={e => setFormData({...formData, phone: e.target.value})} required />
          </>
        )}
        <input type="email" placeholder="Email" onChange={e => setFormData({...formData, email: e.target.value})} required />
        <input type="password" placeholder="Password" onChange={e => setFormData({...formData, password: e.target.value})} required />
        <button type="submit" style={{ padding: '12px', backgroundColor: '#4a90e2', color: 'white', border: 'none', borderRadius: '5px', fontWeight: 'bold', cursor: 'pointer' }}>
          {isLogin ? "Login" : "Register for Vetting"}
        </button>
      </form>
      <p onClick={() => setIsLogin(!isLogin)} style={{ textAlign: 'center', cursor: 'pointer', color: '#4a90e2', marginTop: '20px' }}>
        {isLogin ? "New volunteer? Create an account" : "Already registered? Login"}
      </p>
    </div>
  );
}

export default VolunteerAuth;