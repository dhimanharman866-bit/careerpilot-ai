import { useNavigate,useLocation } from "react-router-dom";

const Sidebar=({isOpen})=>{
    const navigate=useNavigate();
    const location=useLocation();
    const menuItems=[
        {
            title:"Dashboard",
            path:"/dashboard"
        },
        {
            title:"Resume",
            path:"/resume-upload"
        },
        {
            title:"Interviews",
            path:"/interview"
        },
        {
            title:"Voice Interview",
            path:"/voice-interview"
        },
        {
            title:"Video Interview",
            path:"/video-interview"
        },
        {
        title: "Placement Readiness",
        path: "/placement"
        },
        {
        title: "History",
        path: "/history"
        }
    ]
    return (
        <div className={`
        ${isOpen ? "w-64" : "w-0"}
        overflow-hidden
        transition-all
        duration-300
        bg-zinc-950
        border-r
        border-zinc-800
        min-h-screen
        p-6`}>
            {/* Logo */}
            <div className="mb-10">
                <h1 className="text-white text-2xl font-bold">
                    CareerPilot
                </h1>

                <p className="text-zinc-400 text-sm">
                    AI Career Coach
                </p>
            </div>

            <div className="flex flex-col gap-4">
                {menuItems.map((item)=>(
                    <button key={item.path} onClick={()=>navigate(item.path)} className={
                        `
                        text-left px-4 px-3 rounded-lg transition-all duration-200
                        ${
                            location.pathname===item.path
                            ?"bg-purple-600 text-white"
                            :"text-zinc-300 hover:bg-zinc-800 hover:text-white"
                        }
                    `}
                    >
                        {item.title}
                    </button>
                ))}
            </div>
        </div>
    );
};

export default Sidebar;