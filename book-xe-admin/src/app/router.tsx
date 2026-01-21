import { createBrowserRouter, Navigate } from "react-router-dom";
import { LoginPage } from "../pages/login/LoginPage";
import { DashboardPage } from "../pages/dashboard/DashboardPage";
import { AllBookingsPage } from "../pages/admin/AllBookingsPage";
import { MainLayout } from "../components/layout/MainLayout";
import { ProtectedRoute } from "./protected-route";

export const router = createBrowserRouter([
  {
    path: "/login",
    element: <LoginPage />,
  },
  {
    element: <ProtectedRoute />, // All internal routes need login
    children: [
      {
        element: <MainLayout />, // Shared layout with sidebar/header
        children: [
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
            ],
          },
          {
            path: "/",
            element: <Navigate to="/dashboard" replace />,
          },
        ],
      },
    ],
  },
  {
    path: "*",
    element: <Navigate to="/dashboard" replace />,
  },
]);
