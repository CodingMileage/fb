export const fetchUserBuilds = async (userId: string, db: Firestore) => {
    const buildsCollectionRef = collection(db, "builds");
    const buildQuery = query(buildsCollectionRef, where("userId", "==", userId));
    const querySnapshot = await getDocs(buildQuery);
    return querySnapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
  };
  