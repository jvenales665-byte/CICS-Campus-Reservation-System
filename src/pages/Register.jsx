import "../style/Register.css";
import { useState, useEffect } from "react";

function Register({ onNavigate }) {

const handleRegister = async (e) => {
  e.preventDefault();

  if (password !== confirmPassword) {
    setNotification({
        type: "error",
        message: "Passwords do not match!"
    });
    return;
  }

  if (!fullName || !email || !password || !position || !idPicture) {
    setNotification({
        type: "error",
        message: "Please fill in all fields."
    });
    return;
  }

  try {
    const formData = new FormData();
    formData.append("full_name", fullName);
    formData.append("position", position);
    formData.append("email", email);
    formData.append("password", password);
    formData.append("id_picture", idPicture);

const response = await fetch("http://localhost:5000/register", {
    method: "POST",
    body: formData,
});

  const data = await response.json();

    setNotification({
        type: response.ok ? "success" : "error",
        message: data.message
    });

    if (response.ok) {
    setFullName("");
    setPosition("");
    setIdPicture(null);
    setEmail("");
    setPassword("");
    setConfirmPassword("");
    setShowPassword(false);
    setShowConfirmPassword(false);
    }
} catch (error) {
    setNotification({
        type: "error",
        message: "Unable to connect to the server."
    });
}

};
    
const [showPassword, setShowPassword] = useState(false);
const [notification, setNotification] = useState(null);
const [showConfirmPassword, setShowConfirmPassword] = useState(false);

const [password, setPassword] = useState("");
const [confirmPassword, setConfirmPassword] = useState("");

const [fullName, setFullName] = useState("");
const [email, setEmail] = useState("");

const [position, setPosition] = useState("");
const [idPicture, setIdPicture] = useState(null);

useEffect(() => {
    if (notification) {
        const timer = setTimeout(() => {
            setNotification(null);
        }, 3000);

        return () => clearTimeout(timer);
    }
}, [notification]);

  return (
    <div className="register-container">
        <div className="register-box">
        <h1>Create Account</h1>
        <p>Register to reserve campus facilities.</p>

        <form onSubmit={handleRegister}>

            <input
                type="text"
                placeholder="Full Name"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
            />

            <select
                className="register-select"
                value={position}
                onChange={(e) => setPosition(e.target.value)}
            >
                <option value="" disabled>Select Your Position</option>
                <option value="Faculty/Professor">Faculty / Professor</option>
                <option value="Office Staff">Office Staff</option>
            </select>

            <input
                type="file"
                className="id-upload-input"
                accept="image/*"
                required
                onChange={(e) => setIdPicture(e.target.files[0])}
            />

            <label className="id-upload-label">
                Upload a picture of your official ID
            </label>

            <input
                type="email"
                placeholder="Email Address"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
            />

            <div className="register-password-field">
                <input
                    type={showPassword ? "text" : "password"}
                    placeholder="Password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                />
                <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                >
                    {showPassword ? "Hide" : "Show"}
                </button>
            </div>

            <div className="register-password-field">
                <input
                    type={showConfirmPassword ? "text" : "password"}
                    placeholder="Confirm Password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                />
                <button
                    type="button"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                >
                    {showConfirmPassword ? "Hide" : "Show"}
                </button>
            </div>  

            <button type="submit">Create Account</button>
        </form>

        {notification && (
            <div className={`notification-popup ${notification.type}`}>
                <p>{notification.message}</p>
                <button onClick={() => setNotification(null)}>
                    OK
                </button>
            </div>
        )}

        <hr />

        <p className="login-link">
            Already have an account?{" "}
            <a
                href="#"
                onClick={(e) => {
                e.preventDefault();
                onNavigate("login");
                }}
            >
                Sign In
            </a>
        </p>

        </div>
    </div>
  );
}

export default Register;