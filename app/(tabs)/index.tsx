import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  Dimensions,
  Animated,
  ActivityIndicator,
  Platform,
  ScrollView,
  RefreshControl,
} from "react-native";
import Icon from "react-native-vector-icons/MaterialCommunityIcons";
import { collection, getDocs, query, orderBy, limit } from "firebase/firestore";
import { db } from "@/FirebaseConfig";
import { Link, useRouter } from "expo-router";
import { Image } from "react-native";
import { PieChart } from "react-native-chart-kit";
import { Divider } from "react-native-paper";

type Build = {
  id: string;
  userId: string;
  position: string;
  height: number;
  weight: number;
  wingspan: number;
  likes: number;
  role: string;
  timestamp: any;
  // Add more attributes for pie chart
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
};

export const convertHeight = (inches: number) => {
  const feet = Math.floor(inches / 12);
  const remainingInches = inches % 12;
  return `${feet}'${remainingInches}`;
};

export default function TabOneScreen() {
  const router = useRouter();
  const [mostPopularBuilds, setMostPopularBuilds] = useState<Build[]>([]);
  const [newestBuilds, setNewestBuilds] = useState<Build[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const screenWidth = Dimensions.get("window").width;
  const cardWidth = screenWidth / 2 - 24;

  // Calculate pie chart data for a build
  const calculateBuildPieData = (build: Build) => {
    const finishing =
      build.closeShot +
      build.drivingLayup +
      build.drivingDunk +
      build.standingDunk +
      build.postControl -
      200;

    const shooting = build.midRange + build.threePointer + build.freeThrow - 65;

    const playmaking =
      build.passAccuracy + build.ballHandle + build.speedWithBall - 65;

    const defense =
      build.interiorDefense +
      build.perimeterDefense +
      build.steal +
      build.block +
      build.offensiveRebound +
      build.defensiveRebound -
      200;

    return [
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
  };

  const fetchMostLikedBuilds = async () => {
    try {
      const buildsCollectionRef = collection(db, "builds");
      const likeQuery = query(buildsCollectionRef, orderBy("likes", "desc"));
      const querySnapshot = await getDocs(likeQuery);

      const mostLikedBuilds = querySnapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      })) as Build[];

      setMostPopularBuilds(mostLikedBuilds);
    } catch (err) {
      console.error(err);
      setError("Error fetching builds.");
    } finally {
      setLoading(false);
    }
  };

  const getNewestBuilds = async () => {
    try {
      const buildsCollectionRef = collection(db, "builds");
      const newestBuildsQuery = query(
        buildsCollectionRef,
        orderBy("timestamp", "desc"),
        limit(5)
      );
      const data = await getDocs(newestBuildsQuery);

      const filteredData = data.docs.map((doc) => ({
        ...doc.data(),
        id: doc.id,
      })) as Build[];
      setNewestBuilds(filteredData);
    } catch (error) {
      console.error("Error fetching newest builds: ", error);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await Promise.all([fetchMostLikedBuilds(), getNewestBuilds()]);
    setRefreshing(false);
  };

  useEffect(() => {
    fetchMostLikedBuilds();
    getNewestBuilds();
  }, []);

  const BuildCard = ({ item }: { item: Build }) => {
    const scaleAnim = new Animated.Value(1);
    const pieData = calculateBuildPieData(item);

    const handlePressIn = () => {
      Animated.spring(scaleAnim, {
        toValue: 1.03,
        useNativeDriver: true,
      }).start();
    };

    const handlePressOut = () => {
      Animated.spring(scaleAnim, {
        toValue: 1,
        useNativeDriver: true,
      }).start();
    };

    const handlePress = () => {
      router.push(`/build/${item.id}`);
    };

    return (
      <View style={styles.cardContainer}>
        <TouchableOpacity
          activeOpacity={0.8}
          onPressIn={handlePressIn}
          onPressOut={handlePressOut}
          onPress={handlePress}
        >
          <View className="p-4 rounded-3xl bg-slate-200">
            <View className="flex items-center justify-center">
              <PieChart
                data={pieData}
                width={Dimensions.get("window").width - 180}
                height={175}
                chartConfig={{
                  backgroundColor: "#1e1e1e",
                  backgroundGradientFrom: "#1e1e1e",
                  backgroundGradientTo: "#1e1e1e",
                  color: (opacity = 1) => `rgba(255, 255, 255, ${opacity})`,
                }}
                accessor="population"
                backgroundColor="transparent"
                paddingLeft="45"
                center={[10, 0]}
                hasLegend={false}
              />
            </View>

            <Text className="text-xl font-semibold text-center">
              {item.position}
            </Text>
            <Divider className="m-2" />

            {/* Pie Chart */}

            <View className="flex flex-row justify-center">
              <Text className="text-xl font-semibold">
                HT: {convertHeight(item.height)} |{" "}
              </Text>
              <Text className="text-xl font-semibold">
                WT: {item.weight} |{" "}
              </Text>
              <Text className="text-xl font-semibold">
                WS: {convertHeight(item.wingspan)}
              </Text>
            </View>
            <Text className="pt-2 text-xl font-semibold text-center">
              Role: {item.role}
            </Text>
            <View className="flex flex-row items-center justify-center pt-2">
              <Icon name="heart" size={24} color="red" />
              <Text className="font-bold">{item.likes}</Text>
            </View>
          </View>
        </TouchableOpacity>
      </View>
    );
  };

  if (loading) {
    return (
      <View style={styles.container}>
        <ActivityIndicator size="large" color="#0000ff" />
      </View>
    );
  }

  if (error) {
    return (
      <View style={styles.container}>
        <Text style={styles.error}>{error}</Text>
      </View>
    );
  }

  return (
    <ScrollView
      className="bg-amber-900"
      refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
      }
    >
      <View className="p-4">
        <Text className="pb-2 text-3xl font-bold text-center text-white">
          Most Liked Builds
        </Text>
        {mostPopularBuilds.length > 0 ? (
          <FlatList
            data={mostPopularBuilds}
            renderItem={({ item }) => (
              <View className="mr-4">
                <BuildCard item={item} />
              </View>
            )}
            keyExtractor={(item) => item.id}
            showsVerticalScrollIndicator={false}
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.listContent}
            horizontal={true}
          />
        ) : (
          <Text style={styles.noBuildsText}>No builds found.</Text>
        )}

        <Text className="pb-2 text-3xl font-bold text-center text-white">
          Newest
        </Text>
        {newestBuilds.length > 0 ? (
          <FlatList
            data={newestBuilds}
            renderItem={({ item }) => (
              <View className="mr-4">
                <BuildCard item={item} />
              </View>
            )}
            keyExtractor={(item) => item.id}
            showsVerticalScrollIndicator={false}
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.listContent}
            horizontal={true}
          />
        ) : (
          <Text style={styles.noBuildsText}>No builds found.</Text>
        )}
      </View>
    </ScrollView>
  );
}

// Styles (ensure these are defined)
const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  cardContainer: {
    marginRight: 10,
  },
  error: {
    color: "red",
    fontSize: 16,
  },
  noBuildsText: {
    textAlign: "center",
    color: "white",
    fontSize: 16,
  },
  listContent: {
    paddingHorizontal: 10,
  },
  likeContainer: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
  },
  likesText: {
    marginLeft: 5,
  },
});
