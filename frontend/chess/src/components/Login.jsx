import React from 'react';
import { Link } from 'react-router-dom'; // Import Link from react-router-dom
import bgImage from '../assets/bgImage.jpg'; // Import your background image
import PieceArray from './PieceArray';

function Login() {
    return (
        <div
            className="w-screen h-screen bg-cover bg-no-repeat bg-center flex items-center justify-center"
            style={{ backgroundImage: `url(${bgImage})` }}
        >
            <div className="bg-white bg-opacity-10 backdrop-filter backdrop-blur-xl border border-gray-200 p-8 md:p-12 lg:p-16 rounded-xl shadow-lg w-11/12 max-w-md lg:max-w-lg xl:max-w-xl">
                <PieceArray />

                <h2 className="md:text-4xl lg:text-5xl sm:text-3xl font-semibold text-center text-white mb-12">Login</h2>
                <form className="space-y-6">
                    <div>
                        <label htmlFor="email" className="block text-lg my-2 font-medium text-white">Email</label>
                        <input
                            type="email"
                            id="email"
                            className="tracking-wider text-xl placeholder-gray-100 mt-1 p-2 w-full rounded-md bg-gray-200 bg-opacity-30 text-white border border-gray-400 focus:ring focus:ring-blue-500"
                            placeholder="you@example.com"
                        />
                    </div>
                    <div>
                        <label htmlFor="password" className="block text-lg my-2 font-medium text-white">Password</label>
                        <input
                            type="password"
                            id="password"
                            className="tracking-wider text-xl placeholder-gray-100 mt-1 p-2 w-full rounded-md bg-gray-200 bg-opacity-30 text-white border border-gray-400 focus:ring focus:ring-blue-500"
                            placeholder="••••••••"
                        />
                    </div>
                    <div className="text-center">
                        <button
                            type="submit"
                            className="text-xl px-4 w-full py-2 my-3 bg-transparent text-gray-100 rounded-md border border-purple-300 hover:bg-purple-600 hover:border-purple-600 hover:text-white transition duration-300 ease-in-out"
                        >
                            Login
                        </button>
                    </div>
                    <div className="text-center text-lg  text-white">
                        Don't have an account? <Link to="/signup" className="text-purple-300 hover:text-white">Sign Up</Link>
                    </div>
                </form>
            </div>
        </div>
    );
}

export default Login;
