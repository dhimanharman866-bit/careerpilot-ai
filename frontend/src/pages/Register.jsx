import { useState } from "react";
import api from "../services/api";
import { useNavigate } from "react-router-dom";

const Register=()=>{
  const [username,setUsername]=useState("");
  const [email,setEmail]=useState("");
  const [password,setPassword]=useState("");
  const navigate = useNavigate();
  const handleRegister= async()=>{
    if(!username || !email || !password){
      alert("Please fill all fields");
      return;
    }
    try{
      const response = await api.post(
      "/register",
      {
        username,
        email,
        password
      }
    );
    console.log(response.data);
    navigate("/login");
    }catch(error){
    alert("Registration Failed");
    }
  };
  return (
    <div>
      <h1>Register</h1>
      <input type="text" placeholder="Enter Username" value={username} onChange={(e)=>setUsername(e.target.value)}/>
      <br />
      <br />
      <input
          type="email"
          placeholder="Enter Email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
      />

      <br />
      <br />

      <input
          type="password"
          placeholder="Enter Password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
      />
      <br />
      <br />
      <button onClick={handleRegister}>
        Register
      </button>
      <br />
      <br />
      <p>Username:{username}</p>
      <p>email:{email}</p>
      <p>password:{password}</p>

    </div>
  );
};

export default Register;