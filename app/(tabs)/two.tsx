import { StyleSheet } from "react-native";

import EditScreenInfo from "@/components/EditScreenInfo";
import { Text, View } from "@/components/Themed";
import {
  addDoc,
  collection,
  getDocs,
  query,
  where,
  updateDoc,
  doc,
  getDoc,
} from "firebase/firestore";
import { db, auth } from "@/FirebaseConfig";
import { useEffect, useState } from "react";

const buildsCollectionRef = collection(db, "builds");

const convertHeight = (inches: number) => {
  const feet = Math.floor(inches / 12);
  const remainingInches = inches % 12;
  return `${feet}'${remainingInches}"`;
};

export default function TabTwoScreen() {
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

  const handleGamertagChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setNewGamertag(event.target.value);
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

  const inchesToFeetAndInches = (inches: number) => {
    const feet = Math.floor(inches / 12);
    const remainingInches = inches % 12;
    return {
      feet,
      remainingInches,
    };
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Tab Two</Text>
      <View
        style={styles.separator}
        lightColor="#eee"
        darkColor="rgba(255,255,255,0.1)"
      />
      <Text>{JSON.stringify(inchesToFeetAndInches(70))}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  title: {
    fontSize: 20,
    fontWeight: "bold",
  },
  separator: {
    marginVertical: 30,
    height: 1,
    width: "80%",
  },
});
