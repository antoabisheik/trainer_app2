import { db } from './firebase';
import {
  collection,
  doc,
  setDoc,
  getDoc,
  getDocs,
  deleteDoc,
  query,
  where,
  runTransaction
} from 'firebase/firestore';

class WorkoutAPI {

  /* =======================
     HELPERS
  ======================= */

  formatDate(date) {
    const d = new Date(date);
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  }

  getWeekDates(referenceDate = new Date()) {
    const dates = [];
    const current = new Date(referenceDate);

    const dayOfWeek = current.getDay();
    const diffToMonday = dayOfWeek === 0 ? -6 : 1 - dayOfWeek;
    const monday = new Date(current);
    monday.setDate(current.getDate() + diffToMonday);

    for (let i = 0; i < 7; i++) {
      const date = new Date(monday);
      date.setDate(monday.getDate() + i);
      dates.push({
        date: this.formatDate(date),
        dayName: date.toLocaleDateString('en-US', { weekday: 'long' }),
        dayShort: date.toLocaleDateString('en-US', { weekday: 'short' }),
        isToday: this.formatDate(date) === this.formatDate(new Date())
      });
    }

    return dates;
  }

  generateExerciseInstanceId() {
    return `ex_${Date.now()}_${Math.random().toString(36).slice(2)}`;
  }

  normalizeDay(workouts, dateStr) {
    if (!workouts[dateStr]) {
      workouts[dateStr] = [];
      return;
    }

    if (Array.isArray(workouts[dateStr])) {
      return;
    }

    // legacy object -> flat array
    const flattened = [];
    Object.values(workouts[dateStr]).forEach(arr => {
      if (Array.isArray(arr)) {
        arr.forEach(ex => flattened.push(ex));
      }
    });

    workouts[dateStr] = flattened;
  }

  /* =======================
     CORE API
  ======================= */

  async getWorkoutPlan(userId, organizationId, gymId) {
    try {
      const planRef = doc(db, 'workoutPlans', `${organizationId}_${gymId}_${userId}`);
      const snap = await getDoc(planRef);

      if (snap.exists()) {
        return { id: snap.id, ...snap.data() };
      }

      return {
        id: `${organizationId}_${gymId}_${userId}`,
        userId,
        organizationId,
        gymId,
        workouts: {},
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };
    } catch (error) {
      if (process.env.NODE_ENV === 'development') console.error('Error getting workout plan:', error);
      throw error;
    }
  }

  async saveWorkoutPlan(userId, organizationId, gymId, workouts) {
    try {
      const planId = `${organizationId}_${gymId}_${userId}`;
      const planRef = doc(db, 'workoutPlans', planId);

      const data = {
        userId,
        organizationId,
        gymId,
        workouts,
        updatedAt: new Date().toISOString()
      };

      const existing = await getDoc(planRef);
      if (!existing.exists()) {
        data.createdAt = new Date().toISOString();
      }

      await setDoc(planRef, data, { merge: true });
      return { success: true };
    } catch (error) {
      if (process.env.NODE_ENV === 'development') console.error('Error saving workout plan:', error);
      throw error;
    }
  }

  /* =======================
     EXERCISE OPERATIONS (using transactions to prevent race conditions)
  ======================= */

  async addExercise(userId, organizationId, gymId, date, exercise) {
    try {
      const dateStr = typeof date === 'string' ? date : this.formatDate(date);
      const planId = `${organizationId}_${gymId}_${userId}`;
      const planRef = doc(db, 'workoutPlans', planId);

      const exerciseWithMetadata = {
        id: exercise.id,
        name: exercise.name,
        muscleId: exercise.muscleId ?? null,
        muscle_name: exercise.muscle ?? null,
        reps: exercise.reps ?? 15,
        sets: exercise.sets ?? 3,
        weight: exercise.weight ?? 0,
        image: exercise.image ?? null,
        instanceId: this.generateExerciseInstanceId(),
        addedAt: new Date().toISOString()
      };

      await runTransaction(db, async (transaction) => {
        const snap = await transaction.get(planRef);
        let data = snap.exists() ? snap.data() : {
          userId, organizationId, gymId,
          workouts: {},
          createdAt: new Date().toISOString()
        };

        let workouts = data.workouts || {};
        this.normalizeDay(workouts, dateStr);
        workouts[dateStr].push(exerciseWithMetadata);

        transaction.set(planRef, { ...data, workouts, updatedAt: new Date().toISOString() }, { merge: true });
      });

      return { success: true, instanceId: exerciseWithMetadata.instanceId };
    } catch (error) {
      if (process.env.NODE_ENV === 'development') console.error('Error adding exercise:', error);
      throw error;
    }
  }

