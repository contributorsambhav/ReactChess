import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import bgImage from '../../assets/images/bgImage.jpg';

function SignUp() {
    const navigate = useNavigate();
    const [formData, setFormData] = useState({
        name: '',
        email: '',
        password: '',
        confirmPassword: ''
    });
    const [showPassword, setShowPassword] = useState(false);
    const [showConfirmPassword, setShowConfirmPassword] = useState(true);

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

    const postData = async (e) => {
        e.preventDefault();
        const { name, email, password, confirmPassword } = formData;
    
        if (password !== confirmPassword) {
            alert("Password and Confirm Password do not match");
            return;
        }
    
        const res = await fetch("http://localhost:8123/user/register", {
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
            alert(JSON.stringify(data))
            alert("Registration Successful");
            navigate("/login");
        }
    };
    

    return (
        <div
            className="w-screen min-h-screen bg-cover bg-no-repeat bg-center flex items-center justify-center"
            style={{ backgroundImage: `url(${bgImage})` }}
        >
            <div className="bg-white bg-opacity-10 backdrop-filter backdrop-blur-xl border border-gray-200 p-8 lg:p-12 lg:p-16 rounded-xl shadow-lg w-11/12 max-w-md lg:max-w-lg xl:max-w-xl">
                <h2 className="text-4xl font-bold text-white text-center mb-8">Sign Up</h2>
                <form className="space-y-2" onSubmit={postData}>
                    <div>
                        <label htmlFor="username" className="block text-lg my-2 font-medium text-white">Username</label>
                        <input
                            type="text"
                            id="username"
                            name="name"
                            className="tracking-wider text-lg placeholder-opacity-75 placeholder-gray-100 mt-1 p-2 w-full rounded-md bg-gray-200 bg-opacity-30 text-white border border-gray-400 focus:ring focus:ring-blue-500"
                            placeholder="Enter your username"
                            value={formData.name}
                            onChange={handleChange}
                            required
                        />
                    </div>
                    <div>
                        <label htmlFor="email" className="block text-lg my-2 font-medium text-white">Email</label>
                        <input
                            type="email"
                            id="email"
                            name="email"
                            className="tracking-wider text-lg placeholder-opacity-75 placeholder-gray-100 mt-1 p-2 w-full rounded-md bg-gray-200 bg-opacity-30 text-white border border-gray-400 focus:ring focus:ring-blue-500"
                            placeholder="Enter your email"
                            value={formData.email}
                            onChange={handleChange}
                            required
                        />
                    </div>
                    <label htmlFor="password" className="block text-lg  font-medium text-white">Password</label>
                    <div className="relative">
                        <input
                            type={showPassword ? "text" : "password"}
                            id="password"
                            name="password"
                            className="tracking-wider text-lg placeholder-opacity-75 placeholder-gray-100 mt-1 p-2 w-full rounded-md bg-gray-200 bg-opacity-30 text-white border border-gray-400 focus:ring focus:ring-blue-500"
                            placeholder="Enter your password"
                            value={formData.password}
                            onChange={handleChange}
                            required
                        />
                        <span className=" absolute right-3 top-3" onClick={() => togglePasswordVisibility('password')}>
                            {!showPassword ? <i className="fas fa-eye-slash text-white"></i> : <i className="fas fa-eye  text-white"></i>}
                        </span>
                    </div>
                    <label htmlFor="confirmPassword" className="block text-lg  font-medium text-white">Confirm Password</label>
                    <div className="relative">
                        <input
                            type={showConfirmPassword ? "text" : "password"}
                            id="confirmPassword"
                            name="confirmPassword"
                            className="tracking-wider text-lg placeholder-opacity-75 placeholder-gray-100 mt-1 p-2 w-full rounded-md bg-gray-200 bg-opacity-30 text-white border border-gray-400 focus:ring focus:ring-blue-500"
                            placeholder="Confirm your password"
                            value={formData.confirmPassword}
                            onChange={handleChange}
                            required
                        />
                        <span className="absolute right-3 top-3" onClick={() => togglePasswordVisibility('confirmPassword')}>
                            {!showConfirmPassword ? <i className="fas fa-eye-slash  text-white"></i> : <i className="fas fa-eye  text-white"></i>}
                        </span>

                    </div>
                    <div className="text-center">
                        <button
                            type="submit"
                            className=" mt-4 w-full hover:bg-slateblue-700 text-white font-weight-600 text-xl py-3 px-6 rounded-lg focus:outline-none focus:ring-2 focus:ring-slateblue-500"
                        >
                            Sign Up
                        </button>
                    </div>
                    <div className="text-center text-white text-lg">
                        Already have an account? <Link to="/login" className="underline text-gray-100 hover:text-blue-500">Login</Link>
                    </div>
                </form>
            </div>
        </div>
    );
}

export default SignUp;
