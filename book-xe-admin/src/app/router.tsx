import { createBrowserRouter, Navigate } from "react-router-dom";
import { LoginPage } from "../pages/login/LoginPage";
import { RegisterPage } from "../pages/register/RegisterPage";
import { DashboardPage } from "../pages/dashboard/DashboardPage";
import { OverviewPage } from "../pages/dashboard/OverviewPage";
import { AllBookingsPage } from "../pages/admin/AllBookingsPage";
import { UserManagementPage } from "../pages/admin/UserManagementPage";
import { VehicleManagementPage } from "../pages/admin/VehicleManagementPage";
import { MainLayout } from "../components/layout/MainLayout";
import { ProtectedRoute } from "./protected-route";

export const router = createBrowserRouter([
  {
    path: "/login",
    element: <LoginPage />,
  },
  {
    path: "/register",
    element: <RegisterPage />,
  },
  {
    element: <ProtectedRoute />, // All internal routes need login
    children: [
      {
        element: <MainLayout />, // Shared layout with sidebar/header
        children: [
          {
            path: "/overview",
            element: <OverviewPage />,
          },
          {
            path: "/dashboard",
            element: <DashboardPage />,
          },
          {
            element: <ProtectedRoute allowedRoles={["admin"]} />, // Admin only
            children: [
              {
                path: "/admin/bookings",
                element: <AllBookingsPage />,
              },
              {
                path: "/admin/users",
                element: <UserManagementPage />,
              },
              {
                path: "/admin/vehicles",
                element: <VehicleManagementPage />,
              },
            ],
          },
          {
            path: "/",
            element: <Navigate to="/overview" replace />,
          },
        ],
      },
    ],
  },
  {
    path: "*",
    element: <Navigate to="/overview" replace />,
  },
]);
