import { useState, useEffect } from "react";
import { Navigate } from "react-router-dom";
import { useAuth } from "../utils/AuthContext";
import { Spinner, Center } from "@chakra-ui/react";

export default function ProtectedRoute({ permission, children }) {
  const { currentUser, loading } = useAuth();

  function hasPermission(user, requiredPermission) {
    return user?.permissions?.[requiredPermission] === true;
  }

  if (loading) {
    // tampilkan spinner di tengah layar
    return (
      <Center flex="1" minH="calc(100vh - 64px)">
        <Spinner size="xl" thickness="4px" speed="0.65s" color="purple.500" />
      </Center>
    );
  }

  if (!hasPermission(currentUser, permission)) {
    return <Navigate to="/unauthorized" replace />;
  }
  return children;
}
