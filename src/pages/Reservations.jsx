import { useState, useEffect } from "react";
import "../style/Reservations.css";

const formatTime = (time) => {
    if (!time) return "";

    const [hours, minutes] = String(time).slice(0, 5).split(":");
    const date = new Date();

    date.setHours(Number(hours), Number(minutes));

    return date.toLocaleTimeString("en-US", {
        hour: "numeric",
        minute: "2-digit",
        hour12: true
    });
};

function Reservations() {
    const [reservations, setReservations] = useState([]);
    const [searchTerm, setSearchTerm] = useState("");
    const [statusFilter, setStatusFilter] = useState("All");
    const [selectedReservation, setSelectedReservation] = useState(null);
    const [notification, setNotification] = useState(null);
    const [isProcessing, setIsProcessing] = useState(false);
    const [confirmationAction, setConfirmationAction] = useState(null);

    const showNotification = (type, message) => {
        setNotification({ type, message });

        setTimeout(() => {
            setNotification(null);
        }, 3000);
    };

    const handleReservationAction = async (action) => {
        if (isProcessing) return;

        setIsProcessing(true);

        try {
            const response = await fetch(
                `http://localhost:5000/api/reservations/${selectedReservation.id}/${action}`,
                {
                    method: "PUT"
                }
            );

            const data = await response.json();

            if (response.ok) {
                const updatedReservation = {
                    ...selectedReservation,
                    status: action === "approve" ? "approved" : "rejected"
                };

                setReservations((prev) =>
                    prev.map((reservation) =>
                        reservation.id === selectedReservation.id
                            ? { ...reservation, status: updatedReservation.status }
                            : reservation
                    )
                );

                setSelectedReservation(updatedReservation);
                showNotification("success", data.message);
            } else {
                showNotification("error", data.message);
            }
        } catch (error) {
            console.error("Reservation action error:", error);
            showNotification("error", "Unable to connect to the server.");
        } finally {
            setIsProcessing(false);
        }
    };

    useEffect(() => {
        const fetchReservations = async () => {
            try {
                const response = await fetch(
                    "http://localhost:5000/api/reservations"
                );

                const data = await response.json();

                if (response.ok) {
                    setReservations(data);
                }
            } catch (error) {
                console.error("Failed to fetch reservations:", error);
            }
        };

        fetchReservations();
    }, []);

    const filteredReservations = reservations.filter((reservation) => {
        const search = searchTerm.toLowerCase();

        const matchesSearch =
            reservation.full_name?.toLowerCase().includes(search) ||
            reservation.facility_name?.toLowerCase().includes(search) ||
            reservation.purpose?.toLowerCase().includes(search);

        const matchesStatus =
            statusFilter === "All" ||
            reservation.status === statusFilter.toLowerCase();

        return matchesSearch && matchesStatus;
    });

    return (
        <div className="reservations-container">

            {notification && (
                <div className={`profile-notification ${notification.type}`}>
                    {notification.message}
                </div>
            )}

            <h1>Reservations Management</h1>
            <p>Manage and monitor campus reservation requests.</p>

            <p>Total Reservations: {reservations.length}</p>

            <div className="reservations-search">
                <input
                    type="text"
                    placeholder="Search by requester, facility, or purpose..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                />
            </div>

            <div className="reservation-filters">
                {["All", "Pending", "Approved", "Rejected", "Cancelled"].map((status) => (
                    <button
                        key={status}
                        className={statusFilter === status ? "active" : ""}
                        onClick={() => setStatusFilter(status)}
                    >
                        {status}
                    </button>
                ))}
            </div>

            <div className="reservations-table-container">
                <table className="reservations-table">
                    <thead>
                        <tr>
                            <th>ID</th>
                            <th>Requester</th>
                            <th>Position</th>
                            <th>Facility</th>
                            <th>Date</th>
                            <th>Time</th>
                            <th>Purpose</th>
                            <th>Status</th>
                            <th>Action</th>
                        </tr>
                    </thead>

                    <tbody>
                        {filteredReservations.length > 0 ? (
                            filteredReservations.map((reservation) => (
                                <tr key={reservation.id}>
                                    <td>{reservation.id}</td>
                                    <td>{reservation.full_name}</td>
                                    <td>{reservation.position}</td>
                                    <td>{reservation.facility_name}</td>
                                    <td>{reservation.reservation_date}</td>
                                    <td>
                                        {formatTime(reservation.start_time)} - {formatTime(reservation.end_time)}
                                    </td>
                                    <td>{reservation.purpose}</td>
                                    <td>
                                        <span className={`reservation-status ${reservation.status}`}>
                                            {reservation.status}
                                        </span>
                                    </td>
                                    <td>
                                        <button
                                            className="view-reservation-btn"
                                            onClick={() => setSelectedReservation(reservation)}
                                        >
                                            View Details
                                        </button>
                                    </td>
                                </tr>
                            ))
                        ) : (
                            <tr>
                                <td colSpan="9">
                                    {searchTerm
                                        ? "No matching reservations found."
                                        : "No reservation requests found."}
                                </td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>

            {selectedReservation && (
                <div className="reservation-modal-overlay">
                    <div className="reservation-modal">
                        <h2>Reservation Details</h2>
                        
                        <p><strong>Reservation ID:</strong> {selectedReservation.id}</p>
                        <p><strong>Requester:</strong> {selectedReservation.full_name}</p>
                        <p><strong>Position:</strong> {selectedReservation.position}</p>
                        <p><strong>Email:</strong> {selectedReservation.email}</p>
                        <p><strong>Facility:</strong> {selectedReservation.facility_name}</p>
                        <p><strong>Location:</strong> {selectedReservation.location}</p>
                        <p><strong>Date:</strong> {selectedReservation.reservation_date}</p>
                        <p>
                            <strong>Start Time:</strong> {formatTime(selectedReservation.start_time)}
                        </p>
                        <p>
                            <strong>End Time:</strong> {formatTime(selectedReservation.end_time)}
                        </p>
                        <p><strong>Purpose:</strong> {selectedReservation.purpose}</p>
                        <p><strong>Status:</strong> {selectedReservation.status}</p>
                        <p>
                            <strong>Submitted:</strong>{" "}
                            {new Date(selectedReservation.created_at).toLocaleString("en-US", {
                                year: "numeric",
                                month: "short",
                                day: "numeric",
                                hour: "numeric",
                                minute: "2-digit",
                                hour12: true,
                                timeZone: "Asia/Manila"
                            })}
                        </p>

                        <button
                            onClick={() => setSelectedReservation(null)}
                        >
                            Close
                        </button>

                        {selectedReservation.status === "pending" && (
                            <div className="reservation-action-buttons">
                                <button
                                    className="approve-reservation-btn"
                                    onClick={() => setConfirmationAction("approve")}
                                    disabled={isProcessing}
                                >
                                    {isProcessing ? "Processing..." : "Approve"}
                                </button>

                                <button
                                    className="reject-reservation-btn"
                                    onClick={() => setConfirmationAction("reject")}
                                    disabled={isProcessing}
                                >
                                    {isProcessing ? "Processing..." : "Reject"}
                                </button>
                            </div>
                        )}

                        {confirmationAction && (
                            <div className="reservation-confirmation">
                                <h3>
                                    Confirm {confirmationAction === "approve" ? "Approval" : "Rejection"}
                                </h3>

                                <p>
                                    Are you sure you want to {confirmationAction} this reservation?
                                </p>

                                <button
                                    onClick={() => setConfirmationAction(null)}
                                >
                                    Cancel
                                </button>

                                <button
                                    onClick={() => {
                                        handleReservationAction(confirmationAction);
                                        setConfirmationAction(null);
                                    }}
                                    disabled={isProcessing}
                                >
                                    Confirm
                                </button>
                            </div>
                        )}
                    </div>
                </div>
            )}
            
        </div>
    );
}

export default Reservations;