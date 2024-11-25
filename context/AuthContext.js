import React, { createContext, useState, useEffect } from "react";
import { db, auth, googleProvider } from "@/FirebaseConfig";
import { signInWithPopup, signOut, onAuthStateChanged, signInWithEmailAndPassword } from "firebase/auth";
import { doc, getDoc, setDoc } from "firebase/firestore";

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [error, setError] = useState(null);
  const [reloadTrigger, setReloadTrigger] = useState(false);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      if (currentUser) {
        handleUserDocument(currentUser);
      }
      setUser(currentUser);
    });

    // Cleanup subscription on unmount
    return () => unsubscribe();
  }, []);

  const handleUserDocument = async (user) => {
    try {
      const userDocRef = doc(db, "users", user.uid);
      const userDocSnapshot = await getDoc(userDocRef);

      if (!userDocSnapshot.exists()) {
        // Create user document with default values
        await setDoc(userDocRef, {
          gamertag: "", // or any other default values
          email: user.email || "",
          likedBuilds: [],
          builds: [],
          post: [],
          likedPost: [],
          createdAt: new Date(),
        });
        console.log("New user document created.");
      }
    } catch (error) {
      console.error("Error handling user document: ", error);
    }
  };

  const signInGoogle = async () => {
    try {
      await signInWithPopup(auth, googleProvider);
      setError(null);
    } catch (err) {
      console.error(err);
      setError("Failed to sign in. Please try again.");
    }
  };

  const handleSignIn = async (email, password) => {
    try {
      const user = await signInWithEmailAndPassword(auth, email, password);
      setReloadTrigger(prev => !prev);
    } catch (error) {
      console.log(error);
      alert("Sign in failed: " + error.message);
    }
  };

  const handleSignOut = async () => {
    try {
      await signOut(auth);
      setReloadTrigger(prev => !prev);
      setError(null);
    } catch (err) {
      console.error(err);
      setError("Failed to sign out. Please try again.");
    }
  };

  return (
    <AuthContext.Provider value={{ user, signInGoogle, handleSignIn, handleSignOut, reloadTrigger, error }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => React.useContext(AuthContext);
