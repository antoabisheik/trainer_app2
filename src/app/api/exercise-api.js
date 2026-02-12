import { db, storage } from './firebase';
import {
  collection,
  doc,
  setDoc,
  getDoc,
  getDocs,
  deleteDoc,
  query,
  orderBy,
  runTransaction
} from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL, deleteObject } from 'firebase/storage';

class ExerciseAPI {
  constructor() {
    this.collectionName = 'exercises';
    this.musclesCollectionName = 'muscles';
  }

  async getNextId() {
    try {
      const counterRef = doc(db, 'counters', 'exercise_counter');

      const newId = await runTransaction(db, async (transaction) => {
        const counterDoc = await transaction.get(counterRef);

        let currentId;
        if (counterDoc.exists()) {
          currentId = counterDoc.data().currentId || 0;
        } else {
          const exercises = await this.getAllExercises();
          currentId = exercises.length === 0 ? 0 : Math.max(...exercises.map(ex => ex.exercise_id || 0));
        }

        const nextId = currentId + 1;
        transaction.set(counterRef, { currentId: nextId }, { merge: true });
        return nextId;
      });

      return newId;
    } catch (error) {
      if (process.env.NODE_ENV === 'development') console.error('Error getting next ID:', error);
      throw error;
    }
  }

  async uploadImage(file, exerciseId) {
    try {
      const timestamp = Date.now();
      const fileName = `${exerciseId}_${timestamp}.${file.name.split('.').pop()}`;
      const storageRef = ref(storage, `exercises/${fileName}`);

      await uploadBytes(storageRef, file);
      const downloadURL = await getDownloadURL(storageRef);

      return downloadURL;
    } catch (error) {
      if (process.env.NODE_ENV === 'development') console.error('Error uploading image:', error);
      throw error;
    }
  }

  async deleteImage(imageUrl) {
    try {
      if (!imageUrl) return;

      const storageRef = ref(storage, imageUrl);
      await deleteObject(storageRef);
    } catch (error) {
      if (process.env.NODE_ENV === 'development') console.error('Error deleting image:', error);
    }
  }

  async getAllExercises() {
    try {
      const q = query(collection(db, this.collectionName), orderBy('exercise_id', 'asc'));
      const snapshot = await getDocs(q);

      return snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
    } catch (error) {
      if (process.env.NODE_ENV === 'development') console.error('Error getting exercises:', error);
      throw error;
    }
  }

  async getExerciseById(exerciseId) {
    try {
      const docRef = doc(db, this.collectionName, exerciseId.toString());
      const docSnap = await getDoc(docRef);

      if (docSnap.exists()) {
        return { id: docSnap.id, ...docSnap.data() };
      }
      return null;
    } catch (error) {
      if (process.env.NODE_ENV === 'development') console.error('Error getting exercise:', error);
      throw error;
    }
  }

  async createExercise(exerciseData, imageFile = null) {
    try {
      const exerciseId = await this.getNextId();

      let imageUrl = null;
      if (imageFile) {
        imageUrl = await this.uploadImage(imageFile, exerciseId);
      }

      const exercise = {
        exercise_id: exerciseId,
        exercise_name: exerciseData.exercise_name,
        muscle_id: exerciseData.muscle_id,
        muscle_name: exerciseData.muscle_name || null,
        image: imageUrl,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };

      await setDoc(doc(db, this.collectionName, exerciseId.toString()), exercise);

      return { id: exerciseId.toString(), ...exercise };
    } catch (error) {
      if (process.env.NODE_ENV === 'development') console.error('Error creating exercise:', error);
      throw error;
    }
  }

  async updateExercise(exerciseId, exerciseData, imageFile = null) {
    try {
      const docRef = doc(db, this.collectionName, exerciseId.toString());
      const existingDoc = await getDoc(docRef);

      if (!existingDoc.exists()) {
        throw new Error('Exercise not found');
      }

      const existingData = existingDoc.data();
      let imageUrl = existingData.image;

      if (imageFile) {
        if (existingData.image) {
          await this.deleteImage(existingData.image);
        }
        imageUrl = await this.uploadImage(imageFile, exerciseId);
      }

      const updatedExercise = {
        ...existingData,
        exercise_name: exerciseData.exercise_name || existingData.exercise_name,
        muscle_id: exerciseData.muscle_id || existingData.muscle_id,
        muscle_name: exerciseData.muscle_name || existingData.muscle_name,
        image: imageUrl,
        updatedAt: new Date().toISOString()
      };

      await setDoc(docRef, updatedExercise);

      return { id: exerciseId.toString(), ...updatedExercise };
    } catch (error) {
      if (process.env.NODE_ENV === 'development') console.error('Error updating exercise:', error);
      throw error;
    }
  }

  async deleteExercise(exerciseId) {
    try {
      const docRef = doc(db, this.collectionName, exerciseId.toString());
      const docSnap = await getDoc(docRef);

      if (docSnap.exists() && docSnap.data().image) {
        await this.deleteImage(docSnap.data().image);
      }

      await deleteDoc(docRef);
      return { success: true };
    } catch (error) {
      if (process.env.NODE_ENV === 'development') console.error('Error deleting exercise:', error);
      throw error;
    }
  }

  async getAllMuscles() {
    try {
      const q = query(collection(db, this.musclesCollectionName), orderBy('muscle_id', 'asc'));
      const snapshot = await getDocs(q);

      return snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
    } catch (error) {
      if (process.env.NODE_ENV === 'development') console.error('Error getting muscles:', error);
      throw error;
    }
  }

  async getMuscleById(muscleId) {
    try {
      const docRef = doc(db, this.musclesCollectionName, muscleId.toString());
      const docSnap = await getDoc(docRef);

      if (docSnap.exists()) {
        return { id: docSnap.id, ...docSnap.data() };
      }
      return null;
    } catch (error) {
      if (process.env.NODE_ENV === 'development') console.error('Error getting muscle:', error);
      throw error;
    }
  }
}

export default new ExerciseAPI();
