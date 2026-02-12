import { db } from './firebase';
import {
  collection,
  doc,
  getDoc,
  getDocs,
  query,
  where,
  orderBy
} from 'firebase/firestore';

class UsersAPI {
  constructor() {
    this.collectionName = 'users';
  }

  async getUsers(organizationId = null, gymId = null) {
    try {
      let q = collection(db, this.collectionName);

      if (organizationId && gymId) {
        q = query(
          collection(db, this.collectionName),
          where('organizationId', '==', organizationId),
          where('gyms', 'array-contains', { gymId: gymId })
        );
      }

      const snapshot = await getDocs(q);

      return snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
    } catch (error) {
      if (process.env.NODE_ENV === 'development') console.error('Error getting users:', error);
      throw error;
    }
  }

  async getUserById(userId) {
    try {
      const docRef = doc(db, this.collectionName, userId);
      const docSnap = await getDoc(docRef);

      if (docSnap.exists()) {
        return { id: docSnap.id, ...docSnap.data() };
      }
      return null;
    } catch (error) {
      if (process.env.NODE_ENV === 'development') console.error('Error getting user:', error);
      throw error;
    }
  }

  async getUsersByGym(gymId) {
    try {
      const snapshot = await getDocs(collection(db, this.collectionName));

      // Filter users who have the gymId in their gyms array
      const users = snapshot.docs
        .map(doc => ({ id: doc.id, ...doc.data() }))
        .filter(user => {
          if (!user.gyms || !Array.isArray(user.gyms)) return false;
          return user.gyms.some(gym => gym.gymId === gymId);
        });

      return users;
    } catch (error) {
      if (process.env.NODE_ENV === 'development') console.error('Error getting users by gym:', error);
      throw error;
    }
  }

  async searchUsers(searchTerm, gymId = null) {
    try {
      const users = gymId ? await this.getUsersByGym(gymId) : await this.getUsers();

      if (!searchTerm) return users;

      const lowerSearch = searchTerm.toLowerCase();
      return users.filter(user => {
        const displayName = user.authUser?.displayName?.toLowerCase() || '';
        const email = user.authUser?.email?.toLowerCase() || '';
        const userId = user.userId?.toLowerCase() || '';

        return displayName.includes(lowerSearch) ||
               email.includes(lowerSearch) ||
               userId.includes(lowerSearch);
      });
    } catch (error) {
      if (process.env.NODE_ENV === 'development') console.error('Error searching users:', error);
      throw error;
    }
  }
}

export default new UsersAPI();
