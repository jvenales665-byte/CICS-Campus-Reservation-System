
import { useState, useEffect } from "react";
import "../style/UserDash.css";
import MakeReservation from "./MakeReservation";
import MyReservations from "./MyReservations";
import UserProfile from "./UserProfile";

function UserDash({ user, onLogout }) {
    const [activeSection, setActiveSection] = useState("Dashboard");
    const [currentUser, setCurrentUser] = useState(user);
    const [reservations, setReservations] = useState([]);

    useEffect(() => {
        setCurrentUser(user);
    }, [user]);

    useEffect(() => {
        const fetchReservations = async () => {
            try {
                const response = await fetch(
                    "http://localhost:5000/api/reservations"
                );

                if (!response.ok) {
                    throw new Error("Failed to fetch reservations.");
                }

                const data = await response.json();

                const userReservations = data.filter(
                    reservation =>
                        String(reservation.user_id) === String(user?.id)
                );

                setReservations(userReservations);
            } catch (error) {
                console.error("Dashboard reservation error:", error);
            }
        };

        if (user?.id) {
            fetchReservations();
        }
    }, [user?.id]);

    const totalReservations = reservations.length;

    const pendingReservations = reservations.filter(
        reservation => reservation.status?.toLowerCase() === "pending"
    ).length;

    const approvedReservations = reservations.filter(
        reservation => reservation.status?.toLowerCase() === "approved"
    ).length;

    const rejectedReservations = reservations.filter(
        reservation => reservation.status?.toLowerCase() === "rejected"
    ).length;

    return (
        <div className="user-dashboard">
            <aside className="user-sidebar">
                <h2>CICS Reservation</h2>

                {/* USER SIDEBAR PROFILE */}
                <div className="user-dashboard-sidebar-profile">
                    {currentUser?.profile_picture ? (
                        <img
                            src={`http://localhost:5000/uploads/${currentUser.profile_picture}`}
                            alt="User Profile"
                        />
                    ) : (
                        <div className="user-dashboard-sidebar-default-picture">
                            {currentUser?.full_name?.charAt(0) || "U"}
                        </div>
                    )}

                    <div className="user-dashboard-sidebar-profile-info">
                        <h3>{currentUser?.full_name}</h3>
                        <p>{currentUser?.position}</p>
                        <span>{currentUser?.role}</span>
                    </div>
                </div>

                <nav>
                    <button onClick={() => setActiveSection("Dashboard")}>
                        Dashboard
                    </button>

                    <button onClick={() => setActiveSection("Make Reservation")}>
                        Make a Reservation
                    </button>

                    <button onClick={() => setActiveSection("My Reservations")}>
                        My Reservations
                    </button>

                    <button onClick={() => setActiveSection("My Profile")}>
                        My Profile
                    </button>
                </nav>

                <button onClick={onLogout}>Logout</button>
            </aside>

            <main className="user-main-content">
                {activeSection === "Dashboard" && (
                    <div className="user-dashboard-overview">
                        <div className="user-dashboard-welcome">
                            <div>
                                <h1>
                                    Welcome, {currentUser?.full_name || "User"}!
                                </h1>
                                <p>
                                    {currentUser?.position || "Campus Member"}
                                </p>
                            </div>
                        </div>

                        <div className="user-dashboard-cards">
                            <div className="user-dashboard-card">
                                <h3>Total Reservations</h3>
                                <h2>{totalReservations}</h2>
                                <p>All your reservation requests</p>
                            </div>

                            <div className="user-dashboard-card">
                                <h3>Pending</h3>
                                <h2>{pendingReservations}</h2>
                                <p>Awaiting approval</p>
                            </div>

                            <div className="user-dashboard-card">
                                <h3>Approved</h3>
                                <h2>{approvedReservations}</h2>
                                <p>Approved reservations</p>
                            </div>

                            <div className="user-dashboard-card">
                                <h3>Rejected</h3>
                                <h2>{rejectedReservations}</h2>
                                <p>Rejected reservations</p>
                            </div>
                        </div>
                    </div>
                )}

                {activeSection === "Make Reservation" && (
                    <MakeReservation user={currentUser} />
                )}

                {activeSection === "My Reservations" && (
                    <MyReservations user={currentUser} />
                )}

                {activeSection === "My Profile" && (
                    <UserProfile
                        user={currentUser}
                        onUserUpdate={setCurrentUser}
                    />
                )}
            </main>
        </div>
    );
}

export default UserDash;
