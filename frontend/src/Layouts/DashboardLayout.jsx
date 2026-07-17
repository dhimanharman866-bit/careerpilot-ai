import Sidebar from "../components/Sidebar";
import Navbar from "../components/Navbar";
import Dashboard from "../pages/dashboard";
import { useState } from "react";

const DashboardLayout = ({children})=>{
    const [isSidebarOpen,setIsSidebarOpen]=useState(true);
    return (
        <div className="flex bg-black min-h-screen">
            {isSidebarOpen && (
                <Sidebar isOpen={isSidebarOpen} />
            )}
            <div className="flex-1 transitiono-all duration-300">
                <Navbar isOpen={isSidebarOpen} setIsOpen={setIsSidebarOpen}/>
                <div className="p-6">
                    {children}
                </div>
            </div>
        </div>
    );
};
export default DashboardLayout;
