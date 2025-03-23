"use client"
import { useEffect, useRef, useState } from "react";
import { motion } from "framer-motion";
// @ts-ignore
import NET from "vanta/dist/vanta.net.min";
import * as THREE from "three";
import { FaGamepad } from "react-icons/fa";
import { useRouter } from "next/navigation";  // Use next/router for Pages Router

export default function AdvancedAuthForm() {
  const [isLogin, setIsLogin] = useState(true);
  const [vantaEffect, setVantaEffect] = useState<any>(null);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [gamerTag, setGamerTag] = useState('');
  const vantaRef = useRef(null);
  const router = useRouter();  // Use the correct useRouter

  useEffect(() => {
    if (!vantaEffect) {
      setVantaEffect(
        NET({
          el: vantaRef.current,
          THREE: THREE,
          color: 0x9c27b0,
          backgroundColor: 0x000000,
          points: 12.0,
          maxDistance: 20.0,
          spacing: 18.0,
        })
      );
    }
    return () => {
      if (vantaEffect) vantaEffect.destroy();
    };
  }, [vantaEffect]);

  const toggleForm = () => setIsLogin(!isLogin);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const url = isLogin ? 'http://localhost:3002/auth/login' : 'http://localhost:3002/auth/signup';
  
    const body = {
      email: email,
      password: password,
    };
  
    try {
      const response = await fetch(url, {
        method: 'POST',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(body),
      });
  
      if (!response.ok) {
        const errorData = await response.json(); // Parse error response
        console.error('Error Response:', errorData);
        throw new Error(errorData.message || 'Failed to fetch');
      }
  
      const data = await response.json();
      console.log('Response Data:', data);
      // Redirect to home page after successful login or signup
      router.push('/home');  // Correct redirection to /home
    } catch (error) {
      console.error('Error during fetch:', error);
      alert('Something went wrong. Please try again.');
    }
  };

  return (
    <div ref={vantaRef} className="min-h-screen flex items-center justify-center relative">
      <motion.div
        className="relative backdrop-blur-md bg-white/10 p-10 rounded-2xl shadow-2xl w-[380px]"
        initial={{ y: -50, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 1 }}
      >
        <motion.div
          className="flex justify-center mb-6"
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ delay: 0.3 }}
        >
          <FaGamepad className="text-purple-500 text-5xl" />
        </motion.div>

        <h2 className="text-white text-center text-2xl mb-6 font-bold tracking-wider">
          {isLogin ? "Enter The Arena" : "Create Your Profile"}
        </h2>

        <motion.form
          className="space-y-5"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.5 }}
          onSubmit={handleSubmit}
        >
          {!isLogin && (
            <motion.input
              type="text"
              placeholder="Gamer Tag"
              value={gamerTag}
              onChange={(e) => setGamerTag(e.target.value)}
              className="w-full p-3 rounded-lg bg-gray-800 text-white focus:outline-none"
              initial={{ x: -40, opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
            />
          )}
          <motion.input
            type="email"
            placeholder="Email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="w-full p-3 rounded-lg bg-gray-800 text-white focus:outline-none"
            initial={{ x: 40, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
          />
          <motion.input
            type="password"
            placeholder="Password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="w-full p-3 rounded-lg bg-gray-800 text-white focus:outline-none"
            initial={{ x: -40, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
          />
          <button
            type="submit"
            className="w-full bg-purple-600 hover:bg-purple-700 transition duration-300 p-3 rounded-lg text-white"
          >
            {isLogin ? "Login" : "Sign Up"}
          </button>
        </motion.form>

        <motion.p
          className="text-gray-300 text-center mt-6 cursor-pointer"
          whileHover={{ scale: 1.1, color: "#D946EF" }}
          onClick={toggleForm}
        >
          {isLogin ? "No account? Sign up here!" : "Already a player? Login!"}
        </motion.p>

        {/* Glowing Border Animation */}
        <motion.div
          className="absolute inset-0 rounded-2xl border-2 border-purple-600 opacity-50 pointer-events-none"
          animate={{ rotate: 360 }}
          transition={{ repeat: Infinity, duration: 12, ease: "linear" }}
        />
      </motion.div>
    </div>
  );
}
