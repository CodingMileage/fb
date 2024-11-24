import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  ActivityIndicator,
  TouchableOpacity,
  Dimensions,
} from "react-native";
import { useNavigation, useRoute } from "@react-navigation/native";
import { db, auth } from "@/FirebaseConfig";
import {
  doc,
  getDoc,
  collection,
  getDocs,
  deleteDoc,
  updateDoc,
  arrayRemove,
} from "firebase/firestore";
import { PieChart } from "react-native-chart-kit";

// Helper function to convert height
const convertHeight = (height: number) => {
  const feet = Math.floor(height / 12);
  const inches = height % 12;
  return `${feet}'${inches}"`;
};

const BuildDetails = () => {
  const navigation = useNavigation();
  const route = useRoute();
  const [buildId, setBuildId] = useState<string | null>(null);
  const [buildData, setBuildData] = useState<any>(null);
  const [samePositionBuilds, setSamePositionBuilds] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [overallPercentile, setOverallPercentile] = useState<string | null>(
    null
  );

  const deleteBuild = async (id: string) => {
    try {
      const userId = auth.currentUser?.uid;
      if (!userId) {
        console.error("User is not authenticated");
        return;
      }

      const buildDocRef = doc(db, "builds", id);
      const userDocRef = doc(db, "users", userId);

      await deleteDoc(buildDocRef);
      await updateDoc(userDocRef, {
        builds: arrayRemove(id),
      });

      navigation.goBack();
    } catch (error) {
      console.error("Error deleting build: ", error);
      setError("Failed to delete the build.");
    }
  };

  useEffect(() => {
    setBuildId(route.params?.id);
  }, [route.params]);

  useEffect(() => {
    if (!buildId) return;

    const fetchBuildData = async () => {
      try {
        const buildDocRef = doc(db, "builds", buildId);
        const docSnap = await getDoc(buildDocRef);

        if (docSnap.exists()) {
          setBuildData(docSnap.data());
        } else {
          setError("No such build exists.");
        }
      } catch (err) {
        setError("Error fetching build data.");
      }
      setLoading(false);
    };

    fetchBuildData();
  }, [buildId]);

  useEffect(() => {
    if (!buildData) return;

    const fetchSamePositionBuilds = async () => {
      try {
        const buildsCollectionRef = collection(db, "builds");
        const buildsSnapshot = await getDocs(buildsCollectionRef);
        const buildsList = buildsSnapshot.docs
          .map((doc) => doc.data())
          .filter((build) => build.position === buildData.position);
        setSamePositionBuilds(buildsList);
      } catch (err) {
        setError("Error fetching builds with the same position.");
      }
    };

    fetchSamePositionBuilds();
  }, [buildData]);

  useEffect(() => {
    if (buildData && samePositionBuilds.length > 0) {
      const calculatePercentile = (attribute: string) => {
        const values = samePositionBuilds.map((build) => build[attribute]);
        values.sort((a, b) => a - b);
        const selectedValue = buildData[attribute];
        const rank = values.findIndex((value) => value === selectedValue) + 1;
        return (rank / values.length) * 100;
      };

      const heightPercentile = calculatePercentile("height");
      const weightPercentile = calculatePercentile("weight");
      const overall = (heightPercentile + weightPercentile) / 2;
      setOverallPercentile(overall.toFixed(2));
    }
  }, [buildData, samePositionBuilds]);

  if (loading) return <ActivityIndicator size="large" color="#0000ff" />;
  if (error) return <Text style={styles.errorText}>{error}</Text>;

  const finishing =
    buildData.closeShot +
    buildData.drivingLayup +
    buildData.drivingDunk +
    buildData.standingDunk +
    buildData.postControl -
    200;

  const shooting =
    buildData.midRange + buildData.threePointer + buildData.freeThrow - 65;

  const playmaking =
    buildData.passAccuracy +
    buildData.ballHandle +
    buildData.speedWithBall -
    65;

  const defense =
    buildData.interiorDefense +
    buildData.perimeterDefense +
    buildData.steal +
    buildData.block +
    buildData.offensiveRebound +
    buildData.defensiveRebound -
    200;

  const pieData = [
    {
      name: "Finishing",
      population: finishing,
      color: "#3437eb",
      legendFontColor: "#7F7F7F",
    },
    {
      name: "Shooting",
      population: shooting,
      color: "#08fc00",
      legendFontColor: "#7F7F7F",
    },
    {
      name: "Playmaking",
      population: playmaking,
      color: "#ebdf0c",
      legendFontColor: "#7F7F7F",
    },
    {
      name: "Defense",
      population: defense,
      color: "#fc0019",
      legendFontColor: "#7F7F7F",
    },
  ];

  const AttributeCard = ({
    title,
    data,
    backgroundColor,
  }: {
    title: string;
    data: any;
    backgroundColor: string;
  }) => (
    <View style={[styles.card, { backgroundColor }]}>
      {Object.entries(data).map(([key, value]) => (
        <View key={key} style={styles.attributeRow}>
          <Text style={styles.attributeLabel}>{key}:</Text>
          <Text style={styles.attributeValue}>{value}</Text>
        </View>
      ))}
    </View>
  );

  return (
    <ScrollView style={styles.container}>
      {buildData && (
        <>
          <View style={styles.header}>
            <View style={styles.headerInfo}>
              <Text style={styles.headerText}>
                Position: {buildData.position}
              </Text>
              <Text style={styles.headerText}>
                Height: {convertHeight(buildData.height)}
              </Text>
              <Text style={styles.headerText}>Weight: {buildData.weight}</Text>
              <Text style={styles.headerText}>
                Wingspan: {convertHeight(buildData.wingspan)}
              </Text>
              <Text style={styles.headerText}>Role: {buildData.role}</Text>
              <Text style={styles.headerText}>
                Uploader: {buildData.gamertag}
              </Text>
              <Text style={styles.headerText}>Likes: {buildData.likes}</Text>
            </View>
          </View>

          <View style={styles.attributesContainer}>
            <AttributeCard
              title="Finishing"
              data={{
                "Close Shot": buildData.closeShot,
                "Driving Layup": buildData.drivingLayup,
                "Driving Dunk": buildData.drivingDunk,
                "Standing Dunk": buildData.standingDunk,
                "Post Control": buildData.postControl,
              }}
              backgroundColor="#3437eb"
            />

            <AttributeCard
              title="Shooting"
              data={{
                "Mid Range": buildData.midRange,
                "Three Pointer": buildData.threePointer,
                "Free Throw": buildData.freeThrow,
              }}
              backgroundColor="#08fc00"
            />

            <AttributeCard
              title="Playmaking"
              data={{
                "Pass Accuracy": buildData.passAccuracy,
                "Ball Handle": buildData.ballHandle,
                "Speed with Ball": buildData.speedWithBall,
              }}
              backgroundColor="#ebdf0c"
            />

            <AttributeCard
              title="Defense"
              data={{
                "Interior Defense": buildData.interiorDefense,
                "Perimeter Defense": buildData.perimeterDefense,
                Steal: buildData.steal,
                Block: buildData.block,
                "Offensive Rebound": buildData.offensiveRebound,
                "Defensive Rebound": buildData.defensiveRebound,
              }}
              backgroundColor="#fc0019"
            />
          </View>

          {overallPercentile && (
            <Text style={styles.percentileText}>
              {auth.currentUser?.uid === buildData.userId ? "Your" : "This"}{" "}
              build ranks in the {overallPercentile}th percentile among other{" "}
              {buildData.position}s.
            </Text>
          )}

          <View style={styles.chartContainer}>
            <PieChart
              data={pieData}
              width={Dimensions.get("window").width - 32}
              height={220}
              chartConfig={{
                backgroundColor: "#1e1e1e",
                backgroundGradientFrom: "#1e1e1e",
                backgroundGradientTo: "#1e1e1e",
                color: (opacity = 1) => `rgba(255, 255, 255, ${opacity})`,
              }}
              accessor="population"
              backgroundColor="transparent"
              paddingLeft="15"
            />
          </View>

          {auth.currentUser?.uid === buildData.userId && (
            <TouchableOpacity
              style={styles.deleteButton}
              onPress={() => buildId && deleteBuild(buildId)}
            >
              <Text style={styles.deleteButtonText}>Delete Build</Text>
            </TouchableOpacity>
          )}
        </>
      )}
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#1e1e1e",
    padding: 16,
  },
  header: {
    backgroundColor: "rgba(100, 116, 139, 0.3)",
    borderRadius: 8,
    padding: 16,
    marginBottom: 16,
  },
  headerInfo: {
    gap: 8,
  },
  headerText: {
    color: "white",
    fontSize: 16,
    fontWeight: "600",
  },
  attributesContainer: {
    gap: 16,
  },
  card: {
    padding: 16,
    borderRadius: 8,
    marginBottom: 16,
  },
  attributeRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    borderBottomWidth: 1,
    borderBottomColor: "rgba(255, 255, 255, 0.3)",
    paddingVertical: 8,
  },
  attributeLabel: {
    color: "white",
    fontSize: 16,
    fontWeight: "600",
  },
  attributeValue: {
    color: "white",
    fontSize: 16,
  },
  percentileText: {
    color: "white",
    fontSize: 16,
    textAlign: "center",
    marginVertical: 16,
  },
  chartContainer: {
    alignItems: "center",
    backgroundColor: "rgba(100, 116, 139, 0.3)",
    borderRadius: 8,
    padding: 16,
    marginVertical: 16,
  },
  deleteButton: {
    backgroundColor: "#dc2626",
    padding: 16,
    borderRadius: 8,
    alignItems: "center",
    marginTop: 16,
  },
  deleteButtonText: {
    color: "white",
    fontSize: 16,
    fontWeight: "600",
  },
  errorText: {
    color: "#dc2626",
    fontSize: 16,
    textAlign: "center",
    marginTop: 16,
  },
});

export default BuildDetails;
