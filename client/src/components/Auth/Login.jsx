import { Link, useNavigate } from 'react-router-dom';
import React, { useState } from 'react';

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
    React.useEffect(() => {
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
                dispatch(login(data));  // Dispatch login action with user data
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
            className="w-screen min-h-screen bg-cover bg-no-repeat bg-center flex items-center justify-center"
            style={{ backgroundImage: `url(${bgImage})` }}
        >
            <div className="bg-white bg-opacity-10 backdrop-filter backdrop-blur-xl border border-gray-200 p-6 lg:p-8 rounded-xl shadow-lg w-11/12 max-w-sm lg:max-w-md xl:max-w-lg">
                <PieceArray />
                <h2 className="text-2xl lg:text-3xl font-semibold text-center text-white mb-8">Login</h2>
                <form className="space-y-6" onSubmit={handleLogin}>
                    <div>
                        <label htmlFor="email" className="block text-base my-2 font-medium text-white">Email</label>
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
                        <label htmlFor="password" className="block text-base my-2 font-medium text-white">Password</label>
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
                            <span className="absolute right-3 top-3" onClick={togglePasswordVisibility}>
                                {!showPassword ? <i className="fas fa-eye-slash text-white"></i> : <i className="fas fa-eye text-white"></i>}
                            </span>
                        </div>
                    </div>
                    {error && <p className="text-red-500">{error}</p>}
                    <div className="text-center">
                        <button
                            type="submit"
                            className="text-lg px-4 w-full py-2 my-2 bg-transparent text-gray-100 rounded-md border border-purple-300 hover:bg-purple-600 hover:border-purple-600 hover:text-white transition duration-300 ease-in-out"
                        >
                            Login
                        </button>
                    </div>
                    <div className="text-center text-base text-white">
                        Don't have an account? <Link to="/signup" className="text-purple-300 hover:text-white">Sign Up</Link>
                    </div>
                </form>
            </div>
        </div>
    );
}

export default Login;
