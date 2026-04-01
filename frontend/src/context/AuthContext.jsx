import React, { createContext, useContext, useState, useEffect } from 'react';
import { 
  createUserWithEmailAndPassword, 
  signInWithEmailAndPassword, 
  signOut, 
  onAuthStateChanged,
  sendPasswordResetEmail,
  deleteUser
} from 'firebase/auth';
import { doc, onSnapshot } from 'firebase/firestore'; // <-- Moved to correct library
import { auth, db } from '../services/firebase';      // <-- Grabbed db from firebase.js
import { initializeUserProfile } from '../services/db';

// Create the Context
const AuthContext = createContext();

// Custom hook to use the Auth Context easily
export function useAuth() {
  return useContext(AuthContext);
}

export function AuthProvider({ children }) {
  const [currentUser, setCurrentUser] = useState(null);
  const [userProfile, setUserProfile] = useState(null);
  const [loading, setLoading] = useState(true);

  // Authentication Methods
  function signup(email, password) {
    return createUserWithEmailAndPassword(auth, email, password);
  }

  function login(email, password) {
    return signInWithEmailAndPassword(auth, email, password);
  }

  function logout() {
    return signOut(auth);
  }

  function resetPassword(email) {
    return sendPasswordResetEmail(auth, email);
  }

  function deleteAccount() {
    if (currentUser) {
      return deleteUser(currentUser);
    }
  }

  useEffect(() => {
    let profileUnsubscribe; // Track the snapshot listener outside the callback

    const unsubscribeAuth = onAuthStateChanged(auth, async (user) => {
      setCurrentUser(user);
      
      if (user) {
        // 1. Ensure they have a profile in the database
        await initializeUserProfile(user.uid, user.email);
        
        // 2. Set up a live listener for their Sparks and Tier
        profileUnsubscribe = onSnapshot(doc(db, "users", user.uid), (docSnapshot) => {
          if (docSnapshot.exists()) {
            setUserProfile(docSnapshot.data());
          }
        });
      } else {
        setUserProfile(null);
        // If they log out, clean up the database listener so it doesn't cause memory leaks
        if (profileUnsubscribe) profileUnsubscribe();
      }
      
      // THIS MUST RUN NO MATTER WHAT! 
      // It tells React it's safe to finally draw the screen.
      setLoading(false);
    });

    // When the whole app unmounts, clean up BOTH Firebase listeners securely
    return () => {
      unsubscribeAuth();
      if (profileUnsubscribe) profileUnsubscribe();
    };
  }, []);

  const value = {
    currentUser,
    userProfile,
    signup,
    login,
    logout,
    resetPassword,
    deleteAccount
  };

  return (
    <AuthContext.Provider value={value}>
      {/* Do not render children until Firebase has checked the auth state */}
      {!loading && children}
    </AuthContext.Provider>
  );
}