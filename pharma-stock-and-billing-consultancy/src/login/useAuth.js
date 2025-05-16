import { useEffect, useState } from "react";

const useAuth = () => {
  const [user, setUser] = useState(null);
  const [role, setRole] = useState(null);

  useEffect(() => {
    const token = localStorage.getItem("token");
    const email = localStorage.getItem("email");
    const userRole = localStorage.getItem("role");

    if (token && email && userRole) {
      setUser({ email }); // Simulate user object
      setRole(userRole);
    } else {
      setUser(null);
      setRole(null);
    }
  }, []);

  useEffect(() => {
    console.log("useAuth Hook -> User:", user);
    console.log("useAuth Hook -> Role:", role);
  }, [user, role]);

  return { user, role };
};

export default useAuth;
