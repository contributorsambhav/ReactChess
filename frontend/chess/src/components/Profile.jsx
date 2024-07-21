import React from 'react';
import axios from 'axios';
import { useSelector, useDispatch } from 'react-redux';
import { login, logout } from '../store/authSlice';
import Cookies from 'js-cookie';
import { useNavigate } from 'react-router-dom';

function Profile() {
    const authStatus = useSelector(state => state.auth.status);
    const userData = useSelector(state => state.auth.userData);
    const dispatch = useDispatch();
    const navigate = useNavigate()

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

    const renderMatchHistory = (matchHistory) => {
        return (
            <div className="mt-4 text-black">
                <h2 className="text-xl font-bold">Match History</h2>
                {Object.entries(matchHistory).map(([key, value]) => (
                    <div key={key} className="mb-2">
                        <span className="font-bold capitalize">{key}:</span> {JSON.stringify(value)}
                    </div>
                ))}
            </div>
        );
    };

    const handleLogout = () => {
        Cookies.remove('token', { path: '/' });
        dispatch(logout());
        navigate("/login")
    };

    return (
        <div className="w-screen h-screen flex items-center justify-center">
            <div className="w-96 items-center p-4 mx-auto bg-gradient-to-r from-white to-green-400 opacity-90 rounded-lg shadow-md">
                <h1 className="text-green-900 text-2xl font-bold mb-4">User Profile</h1>
                <div className="w-full bg-green-200 bg-opacity-75 p-4 rounded-lg shadow-md">
                    <p className="text-lg font-semibold">Status: {authStatus}</p>
                    <div className="mt-4 text-black">
                        {userData && Object.entries(userData).map(([key, value]) => {
                            if (key === 'matchHistory' && typeof value === 'object') {
                                return (
                                    <div key={key} className="mb-2">
                                        {renderMatchHistory(value)}
                                    </div>
                                );
                            } else {
                                return (
                                    <div key={key} className="mb-2">
                                        <span className="font-bold capitalize">{key}:</span> {value}
                                    </div>
                                );
                            }
                        })}
                    </div>
                </div>
                <button 
                    onClick={handleLogout}
                    className="mt-4 bg-green-500 text-white font-bold py-2 px-4 rounded hover:bg-green-600"
                >
                    Logout
                </button>
            </div>
        </div>
    );
}

export default Profile;
