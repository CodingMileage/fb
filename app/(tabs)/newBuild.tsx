import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  Dimensions,
} from "react-native";
import { Picker } from "@react-native-picker/picker";
import Slider from "@react-native-community/slider";
import { db, auth } from "@/FirebaseConfig";
import {
  doc,
  addDoc,
  arrayUnion,
  collection,
  updateDoc,
} from "firebase/firestore";
import { useNavigation } from "@react-navigation/native";

const { width } = Dimensions.get("window");

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

const attributeCategories = {
  finishing: Object.entries(attributes).slice(0, 5),
  shooting: Object.entries(attributes).slice(5, 8),
  playmaking: Object.entries(attributes).slice(8, 11),
  defense: Object.entries(attributes).slice(11, 17),
  physical: Object.entries(attributes).slice(17, 21),
};

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

// Convert inches to feet and inches
const inchesToFeetAndInches = (inches: number) => {
  const feet = Math.floor(inches / 12);
  const remainingInches = inches % 12;
  return `${feet}'${remainingInches}"`;
};

const NewBuildScreen = () => {
  const navigation = useNavigation();
  const [newUserGamerTag, setNewUserGamerTag] = useState("");
  const [newBuildHeight, setNewBuildHeight] = useState(69);
  const [newBuildWeight, setNewBuildWeight] = useState(150);
  const [newBuildPosition, setNewBuildPosition] = useState("");
  const [newBuildRole, setNewBuildRole] = useState("");
  const [newBuildWingspan, setNewBuildWingspan] = useState(69);
  const [error, setError] = useState<string | null>(null);

  const [attributesState, setAttributesState] = useState(
    Object.keys(attributes).reduce((acc, attr) => {
      acc[attr] = 25;
      return acc;
    }, {})
  );

  const handleAttributeChange = (attribute: string, value: number) => {
    setAttributesState((prev) => ({
      ...prev,
      [attribute]: value,
    }));
  };

  const heightOptions = (position: string) => {
    const range = heightRanges[position] || { min: 69, max: 79 };
    return Array.from(
      { length: range.max - range.min + 1 },
      (_, i) => range.min + i
    );
  };

  const isFormValid = () => {
    return (
      newBuildHeight > 0 &&
      newBuildRole !== "" &&
      newUserGamerTag.trim().length > 0
    );
  };

  const onSubmitBuild = async () => {
    if (!auth.currentUser) {
      console.log("User is not authenticated");
      return;
    }

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
      const buildsCollectionRef = collection(db, "builds");

      // Add the new build document
      const newBuildDocRef = await addDoc(buildsCollectionRef, {
        height: newBuildHeight,
        weight: newBuildWeight,
        wingspan: newBuildWingspan,
        position: newBuildPosition,
        userId: userId,
        gamertag: newUserGamerTag,
        role: newBuildRole,
        likes: 0,
        ...attributesState,
        timestamp: new Date(),
      });

      // Update the user's document to include the new build ID
      const userDocRef = doc(db, "users", userId);
      await updateDoc(userDocRef, {
        gamertag: newUserGamerTag,
        builds: arrayUnion(newBuildDocRef.id),
      });

      // Reset form and navigate
      navigation.navigate("Community");
      setError(null);
    } catch (error) {
      console.error("Error adding build: ", error);
    }
  };

  const renderAttributeSliders = (category, color) => {
    return category.map(([key, label]) => (
      <View key={key} style={styles.attributeContainer}>
        <Text style={styles.attributeLabel}>{label}</Text>
        <View style={styles.sliderContainer}>
          <Slider
            value={attributesState[key]}
            onValueChange={(value) => handleAttributeChange(key, value)}
            minimumValue={25}
            maximumValue={99}
            step={1}
            minimumTrackTintColor={color}
            maximumTrackTintColor="gray"
            thumbTintColor={color}
          />
          <TextInput
            style={styles.attributeInput}
            value={attributesState[key].toString()}
            onChangeText={(text) => {
              const value = parseInt(text) || 25;
              handleAttributeChange(key, Math.max(25, Math.min(99, value)));
            }}
            keyboardType="numeric"
          />
        </View>
      </View>
    ));
  };

  return (
    <ScrollView style={styles.container}>
      <View style={styles.card}>
        <Text style={styles.title}>Build Details</Text>

        <TextInput
          style={styles.input}
          placeholder="Gamertag"
          value={newUserGamerTag}
          onChangeText={setNewUserGamerTag}
        />

        <View style={styles.pickerContainer}>
          <Text style={styles.label}>Build Position</Text>
          <Picker
            selectedValue={newBuildPosition}
            onValueChange={(itemValue) => {
              setNewBuildPosition(itemValue);
              setNewBuildHeight(heightRanges[itemValue]?.min || 69);
              setNewBuildWingspan(heightRanges[itemValue]?.min || 69);
            }}
          >
            <Picker.Item label="Select Position" value="" />
            {Object.keys(heightRanges).map((position) => (
              <Picker.Item key={position} label={position} value={position} />
            ))}
          </Picker>
        </View>

        <View style={styles.pickerContainer}>
          <Text style={styles.label}>Build Role</Text>
          <Picker
            selectedValue={newBuildRole}
            onValueChange={setNewBuildRole}
            enabled={!!newBuildPosition}
          >
            <Picker.Item label="Select Role" value="" />
            {(positionsToRoles[newBuildPosition] || []).map((role) => (
              <Picker.Item key={role} label={role} value={role} />
            ))}
          </Picker>
        </View>

        <View style={styles.pickerContainer}>
          <Text style={styles.label}>Build Height</Text>
          <Picker
            selectedValue={newBuildHeight}
            onValueChange={(itemValue) => setNewBuildHeight(itemValue)}
          >
            {heightOptions(newBuildPosition).map((height) => (
              <Picker.Item
                key={height}
                label={inchesToFeetAndInches(height)}
                value={height}
              />
            ))}
          </Picker>
        </View>

        <TextInput
          style={styles.input}
          placeholder="Build Weight"
          value={newBuildWeight.toString()}
          onChangeText={(text) => setNewBuildWeight(parseInt(text) || 150)}
          keyboardType="numeric"
        />
      </View>

      {/* Attribute Categories */}
      <View style={[styles.card, { backgroundColor: "#2196F3" }]}>
        {renderAttributeSliders(attributeCategories.finishing, "#2196F3")}
      </View>

      <View style={[styles.card, { backgroundColor: "#4CAF50" }]}>
        {renderAttributeSliders(attributeCategories.shooting, "#4CAF50")}
      </View>

      <View style={[styles.card, { backgroundColor: "#FFC107" }]}>
        {renderAttributeSliders(attributeCategories.playmaking, "#FFC107")}
      </View>

      <View style={[styles.card, { backgroundColor: "#F44336" }]}>
        {renderAttributeSliders(attributeCategories.defense, "#F44336")}
      </View>

      <View style={[styles.card, { backgroundColor: "#FF9800" }]}>
        {renderAttributeSliders(attributeCategories.physical, "#FF9800")}
      </View>

      <TouchableOpacity
        style={[styles.submitButton, { opacity: isFormValid() ? 1 : 0.5 }]}
        onPress={onSubmitBuild}
        disabled={!isFormValid()}
      >
        <Text style={styles.submitButtonText}>Submit Build</Text>
      </TouchableOpacity>

      {error && <Text style={styles.errorText}>{error}</Text>}
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f4f4f4",
  },
  card: {
    backgroundColor: "white",
    borderRadius: 8,
    padding: 16,
    marginVertical: 8,
    marginHorizontal: 16,
  },
  title: {
    fontSize: 20,
    fontWeight: "bold",
    textAlign: "center",
    marginBottom: 16,
  },
  input: {
    borderWidth: 1,
    borderColor: "#ddd",
    borderRadius: 4,
    padding: 8,
    marginVertical: 8,
  },
  pickerContainer: {
    marginVertical: 8,
  },
  label: {
    fontSize: 16,
    marginBottom: 8,
  },
  attributeContainer: {
    flexDirection: "row",
    alignItems: "center",
    marginVertical: 8,
  },
  attributeLabel: {
    flex: 1,
    fontSize: 14,
    color: "white",
  },
  sliderContainer: {
    flex: 2,
    flexDirection: "row",
    alignItems: "center",
  },
  attributeInput: {
    width: 50,
    textAlign: "center",
    borderWidth: 1,
    borderColor: "white",
    color: "white",
    marginLeft: 8,
  },
  submitButton: {
    backgroundColor: "#007bff",
    padding: 16,
    borderRadius: 8,
    marginHorizontal: 16,
    marginVertical: 16,
    alignItems: "center",
  },
  submitButtonText: {
    color: "white",
    fontSize: 16,
    fontWeight: "bold",
  },
  errorText: {
    color: "red",
    textAlign: "center",
    marginTop: 16,
  },
});

export default NewBuildScreen;
