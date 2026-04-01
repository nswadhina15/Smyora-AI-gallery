import { collection, addDoc, serverTimestamp, query, where, getDocs, doc, deleteDoc, updateDoc, getDoc, or, and, setDoc, onSnapshot, arrayUnion, writeBatch, increment } from "firebase/firestore";
import { db } from "./firebase";

// 1. Function to save a new photo after upload
export const addPhotoRecord = async (userId, cloudinaryData, locationData) => {
  const photosRef = collection(db, "photos");
  const newPhoto = {
    userId,
    url: cloudinaryData.secure_url,
    publicId: cloudinaryData.public_id,
    format: cloudinaryData.format,
    width: cloudinaryData.width,
    height: cloudinaryData.height,
    tags: cloudinaryData.tags || [],
    location: locationData ? { lat: locationData.latitude, lng: locationData.longitude } : null,
    createdAt: serverTimestamp(),
    isFavorite: false,
    albumId: null,
  };
  const docRef = await addDoc(photosRef, newPhoto);
  return { id: docRef.id, ...newPhoto };
};

// 2. Function to fetch all photos for the logged-in user
export const getUserPhotos = async (userId) => {
  try {
    const photosRef = collection(db, "photos");
    
    const q = query(collection(db, "photos"), where("userId", "==", userId));
    
    const querySnapshot = await getDocs(q);
    const photos = querySnapshot.docs.map(doc => ({ 
      id: doc.id, 
      ...doc.data() 
    }));
    return photos
      .filter(photo => !photo.inVault)
      .sort((a, b) => {
        const dateA = a.createdAt?.toMillis() || 0;
        const dateB = b.createdAt?.toMillis() || 0;
        return dateB - dateA;
      });

  } catch (error) {
    console.error("Error fetching photos:", error);
    throw error;
  }
};

export const deletePhotoRecord = async (docId) => {
  try {
    // Point directly to the specific document using its ID
    const docRef = doc(db, "photos", docId);
    await deleteDoc(docRef);
    console.log("Document successfully deleted from Firestore!");
  } catch (error) {
    console.error("Error removing document:", error);
    throw error;
  }
};

export const toggleFavoriteStatus = async (docId, currentStatus) => {
  try {
    const docRef = doc(db, "photos", docId);
    await updateDoc(docRef, {
      isFavorite: !currentStatus // Flip it to the opposite of what it currently is
    });
    console.log("Favorite status updated!");
    return !currentStatus;
  } catch (error) {
    console.error("Error updating favorite status:", error);
    throw error;
  }
};

export const getFavoritePhotos = async (userId) => {
  try {
    const photosRef = collection(db, "photos");
    const q = query(
      photosRef,
      where("userId", "==", userId),
      where("isFavorite", "==", true) // Only grab the ones with a heart!
    );
    
    const querySnapshot = await getDocs(q);
    const photos = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));

    return photos.sort((a, b) => {
      const dateA = a.createdAt?.toMillis() || 0;
      const dateB = b.createdAt?.toMillis() || 0;
      return dateB - dateA;
    });
  } catch (error) {
    console.error("Error fetching favorite photos:", error);
    throw error;
  }
};

export const createAlbum = async (userId, albumName, isLiving = false, livingKeyword = '') => {
  try {
    const albumsRef = collection(db, "albums");
    const newAlbum = {
      userId: userId,
      name: albumName,
      createdAt: serverTimestamp(),
      coverPhotoUrl: null,
      isLiving: isLiving,                 // NEW
      livingKeyword: livingKeyword.toLowerCase() // NEW
    };
    
    const docRef = await addDoc(albumsRef, newAlbum);
    return { id: docRef.id, ...newAlbum };
  } catch (error) {
    console.error("Error creating album:", error);
    throw error;
  }
};

// NEW: 7. Function to fetch all albums for a user
export const getUserAlbums = async (userId) => {
  try {
    const albumsRef = collection(db, "albums");
    const q = query(albumsRef, where("userId", "==", userId));
    const querySnapshot = await getDocs(q);
    
    const albums = querySnapshot.docs.map(doc => ({ 
      id: doc.id, 
      ...doc.data() 
    }));

    // Sort alphabetically for now
    return albums.sort((a, b) => a.name.localeCompare(b.name));
  } catch (error) {
    console.error("Error fetching albums:", error);
    throw error;
  }
};

