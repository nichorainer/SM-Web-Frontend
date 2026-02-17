import { Navigate } from "react-router-dom";
import { useAuth } from "../utils/AuthContext";

export default function ProtectedRoute({ permission, children }) {
  const { currentUser } = useAuth();

function hasPermission(user, requiredPermission) {
  return user?.permissions?.[requiredPermission] === true;
}

  if (!hasPermission(currentUser, permission)) {
    return <Navigate to="/unauthorized" replace />;
  }
  return children;
}
