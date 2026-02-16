import { Link, useLocation } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';

import React from 'react';
import axios from 'axios';
import { login } from '../store/authSlice';
import wN from './pieces/wN.png';

function Navbar() {
    const dispatch = useDispatch();
    const authStatus = useSelector(state => state.auth.status);
    const userData = useSelector(state => state.auth.userData);
    const location = useLocation();

    React.useEffect(() => {
        // Fetch authenticated user profile; don't call root which returns a string.
        axios.get(`${import.meta.env.VITE_BACKEND_URL}/profile`, {
            withCredentials: true,
        })
            .then((res) => {
                const data = res.data;
                // If backend returns user object, update store
                if (data && typeof data === 'object') {
                    dispatch(login(data));
                } else {
                    dispatch(login(null));
                }
            })
            .catch((error) => {
                // On error (e.g., 401), ensure auth is cleared
                console.error('Error fetching profile:', error);
                dispatch(logout());
            });
    }, [dispatch]);

    // Override authStatus to false if the route is /login or /signup
    const isAuthPage = location.pathname === '/login' || location.pathname === '/signup';
    const effectiveAuthStatus = isAuthPage ? 'false' : authStatus;

    return (
        <nav className="w-full absolute top-0 z-50 pointer-events-auto bg-purple-900 bg-opacity-40 p-2">
            <div className="container mx-auto flex justify-between items-center">
                <div className="text-gray-800 text-2xl font-semibold">
                    <Link to="/" >
                        <img src={wN} width={40} alt="Logo" />
                    </Link>
                </div>
                <ul className="flex space-x-8">
                    <li>
                        <Link
                            to="/"
                            className="text-white text-md md:text-xl hover:text-purple-300 transition duration-300 ease-in-out"
                        >
                            Home
                        </Link>
                    </li>
                    {effectiveAuthStatus === "true" && userData.username ? (
                        <>
                            <li>
                                <Link
                                    to="/modeselector"
                                    className="text-white text-md md:text-xl hover:text-purple-300 transition duration-300 ease-in-out"
                                >
                                    Mode
                                </Link>
                            </li>
                            <li>
                                <Link
                                    to="/puzzle"
                                    className="text-white text-md md:text-xl hover:text-purple-300 transition duration-300 ease-in-out"
                                >
                                    Puzzles
                                </Link>
                            </li>
                            
                            <li>
                                <Link
                                    to="/profile"
                                    className="text-white text-md md:text-xl hover:text-purple-300 transition duration-300 capitalize ease-in-out"
                                >
                                    {userData ? userData.username.split(" ")[0] : "Profile"}

                                </Link>
                            </li>
                        </>
                    ) : (
                        <>
                            <li>
                                <Link
                                    to="/signup"
                                    className="text-white text-md md:text-xl hover:text-purple-300 transition duration-300 ease-in-out"
                                >
                                    SignUp
                                </Link>
                            </li>
                            <li>
                                <Link
                                    to="/login"
                                    className="text-white text-md md:text-xl hover:text-purple-300 transition duration-300 ease-in-out"
                                >
                                    Login
                                </Link>
                            </li>
                        </>
                    )}
                </ul>
            </div>
        </nav>
    );
}

export default Navbar;
