/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState, useEffect } from "react";
import { BrowserRouter as Router, Routes, Route, useNavigate } from "react-router-dom";
import { Toaster } from "sonner";
import { 
  Sparkles, 
  Video, 
  Home as HomeIcon, 
  Settings, 
  History, 
  Plus, 
  ArrowRight,
  MonitorPlay,
  Zap,
  Layout,
  Camera,
  MessageSquare
} from "lucide-react";
import { motion, AnimatePresence } from "motion/react";

// Components (We will create these)
import LandingPage from "./components/LandingPage";
import Dashboard from "./components/Dashboard";
import ProjectAnalysis from "./components/ProjectAnalysis";

import { AuthProvider } from "./contexts/AuthContext";

export default function App() {
  return (
    <Router>
      <AuthProvider>
        <div className="min-h-screen bg-[#FDFCFB] text-[#1D1D1F] font-sans selection:bg-[#FF6321] selection:text-white">
          <Toaster position="top-center" richColors />
          <Routes>
            <Route path="/" element={<LandingPage />} />
            <Route path="/dashboard" element={<Dashboard />} />
            <Route path="/project/:id" element={<ProjectAnalysis />} />
          </Routes>
        </div>
      </AuthProvider>
    </Router>
  );
}

