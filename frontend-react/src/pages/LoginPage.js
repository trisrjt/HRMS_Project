import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import api from "../api/axios";
import { useAuth } from "../context/AuthContext";
import LiquidChrome from "../components/LiquidChrome.jsx";
import { MapContainer, TileLayer, Marker, Popup } from "react-leaflet";
import "leaflet/dist/leaflet.css";
import L from "leaflet";

// Fix for default marker icon in React-Leaflet
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: require("leaflet/dist/images/marker-icon-2x.png"),
  iconUrl: require("leaflet/dist/images/marker-icon.png"),
  shadowUrl: require("leaflet/dist/images/marker-shadow.png"),
});

const LoginPage = () => {
  const navigate = useNavigate();
  const { login } = useAuth();

  const [formValues, setFormValues] = useState({
    email: "",
    password: "",
  });
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [isQuickCheckIn, setIsQuickCheckIn] = useState(false);
  const [successMessage, setSuccessMessage] = useState("");
  const [showMap, setShowMap] = useState(false);
  const [checkInLocation, setCheckInLocation] = useState(null);
  const [currentTime, setCurrentTime] = useState(new Date());
  const [showFaceAuth, setShowFaceAuth] = useState(false);
  const [faceAuthMode, setFaceAuthMode] = useState('login'); // 'login' or 'enroll'
  const [stream, setStream] = useState(null);
  const [faceAuthLoading, setFaceAuthLoading] = useState(false);
  const [modelsLoaded, setModelsLoaded] = useState(false);
  const [isQuickCheckInFlow, setIsQuickCheckInFlow] = useState(false);

  // Update clock every second
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  // Cleanup webcam stream on unmount
  useEffect(() => {
    return () => {
      if (stream) {
        stream.getTracks().forEach(track => track.stop());
      }
    };
  }, [stream]);

  // Attach stream to video element
  useEffect(() => {
    const video = document.getElementById('faceAuthVideo');
    if (video && stream && showFaceAuth) {
      video.srcObject = stream;
    }
  }, [stream, showFaceAuth]);

  // Load face-api models
  useEffect(() => {
    const loadModels = async () => {
      if (window.faceapi && !modelsLoaded) {
        try {
          const MODEL_URL = 'https://cdn.jsdelivr.net/npm/@vladmandic/face-api@1.7.12/model';
          await Promise.all([
            window.faceapi.nets.tinyFaceDetector.loadFromUri(MODEL_URL),
            window.faceapi.nets.faceLandmark68Net.loadFromUri(MODEL_URL),
            window.faceapi.nets.faceRecognitionNet.loadFromUri(MODEL_URL),
          ]);
          setModelsLoaded(true);
          console.log('Face recognition models loaded');
        } catch (err) {
          console.error('Error loading face-api models:', err);
        }
      }
    };

    // Wait for script to load
    if (window.faceapi) {
      loadModels();
    } else {
      const checkInterval = setInterval(() => {
        if (window.faceapi) {
          clearInterval(checkInterval);
          loadModels();
        }
      }, 100);

      return () => clearInterval(checkInterval);
    }
  }, [modelsLoaded]);

  const formatTime = (date) => {
    return date.toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      hour12: true
    });
  };

  const formatDate = (date) => {
    return date.toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const formatTimezone = (date) => {
    const tzName = date.toLocaleTimeString('en-US', { timeZoneName: 'short' }).split(' ').pop();
    return tzName;
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormValues((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setSuccessMessage("");

    if (!formValues.email || !formValues.password) {
      setError("Email and password are required.");
      return;
    }

    try {
      setIsLoading(true);
      const { data } = await api.post("/login", formValues);

      if (!data?.token) {
        setError("Invalid response from server.");
        return;
      }

      localStorage.setItem("token", data.token);

      if (data.force_password_change) {
        if (data.user_id) localStorage.setItem("temp_user_id", data.user_id);
        navigate("/change-password", { replace: true });
        return;
      }

      if (data.user) login(data.token, data.user);
      navigate("/", { replace: true });
    } catch (err) {
      const message = err?.response?.data?.message || "Failed to login. Please try again.";
      setError(message);
    } finally {
      setIsLoading(false);
    }
  };

  const handleQuickCheckIn = async (e) => {
    e.preventDefault();
    setError("");
    setSuccessMessage("");
    setShowMap(false);
    setCheckInLocation(null);

    // Start face authentication flow for quick check-in
    setIsQuickCheckInFlow(true);
    await handleFaceAuth(false);
  };

  const handleFaceAuth = async (isEnroll = false) => {
    setShowFaceAuth(true);
    setFaceAuthMode(isEnroll ? 'enroll' : 'login');
    setError("");
    setSuccessMessage("");

    try {
      // Start webcam
      const mediaStream = await navigator.mediaDevices.getUserMedia({
        video: { width: 640, height: 480 }
      });
      setStream(mediaStream);
    } catch (err) {
      setError("Camera access denied. Please enable camera permissions.");
      setShowFaceAuth(false);
      setIsQuickCheckInFlow(false);
    }
  };

  const completeQuickCheckIn = async (token, user) => {
    try {
      setIsLoading(true);
      setIsQuickCheckIn(true);

      // Check if user is employee (role 4)
      if (user?.role_id !== 4) {
        setError("Quick Check-In is only available for employees.");
        setIsQuickCheckInFlow(false);
        return;
      }

      // Check if already checked in today
      try {
        const attendanceResponse = await api.get("/my-attendance", {
          headers: { Authorization: `Bearer ${token}` },
        });

        const today = new Date().toISOString().split("T")[0];
        const todayRecord = attendanceResponse.data?.find(
          (record) => record.date === today
        );

        if (todayRecord?.check_in) {
          setSuccessMessage(`You are already checked in today at ${todayRecord.check_in}!`);

          // Redirect after 2 seconds
          setTimeout(() => {
            navigate("/employee/dashboard", { replace: true });
          }, 2000);
          return;
        }
      } catch (err) {
        console.error("Error checking today's attendance:", err);
        // Continue with check-in if we can't verify
      }

      // Step 1: Get location
      const location = await new Promise((resolve, reject) => {
        if (!navigator.geolocation) {
          reject(new Error("Geolocation is not supported"));
          return;
        }
        navigator.geolocation.getCurrentPosition(
          (position) => resolve({
            latitude: position.coords.latitude,
            longitude: position.coords.longitude,
          }),
          (error) => reject(new Error("Location access denied")),
          { timeout: 10000, enableHighAccuracy: true }
        );
      });

      // Show map if location obtained
      if (location) {
        setCheckInLocation(location);
        setShowMap(true);
      }

      // Get device info
      const ua = navigator.userAgent;
      let deviceType = 'Desktop';
      if (/(tablet|ipad|playbook|silk)|(android(?!.*mobi))/i.test(ua)) {
        deviceType = 'Tablet';
      } else if (/Mobile|Android|iP(hone|od)|IEMobile|BlackBerry|Kindle|Silk-Accelerated|(hpw|web)OS|Opera M(obi|ini)/.test(ua)) {
        deviceType = 'Mobile';
      }

      let browser = 'Unknown';
      if (ua.indexOf('Firefox') > -1) browser = 'Firefox';
      else if (ua.indexOf('Chrome') > -1) browser = 'Chrome';
      else if (ua.indexOf('Safari') > -1) browser = 'Safari';
      else if (ua.indexOf('Edge') > -1) browser = 'Edge';

      let deviceId = localStorage.getItem('device_id');
      if (!deviceId) {
        deviceId = 'device_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
        localStorage.setItem('device_id', deviceId);
      }

      // Step 2: Check-in with force flag and device info
      const checkInData = {
        latitude: location.latitude,
        longitude: location.longitude,
        force_checkin: true,
        device_id: deviceId,
        device_type: deviceType,
        browser: browser
      };

      await api.post("/my-attendance/check-in", checkInData, {
        headers: { Authorization: `Bearer ${token}` },
      });

      // Success!
      setSuccessMessage(`Checked in successfully at ${new Date().toLocaleTimeString()}!`);

      // Redirect after 3 seconds
      setTimeout(() => {
        navigate("/employee/dashboard", { replace: true });
      }, 3000);

    } catch (err) {
      console.error("Quick check-in error:", err);
      const message = err?.response?.data?.message || "Check-in failed. Please try again.";
      setError(message);
      setShowMap(false);
    } finally {
      setIsLoading(false);
      setIsQuickCheckIn(false);
      setIsQuickCheckInFlow(false);
    }
  };

  const captureFaceAuth = async () => {
    if (!stream || !modelsLoaded) {
      setError('Face recognition system is still loading. Please wait...');
      return;
    }

    setFaceAuthLoading(true);
    try {
      const video = document.getElementById('faceAuthVideo');

      // Detect face and extract descriptor
      const detection = await window.faceapi
        .detectSingleFace(video, new window.faceapi.TinyFaceDetectorOptions())
        .withFaceLandmarks()
        .withFaceDescriptor();

      if (!detection) {
        setError('No face detected. Please position your face in the center.');
        setFaceAuthLoading(false);
        return;
      }

      // Get face descriptor (128-dimensional vector)
      const descriptor = Array.from(detection.descriptor);

      // Also capture image for visual verification (optional)
      const canvas = document.createElement('canvas');
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      const ctx = canvas.getContext('2d');
      ctx.drawImage(video, 0, 0);

      // Convert canvas to blob
      const blob = await new Promise(resolve => canvas.toBlob(resolve, 'image/jpeg', 0.95));

      if (faceAuthMode === 'enroll') {
        // Enrollment: Need email to associate face data
        if (!formValues.email) {
          setError("Please enter your email first to enroll face authentication.");
          closeFaceAuth();
          return;
        }

        // Upload face descriptor for enrollment
        const formData = new FormData();
        formData.append('email', formValues.email);
        formData.append('face_descriptor', JSON.stringify(descriptor));
        formData.append('face_image', blob, 'face.jpg');

        const { data } = await api.post('/auth/enroll-face', formData, {
          headers: { 'Content-Type': 'multipart/form-data' }
        });

        setSuccessMessage("✓ Face enrolled successfully! You can now login using face authentication.");
        closeFaceAuth();
      } else {
        // Login: Use face descriptor to authenticate
        const formData = new FormData();
        formData.append('face_descriptor', JSON.stringify(descriptor));
        formData.append('face_image', blob, 'face.jpg');

        const { data } = await api.post('/auth/login-face', formData, {
          headers: { 'Content-Type': 'multipart/form-data' }
        });

        if (!data?.token) {
          setError("Face not recognized. Please try again or use email/password.");
          closeFaceAuth();
          return;
        }

        localStorage.setItem("token", data.token);

        if (data.force_password_change) {
          if (data.user_id) localStorage.setItem("temp_user_id", data.user_id);
          navigate("/change-password", { replace: true });
          closeFaceAuth();
          return;
        }

        if (data.user) login(data.token, data.user);
        setSuccessMessage("Face authentication successful!");
        closeFaceAuth();

        // If this is quick check-in flow, proceed with location and check-in
        if (isQuickCheckInFlow) {
          await completeQuickCheckIn(data.token, data.user);
        } else {
          // Normal face login - just redirect
          setTimeout(() => {
            navigate("/", { replace: true });
          }, 1000);
        }
      }
    } catch (err) {
      const message = err?.response?.data?.message || "Face authentication failed. Please try again.";
      setError(message);
      closeFaceAuth();
      setIsQuickCheckInFlow(false);
    } finally {
      setFaceAuthLoading(false);
    }
  };

  const closeFaceAuth = () => {
    if (stream) {
      stream.getTracks().forEach(track => track.stop());
      setStream(null);
    }
    setShowFaceAuth(false);
    setFaceAuthLoading(false);
    setIsQuickCheckInFlow(false);
  };

  return (
    <div style={{ position: "relative", minHeight: "100vh", overflow: "hidden" }}>

      {/* 🔹 LIQUID CHROME BACKGROUND */}
      <div style={{ position: "absolute", inset: 0, zIndex: 0 }}>
        <LiquidChrome baseColor={[0.92, 0.94, 0.98]} speed={0.8} amplitude={0.35} interactive={false} />
      </div>

      {/* 🔹 Background image layer */}
      <div
        style={{
          position: "absolute",
          inset: 0,
          zIndex: 1,
          backgroundColor: "#f6f8fb",
          // backgroundImage: "url('https://i.pinimg.com/736x/3c/9c/fb/3c9cfbd4cf4fd763e29b0a5843b9fafe.jpg')",
          backgroundImage: "url('/bg1.jpg')",
          backgroundSize: "cover",
          backgroundPosition: "center",
          backgroundRepeat: "no-repeat",
          filter: "saturate(105%)",
        }}
      />

      {/* 🔹 Soft contrast overlay */}
      <div
        style={{
          position: "absolute",
          inset: 0,
          zIndex: 2,
          background: "linear-gradient(120deg, rgba(255,255,255,0.75) 0%, rgba(245,249,255,0.35) 45%, rgba(245,249,255,0.15) 70%)",
        }}
      />

      {/* 🔹 Logo top-left (no background) */}
      <div
        style={{
          position: "absolute",
          top: "22px",
          left: "28px",
          zIndex: 20,
          display: "flex",
          alignItems: "center",
          gap: "10px",
          padding: "6px 8px",
          borderRadius: "12px",
          background: "transparent",
          boxShadow: "none",
          border: "none",
        }}
      >
        <img
          src="/logo1.webp"
          alt="HRMS Logo"
          style={{ width: "240px", height: "140px", objectFit: "contain", borderRadius: "12px" }}
        />
        {/* <span style={{ fontWeight: 800, letterSpacing: "0.02em", color: "#0f172a", fontSize: "15px" }}>HRMS</span> */}
      </div>

      {/* 🔹 FOREGROUND: overlapping form on hero image */}
      <div
        style={{
          position: "relative",
          zIndex: 3,
          minHeight: "100vh",
          display: "flex",
          alignItems: "center",
          justifyContent: "flex-end",
          padding: "40px 48px",
        }}
      >
        <div
          style={{
            width: "100%",
            maxWidth: "520px",
            background: "linear-gradient(145deg, rgba(255,255,255,0.18), rgba(255,255,255,0.08))",
            backdropFilter: "blur(24px) saturate(140%)",
            WebkitBackdropFilter: "blur(24px) saturate(140%)",
            borderRadius: "18px",
            boxShadow: "0 50px 140px rgba(2,6,23,0.5), 0 20px 60px rgba(2,6,23,0.35), inset 0 1px 0 rgba(255,255,255,0.35), inset 0 0 0 1px rgba(255,255,255,0.18)",
            padding: "48px 40px",
            border: "1px solid rgba(255,255,255,0.28)",
            transition: "transform 0.35s ease, box-shadow 0.35s ease",
          }}
        >

          {/* Logo/Brand Section */}
          <div style={{ marginBottom: "32px" }}>
            <h1 style={{ fontSize: "32px", fontWeight: 700, marginBottom: "8px", color: "#111827", letterSpacing: "-0.02em" }}>Welcome Back</h1>
            <p style={{ fontSize: "15px", color: "#6b7280", lineHeight: "1.5" }}>Sign in to access your HRMS dashboard</p>

            {/* Digital Clock */}
            <div style={{
              marginTop: "16px",
              padding: "8px 14px",
              background: "linear-gradient(135deg, rgba(59,130,246,0.06), rgba(37,99,235,0.06))",
              borderRadius: "8px",
              border: "1px solid rgba(59,130,246,0.15)",
              boxShadow: "0 2px 8px rgba(59,130,246,0.06)"
            }}>
              <div style={{ display: "flex", alignItems: "center", gap: "10px", justifyContent: "center" }}>
                {/* <span style={{ fontSize: "14px" }}>🕐</span> */}
                <div style={{
                  fontSize: "18px",
                  fontWeight: 700,
                  color: "#1c93e1ff",
                  letterSpacing: "0.5px",
                  fontFamily: "monospace"
                }}>
                  {formatTime(currentTime)}
                </div>
              </div>
            </div>
          </div>

          <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
            <div>
              <label htmlFor="email" style={{ display: "block", fontSize: "14px", fontWeight: 600, marginBottom: "8px", color: "#374151" }}>Email Address</label>
              <input
                id="email"
                type="email"
                name="email"
                autoComplete="email"
                value={formValues.email}
                onChange={handleChange}
                disabled={isLoading}
                placeholder="you@example.com"
                required
                style={{
                  width: "100%",
                  padding: "12px 16px",
                  fontSize: "15px",
                  borderRadius: "10px",
                  border: "1.25px solid rgba(255,255,255,0.4)",
                  backgroundColor: "rgba(255,255,255,0.65)",
                  boxShadow: "0 6px 18px rgba(0,0,0,0.08)",
                  transition: "all 0.25s ease",
                  outline: "none",
                  boxSizing: "border-box",
                  color: "#0f172a",
                }}
                onFocus={(e) => {
                  e.target.style.borderColor = "rgba(59,130,246,0.8)";
                  e.target.style.boxShadow = "0 10px 28px rgba(59,130,246,0.2), 0 0 0 3px rgba(59,130,246,0.18)";
                  e.target.style.backgroundColor = "rgba(255,255,255,0.82)";
                }}
                onBlur={(e) => {
                  e.target.style.borderColor = "rgba(255,255,255,0.4)";
                  e.target.style.boxShadow = "0 6px 18px rgba(0,0,0,0.08)";
                  e.target.style.backgroundColor = "rgba(255,255,255,0.65)";
                }}
              />
            </div>

            <div>
              <label htmlFor="password" style={{ display: "block", fontSize: "14px", fontWeight: 600, marginBottom: "8px", color: "#374151" }}>Password</label>
              <div style={{ position: "relative" }}>
                <input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  name="password"
                  autoComplete="current-password"
                  value={formValues.password}
                  onChange={handleChange}
                  disabled={isLoading}
                  placeholder="Enter your password"
                  required
                  style={{
                    width: "100%",
                    padding: "12px 48px 12px 16px",
                    fontSize: "15px",
                    borderRadius: "10px",
                    border: "1.25px solid rgba(255,255,255,0.4)",
                    backgroundColor: "rgba(255,255,255,0.65)",
                    boxShadow: "0 6px 18px rgba(0,0,0,0.08)",
                    transition: "all 0.25s ease",
                    outline: "none",
                    boxSizing: "border-box",
                    color: "#0f172a",
                  }}
                  onFocus={(e) => {
                    e.target.style.borderColor = "rgba(59,130,246,0.8)";
                    e.target.style.boxShadow = "0 10px 28px rgba(59,130,246,0.2), 0 0 0 3px rgba(59,130,246,0.18)";
                    e.target.style.backgroundColor = "rgba(255,255,255,0.82)";
                  }}
                  onBlur={(e) => {
                    e.target.style.borderColor = "rgba(255,255,255,0.4)";
                    e.target.style.boxShadow = "0 6px 18px rgba(0,0,0,0.08)";
                    e.target.style.backgroundColor = "rgba(255,255,255,0.65)";
                  }}
                />
                <button type="button" onClick={() => setShowPassword(!showPassword)} style={{ position: "absolute", right: "12px", top: "50%", transform: "translateY(-50%)", border: "none", background: "none", cursor: "pointer", fontSize: "14px", color: "#6b7280", padding: "4px", display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 600 }}>{showPassword ? "Hide" : "Show"}</button>
              </div>
            </div>

            {error && (<div style={{ padding: "14px 16px", backgroundColor: "#fef2f2", border: "1.5px solid #fecaca", borderRadius: "8px", color: "#dc2626", fontSize: "14px", fontWeight: 500 }}>{error}</div>)}

            {successMessage && (<div style={{ padding: "14px 16px", backgroundColor: "#f0fdf4", border: "1.5px solid #86efac", borderRadius: "8px", color: "#16a34a", fontSize: "14px", fontWeight: 500 }}>{successMessage}</div>)}

            {/* Sign In and Quick Check-In Buttons Side by Side */}
            <div style={{ display: "flex", gap: "12px", marginTop: "8px" }}>
              <button
                type="submit"
                disabled={isLoading}
                style={{
                  flex: 1,
                  padding: "14px 20px",
                  borderRadius: "10px",
                  border: "none",
                  background: isLoading
                    ? "linear-gradient(135deg, #9ca3af, #9ca3af)"
                    : "linear-gradient(135deg, #2563eb, #1e3a8a)",
                  color: "#ffffff",
                  fontSize: "15px",
                  fontWeight: 700,
                  letterSpacing: "0.01em",
                  cursor: isLoading ? "not-allowed" : "pointer",
                  transition: "all 0.2s ease",
                  boxShadow: "0 8px 24px rgba(37, 99, 235, 0.4)",
                }}
                onMouseEnter={(e) => {
                  if (!isLoading) {
                    e.target.style.transform = "translateY(-1px)";
                    e.target.style.boxShadow = "0 12px 28px rgba(37, 99, 235, 0.45)";
                  }
                }}
                onMouseLeave={(e) => {
                  if (!isLoading) {
                    e.target.style.transform = "translateY(0)";
                    e.target.style.boxShadow = "0 8px 24px rgba(37, 99, 235, 0.4)";
                  }
                }}
              >
                {isLoading && !isQuickCheckIn ? "Logging in..." : "Sign In"}
              </button>

              <button
                type="button"
                onClick={handleQuickCheckIn}
                disabled={isLoading}
                style={{
                  flex: 1,
                  padding: "14px 20px",
                  borderRadius: "10px",
                  border: "1.5px solid rgba(34, 197, 94, 0.3)",
                  background: isLoading
                    ? "linear-gradient(135deg, #9ca3af, #9ca3af)"
                    : "linear-gradient(135deg, #10b981, #059669)",
                  color: "#ffffff",
                  fontSize: "15px",
                  fontWeight: 700,
                  letterSpacing: "0.01em",
                  cursor: isLoading ? "not-allowed" : "pointer",
                  transition: "all 0.2s ease",
                  boxShadow: "0 8px 24px rgba(16, 185, 129, 0.4)",
                }}
                onMouseEnter={(e) => {
                  if (!isLoading) {
                    e.target.style.transform = "translateY(-1px)";
                    e.target.style.boxShadow = "0 12px 28px rgba(16, 185, 129, 0.45)";
                  }
                }}
                onMouseLeave={(e) => {
                  if (!isLoading) {
                    e.target.style.transform = "translateY(0)";
                    e.target.style.boxShadow = "0 8px 24px rgba(16, 185, 129, 0.4)";
                  }
                }}
              >
                {isLoading && isQuickCheckIn ? "Checking in..." : "Quick Check-In"}
              </button>
            </div>

            <p style={{ marginTop: "12px", fontSize: "12px", color: "#6b7280", textAlign: "center", lineHeight: "1.5" }}>
              Use <strong>Quick Check-In</strong> for fast attendance marking during rush hours
            </p>
          </form>

        </div>
      </div>

      {/* Footer */}
      <div style={{
        position: "absolute",
        bottom: 0,
        left: 0,
        right: 0,
        zIndex: 10,
        padding: "20px",
        textAlign: "center",
        background: "linear-gradient(to top, rgba(0,0,0,0.05), transparent)"
      }}>
        <p style={{ fontSize: "13px", color: "#6b7280", margin: 0, fontWeight: 500 }}>
          © 2026 Mind & Matter. All rights reserved.
        </p>
      </div>

      {/* Map Popup Modal */}
      {showMap && checkInLocation && (
        <div
          style={{
            position: "fixed",
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            zIndex: 9999,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            background: "rgba(0, 0, 0, 0.7)",
            backdropFilter: "blur(8px)",
            padding: "20px",
            animation: "fadeIn 0.3s ease",
          }}
          onClick={() => setShowMap(false)}
        >
          <div
            style={{
              width: "100%",
              maxWidth: "700px",
              background: "linear-gradient(145deg, rgba(255,255,255,0.98), rgba(255,255,255,0.95))",
              borderRadius: "20px",
              overflow: "hidden",
              boxShadow: "0 25px 100px rgba(0,0,0,0.4), 0 0 0 1px rgba(255,255,255,0.3)",
              animation: "slideUp 0.4s ease",
            }}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div
              style={{
                padding: "20px 24px",
                background: "linear-gradient(135deg, #10b981, #059669)",
                color: "white",
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
              }}
            >
              <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                <span style={{ fontSize: "24px" }}>📍</span>
                <div>
                  <h3 style={{ margin: 0, fontSize: "18px", fontWeight: 700 }}>Check-In Location</h3>
                  <p style={{ margin: "4px 0 0 0", fontSize: "13px", opacity: 0.9 }}>
                    Verified at {new Date().toLocaleTimeString()}
                  </p>
                </div>
              </div>
              <button
                onClick={() => setShowMap(false)}
                style={{
                  background: "rgba(255,255,255,0.2)",
                  border: "none",
                  borderRadius: "8px",
                  color: "white",
                  fontSize: "24px",
                  width: "36px",
                  height: "36px",
                  cursor: "pointer",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  transition: "all 0.2s ease",
                }}
                onMouseEnter={(e) => {
                  e.target.style.background = "rgba(255,255,255,0.3)";
                }}
                onMouseLeave={(e) => {
                  e.target.style.background = "rgba(255,255,255,0.2)";
                }}
              >
                ×
              </button>
            </div>

            {/* Map */}
            <div style={{ height: "450px", width: "100%", position: "relative" }}>
              <MapContainer
                center={[checkInLocation.latitude, checkInLocation.longitude]}
                zoom={16}
                style={{ height: "100%", width: "100%" }}
              >
                <TileLayer
                  attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                  url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                />
                <Marker position={[checkInLocation.latitude, checkInLocation.longitude]}>
                  <Popup>
                    <strong>Your Check-In Location</strong><br />
                    Lat: {checkInLocation.latitude.toFixed(6)}<br />
                    Lng: {checkInLocation.longitude.toFixed(6)}<br />
                    Time: {new Date().toLocaleTimeString()}
                  </Popup>
                </Marker>
              </MapContainer>
            </div>

            {/* Footer with coordinates */}
            <div
              style={{
                padding: "16px 24px",
                background: "#f9fafb",
                borderTop: "1px solid #e5e7eb",
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                gap: "16px",
              }}
            >
              <div style={{ display: "flex", gap: "24px", fontSize: "13px", color: "#6b7280" }}>
                <div>
                  <span style={{ fontWeight: 600, color: "#374151" }}>Latitude:</span>{" "}
                  {checkInLocation.latitude.toFixed(6)}
                </div>
                <div>
                  <span style={{ fontWeight: 600, color: "#374151" }}>Longitude:</span>{" "}
                  {checkInLocation.longitude.toFixed(6)}
                </div>
              </div>
              <div
                style={{
                  padding: "6px 12px",
                  background: "#d1fae5",
                  color: "#065f46",
                  borderRadius: "6px",
                  fontSize: "12px",
                  fontWeight: 600,
                  display: "flex",
                  alignItems: "center",
                  gap: "6px",
                }}
              >
                <span>✓</span> Location Verified
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Face Authentication Modal */}
      {showFaceAuth && (
        <div
          style={{
            position: "fixed",
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            zIndex: 10000,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            background: "rgba(0, 0, 0, 0.85)",
            backdropFilter: "blur(12px)",
            padding: "20px",
            animation: "fadeIn 0.3s ease",
          }}
          onClick={closeFaceAuth}
        >
          <div
            style={{
              width: "100%",
              maxWidth: "600px",
              background: "linear-gradient(145deg, rgba(255,255,255,0.98), rgba(255,255,255,0.95))",
              borderRadius: "20px",
              overflow: "hidden",
              boxShadow: "0 25px 100px rgba(0,0,0,0.5), 0 0 0 1px rgba(255,255,255,0.3)",
              animation: "slideUp 0.4s ease",
            }}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div
              style={{
                padding: "20px 24px",
                background: "linear-gradient(135deg, #8b5cf6, #7c3aed)",
                color: "white",
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
              }}
            >
              <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                <div>
                  <h3 style={{ margin: 0, fontSize: "18px", fontWeight: 700 }}>
                    {faceAuthMode === 'enroll' ? 'Enroll Face Authentication' : (isQuickCheckInFlow ? 'Quick Check-In - Face Authentication' : 'Face Login')}
                  </h3>
                  <p style={{ margin: "4px 0 0 0", fontSize: "13px", opacity: 0.9 }}>
                    {faceAuthMode === 'enroll'
                      ? 'Position your face in the center and capture'
                      : (isQuickCheckInFlow ? 'Authenticate your face to proceed with check-in' : 'Look at the camera to authenticate')}
                  </p>
                </div>
              </div>
              <button
                onClick={closeFaceAuth}
                style={{
                  background: "rgba(255,255,255,0.2)",
                  border: "none",
                  borderRadius: "8px",
                  color: "white",
                  fontSize: "24px",
                  width: "36px",
                  height: "36px",
                  cursor: "pointer",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  transition: "all 0.2s ease",
                }}
                onMouseEnter={(e) => {
                  e.target.style.background = "rgba(255,255,255,0.3)";
                }}
                onMouseLeave={(e) => {
                  e.target.style.background = "rgba(255,255,255,0.2)";
                }}
              >
                ×
              </button>
            </div>

            {/* Video Feed */}
            <div style={{ padding: "24px", background: "#000", position: "relative" }}>
              <video
                id="faceAuthVideo"
                autoPlay
                playsInline
                muted
                style={{
                  width: "100%",
                  maxHeight: "400px",
                  borderRadius: "12px",
                  objectFit: "cover",
                }}
              />

              {/* Face Detection Overlay */}
              <div style={{
                position: "absolute",
                top: "50%",
                left: "50%",
                transform: "translate(-50%, -50%)",
                width: "280px",
                height: "360px",
                border: "3px solid rgba(139, 92, 246, 0.8)",
                borderRadius: "50%",
                pointerEvents: "none",
                boxShadow: "0 0 0 9999px rgba(0,0,0,0.3)"
              }} />
            </div>

            {/* Footer with Actions */}
            <div
              style={{
                padding: "20px 24px",
                background: "#f9fafb",
                borderTop: "1px solid #e5e7eb",
                display: "flex",
                flexDirection: "column",
                gap: "12px",
              }}
            >
              <button
                onClick={captureFaceAuth}
                disabled={faceAuthLoading}
                style={{
                  width: "100%",
                  padding: "14px 24px",
                  borderRadius: "10px",
                  border: "none",
                  background: faceAuthLoading
                    ? "linear-gradient(135deg, #9ca3af, #9ca3af)"
                    : "linear-gradient(135deg, #8b5cf6, #7c3aed)",
                  color: "#ffffff",
                  fontSize: "16px",
                  fontWeight: 700,
                  cursor: faceAuthLoading ? "not-allowed" : "pointer",
                  transition: "all 0.2s ease",
                  boxShadow: "0 4px 12px rgba(139, 92, 246, 0.4)",
                }}
              >
                {faceAuthLoading ? (
                  <span style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: "8px" }}>
                    <span style={{ animation: "spin 1s linear infinite", display: "inline-block" }}>⏳</span>
                    Processing...
                  </span>
                ) : (
                  <span style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: "8px" }}>
                    <span>📸</span> {faceAuthMode === 'enroll' ? 'Capture & Enroll' : 'Capture & Login'}
                  </span>
                )}
              </button>

              <p style={{ margin: 0, fontSize: "12px", color: "#6b7280", textAlign: "center" }}>
                {faceAuthMode === 'enroll'
                  ? '⚠️ Make sure to enter your email first before enrolling'
                  : '💡 Ensure good lighting and look directly at the camera'}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* CSS Animations */}
      <style>{`
        @keyframes fadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        @keyframes slideUp {
          from {
            opacity: 0;
            transform: translateY(30px) scale(0.95);
          }
          to {
            opacity: 1;
            transform: translateY(0) scale(1);
          }
        }
      `}</style>
    </div>
  );
};

export default LoginPage;
