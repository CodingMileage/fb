import { View, Text, SafeAreaView, StyleSheet, TextInput } from "react-native";
import { useEffect, useState } from "react";
import { db, auth } from "@/FirebaseConfig";
import {
  doc,
  addDoc,
  arrayUnion,
  collection,
  getDocs,
  query,
  updateDoc,
  where,
  getDoc,
  setDoc,
} from "firebase/firestore";
import { useRouter } from "expo-router";

const attributes = {
  closeShot: "Close Shot",
  drivingLayup: "Driving Layup",
  drivingDunk: "Driving Dunk",
  standingDunk: "Standing Dunk",
  postControl: "Post Control",
  midRange: "Mid-Range",
  threePointer: "Three-Pointer",
  freeThrow: "Free Throw",
  passAccuracy: "Pass Accuracy",
  ballHandle: "Ball Handle",
  speedWithBall: "Speed With Ball",
  interiorDefense: "Interior Defense",
  perimeterDefense: "Perimeter Defense",
  steal: "Steal",
  block: "Block",
  offensiveRebound: "Offensive Rebound",
  defensiveRebound: "Defensive Rebound",
  speed: "Speed",
  agility: "Agility",
  strength: "Strength",
  vertical: "Vertical",
};

const finishingAtt = Object.entries(attributes).slice(0, 5);
const shootingAtt = Object.entries(attributes).slice(5, 8);
const playmakingAtt = Object.entries(attributes).slice(8, 11);
const defAtt = Object.entries(attributes).slice(11, 17);
const physicalAtt = Object.entries(attributes).slice(17, 21);

const buildsCollectionRef = collection(db, "builds");
const userCollectionRef = collection(db, "users");

// Convert inches to feet and inches
const inchesToFeetAndInches = (inches: number) => {
  const feet = Math.floor(inches / 12);
  const remainingInches = inches % 12;
  return { feet, remainingInches };
};

