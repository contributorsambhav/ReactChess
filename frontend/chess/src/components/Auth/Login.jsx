import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useDispatch } from 'react-redux';
import bgImage from '../../assets/bgImage.jpg';
import PieceArray from '../PieceArray';
import axios from "axios"
import { login } from '../../store/authSlice';
function Login() {
    const dispatch = useDispatch();
    
    const navigate = useNavigate();
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [error, setError] = useState('');
    React.useEffect(() => {
        axios.get("http://localhost:8123/profile", {
            withCredentials: true
        })
            .then(res => {
                const data = res.data;
                dispatch(login(data));
                console.log(data);
            })
            .catch(error => {
                console.error('Error fetching profile:', error);
            });
    }, [dispatch]);
   
    const handleLogin = async (e) => {
    e.preventDefault();
    try {
        const response = await fetch('http://localhost:8123/user/login', {
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
            localStorage.setItem('authToken', data.token);  // Save token to localStorage
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
            className="w-screen h-screen bg-cover bg-no-repeat bg-center flex items-center justify-center"
            style={{ backgroundImage: `url(${bgImage})` }}
        >
            <div className="bg-white bg-opacity-10 backdrop-filter backdrop-blur-xl border border-gray-200 p-8 md:p-12 lg:p-16 rounded-xl shadow-lg w-11/12 max-w-md lg:max-w-lg xl:max-w-xl">
                <PieceArray />
                <h2 className="md:text-4xl lg:text-5xl sm:text-3xl font-semibold text-center text-white mb-12">Login</h2>
                <form className="space-y-6" onSubmit={handleLogin}>
                    <div>
                        <label htmlFor="email" className="block text-lg my-2 font-medium text-white">Email</label>
                        <input
                            type="email"
                            id="email"
                            name="email"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            className="tracking-wider placeholder-opacity-75 text-xl placeholder-gray-100 mt-1 p-2 w-full rounded-md bg-gray-200 bg-opacity-30 text-white border border-gray-400 focus:ring focus:ring-blue-500"
                            placeholder="you@example.com"
                            required
                        />
                    </div>
                    <div>
                        <label htmlFor="password" className="block text-lg my-2 font-medium text-white">Password</label>
                        <div className="relative">
                            <input
                                type={showPassword ? 'text' : 'password'}
                                id="password"
                                name="password"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                className="tracking-wider text-xl placeholder-opacity-75 placeholder-gray-100 mt-1 p-2 w-full rounded-md bg-gray-200 bg-opacity-30 text-white border border-gray-400 focus:ring focus:ring-blue-500"
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
                            className="text-xl px-4 w-full py-2 my-3 bg-transparent text-gray-100 rounded-md border border-purple-300 hover:bg-purple-600 hover:border-purple-600 hover:text-white transition duration-300 ease-in-out"
                        >
                            Login
                        </button>
                    </div>
                    <div className="text-center text-lg text-white">
                        Don't have an account? <Link to="/signup" className="text-purple-300 hover:text-white">Sign Up</Link>
                    </div>
                </form>
            </div>
        </div>
    );
}

export default Login;
