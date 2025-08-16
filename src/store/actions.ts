import { createAsyncThunk } from '@reduxjs/toolkit';
import { GoogleAuthProvider, signInWithPopup, } from 'firebase/auth';
import { auth } from '../firebase.config';


export const loginWithGoogle = createAsyncThunk(
  'auth/loginWithGoogle',
  async (_, {rejectWithValue}) => {
    try {
      const provider = new GoogleAuthProvider();
      const result = await signInWithPopup(auth, provider);

      if (!result) {
        throw new Error('Ты не зарегистрировался');
      }

      return {
        uid: result.user.uid,
        email: result.user.email,
        displayName: result.user.displayName,
        photoURL: result.user.photoURL
      };

    } catch (error) {
      return rejectWithValue(error instanceof Error ? error.message : 'Unknown error');
    }
  },
);

export const logout = createAsyncThunk(
  'auth/logout',
  async (_, { rejectWithValue }) => {
    try {
      await auth.signOut();
    } catch (error) {
      return rejectWithValue(error instanceof Error ? error.message : 'Unknown error');
    }
  }
);

export const checkAuth = createAsyncThunk(
  'auth/checkAuth',
  async (_, { rejectWithValue }) => {
    try {
      await auth.authStateReady();
      return auth.currentUser;
    } catch (error) {
      return rejectWithValue(error instanceof Error ? error.message : 'Unknown error');
    }
  }
);
