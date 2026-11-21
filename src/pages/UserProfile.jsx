
import { useState, useEffect } from "react";
import "../style/UserProfile.css";

function UserProfile({ user, onUserUpdate }) {
    const [displayUser, setDisplayUser] = useState(user);

    const [profilePicture, setProfilePicture] = useState(
        user?.profile_picture || null
    );

    const [notification, setNotification] = useState(null);
    const [selectedPicture, setSelectedPicture] = useState(null);
    const [previewPicture, setPreviewPicture] = useState(null);

    const [isEditing, setIsEditing] = useState(false);

    const [editedInfo, setEditedInfo] = useState({
        full_name: user?.full_name || "",
        position: user?.position || "",
        email: user?.email || ""
    });

    const [currentPassword, setCurrentPassword] = useState("");
    const [newPassword, setNewPassword] = useState("");
    const [confirmPassword, setConfirmPassword] = useState("");

    const [showCurrentPassword, setShowCurrentPassword] = useState(false);
    const [showNewPassword, setShowNewPassword] = useState(false);
    const [showConfirmPassword, setShowConfirmPassword] = useState(false);

    const showNotification = (type, message) => {
        setNotification({ type, message });
    };

    useEffect(() => {
        if (!notification) return;

        const timer = setTimeout(() => {
            setNotification(null);
        }, 3000);

        return () => clearTimeout(timer);
    }, [notification]);

    useEffect(() => {
        if (!selectedPicture) {
            setPreviewPicture(null);
            return;
        }

        const objectUrl = URL.createObjectURL(selectedPicture);
        setPreviewPicture(objectUrl);

        return () => URL.revokeObjectURL(objectUrl);
    }, [selectedPicture]);

    // Keep profile information synchronized with UserDash
    useEffect(() => {
        setDisplayUser(user);
        setProfilePicture(user?.profile_picture || null);

        setEditedInfo({
            full_name: user?.full_name || "",
            position: user?.position || "",
            email: user?.email || ""
        });
    }, [user]);

    const handlePictureUpload = async () => {
        if (!selectedPicture) {
            showNotification("error", "Please select a profile picture first.");
            return;
        }

        const formData = new FormData();
        formData.append("profile_picture", selectedPicture);

        try {
            const response = await fetch(
                `http://localhost:5000/profile-picture/${user.id}`,
                {
                    method: "PUT",
                    body: formData
                }
            );

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.message || "Failed to upload profile picture.");
            }

            const updatedUser = {
                ...displayUser,
                profile_picture: data.profile_picture
            };

            setProfilePicture(data.profile_picture);
            setDisplayUser(updatedUser);
            onUserUpdate?.(updatedUser);

            setSelectedPicture(null);
            showNotification("success", "Profile picture updated successfully!");
        } catch (error) {
            console.error("Profile picture upload error:", error);
            showNotification("error", error.message);
        }
    };

    const handleSaveProfile = async () => {
        if (
            !editedInfo.full_name.trim() ||
            !editedInfo.position ||
            !editedInfo.email.trim()
        ) {
            showNotification("error", "Please fill in all personal information.");
            return;
        }

        try {
            const response = await fetch(
                `http://localhost:5000/update-profile/${user.id}`,
                {
                    method: "PUT",
                    headers: {
                        "Content-Type": "application/json"
                    },
                    body: JSON.stringify({
                        full_name: editedInfo.full_name,
                        position: editedInfo.position,
                        email: editedInfo.email
                    })
                }
            );

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.message || "Failed to update profile.");
            }

            const updatedUser = {
                ...displayUser,
                ...data.user
            };

            setDisplayUser(updatedUser);
            onUserUpdate?.(updatedUser);

            setEditedInfo({
                full_name: updatedUser.full_name,
                position: updatedUser.position,
                email: updatedUser.email
            });

            setIsEditing(false);
            showNotification("success", "Profile updated successfully!");
        } catch (error) {
            console.error("Profile update error:", error);
            showNotification("error", error.message);
        }
    };

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

            if (!response.ok) {
                throw new Error(data.message || "Failed to change password.");
            }

            setCurrentPassword("");
            setNewPassword("");
            setConfirmPassword("");

            showNotification("success", "Password changed successfully!");
        } catch (error) {
            console.error("Change password error:", error);
            showNotification("error", error.message);
        }
    };

    return (
        <div className="user-profile-page">

            {notification && (
                <div className={`user-profile-notification ${notification.type}`}>
                    {notification.message}
                </div>
            )}

            <main className="user-profile-main">

                <div className="user-profile-header">
                    <h1>My Profile</h1>
                    <p>Manage your personal information and account details.</p>
                </div>

                {/* PROFILE OVERVIEW */}
                <section className="user-profile-overview">

                    <div className="user-profile-picture">
                        {profilePicture ? (
                            <img
                                src={`http://localhost:5000/uploads/${profilePicture}`}
                                alt="Profile"
                            />
                        ) : (
                            <div className="user-profile-default-picture">
                                No Profile Picture
                            </div>
                        )}
                    </div>

                    <div className="user-profile-overview-info">
                        <h2>{displayUser?.full_name}</h2>
                        <p>{displayUser?.position}</p>
                        <span>{displayUser?.role}</span>
                    </div>

                    <label
                        htmlFor="user-profile-upload"
                        className="user-profile-upload-button"
                    >
                        Change Photo
                    </label>

                    <input
                        type="file"
                        id="user-profile-upload"
                        accept="image/*"
                        onChange={(e) =>
                            setSelectedPicture(e.target.files[0] || null)
                        }
                        hidden
                    />

                </section>

                {selectedPicture && (
                    <div className="user-profile-picture-preview">
                        <p>Selected Picture:</p>

                        <img
                            src={previewPicture}
                            alt="Selected Profile Preview"
                        />

                        <div>
                            <button onClick={handlePictureUpload}>
                                Upload Picture
                            </button>

                            <button onClick={() => setSelectedPicture(null)}>
                                Cancel
                            </button>
                        </div>
                    </div>
                )}

                {/* PERSONAL INFORMATION */}
                <section className="user-profile-section">

                    <div className="user-profile-section-heading">
                        <div>
                            <h2>Personal Information</h2>
                            <p>Your personal account details.</p>
                        </div>

                        {!isEditing && (
                            <button
                                className="user-profile-edit-button"
                                onClick={() => setIsEditing(true)}
                            >
                                Edit Information
                            </button>
                        )}
                    </div>

                    <div className="user-profile-information-card">

                        <div>
                            <label>Full Name</label>

                            {isEditing ? (
                                <input
                                    type="text"
                                    value={editedInfo.full_name}
                                    onChange={(e) =>
                                        setEditedInfo({
                                            ...editedInfo,
                                            full_name: e.target.value
                                        })
                                    }
                                />
                            ) : (
                                <p>{displayUser?.full_name}</p>
                            )}
                        </div>

                        <div>
                            <label>Position</label>

                            {isEditing ? (
                                <select
                                    value={editedInfo.position}
                                    onChange={(e) =>
                                        setEditedInfo({
                                            ...editedInfo,
                                            position: e.target.value
                                        })
                                    }
                                >
                                    <option value="Faculty Professor">
                                        Faculty Professor
                                    </option>
                                    <option value="Office Staff">
                                        Office Staff
                                    </option>
                                </select>
                            ) : (
                                <p>{displayUser?.position}</p>
                            )}
                        </div>

                    </div>

                    {isEditing && (
                        <div className="user-profile-edit-actions">
                            <button
                                className="user-profile-save-button"
                                onClick={handleSaveProfile}
                            >
                                Save Changes
                            </button>

                            <button
                                className="user-profile-cancel-button"
                                onClick={() => {
                                    setEditedInfo({
                                        full_name: displayUser?.full_name || "",
                                        position: displayUser?.position || "",
                                        email: displayUser?.email || ""
                                    });
                                    setIsEditing(false);
                                }}
                            >
                                Cancel
                            </button>
                        </div>
                    )}

                </section>

                {/* ACCOUNT INFORMATION */}
                <section className="user-profile-section">

                    <div className="user-profile-section-heading">
                        <div>
                            <h2>Account Information</h2>
                            <p>Your registered account information.</p>
                        </div>
                    </div>

                    <div className="user-profile-information-card">

                        <div>
                            <label>Email Address</label>

                            {isEditing ? (
                                <input
                                    type="email"
                                    value={editedInfo.email}
                                    onChange={(e) =>
                                        setEditedInfo({
                                            ...editedInfo,
                                            email: e.target.value
                                        })
                                    }
                                />
                            ) : (
                                <p>{displayUser?.email}</p>
                            )}
                        </div>

                        <div>
                            <label>Account Role</label>
                            <p>{displayUser?.role}</p>
                        </div>

                    </div>

                </section>

                {/* ACCOUNT SETTINGS */}
                <section className="user-profile-section">

                    <div className="user-profile-section-heading">
                        <div>
                            <h2>Account Settings</h2>
                            <p>Manage your account security and password.</p>
                        </div>
                    </div>

                    <div className="user-profile-information-card">

                        <div>
                            <label>Current Password</label>

                            <div className="user-profile-password-wrapper">
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

                            <div className="user-profile-password-wrapper">
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

                            <div className="user-profile-password-wrapper">
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
                        className="user-profile-change-password-button"
                        onClick={handleChangePassword}
                    >
                        Change Password
                    </button>

                </section>

            </main>
        </div>
    );
}

export default UserProfile;
