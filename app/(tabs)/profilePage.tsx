import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  ActivityIndicator,
  SafeAreaView,
} from "react-native";
import { db, auth } from "@/FirebaseConfig";
import {
  doc,
  getDoc,
  updateDoc,
  collection,
  query,
  where,
  getDocs,
} from "firebase/firestore";
import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut as firebaseSignOut,
} from "firebase/auth";
import { router } from "expo-router";

const convertHeight = (inches: number) => {
  const feet = Math.floor(inches / 12);
  const remainingInches = inches % 12;
  return `${feet}'${remainingInches}"`;
};

const ProfileScreen = () => {
  const [gamertag, setGamertag] = useState<string | null>(null);
  const [newGamertag, setNewGamertag] = useState<string>("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [buildCount, setBuildCount] = useState<number>(0);
  const [userBuilds, setUserBuilds] = useState<any[]>([]);
  const [isEditing, setIsEditing] = useState<boolean>(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const signIn = async () => {
    try {
      const user = await signInWithEmailAndPassword(auth, email, password);
      if (user) router.replace("/(tabs)/profilePage");
    } catch (error: any) {
      console.log(error);
      alert("Sign in failed: " + error.message);
    }
  };

  const signUp = async () => {
    try {
      const user = await createUserWithEmailAndPassword(auth, email, password);
      if (user) router.replace("/");
    } catch (error: any) {
      console.log(error);
      alert("Sign up failed: " + error.message);
    }
  };

  const handleSignOut = async () => {
    try {
      await firebaseSignOut(auth);
      router.replace("/(tabs)/profilePage"); // Navigate back to home screen
    } catch (error: any) {
      console.log(error);
      alert("Sign out failed: " + error.message);
    }
  };

  useEffect(() => {
    const fetchUserData = async () => {
      if (!auth.currentUser) {
        setError("User not authenticated.");
        setLoading(false);
        return;
      }

      try {
        // Fetch user's gamertag
        const userDocRef = doc(db, "users", auth.currentUser.uid);
        const userDocSnapshot = await getDoc(userDocRef);

        if (userDocSnapshot.exists()) {
          const userData = userDocSnapshot.data();
          setGamertag(userData?.gamertag || "");
        } else {
          setGamertag("");
        }

        // Fetch user's build count and builds
        const buildsCollectionRef = collection(db, "builds");
        const buildQuery = query(
          buildsCollectionRef,
          where("userId", "==", auth.currentUser.uid)
        );
        const buildQuerySnapshot = await getDocs(buildQuery);

        setBuildCount(buildQuerySnapshot.size);

        const buildsData = buildQuerySnapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        }));
        setUserBuilds(buildsData);
      } catch (error) {
        console.error("Error fetching user data:", error);
        setError("Failed to load user data.");
      } finally {
        setLoading(false);
      }
    };

    fetchUserData();
  }, []);

  const handleGamertagChange = (text: string) => {
    setNewGamertag(text);
  };

  const handleGamertagSubmit = async () => {
    if (!auth.currentUser) {
      setError("User not authenticated.");
      return;
    }

    try {
      const userDocRef = doc(db, "users", auth.currentUser.uid);
      await updateDoc(userDocRef, { gamertag: newGamertag });

      setGamertag(newGamertag);
      setNewGamertag("");
      setIsEditing(false); // Exit editing mode
    } catch (error) {
      console.error("Error updating gamertag:", error);
      setError("Failed to update gamertag.");
    }
  };

  const handleEditToggle = () => {
    setIsEditing(!isEditing); // Toggle editing mode
  };

  if (loading) {
    return (
      <View style={styles.container}>
        <ActivityIndicator size="large" color="#0000ff" />
      </View>
    );
  }

  return (
    <ScrollView style={styles.container}>
      {auth.currentUser ? (
        <View style={styles.card}>
          <Text style={styles.sectionTitle}>Gamertag</Text>
          {isEditing ? (
            <View>
              <TextInput
                style={styles.input}
                placeholder="Enter Gamertag"
                value={newGamertag}
                onChangeText={handleGamertagChange}
              />
              <View style={styles.buttonContainer}>
                <TouchableOpacity
                  style={styles.saveButton}
                  onPress={handleGamertagSubmit}
                >
                  <Text style={styles.buttonText}>Save Gamertag</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={styles.cancelButton}
                  onPress={handleEditToggle}
                >
                  <Text style={styles.buttonText}>Cancel</Text>
                </TouchableOpacity>
              </View>
              {error && <Text style={styles.errorText}>{error}</Text>}
            </View>
          ) : (
            <View>
              <Text style={styles.gamertagText}>{gamertag}</Text>
              <TouchableOpacity
                style={styles.editButton}
                onPress={handleEditToggle}
              >
                <Text style={styles.buttonText}>Edit Gamertag</Text>
              </TouchableOpacity>

              <Text style={styles.buildCountText}>
                You have {buildCount} {buildCount === 1 ? "build" : "builds"}.
              </Text>

              <Text style={styles.sectionTitle}>Your Builds:</Text>
              {userBuilds.map((build) => (
                <View key={build.id} style={styles.buildItem}>
                  <Text style={styles.buildPrimaryText}>
                    Position: {build.position}
                  </Text>
                  <Text style={styles.buildSecondaryText}>
                    Height: {convertHeight(build.height)} | Weight:{" "}
                    {build.weight} | Wingspan: {convertHeight(build.wingspan)} |
                    Role: {build.role}
                  </Text>
                </View>
              ))}
              <TouchableOpacity
                style={styles.signOutButton}
                onPress={handleSignOut}
              >
                <Text style={styles.buttonText}>Sign Out</Text>
              </TouchableOpacity>
            </View>
          )}
        </View>
      ) : (
        <SafeAreaView style={styles.container}>
          <Text style={styles.title}>Login</Text>
          <TextInput
            style={styles.textInput}
            placeholder="email"
            value={email}
            onChangeText={setEmail}
          />
          <TextInput
            style={styles.textInput}
            placeholder="password"
            value={password}
            onChangeText={setPassword}
            secureTextEntry
          />
          <TouchableOpacity style={styles.button} onPress={signIn}>
            <Text style={styles.text}>Login</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.button} onPress={signUp}>
            <Text style={styles.text}>Make Account</Text>
          </TouchableOpacity>
        </SafeAreaView>
      )}
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#6b2714",
  },
  card: {
    margin: 16,
    padding: 16,
    backgroundColor: "white",
    borderRadius: 8,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "bold",
    marginBottom: 12,
  },
  input: {
    borderWidth: 1,
    borderColor: "#ddd",
    padding: 10,
    borderRadius: 4,
    marginBottom: 12,
  },
  buttonContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 12,
  },
  saveButton: {
    backgroundColor: "#007bff",
    padding: 10,
    borderRadius: 4,
    flex: 1,
    marginRight: 8,
  },
  cancelButton: {
    backgroundColor: "#6c757d",
    padding: 10,
    borderRadius: 4,
    flex: 1,
  },
  editButton: {
    backgroundColor: "#007bff",
    padding: 10,
    borderRadius: 4,
    marginVertical: 12,
  },
  signOutButton: {
    backgroundColor: "#dc3545",
    padding: 10,
    borderRadius: 4,
    marginBottom: 16,
  },
  buttonText: {
    color: "white",
    textAlign: "center",
    fontWeight: "bold",
  },
  errorText: {
    color: "red",
    marginTop: 12,
  },
  gamertagText: {
    fontSize: 16,
    marginBottom: 12,
  },
  buildCountText: {
    marginVertical: 12,
  },
  buildItem: {
    backgroundColor: "#f9f9f9",
    padding: 12,
    borderRadius: 4,
    marginBottom: 8,
  },
  buildPrimaryText: {
    fontWeight: "bold",
    marginBottom: 4,
  },
  buildSecondaryText: {
    color: "#666",
  },
  title: {
    fontSize: 28, // A bit larger for a more striking appearance
    fontWeight: "800", // Extra bold for emphasis
    marginBottom: 40, // Increased space for a more airy, open feel
    color: "#1A237E", // A deep indigo for a sophisticated, modern look
  },
  textInput: {
    height: 50, // Standard height for elegance and simplicity
    width: "90%", // Full width for a more expansive feel
    backgroundColor: "#FFFFFF", // Pure white for contrast against the container
    borderColor: "#E8EAF6", // A very light indigo border for subtle contrast
    borderWidth: 2,
    borderRadius: 15, // Softly rounded corners for a modern, friendly touch
    marginVertical: 15,
    paddingHorizontal: 25, // Generous padding for ease of text entry
    fontSize: 16, // Comfortable reading size
    color: "#3C4858", // A dark gray for readability with a hint of warmth
    shadowColor: "#9E9E9E", // A medium gray shadow for depth
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 4, // Slightly elevated for a subtle 3D effect
  },
  button: {
    width: "90%",
    marginVertical: 15,
    backgroundColor: "#5C6BC0", // A lighter indigo to complement the title color
    padding: 20,
    borderRadius: 15, // Matching rounded corners for consistency
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#5C6BC0", // Shadow color to match the button for a cohesive look
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4,
    shadowRadius: 5,
    elevation: 5,
  },
  text: {
    color: "#FFFFFF", // Maintained white for clear visibility
    fontSize: 18, // Slightly larger for emphasis
    fontWeight: "600", // Semi-bold for a balanced weight
  },
});

export default ProfileScreen;
