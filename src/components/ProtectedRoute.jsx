import { Navigate, Outlet, useLocation } from "react-router-dom";
import { useAuth } from "../hooks/useAuth";
import Spinner from "./Spinner";

// Gates a route behind a valid session. Optionally restrict by role, e.g.
// <ProtectedRoute roles={["super_admin"]}>, or to accounts attached to a
// business with `requireBusiness`. Without children it renders nested routes.
export default function ProtectedRoute({ children, roles, requireBusiness = false }) {
  const { user, loading } = useAuth();
  const location = useLocation();

  if (loading) {
    return (
      <div className="grid min-h-screen place-items-center">
        <Spinner className="h-8 w-8" />
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" replace state={{ from: location }} />;
  }

  if (roles && !roles.includes(user.role)) {
    return <Navigate to="/" replace />;
  }

  if (requireBusiness && !user.business_id) {
    return <Navigate to="/" replace />;
  }

  return children ?? <Outlet />;
}
