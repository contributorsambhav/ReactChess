import { Link, useNavigate } from 'react-router-dom';
import React, { useState, useEffect, useCallback } from 'react';

import bgImage from '../../assets/images/bgImage.jpg';
import { login } from '../../store/authSlice';
import { useDispatch } from 'react-redux';

function SignUp() {
    const navigate = useNavigate();
    const dispatch = useDispatch();
    const [formData, setFormData] = useState({
        name: '',
        email: '',
        password: '',
        confirmPassword: ''
    });
    const [showPassword, setShowPassword] = useState(false);
    const [showConfirmPassword, setShowConfirmPassword] = useState(false);
    const [error, setError] = useState('');

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData({
            ...formData,
            [name]: value
        });
    };

    const togglePasswordVisibility = (field) => {
        if (field === 'password') {
            setShowPassword(!showPassword);
        } else if (field === 'confirmPassword') {
            setShowConfirmPassword(!showConfirmPassword);
        }
    };

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
                setError(data.error || 'Google sign-up failed');
            }
        } catch (err) {
            console.error('Google sign-up error:', err);
            setError('Google sign-up failed. Please try again.');
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

    const postData = async (e) => {
        e.preventDefault();
        const { name, email, password, confirmPassword } = formData;

        if (password !== confirmPassword) {
            alert("Password and Confirm Password do not match");
            return;
        }

        const res = await fetch(`${import.meta.env.VITE_BACKEND_URL}/user/register`, {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify({
                username: name,
                email: email,
                password: password
            })
        });

        const data = await res.json();

        if (!data) {
            alert("Invalid data");
        } else {
            navigate("/login");
        }
    };


    return (
        <div
            className="w-screen min-h-screen bg-cover bg-no-repeat bg-center flex items-center justify-center pt-14"
            style={{ backgroundImage: `url(${bgImage})` }}
        >
            <div className="bg-white bg-opacity-10 backdrop-filter backdrop-blur-xl border border-gray-200 p-6 lg:p-8 rounded-xl shadow-lg w-11/12 max-w-sm lg:max-w-md xl:max-w-lg my-4">
                <h2 className="text-2xl lg:text-3xl font-bold text-white text-center mb-4">Sign Up</h2>
                <form className="space-y-2" onSubmit={postData}>
                    <div>
                        <label htmlFor="username" className="block text-sm my-1 font-medium text-white">Username</label>
                        <input
                            type="text"
                            id="username"
                            name="name"
                            className="tracking-wider text-base placeholder-opacity-75 placeholder-gray-100 mt-1 p-2 w-full rounded-md bg-gray-200 bg-opacity-30 text-white border border-gray-400 focus:ring focus:ring-blue-500"
                            placeholder="Enter your username"
                            value={formData.name}
                            onChange={handleChange}
                            required
                        />
                    </div>
                    <div>
                        <label htmlFor="email" className="block text-sm my-1 font-medium text-white">Email</label>
                        <input
                            type="email"
                            id="email"
                            name="email"
                            className="tracking-wider text-base placeholder-opacity-75 placeholder-gray-100 mt-1 p-2 w-full rounded-md bg-gray-200 bg-opacity-30 text-white border border-gray-400 focus:ring focus:ring-blue-500"
                            placeholder="Enter your email"
                            value={formData.email}
                            onChange={handleChange}
                            required
                        />
                    </div>
                    <label htmlFor="password" className="block text-sm font-medium text-white">Password</label>
                    <div className="relative">
                        <input
                            type={showPassword ? "text" : "password"}
                            id="password"
                            name="password"
                            className="tracking-wider text-base placeholder-opacity-75 placeholder-gray-100 mt-1 p-2 w-full rounded-md bg-gray-200 bg-opacity-30 text-white border border-gray-400 focus:ring focus:ring-blue-500"
                            placeholder="Enter your password"
                            value={formData.password}
                            onChange={handleChange}
                            required
                        />
                        <span className="absolute right-3 top-3 cursor-pointer" onClick={() => togglePasswordVisibility('password')}>
                            {!showPassword ? <i className="fas fa-eye-slash text-white"></i> : <i className="fas fa-eye  text-white"></i>}
                        </span>
                    </div>
                    <label htmlFor="confirmPassword" className="block text-sm font-medium text-white">Confirm Password</label>
                    <div className="relative">
                        <input
                            type={showConfirmPassword ? "text" : "password"}
                            id="confirmPassword"
                            name="confirmPassword"
                            className="tracking-wider text-base placeholder-opacity-75 placeholder-gray-100 mt-1 p-2 w-full rounded-md bg-gray-200 bg-opacity-30 text-white border border-gray-400 focus:ring focus:ring-blue-500"
                            placeholder="Confirm your password"
                            value={formData.confirmPassword}
                            onChange={handleChange}
                            required
                        />
                        <span className="absolute right-3 top-3 cursor-pointer" onClick={() => togglePasswordVisibility('confirmPassword')}>
                            {!showConfirmPassword ? <i className="fas fa-eye-slash  text-white"></i> : <i className="fas fa-eye  text-white"></i>}
                        </span>
                    </div>
                    {error && <p className="text-red-400 text-sm text-center">{error}</p>}
                    <div className="text-center">
                        <button
                            type="submit"
                            className="mt-2 w-full hover:bg-slateblue-700 text-white font-weight-600 text-base py-2 px-4 rounded-lg focus:outline-none focus:ring-2 focus:ring-slateblue-500 border border-purple-300 hover:bg-purple-600 hover:border-purple-600 transition duration-300"
                        >
                            Sign Up
                        </button>
                    </div>

                    {/* Divider */}
                    <div className="flex items-center my-1">
                        <div className="flex-grow border-t border-gray-400"></div>
                        <span className="px-3 text-gray-300 text-sm">OR</span>
                        <div className="flex-grow border-t border-gray-400"></div>
                    </div>

                    {/* Custom Google Sign-Up Button */}
                    <div className="text-center">
                        <button
                            type="button"
                            onClick={handleGoogleSignIn}
                            className="w-full bg-transparent hover:bg-purple-600 text-white font-semibold text-base py-2 px-4 rounded-lg border border-purple-300 hover:border-purple-600 transition duration-300 flex items-center justify-center gap-3"
                        >
                            <svg width="18" height="18" viewBox="0 0 18 18" xmlns="http://www.w3.org/2000/svg">
                                <g fill="none" fillRule="evenodd">
                                    <path d="M17.64 9.205c0-.639-.057-1.252-.164-1.841H9v3.481h4.844a4.14 4.14 0 0 1-1.796 2.716v2.259h2.908c1.702-1.567 2.684-3.875 2.684-6.615z" fill="#4285F4" />
                                    <path d="M9 18c2.43 0 4.467-.806 5.956-2.18l-2.908-2.259c-.806.54-1.837.86-3.048.86-2.344 0-4.328-1.584-5.036-3.711H.957v2.332A8.997 8.997 0 0 0 9 18z" fill="#34A853" />
                                    <path d="M3.964 10.71A5.41 5.41 0 0 1 3.682 9c0-.593.102-1.17.282-1.71V4.958H.957A8.996 8.996 0 0 0 0 9c0 1.452.348 2.827.957 4.042l3.007-2.332z" fill="#FBBC05" />
                                    <path d="M9 3.58c1.321 0 2.508.454 3.44 1.345l2.582-2.58C13.463.891 11.426 0 9 0A8.997 8.997 0 0 0 .957 4.958L3.964 7.29C4.672 5.163 6.656 3.58 9 3.58z" fill="#EA4335" />
                                </g>
                            </svg>
                            Sign up with Google
                        </button>
                    </div>

                    <div className="text-center text-white text-sm pt-1">
                        Already have an account? <Link to="/login" className="underline text-gray-100 hover:text-blue-500">Login</Link>
                    </div>
                </form>
            </div>
        </div>
    );
}

export default SignUp;