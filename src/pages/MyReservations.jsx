
import { useState, useEffect } from "react";
import "../style/MyReservations.css";

function MyReservations({ user }) {
    const [reservations, setReservations] = useState([]);
    const [loading, setLoading] = useState(true);
    const [selectedReservation, setSelectedReservation] = useState(null);
    const [reservationToCancel, setReservationToCancel] = useState(null);
    const [notification, setNotification] = useState(null);

    const showNotification = (type, message) => {
        setNotification({ type, message });

        setTimeout(() => {
            setNotification(null);
        }, 3000);
    };

    const fetchMyReservations = async () => {
        try {
            const response = await fetch("http://localhost:5000/api/reservations");

            if (!response.ok) {
                throw new Error("Failed to fetch reservations");
            }

            const data = await response.json();

            const myReservations = data.filter(
                (reservation) =>
                    String(reservation.user_id) === String(user.id)
            );

            setReservations(myReservations);
        } catch (error) {
            console.error("Error fetching reservations:", error);
        } finally {
            setLoading(false);
        }
    };

    const handleCancel = async (reservationId) => {

        try {
            const response = await fetch(
                `http://localhost:5000/api/reservations/${reservationId}/cancel`,
                {
                    method: "PUT",
                    headers: {
                        "Content-Type": "application/json",
                    },
                    body: JSON.stringify({
                        user_id: user.id,
                    }),
                }
            );

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.message || "Failed to cancel reservation.");
            }

            showNotification("success", "Reservation cancelled successfully!");

            await fetchMyReservations();

        } catch (error) {
            console.error("Cancellation error:", error);
            showNotification("error", error.message);
        }
    };

    useEffect(() => {
        fetchMyReservations();
    }, [user.id]);

    return (
        <div className="my-reservations">
            {notification && (
                <div className={`my-reservations-notification ${notification.type}`}>
                    {notification.message}
                </div>
            )}
            <h2>My Reservations</h2>
            <p>View and manage your facility reservations.</p>

            {loading ? (
                <p>Loading reservations...</p>
            ) : reservations.length === 0 ? (
                <p>You have no reservations yet.</p>
            ) : (
                <div className="my-reservations-table-container">
                    <table className="my-reservations-table">
                        <thead>
                            <tr>
                                <th>Facility</th>
                                <th>Date</th>
                                <th>Start Time</th>
                                <th>End Time</th>
                                <th>Purpose</th>
                                <th>Status</th>
                                <th>Action</th>
                            </tr>
                        </thead>

                        <tbody>
                            {reservations.map((reservation) => (
                                <tr key={reservation.id}>
                                    <td>{reservation.facility_name}</td>
                                    <td>
                                        {new Date(
                                            reservation.reservation_date
                                        ).toLocaleDateString("en-PH", {
                                            timeZone: "Asia/Manila",
                                            year: "numeric",
                                            month: "short",
                                            day: "numeric",
                                        })}
                                    </td>
                                    <td>{formatTime(reservation.start_time)}</td>
                                    <td>{formatTime(reservation.end_time)}</td>
                                    <td>{reservation.purpose}</td>
                                    <td>
                                        <span
                                            className={`my-reservation-status ${reservation.status}`}
                                        >
                                            {reservation.status}
                                        </span>
                                    </td>
                                    <td>
                                        <button
                                            className="user-view-reservation-btn"
                                            onClick={() => setSelectedReservation(reservation)}
                                        >
                                            View Details
                                        </button>

                                        {reservation.status === "approved" && (
                                            <button
                                                className="cancel-reservation-btn"
                                                onClick={() => setReservationToCancel(reservation)}
                                            >
                                                Cancel Reservation
                                            </button>
                                        )}
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            )}
            {selectedReservation && (
                <div className="reservation-details-overlay">
                    <div className="reservation-details-modal">
                        <div className="reservation-details-header">
                            <h2>Reservation Details</h2>

                            <button
                                className="close-details-btn"
                                onClick={() => setSelectedReservation(null)}
                            >
                                &times;
                            </button>
                        </div>

                        <div className="reservation-details-body">
                            <div className="details-item">
                                <label>Facility</label>
                                <p>{selectedReservation.facility_name}</p>
                            </div>

                            <div className="details-item">
                                <label>Location</label>
                                <p>{selectedReservation.location || "Not specified"}</p>
                            </div>

                            <div className="details-item">
                                <label>Reservation Date</label>
                                <p>
                                    {new Date(
                                        selectedReservation.reservation_date
                                    ).toLocaleDateString("en-PH", {
                                        timeZone: "Asia/Manila",
                                        year: "numeric",
                                        month: "long",
                                        day: "numeric",
                                    })}
                                </p>
                            </div>

                            <div className="details-item">
                                <label>Starting Time</label>
                                <p>{formatTime(selectedReservation.start_time)}</p>
                            </div>

                            <div className="details-item">
                                <label>Ending Time</label>
                                <p>{formatTime(selectedReservation.end_time)}</p>
                            </div>

                            <div className="details-item">
                                <label>Purpose</label>
                                <p>{selectedReservation.purpose}</p>
                            </div>

                            <div className="details-item">
                                <label>Status</label>
                                <span className={`my-reservation-status ${selectedReservation.status}`}>
                                    {selectedReservation.status}
                                </span>
                            </div>

                            <div className="details-item">
                                <label>Date Submitted</label>
                                <p>
                                    {selectedReservation.created_at
                                        ? new Date(selectedReservation.created_at).toLocaleString("en-PH", {
                                            timeZone: "Asia/Manila",
                                            dateStyle: "medium",
                                            timeStyle: "short",
                                        })
                                        : "Not available"}
                                </p>
                            </div>
                        </div>

                        <div className="reservation-details-footer">
                            <button
                                onClick={() => setSelectedReservation(null)}
                            >
                                Close
                            </button>
                        </div>
                    </div>
                </div>
            )}
            {reservationToCancel && (
                <div className="my-cancel-confirm-overlay">
                    <div className="my-cancel-confirm-modal">
                        <h2>Cancel Reservation?</h2>

                        <p>
                            Are you sure you want to cancel your reservation for
                            <strong> {reservationToCancel.facility_name}</strong>?
                        </p>

                        <div className="my-cancel-confirm-actions">
                            <button
                                className="my-cancel-no-btn"
                                onClick={() => setReservationToCancel(null)}
                            >
                                No, Keep Reservation
                            </button>

                            <button
                                className="my-cancel-yes-btn"
                                onClick={() => {
                                    const reservationId = reservationToCancel.id;
                                    setReservationToCancel(null);
                                    handleCancel(reservationId);
                                }}
                            >
                                Yes, Cancel Reservation
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}

function formatTime(time) {
    if (!time) return "";

    const [hours, minutes] = time.split(":");
    const date = new Date();
    date.setHours(Number(hours), Number(minutes), 0);

    return date.toLocaleTimeString("en-US", {
        hour: "numeric",
        minute: "2-digit",
        hour12: true,
    });
}

export default MyReservations;
