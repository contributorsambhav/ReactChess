import { createSlice } from "@reduxjs/toolkit";

const initialState = {
    status: "false",
    userData: null
}

const authSlice = createSlice({
    name: "auth",
    initialState,
    reducers: {
        login: (state, action) => {
            if (action.payload) {
                state.status = "true";
                state.userData = action.payload;
            } else {
                state.status = "false";
                state.userData = null;
            }
        },
        logout: (state) => {
            state.status = "false";
            state.userData = null;
        }
    }
})

export const { login, logout } = authSlice.actions;

export default authSlice.reducer;
