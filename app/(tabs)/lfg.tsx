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
} from "firebase/firestore";
import { db, auth } from "@/FirebaseConfig";
import { Link } from "expo-router";

const LFG = () => {
  const [newPostTitle, setNewPostTitle] = useState("");
  const [newPostContent, setNewPostContent] = useState("");
  const [gamertag, setGamertag] = useState<string | null>(null);
  const [newestPost, setNewestPost] = useState([]);
  const [postCount, setPostCount] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchInitialData = async () => {
      await fetchUserData();
      await getNewestPost();
      await fetchPostCount();
    };

    fetchInitialData();
  }, []);

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
      const filteredData = data.docs.map((doc) => ({
        ...doc.data(),
        id: doc.id,
      }));
      setNewestPost(filteredData);
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
        // title: newPostTitle,
        content: newPostContent,
        userId,
        gamertag,
        timestamp: new Date(),
      });

      await updateDoc(userDocRef, {
        posts: arrayUnion(newPostDocRef.id),
      });

      // setNewPostTitle("");
      setNewPostContent("");
      await getNewestPost(); // Refresh newest posts
      await fetchPostCount(); // Refresh post count
    } catch (error) {
      console.error("Error submitting post:", error);
      setError("Failed to submit post.");
    }
  };

  return (
    <ScrollView style={{ backgroundColor: "#ffefcc" }}>
      <SafeAreaView>
        <Text style={{ fontSize: 24, fontWeight: "bold", textAlign: "center" }}>
          People Looking: {postCount}
        </Text>
        <View>
          {/* <TextInput
            placeholder="Enter Title"
            value={newPostTitle}
            onChangeText={setNewPostTitle}
            style={{
              backgroundColor: "#e0e0e0",
              padding: 16,
              margin: 16,
              borderRadius: 8,
            }}
          /> */}
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
          <View>
            {newestPost.map((post) => (
              <Link
                key={post.id}
                href={`/post/${post.id}`}
                className="p-4 m-4 rounded bg-slate-300"
              >
                <View key={post.id}>
                  {/* <Text style={{ fontWeight: "bold" }}>{post.title}</Text> */}
                  <Text>{post.content}</Text>
                  <Text style={{ fontStyle: "italic" }}>- {post.gamertag}</Text>
                </View>
              </Link>
            ))}
          </View>
        </View>
      </SafeAreaView>
    </ScrollView>
  );
};

export default LFG;
