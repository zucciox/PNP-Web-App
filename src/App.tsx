// Router
import { createBrowserRouter, RouterProvider } from "react-router-dom";
import Home from "./Home"
import Dashboard from "./dashboard/Dashboard"
import Login from "./login"
import AdminPanel from "./adminPanel/AdminPanel";

const router = createBrowserRouter([
    {path : "/", element: <Home/>},
    {path : "/dashboard", element: <Dashboard/>},
    {path : "/login", element: <Login/>},
    {path : "/admin", element: <AdminPanel/>},
])

export default function App(){
    return <RouterProvider router = {router} />
}