export const getAlbumDetails = async (albumId) => {
  try {
    const docRef = doc(db, "albums", albumId);
    const docSnap = await getDoc(docRef);
    if (docSnap.exists()) {
      return { id: docSnap.id, ...docSnap.data() };
    }
    throw new Error("Album not found");
  } catch (error) {
    console.error("Error fetching album details:", error);
    throw error;
  }
};

// NEW: 9. Fetch ONLY photos inside a specific album
export const getAlbumPhotos = async (userId, albumId) => {
  const albumDoc = await getDoc(doc(db, "albums", albumId));
  const albumData = albumDoc.data();

  const photosRef = collection(db, "photos");
  let q;

  if (albumData?.isLiving && albumData?.livingKeyword) {
    // FIXED: Wrapped the conditions inside an and() function
    q = query(
      photosRef,
      and(
        where("userId", "==", userId),
        or(
          where("albumId", "==", albumId),
          where("tags", "array-contains", albumData.livingKeyword)
        )
      )
    );
  } else {
    // Standard Album Query
    q = query(
      photosRef,
      where("userId", "==", userId),
      where("albumId", "==", albumId)
    );
  }

  const querySnapshot = await getDocs(q);
  let photos = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
  photos = photos.filter(photo => !(photo.removedFromAlbums || []).includes(albumId));
  const uniquePhotos = Array.from(new Map(photos.map(p => [p.id, p])).values());
  return uniquePhotos.sort((a, b) => (b.createdAt?.toMillis() || 0) - (a.createdAt?.toMillis() || 0));
};

// NEW: 10. Update a photo to move it into an album
export const updatePhotoAlbum = async (photoId, albumId) => {
  try {
    const docRef = doc(db, "photos", photoId);
    await updateDoc(docRef, { albumId: albumId });
  } catch (error) {
    console.error("Error updating photo album:", error);
    throw error;
  }
};

export const setAlbumCover = async (albumId, photoUrl) => {
  try {
    const docRef = doc(db, "albums", albumId);
    await updateDoc(docRef, { 
      coverPhotoUrl: photoUrl 
    });
    console.log("Album cover updated successfully!");
  } catch (error) {
    console.error("Error setting album cover:", error);
    throw error;
  }
};

// NEW: Save Photo DNA
export const updatePhotoDNA = async (photoId, dnaData) => {
  const photoRef = doc(db, "photos", photoId);
  await updateDoc(photoRef, { dna: dnaData });
};

// --- VAULT ENGINE ---
export const setupVaultPin = async (userId, pin) => {
  const userRef = doc(db, "users", userId);
  // We save the PIN to a dedicated user profile document
  await setDoc(userRef, { vaultPin: pin }, { merge: true });
};

export const checkHasVault = async (userId) => {
  const userRef = doc(db, "users", userId);
  const snap = await getDoc(userRef);
  return snap.exists() && !!snap.data().vaultPin;
};

export const verifyVaultPin = async (userId, pin) => {
  const userRef = doc(db, "users", userId);
  const snap = await getDoc(userRef);
  if (snap.exists() && snap.data().vaultPin === pin) return true;
  return false;
};

export const toggleVaultStatus = async (photoId, currentStatus) => {
  const photoRef = doc(db, "photos", photoId);
  // Flips the boolean: if it was in the vault, take it out. If not, put it in.
  await updateDoc(photoRef, { inVault: !currentStatus });
};

export const getVaultPhotos = async (userId) => {
  const q = query(collection(db, "photos"), where("userId", "==", userId), where("inVault", "==", true));
  const querySnapshot = await getDocs(q);
  return querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })).sort((a, b) => (b.createdAt?.toMillis() || 0) - (a.createdAt?.toMillis() || 0));
};

export const getPhotosByMood = async (userId, mood) => {
  try {
    const photos = await getUserPhotos(userId);
    if (!mood) return photos;
    return photos.filter(p => p.dna?.mood === mood);
  } catch (error) {
    console.error("Mood Fetch Error:", error);
    return [];
  }
};

