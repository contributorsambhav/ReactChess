import { login, logout } from "../store/authSlice";
import { useDispatch, useSelector } from "react-redux";

// Cookies removed: logout will call backend to clear httpOnly cookie
import React from "react";
import axios from "axios";
import bg from "../assets/images/bgprofile.jpg";
import svg from "../assets/images/base.png";
import { useNavigate } from "react-router-dom";

function Profile() {
  const userData = useSelector((state) => state.auth.userData);
  const dispatch = useDispatch();
  const navigate = useNavigate();

  React.useEffect(() => {
    axios
      .get(`${import.meta.env.VITE_BACKEND_URL}/profile`, {
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
      <div className="h-full bg-gray-800 bg-opacity-50 lg:p-4 rounded-lg shadow-md">
        <h2 className="text-lg lg:text-xl font-semibold text-center text-white mb-2">
          Match History
        </h2>
        <table className="min-w-full mx-auto bg-gray-200 bg-opacity-20 text-gray-100 rounded-lg">
          <thead className="bg-gray-700 bg-opacity-70">
            <tr>
              <th
                scope="col"
                className="px-2 lg:px-3 py-2 text-left text-sm lg:text-base font-semibold text-white"
              >
                SR.NO
              </th>
              <th
                scope="col"
                className="px-2 lg:px-3 py-2 text-left text-sm lg:text-base font-semibold text-white"
              >
                OPPONENT
              </th>
              <th
                scope="col"
                className="px-2 lg:px-3 py-2 text-left text-sm lg:text-base font-semibold text-white"
              >
                RESULT
              </th>
              {window.innerWidth > 768 && (
                <th
                  scope="col"
                  className="px-2 lg:px-3 py-2 text-left text-sm lg:text-base font-semibold text-white"
                >
                  DATE
                </th>
              )}
            </tr>
          </thead>
          <tbody>
            {matchHistory.map((match, index) => (
              <tr
                key={match._id}
                className="hover:bg-gray-600 transition-colors duration-300"
              >
                <td className="px-2 lg:px-3 py-2 text-sm lg:text-base text-gray-100">
                  {index + 1}
                </td>
                <td className="px-2 lg:px-3 py-2 capitalize text-sm lg:text-base text-gray-100">
                  {match.opponent}
                </td>
                <td className="px-2 lg:px-3 py-2 capitalize text-sm lg:text-base text-gray-100">
                  {match.status}
                </td>
                {window.innerWidth > 768 && (
                  <td className="px-2 lg:px-3 py-2 text-sm lg:text-base text-gray-100">
                    {new Date(match.createdAt).toLocaleDateString()}
                  </td>
                )}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    );
  };

  const handleLogout = () => {
    axios
      .post(`${import.meta.env.VITE_BACKEND_URL}/user/logout`, {}, { withCredentials: true })
      .catch((err) => console.error('Logout error:', err))
      .finally(() => {
        dispatch(logout());
        navigate('/login');
      });
  };

  return (
    <div
      className="w-screen h-screen flex items-center justify-center bg-gray-900"
      style={{ backgroundImage: `url(${bg})`, backgroundSize: "cover" }}
    >
      <div className="w-11/12 lg:w-3/4 h-3/4 flex flex-col lg:flex-row space-y-4 lg:space-y-0 lg:space-x-4">
        <div className="lg:w-1/2 bg-gray-700 bg-opacity-50 rounded-lg shadow-md flex flex-col justify-between p-4">
          <div className="flex flex-col items-center lg:items-start flex-grow overflow-y-auto">
            <h1 className="text-lg lg:text-xl font-semibold text-center lg:text-left text-white mb-4">
              User Profile
            </h1>
            <div className="text-gray-100 text-base lg:text-lg mb-4 w-full">
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
                            <td className="font-semibold text-base lg:text-lg capitalize py-2">
                              {key}:
                            </td>
                            <td className="capitalize text-base lg:text-lg py-2">
                              {value}
                            </td>
                          </tr>
                        );
                      }
                      return null;
                    })}
                </tbody>
              </table>
            </div>
            {window.innerWidth > 768 && (
              <div
                className="w-full h-40 lg:h-56 bg-cover bg-center relative overflow-hidden"
                style={{ backgroundImage: `url(${svg})` }}
              ></div>
            )}
          </div>
          <button
            onClick={handleLogout}
            className="bg-white text-gray-900 text-base lg:text-lg my-4 py-2 font-bold rounded hover:bg-red-500 hover:text-white transition-colors duration-300"
          >
            Logout
          </button>
        </div>
        <div className="lg:w-1/2 bg-gray-700 bg-opacity-50 rounded-lg shadow-md p-4 overflow-y-auto">
          {userData &&
            userData.matchHistory &&
            renderMatchHistory(userData.matchHistory)}
        </div>
      </div>
    </div>
  );
}

export default Profile;
