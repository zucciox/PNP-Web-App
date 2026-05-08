// 1. Change createBrowserRouter to createHashRouter
import { createHashRouter, RouterProvider } from "react-router-dom"; 
import Home from "./Home";
import Dashboard from "./dashboard/Dashboard";
import Login from "./login";
import AdminPanel from "./adminPanel/AdminPanel";

// 2. Update the function call here
const router = createHashRouter([
    { path: "/", element: <Home /> },
    { path: "/dashboard", element: <Dashboard /> },
    { path: "/login", element: <Login /> },
    { path: "/admin", element: <AdminPanel /> },
]);

export default function App() {
    return <RouterProvider router={router} />;
}