// Invite a friend by their Email
export const inviteToAlbum = async (albumId, friendEmail) => {
  const albumRef = doc(db, "albums", albumId);
  // We store an array of "collaborators" (emails or UIDs)
  await updateDoc(albumRef, {
    collaborators: arrayUnion(friendEmail.toLowerCase()),
    isShared: true
  });
};

export const subscribeToAlbumPhotos = async (userId, albumId, callback) => {
  const albumDoc = await getDoc(doc(db, "albums", albumId));
  const albumData = albumDoc.data();

  const photosRef = collection(db, "photos");

  if (albumData?.isLiving && albumData?.livingKeyword) {
    const q = query(photosRef, where("userId", "==", userId));
    
    return onSnapshot(q, (snapshot) => {
      const allPhotos = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      const livingPhotos = allPhotos.filter(photo => 
        photo.albumId === albumId || 
        (photo.tags && photo.tags.includes(albumData.livingKeyword))
      );
      
      callback(livingPhotos.sort((a, b) => (b.createdAt?.toMillis() || 0) - (a.createdAt?.toMillis() || 0)));
    });
    
  } else {
    const q = query(photosRef, where("albumId", "==", albumId));
    
    return onSnapshot(q, (snapshot) => {
      const photos = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      callback(photos.sort((a, b) => (b.createdAt?.toMillis() || 0) - (a.createdAt?.toMillis() || 0)));
    });
  }
};

export const addTagToPhoto = async (photoId, newTag) => {
  try {
    const photoRef = doc(db, "photos", photoId);
    await updateDoc(photoRef, {
      tags: arrayUnion(newTag.toLowerCase().trim())
    });
  } catch (error) {
    console.error("Error adding tag:", error);
    throw error;
  }
};

// --- ALBUM MANAGEMENT ---

export const deleteAlbum = async (albumId) => {
  try {
    // 1. Delete the album document itself
    await deleteDoc(doc(db, "albums", albumId));

    // 2. Remove the albumId from any photos explicitly linked to it
    const q = query(collection(db, "photos"), where("albumId", "==", albumId));
    const snapshot = await getDocs(q);

    // We use a batch write to update all photos safely at the same time
    const batch = writeBatch(db);
    snapshot.forEach((photoDoc) => {
      batch.update(photoDoc.ref, { albumId: null });
    });
    
    await batch.commit();
    console.log("Album deleted and photos unlinked!");
  } catch (error) {
    console.error("Error deleting album:", error);
    throw error;
  }
};

export const removePhotoFromAlbum = async (photoId, albumId) => {
  try {
    const photoRef = doc(db, "photos", photoId);
    await updateDoc(photoRef, {
      albumId: null, // Remove manual link
      removedFromAlbums: arrayUnion(albumId) // Blacklist it so Living Albums don't pull it back!
    });
  } catch (error) {
    console.error("Error removing photo from album:", error);
    throw error;
  }
};

export const initializeUserProfile = async (userId, email) => {
  const userRef = doc(db, "users", userId);
  const snap = await getDoc(userRef);
  
  if (!snap.exists()) {
    await setDoc(userRef, {
      email: email,
      tier: "free", // Options: "free" or "lumina"
      sparks: 5, 
      createdAt: serverTimestamp()
    });
  }
};

export const burnSpark = async (userId, cost = 1) => {
  const userRef = doc(db, "users", userId);
  const snap = await getDoc(userRef);
  
  if (snap.exists() && snap.data().sparks >= cost) {
    await updateDoc(userRef, {
      sparks: increment(-cost) // Subtract the credit safely
    });
    return true; // Success!
  } else {
    throw new Error("Not enough Sparks!"); 
  }
};

export const addSparksToUser = async (userId, amount) => {
  const userRef = doc(db, "users", userId);
  try {
    await updateDoc(userRef, {
      sparks: increment(amount),
      tier: "lumina" // Upgrade their tier visually!
    });
    return true;
  } catch (error) {
    console.error("Error adding sparks:", error);
    throw error;
  }
};