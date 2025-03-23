"use client"
import { useEffect, useRef, useState } from "react";
// @ts-ignore
import NET from "vanta/dist/vanta.net.min";
import * as THREE from "three";
import { FaBasketballBall, FaBowlingBall, FaCoins, FaUserCircle } from "react-icons/fa";
import { motion } from "framer-motion";
import { ethers } from "ethers";
import Web3Modal from "web3modal";

export default function Home() {
  const [vantaEffect, setVantaEffect] = useState<any>(null);
  const vantaRef = useRef(null);
  const providerOptions = {};

  useEffect(() => {
    if (!vantaEffect) {
      setVantaEffect(
        NET({
          el: vantaRef.current,
          THREE: THREE,
          color: 0x9c27b0,  // Purple color
          backgroundColor: 0x000000,  // Black background
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

  async function connectwallet() {
    try {
      let web3modal = new Web3Modal({
        cacheProvider: false,
        providerOptions,
      });
      const web3modalInstance = await web3modal.connect();
      const web3ModalProvider = new ethers.BrowserProvider(web3modalInstance); // Use BrowserProvider instead of Web3Provider
      console.log(web3ModalProvider);
    } catch (error) {
      console.log(error);
    }
  }

  const handleBitcoinPayment = (game: string) => {
    // Add the Bitcoin payment logic here, like integrating BTCPay or CoinGate API
    console.log(`Processing payment for ${game}...`);
  };

  return (
    <div>
      {/* Sticky Navbar with Transparent Background */}
      <nav className="sticky top-0 z-50 bg-transparent text-white shadow-none py-4 px-6 flex justify-between items-center">
        <h1 className="text-xl font-bold">Web3 Arcade</h1>
        <div className="flex items-center gap-4">
          <button
            onClick={connectwallet}
            className="bg-purple-600 text-white py-2 px-4 rounded-lg hover:bg-purple-700 transition-colors duration-300"
          >
            <FaUserCircle className="inline-block mr-2" /> Connect Wallet
          </button>
        </div>
      </nav>

      {/* Vanta Effect and Content */}
      <div ref={vantaRef} className="min-h-screen w-full flex flex-col items-center justify-center bg-black text-white">
        <div className="absolute inset-0 z-0"></div>
        <div className="relative z-10 flex flex-col items-center">
          <h1 className="text-4xl font-extrabold text-center text-purple-500 mb-10">
            Welcome to the -Arcade Game
          </h1>
          <p className="text-lg font-medium text-center text-gray-300 mb-16">
            Choose a game below and get ready for a fun and quick challenge.
          </p>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-10 w-full px-6">
            {/* Basketball Shootout */}
            <motion.div
              className="bg-gray-800 rounded-2xl shadow-lg p-8 flex flex-col items-center text-center hover:scale-105 transform transition-all duration-300"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 1 }}
            >
              <FaBasketballBall className="text-purple-500 text-6xl mb-6" />
              <h2 className="text-2xl font-bold text-white mb-4">Basketball Shootout</h2>
              <p className="text-gray-400 mb-6">Shoot as many baskets as you can in 30 seconds!</p>
              <button
                className="bg-purple-600 text-white py-3 px-8 rounded-lg text-lg font-semibold hover:bg-purple-700 transition-colors duration-300"
                onClick={() => handleBitcoinPayment("Basketball Shootout")}
              >
                Pay 
              </button>
            </motion.div>

            {/* Archery Contest */}
            <motion.div
              className="bg-gray-800 rounded-2xl shadow-lg p-8 flex flex-col items-center text-center hover:scale-105 transform transition-all duration-300"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 1, delay: 0.3 }}
            >
              <FaBowlingBall className="text-purple-500 text-6xl mb-6" />
              <h2 className="text-2xl font-bold text-white mb-4">Archery Contest</h2>
              <p className="text-gray-400 mb-6">Aim for the target and shoot your arrow!</p>
              <button
                className="bg-purple-600 text-white py-3 px-8 rounded-lg text-lg font-semibold hover:bg-purple-700 transition-colors duration-300"
                onClick={() => handleBitcoinPayment("Archery Contest")}
              >
                Pay 
              </button>
            </motion.div>

            {/* Coin Toss */}
            <motion.div
              className="bg-gray-800 rounded-2xl shadow-lg p-8 flex flex-col items-center text-center hover:scale-105 transform transition-all duration-300"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 1, delay: 0.6 }}
            >
              <FaCoins className="text-purple-500 text-6xl mb-6" />
              <h2 className="text-2xl font-bold text-white mb-4">Coin Toss</h2>
              <p className="text-gray-400 mb-6">Predict heads or tails and win big!</p>
              <button
                className="bg-purple-600 text-white py-3 px-8 rounded-lg text-lg font-semibold hover:bg-purple-700 transition-colors duration-300"
                onClick={() => handleBitcoinPayment("Coin Toss")}
              >
                Pay 
              </button>
            </motion.div>
          </div>
        </div>
      </div>
    </div>
  );
}
