// Router
import { createBrowserRouter, RouterProvider } from "react-router-dom";
import Home from "./Home"
import EconomyDashboard from "./dashboard/economyDashboard/EconomyDashboard"
import Login from "./login"

const router = createBrowserRouter([
    {path : "/", element: <Home/>},
    {path : "/dashboard/economy", element: <EconomyDashboard/>},
    {path : "/login", element: <Login/>},
])

export default function App(){
    return <RouterProvider router = {router} />
}