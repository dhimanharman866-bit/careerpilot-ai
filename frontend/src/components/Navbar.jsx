import { FiMenu } from "react-icons/fi";
import { useState,useEffect } from "react";
import api from "../services/api"

const Navbar = ({ isOpen, setIsOpen }) => {
    const[user,setUser]=useState(null);
    const fetchUser= async ()=>{
        const token=localStorage.getItem("token");
        try {
            const response=await api.get(
                "/me",
                {
                    headers:{
                        Authorization:`Bearer ${token}`
                    }
                }
            );
            console.log(response.data);
            setUser(response.data);
        }
        catch(error){
            console.log(error);
        }
    };
    useEffect(()=>{
        fetchUser();
    },[]);
    return (
        <div className="h-16 border-b border-zinc-800 flex items-center justify-between px-6">

            <div className="flex items-center gap-4">

                <button
                    onClick={() => setIsOpen(!isOpen)}
                    className="text-white hover:text-purple-400 transition"
                >
                    <FiMenu size={24} />
                </button>

                <h2 className="text-white text-xl font-semibold">
                    Dashboard
                </h2>

            </div>

            <div className="text-zinc-400">
                Hi {user?.username || "User"} 👋
            </div>

        </div>
    );
};

export default Navbar;