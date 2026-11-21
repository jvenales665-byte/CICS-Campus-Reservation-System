import "../style/AdminDash.css";
import { useState, useEffect } from "react";
import PendingUsers from "./PendingUsers";
import Facilities from "./Facilities";
import Reservations from "./Reservations";

function AdminDash({ adminUser, onNavigate }) {
    const [showProfile, setShowProfile] = useState(false);
    const [activeSection, setActiveSection] = useState("Dashboard");

    const [totalUsers, setTotalUsers] = useState(0);
    const [pendingUsers, setPendingUsers] = useState(0);

    useEffect(() => {
        const fetchTotalUsers = async () => {
            try {
                const response = await fetch(
                    "http://localhost:5000/api/dashboard/total-users"
                );

                const data = await response.json();

                if (response.ok) {
                    console.log("Total users received:", data.totalUsers);
                    setTotalUsers(data.totalUsers);
                    setPendingUsers(data.pendingUsers);
                }
            } catch (error) {
                console.error("Failed to fetch total users:", error);
            }
        };

        fetchTotalUsers();
    }, []);

  return (

    <div className="admin-dashboard">

        <aside className="admin-sidebar">
        <h2>CICS</h2>
            <p>ADMIN PANEL</p>

            <nav>

            <a
                href="#"
                className={activeSection === "Dashboard" ? "active" : ""}
                onClick={(e) => {
                    e.preventDefault();
                    setActiveSection("Dashboard");
                }}
            >
                Dashboard
            </a>

            <a
                href="#"
                className={activeSection === "Reservations" ? "active" : ""}
                onClick={(e) => {
                    e.preventDefault();
                    setActiveSection("Reservations");
                }}
            >
                Reservations
            </a>

            <a
                href="#"
                className={activeSection === "Facilities" ? "active" : ""}
                onClick={(e) => {
                    e.preventDefault();
                    setActiveSection("Facilities");
                }}
            >
                Facilities
            </a>

            <a
                href="#"
                className={activeSection === "Pending Users" ? "active" : ""}
                onClick={(e) => {
                    e.preventDefault();
                    setActiveSection("Pending Users");
                }}
            >
                Pending Users
            </a>

            </nav>

        </aside>

        <main className="admin-content">

            <header className="admin-header">
                <div>
                <h1>{activeSection}</h1>
                <p>Welcome, Administrator!</p>
                </div>

            <div
                className="admin-profile"
                onClick={() => setShowProfile(!showProfile)}
            >
                <span>{adminUser?.full_name || "Administrator"}</span>
                <span className="profile-arrow">▼</span>
            </div>

            {showProfile && (
            <div className="profile-dropdown">
                <p>{adminUser?.full_name}</p>

                <button
                onClick={() => {
                    setShowProfile(false);
                    onNavigate("profile");
                }}
                >
                My Profile
                </button>

                <button onClick={() => setShowProfile(false)}>
                Close Menu
                </button>

                <button
                    onClick={() => {
                        setShowProfile(false);
                        onNavigate("login");
                    }}
                >
                    Logout
                </button>
            </div>
            )}

            </header>

        
        {activeSection === "Dashboard" && (
            <div className="dashboard-cards">

                <div className="dashboard-card">
                    <h3>Total Reservations</h3>
                    <h2>0</h2>
                    <p>All reservation requests</p>
                </div>

                <div className="dashboard-card">
                    <h3>Total Facilities</h3>
                    <h2>0</h2>
                    <p>Registered campus facilities</p>
                </div>

                <div className="dashboard-card">
                    <h3>Total Users</h3>
                    <h2>{totalUsers}</h2>
                    <p>Registered accounts</p>
                </div>

                <div className="dashboard-card">
                    <h3>Pending Accounts</h3>
                    <h2>{pendingUsers}</h2>
                    <p>Awaiting approval</p>
                </div>

            </div>
        )}

        {activeSection === "Pending Users" && (
            <PendingUsers />
        )}

        {activeSection === "Facilities" && (
            <Facilities />
        )}

        {activeSection === "Reservations" && (
            <Reservations />
        )}

        </main>

    </div>
  );
}

export default AdminDash;