  async updateExercise(userId, organizationId, gymId, date, instanceId, updates) {
    try {
      const dateStr = typeof date === 'string' ? date : this.formatDate(date);
      const planId = `${organizationId}_${gymId}_${userId}`;
      const planRef = doc(db, 'workoutPlans', planId);

      await runTransaction(db, async (transaction) => {
        const snap = await transaction.get(planRef);
        if (!snap.exists()) {
          throw new Error('Workout plan not found');
        }

        let data = snap.data();
        let workouts = data.workouts || {};
        this.normalizeDay(workouts, dateStr);

        const exerciseIndex = workouts[dateStr].findIndex(ex => ex.instanceId === instanceId);
        if (exerciseIndex === -1) {
          throw new Error('Exercise not found');
        }

        // Update only the allowed fields
        const allowedFields = ['reps', 'sets', 'weight', 'notes'];
        allowedFields.forEach(field => {
          if (updates[field] !== undefined) {
            workouts[dateStr][exerciseIndex][field] = updates[field];
          }
        });
        workouts[dateStr][exerciseIndex].updatedAt = new Date().toISOString();

        transaction.set(planRef, { ...data, workouts, updatedAt: new Date().toISOString() }, { merge: true });
      });

      return { success: true };
    } catch (error) {
      if (process.env.NODE_ENV === 'development') console.error('Error updating exercise:', error);
      throw error;
    }
  }

  async removeExercise(userId, organizationId, gymId, date, instanceId) {
    try {
      const dateStr = typeof date === 'string' ? date : this.formatDate(date);
      const planId = `${organizationId}_${gymId}_${userId}`;
      const planRef = doc(db, 'workoutPlans', planId);

      await runTransaction(db, async (transaction) => {
        const snap = await transaction.get(planRef);
        if (!snap.exists()) return;

        let data = snap.data();
        let workouts = data.workouts || {};
        this.normalizeDay(workouts, dateStr);

        workouts[dateStr] = workouts[dateStr].filter(
          ex => ex.instanceId !== instanceId
        );

        transaction.set(planRef, { ...data, workouts, updatedAt: new Date().toISOString() }, { merge: true });
      });

      return { success: true };
    } catch (error) {
      if (process.env.NODE_ENV === 'development') console.error('Error removing exercise:', error);
      throw error;
    }
  }

  async reorderExercises(userId, organizationId, gymId, date, instanceIds) {
    try {
      const dateStr = typeof date === 'string' ? date : this.formatDate(date);
      const planId = `${organizationId}_${gymId}_${userId}`;
      const planRef = doc(db, 'workoutPlans', planId);

      await runTransaction(db, async (transaction) => {
        const snap = await transaction.get(planRef);
        if (!snap.exists()) return;

        let data = snap.data();
        let workouts = data.workouts || {};
        this.normalizeDay(workouts, dateStr);

        workouts[dateStr] = instanceIds
          .map(id => workouts[dateStr].find(ex => ex.instanceId === id))
          .filter(Boolean);

        transaction.set(planRef, { ...data, workouts, updatedAt: new Date().toISOString() }, { merge: true });
      });

      return { success: true };
    } catch (error) {
      if (process.env.NODE_ENV === 'development') console.error('Error reordering exercises:', error);
      throw error;
    }
  }

  async copyWorkout(userId, organizationId, gymId, fromDate, toDate) {
    try {
      const from = this.formatDate(fromDate);
      const to = this.formatDate(toDate);
      const planId = `${organizationId}_${gymId}_${userId}`;
      const planRef = doc(db, 'workoutPlans', planId);

      await runTransaction(db, async (transaction) => {
        const snap = await transaction.get(planRef);
        if (!snap.exists()) throw new Error('No workout plan found');

        let data = snap.data();
        let workouts = data.workouts || {};
        this.normalizeDay(workouts, from);

        if (workouts[from].length === 0) {
          throw new Error('No workout to copy');
        }

        workouts[to] = workouts[from].map(ex => ({
          ...ex,
          instanceId: this.generateExerciseInstanceId(),
          addedAt: new Date().toISOString(),
          copiedFrom: from
        }));

        transaction.set(planRef, { ...data, workouts, updatedAt: new Date().toISOString() }, { merge: true });
      });

      return { success: true };
    } catch (error) {
      if (process.env.NODE_ENV === 'development') console.error('Error copying workout:', error);
      throw error;
    }
  }

  async clearWorkoutByDate(userId, organizationId, gymId, date) {
    try {
      const dateStr = this.formatDate(date);
      const planId = `${organizationId}_${gymId}_${userId}`;
      const planRef = doc(db, 'workoutPlans', planId);

      await runTransaction(db, async (transaction) => {
        const snap = await transaction.get(planRef);
        if (!snap.exists()) return;

        let data = snap.data();
        let workouts = data.workouts || {};
        delete workouts[dateStr];

        transaction.set(planRef, { ...data, workouts, updatedAt: new Date().toISOString() }, { merge: true });
      });

      return { success: true };
    } catch (error) {
      if (process.env.NODE_ENV === 'development') console.error('Error clearing workout:', error);
      throw error;
    }
  }

  async deleteWorkoutPlan(userId, organizationId, gymId) {
    try {
      const planId = `${organizationId}_${gymId}_${userId}`;
      await deleteDoc(doc(db, 'workoutPlans', planId));
      return { success: true };
    } catch (error) {
      if (process.env.NODE_ENV === 'development') console.error('Error deleting workout plan:', error);
      throw error;
    }
  }

  async getGymWorkoutPlans(organizationId, gymId) {
    try {
      const q = query(
        collection(db, 'workoutPlans'),
        where('organizationId', '==', organizationId),
        where('gymId', '==', gymId)
      );

      const snap = await getDocs(q);
      return snap.docs.map(d => ({ id: d.id, ...d.data() }));
    } catch (error) {
      if (process.env.NODE_ENV === 'development') console.error('Error getting gym workout plans:', error);
      throw error;
    }
  }
}

export default new WorkoutAPI();
