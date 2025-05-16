import { Navigate } from "react-router-dom";
import useAuth from "./useAuth"; // Import the hook

const ProtectedRoute = ({ children }) => {
  const { user } = useAuth(); // Get the user from the hook

  if (user === null) {
    return <div>Loading...</div>; // Show loading while checking auth status
  }

  return user ? children : <Navigate to="/login" />; // If user exists, show children (protected content)
};

export default ProtectedRoute;
