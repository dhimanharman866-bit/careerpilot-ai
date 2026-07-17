import { useState } from "react";
import api from "../services/api";
import { useNavigate } from "react-router-dom";

const Login=()=>{
    const[email,setEmail]=useState("");
    const[password,setPassword]=useState("");
    const navigate=useNavigate();
    const handleLogin = async () => {
        const formData= new URLSearchParams();
        formData.append("username",email);
        formData.append("password",password);

        const response = await api.post(
            "/login",
            formData
        )
        console.log(response.data);
        localStorage.setItem(
            "token",
            response.data.access_token
        );
        navigate("/dashboard")
    };
    return (
        <div>
            <h1>Login</h1>
            <input type="email" placeholder="Enter Email" value={email} onChange={(e)=>setEmail(e.target.value)}/>
            <br />
            <br />
            <input type="password" placeholder="Passsword" value={password} onChange={(e)=>setPassword(e.target.value)} />
            <br/>
            <br />
            <button onClick={handleLogin}>
                Login
            </button>
            <br />
            <br />
            <p>Email:{email}</p>
            <p>Password:{password}</p>
        </div>
    );
};
export default Login;