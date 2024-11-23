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
import { Link, useNavigation, useRouter } from "expo-router";

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
};

export const convertHeight = (inches: number) => {
  const feet = Math.floor(inches / 12);
  const remainingInches = inches % 12;
  return `${feet}'${remainingInches}`;
};

export default function TabOneScreen() {
  const router = useRouter();
  const [mostPopularBuilds, setMostPopularBuilds] = useState<Build[]>([]);
  const [newestBuilds, setNewestBuilds] = useState([]);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const screenWidth = Dimensions.get("window").width;
  const cardWidth = screenWidth / 2 - 24;

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
      }));
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
        {Platform.OS === "web" ? (
          <Link href={`/build/${item.id}`} asChild>
            <TouchableOpacity
              activeOpacity={0.8}
              onPressIn={handlePressIn}
              onPressOut={handlePressOut}
            >
              <Animated.View
                style={[
                  styles.card,
                  { width: cardWidth, transform: [{ scale: scaleAnim }] },
                ]}
              >
                {/* Card content */}
                <Text style={styles.buildText}>Position: {item.position}</Text>
                <Text style={styles.buildText}>
                  Height: {convertHeight(item.height)}
                </Text>
                <Text style={styles.buildText}>Weight: {item.weight}</Text>
                <Text style={styles.buildText}>
                  Wingspan: {convertHeight(item.wingspan)}
                </Text>
                <Text style={styles.buildText}>Role: {item.role}</Text>
                <View style={styles.likeContainer}>
                  <Icon name="heart" size={24} color="red" />
                  <Text style={styles.likesText}>{item.likes}</Text>
                </View>
              </Animated.View>
            </TouchableOpacity>
          </Link>
        ) : (
          <TouchableOpacity
            activeOpacity={0.8}
            onPressIn={handlePressIn}
            onPressOut={handlePressOut}
            onPress={handlePress}
          >
            <Animated.View
              style={[
                styles.card,
                { width: cardWidth, transform: [{ scale: scaleAnim }] },
              ]}
            >
              {/* Card content */}
              <Text style={styles.buildText}>Position: {item.position}</Text>
              <Text style={styles.buildText}>
                Height: {convertHeight(item.height)}
              </Text>
              <Text style={styles.buildText}>Weight: {item.weight}</Text>
              <Text style={styles.buildText}>
                Wingspan: {convertHeight(item.wingspan)}
              </Text>
              <Text style={styles.buildText}>Role: {item.role}</Text>
              <View style={styles.likeContainer}>
                <Icon name="heart" size={24} color="red" />
                <Text style={styles.likesText}>{item.likes}</Text>
              </View>
            </Animated.View>
          </TouchableOpacity>
        )}
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
    <>
      <ScrollView
        className="bg-amber-900"
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      >
        <View className="p-4">
          <Text className="font-bold text-center text-3xl text-white pb-2">
            Most Liked Builds
          </Text>
          {mostPopularBuilds.length > 0 ? (
            <FlatList
              data={mostPopularBuilds}
              renderItem={({ item }) => (
                <View className="mr-4">
                  {/* Add margin between cards */}
                  <BuildCard item={item} />
                </View>
              )}
              keyExtractor={(item) => item.id}
              // numColumns={2}
              // columnWrapperStyle={styles.row}
              showsVerticalScrollIndicator={false}
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.listContent}
              horizontal={true}
            />
          ) : (
            <Text style={styles.noBuildsText}>No builds found.</Text>
          )}

          <Text className="font-bold text-center text-3xl text-white pb-2">
            Newest
          </Text>
          {newestBuilds.length > 0 ? (
            <FlatList
              data={newestBuilds}
              renderItem={({ item }) => (
                <View className="mr-4">
                  {/* Add margin between cards */}
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
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#6b2714",
    padding: 16,
  },
  title: {
    fontSize: 24,
    fontWeight: "bold",
    textAlign: "center",
    marginVertical: 16,
    color: "#ffffff",
  },
  error: {
    color: "red",
    textAlign: "center",
    marginTop: 10,
    fontSize: 16,
  },
  listContent: {
    paddingBottom: 16,
  },
  row: {
    justifyContent: "space-between",
    marginBottom: 16,
  },
  cardContainer: {
    alignItems: "center",
  },
  card: {
    backgroundColor: "#ffffff",
    borderRadius: 8,
    padding: 16,
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  buildText: {
    fontSize: 14,
    marginBottom: 8,
    color: "#000",
  },
  likeContainer: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 8,
    gap: 8,
  },
  likesText: {
    fontSize: 14,
    color: "#000",
  },
  noBuildsText: {
    fontSize: 16,
    textAlign: "center",
    marginTop: 20,
    color: "#666",
  },
});
