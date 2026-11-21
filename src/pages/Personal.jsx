import { useState, useEffect } from "react";
import "../style/Personal.css";

function Personal({ user, setDisplayUser }) {

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

    const [isEditing, setIsEditing] = useState(false);

    const [editedInfo, setEditedInfo] = useState({
        full_name: user?.full_name || "",
        position: user?.position || "",
        email: user?.email || ""
    });

    const handleSaveProfile = async () => {
        if (
            !editedInfo.full_name.trim() ||
            !editedInfo.position ||
            !editedInfo.email.trim()
        ) {
            showNotification("error", "Please fill in all profile fields.");
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
                    body: JSON.stringify(editedInfo)
                }
            );

            const data = await response.json();

            if (response.ok) {
                setEditedInfo(data.user);
                setDisplayUser(prevUser => ({
                    ...prevUser,
                    ...data.user
                }));
                setIsEditing(false);
                showNotification("success", "Profile updated successfully!");
            } else {
                showNotification("error", data.message);
            }
        } catch (error) {
            console.error("Profile update error:", error);
            showNotification("error", "Unable to update profile: " + error.message);
        }
    };

return (
    <>
        {notification && (
            <div className={`profile-notification ${notification.type}`}>
                {notification.message}
            </div>
        )}

        <section className="profile-information">

            <div className="profile-section-heading">
                <h2>Personal Information</h2>
                <p>Your personal account details.</p>

                <button
                    className="edit-profile-button"
                    onClick={() => setIsEditing(true)}
                >
                    Edit Information
                </button>
            </div>

            <div className="profile-information-card">

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
                        <p>{editedInfo.full_name}</p>
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
                            <option value="Faculty Professor">Faculty Professor</option>
                            <option value="Office Staff">Office Staff</option>
                        </select>
                    ) : (
                        <p>{editedInfo.position}</p>
                    )}
                </div>

            </div>

            {isEditing && (
                <div className="profile-edit-actions">
                    <button
                        className="save-profile-button"
                        onClick={handleSaveProfile}
                    >
                        Save Changes
                    </button>

                    <button
                        className="cancel-profile-button"
                        onClick={() => {
                            setEditedInfo({
                                full_name: user?.full_name || "",
                                position: user?.position || "",
                                email: user?.email || ""
                            });
                            setIsEditing(false);
                        }}
                    >
                        Cancel
                    </button>
                </div>
            )}

            <div className="profile-section-heading">
                <h2>Account Information</h2>
                <p>Your registered account information.</p>
            </div>

            <div className="profile-information-card">

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
                        <p>{editedInfo.email}</p>
                    )}
                </div>

                <div>
                    <label>Account Role</label>
                    <p>{user?.role}</p>
                </div>

            </div>

        </section>
    </>
    );
}

export default Personal;
