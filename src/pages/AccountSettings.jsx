import { useState, useEffect } from "react";
import "../style/AccountSettings.css";

function AccountSettings({ user }) {

    const [notification, setNotification] = useState(null);

    useEffect(() => {
        if (notification) {
            const timer = setTimeout(() => {
                setNotification(null);
            }, 3000);

            return () => clearTimeout(timer);
        }
    }, [notification]);

    const showNotification = (type, message) => {
        setNotification({
            type,
            message
        });
    };

    const [currentPassword, setCurrentPassword] = useState("");
    const [newPassword, setNewPassword] = useState("");
    const [confirmPassword, setConfirmPassword] = useState("");

    const [showCurrentPassword, setShowCurrentPassword] = useState(false);
    const [showNewPassword, setShowNewPassword] = useState(false);
    const [showConfirmPassword, setShowConfirmPassword] = useState(false);

    const handleChangePassword = async () => {
        if (!currentPassword || !newPassword || !confirmPassword) {
            showNotification("error", "Please fill in all password fields.");
            return;
        }

        if (newPassword !== confirmPassword) {
            showNotification("error", "New passwords do not match.");
            return;
        }

        if (newPassword.length < 8) {
            showNotification("error", "New password must be at least 8 characters.");
            return;
        }

        try {
            const response = await fetch(
                `http://localhost:5000/change-password/${user.id}`,
                {
                    method: "PUT",
                    headers: {
                        "Content-Type": "application/json"
                    },
                    body: JSON.stringify({
                        currentPassword,
                        newPassword
                    })
                }
            );

            const data = await response.json();

            if (response.ok) {
                setCurrentPassword("");
                setNewPassword("");
                setConfirmPassword("");
                showNotification("success", "Password changed successfully!");
            } else {
                showNotification("error", data.message);
            }
        } catch (error) {
            console.error("Change password error:", error);
            showNotification("error", "Unable to change password: " + error.message);
        }
    };

    return (
        <section className="profile-information">

            {notification && (
                <div className={`profile-notification ${notification.type}`}>
                    {notification.message}
                </div>
            )}

            <div className="profile-section-heading">
                <h2>Account Settings</h2>
                <p>Manage your account security and preferences.</p>
            </div>

            <div className="profile-information-card">

                <div>
                    <label>Current Password</label>
                    <div className="password-input-wrapper">
                        <input
                            type={showCurrentPassword ? "text" : "password"}
                            value={currentPassword}
                            onChange={(e) => setCurrentPassword(e.target.value)}
                            placeholder="Enter current password"
                        />

                        <button
                            type="button"
                            onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                        >
                            {showCurrentPassword ? "Hide" : "Show"}
                        </button>
                    </div>
                </div>

                <div>
                    <label>New Password</label>
                    <div className="password-input-wrapper">
                        <input
                            type={showNewPassword ? "text" : "password"}
                            value={newPassword}
                            onChange={(e) => setNewPassword(e.target.value)}
                            placeholder="Enter new password"
                        />

                        <button
                            type="button"
                            onClick={() => setShowNewPassword(!showNewPassword)}
                        >
                            {showNewPassword ? "Hide" : "Show"}
                        </button>
                    </div>
                </div>

                <div>
                    <label>Confirm New Password</label>
                    <div className="password-input-wrapper">
                        <input
                            type={showConfirmPassword ? "text" : "password"}
                            value={confirmPassword}
                            onChange={(e) => setConfirmPassword(e.target.value)}
                            placeholder="Confirm new password"
                        />

                        <button
                            type="button"
                            onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                        >
                            {showConfirmPassword ? "Hide" : "Show"}
                        </button>
                    </div>
                </div>

            </div>

            <button
                className="save-profile-button"
                onClick={handleChangePassword}
            >
                Change Password
            </button>

        </section>
    );
}

export default AccountSettings;