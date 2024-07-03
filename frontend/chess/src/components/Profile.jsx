import React from 'react';
import axios from 'axios';
import { useSelector, useDispatch } from 'react-redux';
import { login } from '../store/authSlice';

function Profile() {
    const authStatus = useSelector(state => state.auth.status);
    const userData = useSelector(state => state.auth.userData);
    const dispatch = useDispatch();

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

    return (
        <div className="w-screen h-screen flex items-center justify-center">
            <div className="w-96 items-center p-4 mx-auto bg-gradient-to-r from-gray-900 to-gray-100 rounded-lg shadow-md">
                <h1 className=" text-gray-100 text-2xl font-bold mb-4">User Profile</h1>
                <div className="w-[50%] bg-gray-200 bg-opacity-75 p-4 rounded-lg shadow-md">
                    <p className="text-lg font-semibold">Status: {authStatus}</p>
                    <div className="mt-4 text-black">
                        {userData && Object.entries(userData).map(([key, value]) => (
                            <div key={key} className="mb-2">
                                <span className="font-bold capitalize">{key}:</span> {value}
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    );
}

export default Profile;
