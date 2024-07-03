import React from 'react';
import { Link } from 'react-router-dom';
import { useSelector } from 'react-redux';  // Import useSelector from react-redux
import wN from './pieces/wN.png';

function Navbar() {
    const authStatus = useSelector(state => state.auth.status);

    return (
        <nav className="w-full bg-purple-300 bg-opacity-10 p-2">
            <div className="container mx-auto flex justify-between items-center">
                <div className="text-white text-2xl font-semibold">
                    <Link to="/" >
                        <img src={wN} width={40} alt="Logo" />
                    </Link>
                </div>
                <ul className="flex space-x-8">
                    <li>
                        <Link
                            to="/"
                            className="text-white text-xl hover:text-purple-300 transition duration-300 ease-in-out"
                        >
                            Home
                        </Link>
                    </li>
                    {authStatus === "true" ? (
                        <>
                            <li>
                                <Link
                                    to="/modeselector"
                                    className="text-white text-xl hover:text-purple-300 transition duration-300 ease-in-out"
                                >
                                    Game Mode
                                </Link>
                            </li>
                            <li>
                                <Link
                                    to="/profile"
                                    className="text-white text-xl hover:text-purple-300 transition duration-300 ease-in-out"
                                >
                                    Profile
                                </Link>
                            </li>
                        </>
                    ) : (
                        <>
                            <li>
                                <Link
                                    to="/signup"
                                    className="text-white text-xl hover:text-purple-300 transition duration-300 ease-in-out"
                                >
                                    SignUp
                                </Link>
                            </li>
                            <li>
                                <Link
                                    to="/login"
                                    className="text-white text-xl hover:text-purple-300 transition duration-300 ease-in-out"
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
