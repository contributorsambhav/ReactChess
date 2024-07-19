import React from 'react';
import { Link } from 'react-router-dom';
import { useSelector, useDispatch } from 'react-redux';
import wN from './pieces/wN.png';
import { login } from '../store/authSlice';

function Navbar() {
    const dispatch = useDispatch();
    const authStatus = useSelector(state => state.auth.status);
    const userData = useSelector(state => state.auth.userData);

    // Check for authentication status in localStorage on component mount
    React.useEffect(() => {
        const token = localStorage.getItem('authToken');
        if (token) {
            // If token exists, dispatch login action with user data
            dispatch(login({ token }));
        }
    }, [dispatch]);

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
                    {authStatus ? (
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
                                    to="/puzzle"
                                    className="text-white text-xl hover:text-purple-300 transition duration-300 ease-in-out"
                                >
                                    Puzzles
                                </Link>
                            </li>
                            <li>
                                <Link
                                    to="/profile"
                                    className="text-white text-xl hover:text-purple-300 transition duration-300 ease-in-out"
                                >
                                    {userData ? userData.username : "Profile"}
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
