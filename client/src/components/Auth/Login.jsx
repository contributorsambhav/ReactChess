import { Link, useNavigate } from 'react-router-dom';
import React, { useState, useEffect, useCallback } from 'react';

import PieceArray from '../PieceArray';
import axios from "axios"
import bgImage from '../../assets/images/bgImage.jpg';
import { login } from '../../store/authSlice';
import { useDispatch } from 'react-redux';

function Login() {
    const dispatch = useDispatch();

    const navigate = useNavigate();
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [error, setError] = useState('');

    useEffect(() => {
        // Try to fetch current user profile if cookie exists
        axios.get(`${import.meta.env.VITE_BACKEND_URL}/profile`, { withCredentials: true })
            .then(res => {
                const data = res.data;
                if (data && typeof data === 'object') {
                    dispatch(login(data));
                }
            })
            .catch(error => {
                console.error('Error fetching profile:', error);
                dispatch(login(null));
            });
    }, [dispatch]);

    // Google OAuth callback
    const handleGoogleResponse = useCallback(async (response) => {
        try {
            const res = await fetch(`${import.meta.env.VITE_BACKEND_URL}/user/google-login`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ credential: response.credential }),
                credentials: 'include'
            });

            const data = await res.json();
            if (res.ok) {
                dispatch(login(data));
                navigate('/profile');
            } else {
                setError(data.error || 'Google login failed');
            }
        } catch (err) {
            console.error('Google login error:', err);
            setError('Google login failed. Please try again.');
        }
    }, [dispatch, navigate]);

    // Load Google Identity Services script
    useEffect(() => {
        const clientId = import.meta.env.VITE_GOOGLE_CLIENT_ID;
        if (!clientId || clientId === 'YOUR_GOOGLE_CLIENT_ID_HERE') return;

        const script = document.createElement('script');
        script.src = 'https://accounts.google.com/gsi/client';
        script.async = true;
        script.defer = true;
        script.onload = () => {
            window.google.accounts.id.initialize({
                client_id: clientId,
                callback: handleGoogleResponse,
            });
        };
        document.body.appendChild(script);

        return () => {
            const existingScript = document.querySelector('script[src="https://accounts.google.com/gsi/client"]');
            if (existingScript) existingScript.remove();
        };
    }, [handleGoogleResponse]);

    const handleGoogleSignIn = () => {
        if (window.google?.accounts?.id) {
            window.google.accounts.id.prompt();
        }
    };

    const handleLogin = async (e) => {
        e.preventDefault();
        try {
            const response = await fetch(`${import.meta.env.VITE_BACKEND_URL}/user/login`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    email: email,
                    password: password
                }),
                credentials: 'include'
            });

            const data = await response.json();
            if (response.ok) {
                dispatch(login(data));
                navigate('/profile');
            } else {
                setError(data.error || 'Login failed');
            }
        } catch (error) {
            console.error('Error during login:', error);
            setError('Internal server error');
        }
    };


    const togglePasswordVisibility = () => {
        setShowPassword(!showPassword);
    };

    return (
        <div
            className="w-screen min-h-screen bg-cover bg-no-repeat bg-center flex items-center justify-center pt-14"
            style={{ backgroundImage: `url(${bgImage})` }}
        >
            <div className="bg-white bg-opacity-10 backdrop-filter backdrop-blur-xl border border-gray-200 p-6 lg:p-8 rounded-xl shadow-lg w-11/12 max-w-sm lg:max-w-md xl:max-w-lg my-4">
                <PieceArray />
                <h2 className="text-2xl lg:text-3xl font-semibold text-center text-white mb-6">Login</h2>
                <form className="space-y-4" onSubmit={handleLogin}>
                    <div>
                        <label htmlFor="email" className="block text-base my-1 font-medium text-white">Email</label>
                        <input
                            type="email"
                            id="email"
                            name="email"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            className="tracking-wider placeholder-opacity-75 text-base placeholder-gray-100 mt-1 p-2 w-full rounded-md bg-gray-200 bg-opacity-30 text-white border border-gray-400 focus:ring focus:ring-blue-500"
                            placeholder="you@example.com"
                            required
                        />
                    </div>
                    <div>
                        <label htmlFor="password" className="block text-base my-1 font-medium text-white">Password</label>
                        <div className="relative">
                            <input
                                type={showPassword ? 'text' : 'password'}
                                id="password"
                                name="password"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                className="tracking-wider text-base placeholder-opacity-75 placeholder-gray-100 mt-1 p-2 w-full rounded-md bg-gray-200 bg-opacity-30 text-white border border-gray-400 focus:ring focus:ring-blue-500"
                                placeholder="••••••••"
                                required
                            />
                            <span className="absolute right-3 top-3 cursor-pointer" onClick={togglePasswordVisibility}>
                                {!showPassword ? <i className="fas fa-eye-slash text-white"></i> : <i className="fas fa-eye text-white"></i>}
                            </span>
                        </div>
                    </div>
                    {error && <p className="text-red-400 text-sm text-center">{error}</p>}
                    <div className="text-center">
                        <button
                            type="submit"
                            className="text-base px-4 w-full py-2 my-1 bg-transparent text-gray-100 rounded-md border border-purple-300 hover:bg-purple-600 hover:border-purple-600 hover:text-white transition duration-300 ease-in-out"
                        >
                            Login
                        </button>
                    </div>

                    {/* Divider */}
                    <div className="flex items-center my-1">
                        <div className="flex-grow border-t border-gray-400"></div>
                        <span className="px-3 text-gray-300 text-sm">OR</span>
                        <div className="flex-grow border-t border-gray-400"></div>
                    </div>

                    {/* Custom Google Sign-In Button */}
                    <div className="text-center">
                        <button
                            type="button"
                            onClick={handleGoogleSignIn}
                            className="w-full bg-transparent hover:bg-purple-600 text-white font-semibold text-base py-2 px-4 rounded-md border border-purple-300 hover:border-purple-600 transition duration-300 flex items-center justify-center gap-3"
                        >
                            <svg width="18" height="18" viewBox="0 0 18 18" xmlns="http://www.w3.org/2000/svg">
                                <g fill="none" fillRule="evenodd">
                                    <path d="M17.64 9.205c0-.639-.057-1.252-.164-1.841H9v3.481h4.844a4.14 4.14 0 0 1-1.796 2.716v2.259h2.908c1.702-1.567 2.684-3.875 2.684-6.615z" fill="#4285F4" />
                                    <path d="M9 18c2.43 0 4.467-.806 5.956-2.18l-2.908-2.259c-.806.54-1.837.86-3.048.86-2.344 0-4.328-1.584-5.036-3.711H.957v2.332A8.997 8.997 0 0 0 9 18z" fill="#34A853" />
                                    <path d="M3.964 10.71A5.41 5.41 0 0 1 3.682 9c0-.593.102-1.17.282-1.71V4.958H.957A8.996 8.996 0 0 0 0 9c0 1.452.348 2.827.957 4.042l3.007-2.332z" fill="#FBBC05" />
                                    <path d="M9 3.58c1.321 0 2.508.454 3.44 1.345l2.582-2.58C13.463.891 11.426 0 9 0A8.997 8.997 0 0 0 .957 4.958L3.964 7.29C4.672 5.163 6.656 3.58 9 3.58z" fill="#EA4335" />
                                </g>
                            </svg>
                            Sign in with Google
                        </button>
                    </div>

                    <div className="text-center text-sm text-white pt-1">
                        Don't have an account? <Link to="/signup" className="text-purple-300 hover:text-white">Sign Up</Link>
                    </div>
                </form>
            </div>
        </div>
    );
}

export default Login;