import "../style/Login.css";
import { useState } from "react";

import logo from "../assets/imgs/ZPPSU_LOGO.png";
import cicsLogo from "../assets/imgs/CICS_LOGO.png";

import ict from "../assets/imgs/ICT_bdg.jpg";
import conference from "../assets/imgs/Conference_room.png";
import classroom from "../assets/imgs/Classroom.jpg";
import hallwayLeft from "../assets/imgs/Hallway_left.jpg";
import hallwayRight from "../assets/imgs/Hallway_right.jpg";

function Login({ onNavigate, onLogin }) {

const [email, setEmail] = useState("");
const [password, setPassword] = useState("");

const [isLoggingIn, setIsLoggingIn] = useState(false);

const [errorMessage, setErrorMessage] = useState("");

const [showPassword, setShowPassword] = useState(false);

const handleLogin = async (e) => {
  e.preventDefault();

  if (!email || !password) {
    setErrorMessage("Please enter your email and password.");
    setIsLoggingIn(false);
    return;
  }

  setErrorMessage("");

  setIsLoggingIn(true);

  try {
    const response = await fetch("http://localhost:5000/login", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ email, password }),
    });

    const data = await response.json();

    if (!response.ok) {
      setErrorMessage(data.message || "Unable to log in.");
      setIsLoggingIn(false);
      return;
    }

    onLogin(data.user);

    if (data.user.role === "admin") {
      onNavigate("admin");
    } else {
      onNavigate("user");
    }

  } catch (error) {
    setErrorMessage("Unable to connect to the server.");
    setIsLoggingIn(false);
  }
};

const photos = [
  {
    image: ict,
    title: "ICT Building",
    description: "A facility for information and communication technology."
  },
  {
    image: conference,
    title: "Conference Room",
    description: "A space for meetings, discussions, and academic conferences."
  },
  {
    image: classroom,
    title: "Classroom",
    description: "A learning space for CICS faculty and students."
  },
  {
    image: hallwayLeft,
    title: "Left Hallway",
    description: "CICS building facilities and common areas."
  },
  {
    image: hallwayRight,
    title: "Right Hallway",
    description: "Explore the facilities inside the CICS building."
  }
];

const [currentPhoto, setCurrentPhoto] = useState(0);
const nextPhoto = () => {
  setCurrentPhoto((currentPhoto + 1) % photos.length);
};

const previousPhoto = () => {
  setCurrentPhoto(
    (currentPhoto - 1 + photos.length) % photos.length
  );
};

  return (
    <div className="login-page">
      <div className="login-container">

        <div className="left-panel">
          <div className="brand">
            <div className="brand-logos">
              <img src={logo} alt="ZPPSU Logo" />
              <img src={cicsLogo} alt="CICS Logo" />
            </div>
            <h2>CICS</h2>
            <p>Campus Reservation System</p>
            
            <div className="login-form">

              <input
                type="email"
                placeholder="Email Address"
                value={email}
                onChange={(e) => {
                  setEmail(e.target.value);
                  setErrorMessage("");
                }}
              />

              <div className="password-field">

                <input
                  type={showPassword ? "text" : "password"}
                  placeholder="Password"
                  value={password}
                  onChange={(e) => {
                    setPassword(e.target.value);
                    setErrorMessage("");
                  }}
                />

                <button type="button" onClick={() => setShowPassword(!showPassword)}>
                  {showPassword ? "Hide" : "Show"}
                </button>

              </div>
              
              {errorMessage && (
                <div className="login-error">
                  <span>⚠</span>
                  {errorMessage}
                </div>
              )}

              <a href="/forgot-password" className="forgot-password">Forgot Password?</a>

              <button type="button" onClick={handleLogin} disabled={isLoggingIn}>
                  {isLoggingIn ? "Logging in..." : "Login"}
              </button>

              <hr className="register-line" />

              <p className="register-text">
                Don't have an account?{" "}
                <a
                  href="#"
                  onClick={(e) => {
                    e.preventDefault();
                    onNavigate("register");
                  }}
                >
                  Create Account
                </a>
              </p>

            </div>

          </div>
        </div>

        <div className="right-panel">

          <div
            className="photo-slider"
            style={{ transform: `translateX(-${currentPhoto * 100}%)` }}
          >
            {photos.map((photo, index) => (
              <img key={index} src={photo.image} alt={photo.title} />
            ))}
          </div>

          <div className="photo-caption">
            <h2>{photos[currentPhoto].title}</h2>
            <p>{photos[currentPhoto].description}</p>
          </div>

          <button className="slider-arrow left-arrow" onClick={previousPhoto}>
            &#10094;
          </button>

          <button className="slider-arrow right-arrow" onClick={nextPhoto}>
            &#10095;
          </button>

          <div className="photo-indicators">
            {photos.map((photo, index) => (
              <span
                key={index}
                className={currentPhoto === index ? "active" : ""}
              ></span>
            ))}
          </div>

        </div>

      </div>
    </div>
  );
}

export default Login;