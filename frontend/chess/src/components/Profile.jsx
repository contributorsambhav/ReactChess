import React from "react";
import axios from "axios";
import { useSelector, useDispatch } from "react-redux";
import { login, logout } from "../store/authSlice";
import Cookies from "js-cookie";
import { useNavigate } from "react-router-dom";
import svg from "../assets/base.png";
import bg from "../assets/bgprofile.jpg";

function Profile() {
  const authStatus = useSelector((state) => state.auth.status);
  const userData = useSelector((state) => state.auth.userData);
  const dispatch = useDispatch();
  const navigate = useNavigate();

  React.useEffect(() => {
    axios
      .get("http://localhost:8123/profile", {
        withCredentials: true,
      })
      .then((res) => {
        const data = res.data;
        dispatch(login(data));
        console.log(data);
      })
      .catch((error) => {
        console.error("Error fetching profile:", error);
      });
  }, [dispatch]);

  const renderMatchHistory = (matchHistory) => {
    return (
      <div className="h-full bg-gray-800 bg-opacity-90 p-4 rounded-lg shadow-md">
        <h2 className="text-3xl font-semibold text-center text-white mb-2">
          Match History
        </h2>
        <table className="min-w-full bg-gray-800 text-gray-100">
          <thead className="bg-gray-700">
            <tr>
              <th
                scope="col"
                className="px-6 py-3 text-left text-xl font-semibold text-white"
              >
                SR.NO
              </th>
              <th
                scope="col"
                className="px-6 py-3 text-left text-xl font-semibold text-white"
              >
                OPPONENT
              </th>
              <th
                scope="col"
                className="px-6 py-3 text-left text-xl font-semibold text-white"
              >
                RESULT
              </th>
              <th
                scope="col"
                className="px-6 py-3 text-left text-xl font-semibold text-white"
              >
                DATE
              </th>
            </tr>
          </thead>
          <tbody>
            {matchHistory.map((match, index) => (
              <tr
                key={match._id}
                className="hover:bg-gray-600 transition-colors duration-300"
              >
                <td className="px-6 py-4 text-xl text-gray-100">
                  {index + 1}
                </td>
                <td className="px-6 py-4 text-xl text-gray-100">
                  {match.opponent}
                </td>
                <td className="px-6 py-4 text-xl text-gray-100">
                  {match.status}
                </td>
                <td className="px-6 py-4 text-xl text-gray-100">
                  {new Date(match.createdAt).toLocaleDateString()}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    );
  };

  const handleLogout = () => {
    Cookies.remove("token", { path: "/" });
    dispatch(logout());
    navigate("/login");
  };

  return (
    <div
      className="w-screen h-screen flex items-center justify-center bg-gray-900"
      style={{ backgroundImage: `url(${bg})`, backgroundSize: "contain" }}
    >
      <div className="w-3/4 h-3/4 flex space-x-4">
        <div className="w-1/2 max-h-[70vh] p-4 bg-gray-700 bg-opacity-50 rounded-lg shadow-md flex flex-col justify-between">
          <div className="flex w-full overflow-y-scroll flex-col items-center justify-center flex-grow">
            <h1 className="text-3xl font-semibold text-center text-white mb-4">
              User Profile
            </h1>
            <div className="text-gray-100 text-xl mb-4 w-full">
              <table className="min-w-full text-left">
                <tbody>
                  {userData &&
                    Object.entries(userData).map(([key, value]) => {
                      if (
                        key !== "userId" &&
                        key !== "iat" &&
                        key !== "exp" &&
                        key !== "matchHistory"
                      ) {
                        return (
                          <tr
                            key={key}
                            className="hover:text-gray-400 transition-colors duration-300"
                          >
                            <td className="font-semibold text-2xl capitalize py-2">
                              {key}:
                            </td>
                            <td className="text-2xl py-2">{value}</td>
                          </tr>
                        );
                      }
                      return null;
                    })}
                </tbody>
              </table>
            </div>
            <div
              className="w-full h-64 bg-cover bg-center relative overflow-hidden"
              style={{ backgroundImage: `url(${svg})` }}
            ></div>
          </div>
          <button
            onClick={handleLogout}
            className="bg-white text-gray-900 text-2xl my-4 py-3 font-bold py-2 px-4 rounded hover:bg-red-500 hover:text-white transition-colors duration-300"
          >
            Logout
          </button>
        </div>
        <div className="w-1/2 max-h-[70vh] overflow-y-scroll">
          {userData && userData.matchHistory && renderMatchHistory(userData.matchHistory)}
        </div>
      </div>
    </div>
  );
}

export default Profile;