const newBuild = () => {
  const [newUserGamerTag, setNewUserGamerTag] = useState("");
  const [newBuildHeight, setNewBuildHeight] = useState(69); // Default to 5'9" in inches
  const [newBuildWeight, setNewBuildWeight] = useState(150);
  const [newBuildPosition, setNewBuildPosition] = useState("");
  const [newBuildRole, setNewBuildRole] = useState("");
  const [newBuildWingspan, setNewBuildWingspan] = useState(69);
  const [newBuildLikes, setNewBuildLikes] = useState(0);
  const [attributesState, setAttributesState] = useState(
    Object.keys(attributes).reduce((acc, attr) => {
      acc[attr] = 25;
      return acc;
    }, {})
  );

  interface AttributesState {
    closeShot: number;
    drivingLayup: number;
    drivingDunk: number;
    standingDunk: number;
    postControl: number;
    midRange: number;
    threePointer: number;
    freeThrow: number;
    passAccuracy: number;
    ballHandle: number;
    speedWithBall: number;
    interiorDefense: number;
    perimeterDefense: number;
    steal: number;
    block: number;
    offensiveRebound: number;
    defensiveRebound: number;
    speed: number;
    agility: number;
    strength: number;
    vertical: number;
  }

  const positionsToRoles = {
    PG: ["ISO Guard", "PNR Guard", "Lock"],
    SG: ["ISO Guard", "2BH", "Lock"],
    SF: ["2BH", "Lock", "Backend"],
    PF: ["Backend", "Inside", "Outside"],
    C: ["Inside C", "Outside C"],
  };

  const heightRanges = {
    PG: { min: 69, max: 79 }, // 5'9" - 6'7"
    SG: { min: 76, max: 81 }, // 6'4" - 6'9"
    SF: { min: 77, max: 83 }, // 6'5" - 6'11"
    PF: { min: 78, max: 84 }, // 6'6" - 7'0"
    C: { min: 79, max: 87 }, // 6'7" - 7'3"
  };

  const heightOptions = (position: string) => {
    const range = heightRanges[position] || { min: 69, max: 79 };
    const options: number[] = [];
    for (let i = range.min; i <= range.max; i++) {
      options.push(i);
    }
    return options;
  };

  const isFormValid = () => {
    return (
      newBuildHeight > 0 &&
      newBuildRole !== "" &&
      newUserGamerTag.trim().length > 0
    );
  };

  const router = useRouter();

  const [userHasGamertag, setUserHasGamertag] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [gamertag, setGamertag] = useState<string | null>(null);

  useEffect(() => {
    const fetchUserData = async () => {
      if (!auth.currentUser) {
        setError("User not authenticated.");
        setLoading(false);
        return;
      }

      try {
        const userDocRef = doc(db, "users", auth.currentUser.uid);
        const userDocSnapshot = await getDoc(userDocRef);

        if (userDocSnapshot.exists()) {
          const userData = userDocSnapshot.data();
          const userGamertag = userData?.gamertag;

          if (!userGamertag) {
            // Check if gamertag is empty
            // alert("Please input a gamertag.");
            setError("Gamertag is required.");
            setGamertag(""); // Reset the gamertag state
          } else {
            console.log("Fetched Gamertag:", userGamertag); // Debugging
            setGamertag(userGamertag);
            setNewUserGamerTag(userGamertag);
            setUserHasGamertag(true);
          }
        } else {
          console.log("No document found for user"); // Debugging
          setGamertag("");
        }
      } catch (error) {
        console.error("Error fetching user data:", error);
        setError("Failed to load user data.");
      } finally {
        setLoading(false);
      }
    };

    fetchUserData();
  }, []);

  const handleSliderChange = (attribute) => (event, newValue) => {
    setAttributesState((prev) => ({ ...prev, [attribute]: newValue }));
  };

  const handleInputChange = (attribute) => (event) => {
    const value = event.target.value === "" ? 25 : Number(event.target.value);
    setAttributesState((prev) => ({
      ...prev,
      [attribute]: Math.max(25, Math.min(99, value)),
    }));
  };

  const handleWeightChange = (event) => {
    setNewBuildWeight(Number(event.target.value));
  };

  const addNewBuild = async (newBuildData: any, userId: string) => {
    try {
      // Reference to the builds collection
      const buildsCollectionRef = collection(db, "builds");

      // Add the new build to the builds collection
      const newBuildDocRef = await addDoc(buildsCollectionRef, {
        ...newBuildData,
        userId: userId, // Ensure userId is added to the build
        timestamp: new Date(),
      });

      console.log("New build added with ID:", newBuildDocRef.id);

      // Call the function to update the user's document
      await updateUserBuilds(userId, newBuildDocRef.id);
    } catch (error) {
      console.error("Error adding new build:", error);
    }
  };

  const updateUserBuilds = async (userId: string, buildId: string) => {
    try {
      // Reference to the user's document
      const userDocRef = doc(db, "users", userId);

      // Update the user's document to include the new build ID
      await updateDoc(userDocRef, {
        builds: arrayUnion(buildId),
      });

      console.log("User document updated with new build ID");
    } catch (error) {
      console.error("Error updating user document:", error);
    }
  };

  const userCollectionRef = collection(db, "users");
  const buildsCollectionRef = collection(db, "builds");

  const onSubmitBuild = async () => {
    if (!auth.currentUser) {
      console.log("User is not authenticated");
      return;
    }

    // Validate gamertag and form inputs
    if (newUserGamerTag.length < 4) {
      setError("Gamertag must be at least 4 characters long.");
      return;
    }

    if (!isFormValid()) {
      setError("Build Height and Build Role are required.");
      return;
    }

    try {
      const userId = auth.currentUser.uid;
      const userDocRef = doc(db, "users", userId);

      // Add the new build document
      const newBuildDocRef = await addDoc(buildsCollectionRef, {
        height: newBuildHeight,
        weight: newBuildWeight,
        wingspan: newBuildWingspan,
        position: newBuildPosition,
        userId: userId,
        gamertag: newUserGamerTag,
        role: newBuildRole,
        likes: newBuildLikes,
        ...attributesState,
        timestamp: new Date(),
      });

      // Update the user's document to include the new build ID in the builds array
      await updateDoc(userDocRef, {
        gamertag: newUserGamerTag,
        builds: arrayUnion(newBuildDocRef.id),
      });

      // Reset form fields and navigate
      setNewBuildHeight(69);
      setNewBuildWeight(150);
      setNewBuildWingspan(69);
      setNewBuildPosition("");
      setNewBuildRole("");
      setAttributesState(
        Object.keys(attributes).reduce((acc, attr) => {
          acc[attr] = 25;
          return acc;
        }, {})
      );
      router.push("/community");
      setError(null); // Clear any previous errors
    } catch (error) {
      console.error("Error adding build: ", error);
    }
  };

  const { feet, remainingInches } = inchesToFeetAndInches(newBuildHeight);

  return (
    <SafeAreaView style={styles.container}>
      <Text style={styles.text}>Hi {gamertag}</Text>
      <TextInput
        style={styles.input}
        placeholder="Gamertag"
        onChange={(e) => setNewUserGamerTag(e.target.value)}
        value={newUserGamerTag}
      ></TextInput>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    flexDirection: "column",
    backgroundColor: "brown",
  },
  input: {
    height: 40,
    margin: 12,
    borderWidth: 1,
    padding: 10,
    color: "white",
  },
  text: {
    color: "white",
  },
});

export default newBuild;
