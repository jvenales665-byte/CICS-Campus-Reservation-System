import { useState, useEffect } from "react";
import "../style/MakeReservation.css";

const formatTime = (time) => {
    if (!time) return "";

    const [hours, minutes] = time.slice(0, 5).split(":");
    const date = new Date();
    date.setHours(Number(hours), Number(minutes));

    return date.toLocaleTimeString("en-US", {
        hour: "numeric",
        minute: "2-digit",
        hour12: true
    });
};

function MakeReservation({ user }) {
    const [facilities, setFacilities] = useState([]);
    const [selectedFacility, setSelectedFacility] = useState("");
    const [showFacilityDetails, setShowFacilityDetails] = useState(false);
    const [showReservationForm, setShowReservationForm] = useState(false);
    const [reservationDate, setReservationDate] = useState("");
    const [startTime, setStartTime] = useState("");
    const [endTime, setEndTime] = useState("");
    const [purpose, setPurpose] = useState("");
    const [occupiedSlots, setOccupiedSlots] = useState([]);
    const [notification, setNotification] = useState(null);

    const showNotification = (type, message) => {
        setNotification({ type, message });

        setTimeout(() => {
            setNotification(null);
        }, 3000);
    };

    const handleSubmitReservation = async () => {
        if (!user?.id) {
            showNotification("error", "Unable to identify the logged-in user. Please log in again.");
            return;
        }

        try {
            const response = await fetch(
                "http://localhost:5000/api/reservations",
                {
                    method: "POST",
                    headers: {
                        "Content-Type": "application/json"
                    },
                    body: JSON.stringify({
                        user_id: user.id,
                        facility_id: selectedFacility,
                        reservation_date: reservationDate,
                        start_time: startTime,
                        end_time: endTime,
                        purpose: purpose
                    })
                }
            );

            const data = await response.json();

            if (!response.ok) {
                showNotification("error", data.message || "Failed to submit reservation.");
                return;
            }

            showNotification("success", "Reservation submitted successfully!");

            setShowReservationForm(false);
            setReservationDate("");
            setStartTime("");
            setEndTime("");
            setPurpose("");
            setOccupiedSlots([]);

        } catch (error) {
            console.error("Submit reservation error:", error);
            showNotification("error", "Unable to connect to the server. Please try again.");
        }
    };

    const selectedFacilityData = facilities.find(
        (facility) => String(facility.id) === String(selectedFacility)
    );

    const isOutsideOperatingHours =
        selectedFacilityData &&
        startTime &&
        endTime &&
        (
            startTime < selectedFacilityData.opening_time?.slice(0, 5) ||
            endTime > selectedFacilityData.closing_time?.slice(0, 5)
        );

    const hasTimeConflict = occupiedSlots.some((slot) => {
        return (
            startTime < slot.end_time.slice(0, 5) &&
            endTime > slot.start_time.slice(0, 5)
        );
    });

    useEffect(() => {
        const fetchFacilities = async () => {
            try {
                const response = await fetch(
                    "http://localhost:5000/api/facilities"
                );

                const data = await response.json();

                if (response.ok) {
                    setFacilities(data);
                }
            } catch (error) {
                console.error("Failed to fetch facilities:", error);
            }
        };

        fetchFacilities();
    }, []);

    useEffect(() => {
        let isCurrent = true;

        const fetchOccupiedSlots = async () => {
            if (!selectedFacility || !reservationDate) {
                setOccupiedSlots([]);
                return;
            }

            setOccupiedSlots([]);

            try {
                const response = await fetch(
                    "http://localhost:5000/api/reservations"
                );

                const data = await response.json();

                if (response.ok && isCurrent) {
                    const approvedReservations = data.filter((reservation) =>
                        String(reservation.facility_id) === String(selectedFacility) &&
                        new Date(reservation.reservation_date).toLocaleDateString("en-CA", {
                            timeZone: "Asia/Manila"
                        }) === reservationDate &&
                        ["pending", "approved"].includes(reservation.status)
                    );

                    setOccupiedSlots(approvedReservations);
                }
            } catch (error) {
                console.error("Failed to fetch occupied slots:", error);
            }
        };

        fetchOccupiedSlots();

        return () => {
            isCurrent = false;
        };
    }, [selectedFacility, reservationDate]);

    return (
        <div className="make-reservation-container">

            {notification && (
                <div className={`custom-notification ${notification.type}`}>
                    {notification.message}
                </div>
            )}

            <h1>Make a Reservation</h1>
            <p>Choose a campus facility and check its availability.</p>

            <div className="facility-selection">
                <h2>Select a Facility</h2>

                <div className="facility-card-grid">
                    {facilities.map((facility) => (
                        <button
                            type="button"
                            key={facility.id}
                            className={`facility-card ${
                                String(selectedFacility) === String(facility.id)
                                    ? "selected"
                                    : ""
                            }`}
                            onClick={() => {
                                setSelectedFacility(String(facility.id));
                                setShowFacilityDetails(true);
                            }}
                        >
                            {facility.image && (
                                <img
                                    src={
                                        facility.image.startsWith("http")
                                            ? facility.image
                                            : facility.image.startsWith("/")
                                                ? `http://localhost:5000${facility.image}`
                                                : `http://localhost:5000/uploads/${facility.image}`
                                    }
                                    alt={facility.facility_name}
                                />
                            )}

                            <h3>{facility.facility_name}</h3>

                            <p>{facility.location}</p>

                            <span>
                                {facility.status === "available"
                                    ? "Available"
                                    : "Unavailable"}
                            </span>
                        </button>
                    ))}
                </div>
            </div>

            {showReservationForm && selectedFacility && (
                <div className="make-reservation-overlay">
                    <div className="make-reservation-modal">

                        <button
                            type="button"
                            className="modal-close-btn"
                            onClick={() => setShowReservationForm(false)}
                        >
                            &times;
                        </button>

                        <h2>Reservation Details</h2>
                        <p>Choose your preferred reservation date and time.</p>

                        <div className="reservation-form-group">
                            <label>Purpose of Reservation</label>
                            <textarea
                                value={purpose}
                                onChange={(e) => setPurpose(e.target.value)}
                                placeholder="Enter the purpose of your reservation..."
                                rows="3"
                            />
                        </div>

                        <div className="reservation-form-group">
                            <label>Start Time</label>
                            <input
                                type="time"
                                value={startTime}
                                onChange={(e) => setStartTime(e.target.value)}
                            />
                        </div>

                        <div className="reservation-form-group">
                            <label>End Time</label>
                            <input
                                type="time"
                                value={endTime}
                                onChange={(e) => setEndTime(e.target.value)}
                            />
                        </div>

                        {hasTimeConflict && (
                            <p className="reservation-conflict-message">
                                This time slot is already occupied. Please choose another time.
                            </p>
                        )}

                        {isOutsideOperatingHours && (
                            <p className="reservation-conflict-message">
                                Your selected time is outside this facility's operating hours.
                                Please choose a time within the operating schedule.
                            </p>
                        )}

                        <div className="reservation-form-group">
                            <label>Select Reservation Date</label>

                            <input
                                type="date"
                                value={reservationDate}
                                min={new Date().toLocaleDateString("en-CA", {
                                    timeZone: "Asia/Manila"
                                })}
                                onChange={(e) => setReservationDate(e.target.value)}
                            />
                        </div>

                        {reservationDate && (
                            <div className="occupied-slots">
                                <h3>Occupied Time Slots</h3>

                                {occupiedSlots.length > 0 ? (
                                    occupiedSlots.map((slot) => (
                                        <div className="occupied-slot" key={slot.id}>
                                            <span>
                                                {formatTime(slot.start_time)} - {formatTime(slot.end_time)}
                                            </span>
                                            <span className="occupied-label">Occupied</span>
                                        </div>
                                    ))
                                ) : (
                                    <p>No approved reservations for this date.</p>
                                )}

                                {startTime && endTime && startTime < endTime && (
                                    <div className="selected-time-status">
                                        <h4>Your Selected Time</h4>

                                        <div className="selected-time-row">
                                            <span>
                                                {formatTime(startTime)} - {formatTime(endTime)}
                                            </span>

                                            {hasTimeConflict ? (
                                                <span className="conflict-label">Conflict</span>
                                            ) : (
                                                <span className="available-label">Available</span>
                                            )}
                                        </div>
                                    </div>
                                )}
                            </div>
                        )}
                        
                        <div className="reservation-modal-actions">
                            <button
                                type="button"
                                className="submit-reservation-btn"
                                onClick={handleSubmitReservation}
                                disabled={
                                    !purpose.trim() ||
                                    !reservationDate ||
                                    !startTime ||
                                    !endTime ||
                                    hasTimeConflict ||
                                    isOutsideOperatingHours
                                }
                            >
                                Submit Reservation
                            </button>
                        </div>

                    </div>

                </div>
            )}

            {showFacilityDetails && selectedFacilityData && (
                <div className="facility-details-overlay">
                    <div className="facility-details-modal">
                        <h2>{selectedFacilityData.facility_name}</h2>

                        {selectedFacilityData.image && (
                            <img
                                src={
                                    selectedFacilityData.image.startsWith("http")
                                        ? selectedFacilityData.image
                                        : selectedFacilityData.image.startsWith("/")
                                            ? `http://localhost:5000${selectedFacilityData.image}`
                                            : `http://localhost:5000/uploads/${selectedFacilityData.image}`
                                }
                                alt={selectedFacilityData.facility_name}
                            />
                        )}

                        <p><strong>Location:</strong> {selectedFacilityData.location}</p>

                        <p><strong>Description:</strong> {selectedFacilityData.description}</p>

                        <p>
                            <strong>Opening Time:</strong>{" "}
                            {formatTime(selectedFacilityData.opening_time)}
                        </p>

                        <p>
                            <strong>Closing Time:</strong>{" "}
                            {formatTime(selectedFacilityData.closing_time)}
                        </p>

                        <button
                            onClick={() => setShowFacilityDetails(false)}
                        >
                            Close
                        </button>

                        <button
                            onClick={() => {
                                setShowFacilityDetails(false);
                                setShowReservationForm(true);
                            }}
                        >
                            Make a Reservation
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
}

export default MakeReservation;