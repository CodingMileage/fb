import React, { useEffect, useState } from "react";
import {
  View,
  SafeAreaView,
  ScrollView,
  TextInput as TextInputN,
  TouchableOpacity,
  RefreshControl,
  Text as TextN,
} from "react-native";
import {
  collection,
  addDoc,
  updateDoc,
  arrayUnion,
  query,
  orderBy,
  limit,
  getDocs,
  getDoc,
  doc,
  getCountFromServer,
  arrayRemove,
  deleteDoc,
  where,
} from "firebase/firestore";
import { db, auth } from "@/FirebaseConfig";
import { Link } from "expo-router";
import { useAuth } from "@/context/AuthContext";
import { SegmentedButtons } from "react-native-paper";
import { Avatar, Button, Card, Text, TextInput } from "react-native-paper";

const LFG = () => {
  const [newPostContent, setNewPostContent] = useState("");
  const [gamertag, setGamertag] = useState<string | null>(null);
  const [newestPost, setNewestPost] = useState([]);
  const [userPost, setUserPost] = useState(null);
  const [postCount, setPostCount] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const { reloadTrigger } = useAuth();
  const [refreshing, setRefreshing] = useState(false);
  const [mode, setMode] = React.useState("");
  const LeftContent = (props) => <Avatar.Icon {...props} icon="folder" />;
  useEffect(() => {
    const fetchInitialData = async () => {
      await fetchUserData();
      await getNewestPost();
      await fetchPostCount();
      // await deleteOldPosts();
    };

    fetchInitialData();
  }, [reloadTrigger]);

  const onRefresh = async () => {
    setRefreshing(true);
    await Promise.all([fetchPostCount(), getNewestPost()]);
    setRefreshing(false);
  };

  const fetchPostCount = async () => {
    try {
      const coll = collection(db, "posts");
      const snapshot = await getCountFromServer(coll);
      setPostCount(snapshot.data().count);
    } catch (error) {
      console.error("Error fetching post count:", error);
    }
  };

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
        setGamertag(userData?.gamertag || null);
      } else {
        console.log("No user document found.");
        setGamertag(null);
      }
    } catch (error) {
      console.error("Error fetching user data:", error);
    } finally {
      setLoading(false);
    }
  };

  const getNewestPost = async () => {
    try {
      const postCollectionRef = collection(db, "posts");
      const newestPostsQuery = query(
        postCollectionRef,
        orderBy("timestamp", "desc"),
        limit(10)
      );

      const data = await getDocs(newestPostsQuery);

      // Separate user's post from the rest
      const currentUserId = auth.currentUser?.uid;
      const allPosts = data.docs.map((doc) => ({
        ...doc.data(),
        id: doc.id,
      }));

      const userPostData = allPosts.find(
        (post) => post.userId === currentUserId
      );
      const otherPosts = allPosts.filter(
        (post) => post.userId !== currentUserId
      );

      setUserPost(userPostData || null);
      setNewestPost(otherPosts);
    } catch (error) {
      console.error("Error fetching newest posts: ", error);
    }
  };

  const onSubmitPost = async () => {
    if (!auth.currentUser) {
      console.log("User is not authenticated");
      return;
    }

    try {
      const userId = auth.currentUser.uid;
      const userDocRef = doc(db, "users", userId);

      const newPostDocRef = await addDoc(collection(db, "posts"), {
        content: newPostContent,
        mode,
        userId,
        gamertag,
        timestamp: new Date(),
      });

      await updateDoc(userDocRef, {
        posts: arrayUnion(newPostDocRef.id),
      });

      setNewPostContent("");
      await getNewestPost(); // Refresh newest posts
      await fetchPostCount(); // Refresh post count
    } catch (error) {
      console.error("Error submitting post:", error);
      setError("Failed to submit post.");
    }
  };

  const deleteOldPosts = async () => {
    try {
      // Calculate the timestamp for one hour ago
      const oneHourAgo = new Date();
      oneHourAgo.setHours(oneHourAgo.getHours() - 1);

      // Query for posts older than one hour
      const postsRef = collection(db, "posts");
      const oldPostsQuery = query(
        postsRef,
        where("timestamp", "<", oneHourAgo)
      );

      // Fetch the old posts
      const oldPostsSnapshot = await getDocs(oldPostsQuery);

      // Delete each old post
      const deletePromises = oldPostsSnapshot.docs.map(async (postDoc) => {
        const postId = postDoc.id;
        const userId = postDoc.data().userId;

        // Delete the post from the posts collection
        await deleteDoc(doc(db, "posts", postId));

        // Remove the post reference from the user's document
        if (userId) {
          const userDocRef = doc(db, "users", userId);
          await updateDoc(userDocRef, {
            posts: arrayRemove(postId),
          });
        }
      });

      // Wait for all deletions to complete
      await Promise.all(deletePromises);

      console.log(`Deleted ${oldPostsSnapshot.size} posts older than one hour`);
    } catch (error) {
      console.error("Error deleting old posts:", error);
    }
  };

  const onDeletePost = async (postId) => {
    if (!auth.currentUser) {
      console.error("User not authenticated");
      return;
    }

    try {
      const userId = auth.currentUser.uid;

      const postDocRef = doc(db, "posts", postId);
      const userDocRef = doc(db, "users", userId);

      await deleteDoc(postDocRef);
      await updateDoc(userDocRef, {
        posts: arrayRemove(postId),
      });

      await getNewestPost();
      await fetchPostCount();
    } catch (error) {
      console.error("Error deleting post:", error);
      setError("Failed to delete post.");
    }
  };

  return (
    <ScrollView
      className="bg-amber-900"
      refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
      }
    >
      <SafeAreaView>
        <Text
          style={{
            fontSize: 24,
            fontWeight: "bold",
            textAlign: "center",
            color: "white",
          }}
          className="mt-4"
        >
          People Looking: {postCount}
        </Text>
        <View>
          {!userPost ? (
            <>
              <View className="p-4 m-8">
                <SegmentedButtons
                  value={mode}
                  onValueChange={setMode}
                  buttons={[
                    {
                      value: "2s",
                      label: "2s",
                      showSelectedCheck: true,
                    },
                    {
                      value: "3s",
                      label: "3s",
                      showSelectedCheck: true,
                    },

                    { value: "5s", label: "5s", showSelectedCheck: true },
                  ]}
                />
                <TextInputN
                  placeholder="Enter Content"
                  value={newPostContent}
                  onChangeText={setNewPostContent}
                  placeholderTextColor={"black"}
                  // style={{
                  //   backgroundColor: "#e0e0e0",
                  //   padding: 16,
                  //   margin: 16,
                  //   borderRadius: 8,
                  // }}
                  className="p-4 m-6 text-black bg-white rounded"
                />

                <TouchableOpacity onPress={onSubmitPost} style={{ margin: 16 }}>
                  <TextN
                    style={{
                      backgroundColor: "#fff",
                      padding: 16,
                      textAlign: "center",
                      borderRadius: 8,
                    }}
                  >
                    Submit
                  </TextN>
                </TouchableOpacity>
              </View>
            </>
          ) : (
            <View>
              <TextN className="text-3xl font-bold text-center text-white">
                Your Post
              </TextN>
              <View
                key={userPost.id}
                style={{
                  margin: 16,
                  padding: 16,
                  backgroundColor: "#f5f5f5",
                  borderRadius: 8,
                }}
              >
                <Text
                  style={{
                    fontSize: 24,
                    fontWeight: "bold",
                    textAlign: "center",
                    color: "black",
                    paddingBottom: 12,
                  }}
                >
                  {userPost.content}
                </Text>
                <TouchableOpacity
                  onPress={() => onDeletePost(userPost.id)}
                  style={{
                    backgroundColor: "#ff4d4d",
                    padding: 8,
                    borderRadius: 4,
                  }}
                >
                  <Text style={{ color: "#fff", textAlign: "center" }}>
                    Delete Post
                  </Text>
                </TouchableOpacity>
              </View>
            </View>
          )}

          {newestPost.map((post) => {
            // Calculate time difference in minutes
            const now = new Date();
            const postDate = post.timestamp.toDate();
            const diffInMinutes = Math.floor((now - postDate) / (1000 * 60));

            // Format the relative time string
            let timeString;
            if (diffInMinutes < 1) {
              timeString = "just now";
            } else if (diffInMinutes < 60) {
              timeString = `${diffInMinutes} minute${
                diffInMinutes === 1 ? "" : "s"
              } ago`;
            } else if (diffInMinutes < 1440) {
              // less than 24 hours
              const hours = Math.floor(diffInMinutes / 60);
              timeString = `${hours} hour${hours === 1 ? "" : "s"} ago`;
            } else {
              const days = Math.floor(diffInMinutes / 1440);
              timeString = `${days} day${days === 1 ? "" : "s"} ago`;
            }

            return (
              <View key={post.id} className="items-center w-full pb-6">
                <Link
                  key={post.id}
                  href={`/post/${post.id}`}
                  className="flex flex-col"
                >
                  <Card>
                    <Card.Title
                      title="Card Title"
                      subtitle="Card Subtitle"
                      left={LeftContent}
                    />
                    <Card.Content>
                      <Text variant="titleLarge">{post.content}</Text>

                      <Text variant="bodyMedium" className="italic">
                        {post.gamertag}
                      </Text>
                      <Text>{timeString}</Text>
                    </Card.Content>
                    <Card.Actions>
                      <Button>Interested</Button>
                    </Card.Actions>
                  </Card>
                </Link>
              </View>
            );
          })}
        </View>
      </SafeAreaView>
    </ScrollView>
  );
};

export default LFG;
