import { createSlice } from '@reduxjs/toolkit';
import { checkAuth, loginWithGoogle, logout } from './actions';
import { AuthorizationStatus } from '../const';
import type { TUser } from '../types/user';


type TInitialState = {
  authorizationStatus: AuthorizationStatus;
  user: TUser | null;
}

const initialState: TInitialState = {
  authorizationStatus: AuthorizationStatus.Unknown,
  user: null,
}

export const reducer = createSlice({
  name: 'reducer', 
  initialState,
  reducers: {},
  extraReducers(builder) {
    builder
      .addCase(loginWithGoogle.fulfilled, (state, action) => {
        state.user = action.payload;
        state.authorizationStatus = AuthorizationStatus.Auth;
      })
      .addCase(logout.fulfilled, (state) => {
        state.user = null;
        state.authorizationStatus = AuthorizationStatus.NoAuth;
      })
      .addCase(checkAuth.fulfilled, (state, action) => {
        const user = action.payload;
        if (user) {
          state.user = {
            uid: user.uid,
            email: user.email,
            displayName: user.displayName,
            photoURL: user.photoURL,
          };
          state.authorizationStatus = AuthorizationStatus.Auth;
        } else {
          state.user = null;
          state.authorizationStatus = AuthorizationStatus.Unknown;
        }
      });
  }
});
