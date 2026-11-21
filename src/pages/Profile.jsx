import { useState, useEffect } from "react";
import "../style/Profile.css";
import Personal from "./Personal";
import AccountSettings from "./AccountSettings";

function Profile({ user, onNavigate }) {

    const [displayUser, setDisplayUser] = useState(user);

    const [profilePicture, setProfilePicture] = useState(
        user?.profile_picture || null
    );

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

    const [activeSection, setActiveSection] = useState("Personal");

    const [selectedPicture, setSelectedPicture] = useState(null);

    const [previewPicture, setPreviewPicture] = useState(null);

    useEffect(() => {
        if (!selectedPicture) {
            setPreviewPicture(null);
            return;
        }

        const objectUrl = URL.createObjectURL(selectedPicture);
        setPreviewPicture(objectUrl);

        return () => URL.revokeObjectURL(objectUrl);
    }, [selectedPicture]);

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

            const responseText = await response.text();
            console.log("Server response:", responseText);
            const data = JSON.parse(responseText);

            if (response.ok) {
                setProfilePicture(data.profile_picture);
                setSelectedPicture(null);
                showNotification("success", "Profile picture updated successfully!");
            } else {
                showNotification("error", data.message);
            }
        } catch (error) {
            console.error("Profile picture upload error:", error);
            showNotification("error", "Unable to upload profile picture: " + error.message);
        }
    };


    return (
        <div className="profile-page">

            <aside className="profile-sidebar">
                <h2>CICS</h2>
                <p>Campus Reservation System</p>

                <div className="profile-sidebar-menu">

                    <button
                        className={activeSection === "Overview" ? "active" : ""}
                        onClick={() => setActiveSection("Overview")}
                    >
                        My Profile
                    </button>

                    <button
                        className={activeSection === "Personal" ? "active" : ""}
                        onClick={() => setActiveSection("Personal")}
                    >
                        Personal Information
                    </button>

                    <button
                        className={activeSection === "Account" ? "active" : ""}
                        onClick={() => setActiveSection("Account")}
                    >
                        Account Settings
                    </button>

                </div>

                <button
                    className="back-dashboard"
                    onClick={() => onNavigate("admin")}
                >
                    Back to Dashboard
                </button>
            </aside>

            <main className="profile-main">

                  {notification && (
                      <div className={`profile-notification ${notification.type}`}>
                          {notification.message}
                      </div>
                  )}

                <div className="profile-header">
                    <h1>My Profile</h1>
                    <p>Manage your personal information and account details.</p>
                </div>

                <section className="profile-overview">

                    <div className="profile-picture">
                        {profilePicture ? (
                            <img
                                src={`http://localhost:5000/uploads/${profilePicture}`}
                                alt="Profile"
                            />
                        ) : (
                            <div className="default-profile-picture">
                                No Profile Picture
                            </div>
                        )}
                    </div>

                    <div className="profile-overview-info">
                        <h2>{displayUser?.full_name}</h2>
                        <p>{displayUser?.position}</p>
                        <span>{displayUser?.role}</span>
                    </div>

                    <label
                        htmlFor="profile-upload"
                        className="upload-profile-button"
                    >
                        Change Photo
                    </label>

                    <input
                        type="file"
                        id="profile-upload"
                        accept="image/*"
                        onChange={(e) => setSelectedPicture(e.target.files[0])}
                        style={{ display: "none" }}
                    />

                </section>

                {selectedPicture && (
                    <div className="selected-picture-preview">
                        <p>Selected Picture:</p>

                        <img
                            src={previewPicture}
                            alt="Selected Profile Preview"
                        />

                        <button onClick={handlePictureUpload}>
                            Upload Picture
                        </button>
                    </div>
                )}

            {activeSection === "Overview" && (
                <section className="profile-information">
                    <div className="profile-section-heading">
                        <h2>Profile Overview</h2>
                        <p>Welcome to your CICS account profile.</p>
                    </div>
                </section>
            )}

            {activeSection === "Personal" && (
                <Personal
                    user={displayUser}
                    setDisplayUser={setDisplayUser}
                />
            )}

            {activeSection === "Account" && (
                <AccountSettings user={user} />
            )}

            </main>
        </div>
    );

}

export default Profile;