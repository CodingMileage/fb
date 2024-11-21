import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  ActivityIndicator,
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
                  Height: {convertHeight(build.height)} | Weight: {build.weight}{" "}
                  | Wingspan: {convertHeight(build.wingspan)} | Role:{" "}
                  {build.role}
                </Text>
              </View>
            ))}
          </View>
        )}
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f5f5f5",
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
});

export default ProfileScreen;
