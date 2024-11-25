import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  SafeAreaView,
  ScrollView,
  TextInput,
  TouchableOpacity,
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
} from "firebase/firestore";
import { db, auth } from "@/FirebaseConfig";
import { Link } from "expo-router";
import { useAuth } from "@/context/AuthContext";
import ProfileScreen from "./profilePage";

const LFG = () => {
  const [newPostContent, setNewPostContent] = useState("");
  const [gamertag, setGamertag] = useState<string | null>(null);
  const [newestPost, setNewestPost] = useState([]);
  const [userPost, setUserPost] = useState(null);
  const [postCount, setPostCount] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const { user } = ProfileScreen;

  useEffect(() => {
    const fetchInitialData = async () => {
      await fetchUserData();
      await getNewestPost();
      await fetchPostCount();
    };

    fetchInitialData();
  }, [user]);

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
    <ScrollView style={{ backgroundColor: "#ffefcc" }}>
      <SafeAreaView>
        <Text style={{ fontSize: 24, fontWeight: "bold", textAlign: "center" }}>
          People Looking: {postCount}
        </Text>
        <View>
          {!userPost ? (
            <>
              <TextInput
                placeholder="Enter Content"
                value={newPostContent}
                onChangeText={setNewPostContent}
                style={{
                  backgroundColor: "#e0e0e0",
                  padding: 16,
                  margin: 16,
                  borderRadius: 8,
                }}
              />
              <TouchableOpacity onPress={onSubmitPost} style={{ margin: 16 }}>
                <Text
                  style={{
                    backgroundColor: "#fff",
                    padding: 16,
                    textAlign: "center",
                    borderRadius: 8,
                  }}
                >
                  Submit
                </Text>
              </TouchableOpacity>
            </>
          ) : (
            <View>
              <Text className="text-3xl font-bold text-center">Your Post</Text>
              <View
                key={userPost.id}
                style={{
                  margin: 16,
                  padding: 16,
                  backgroundColor: "#f5f5f5",
                  borderRadius: 8,
                }}
              >
                <Text style={{ marginBottom: 8 }}>{userPost.content}</Text>
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

          <View>
            {newestPost.map((post) => (
              <View
                key={post.id}
                style={{
                  margin: 16,
                  padding: 16,
                  backgroundColor: "#e0e0e0",
                  borderRadius: 8,
                }}
              >
                <Text>{post.content}</Text>
                <Text>{post.gamertag}</Text>
              </View>
            ))}
          </View>
        </View>
      </SafeAreaView>
    </ScrollView>
  );
};

export default LFG;
