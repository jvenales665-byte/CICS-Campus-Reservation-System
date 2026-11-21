import { useState, useEffect } from "react";
import "../style/PendingUsers.css";

function PendingUsers() {

    const [pendingUsers, setPendingUsers] = useState([]);
    const [notification, setNotification] = useState(null);
    const [rejectUserId, setRejectUserId] = useState(null);

    useEffect(() => {
    fetch("http://localhost:5000/admin/pending-users")
        .then((response) => response.json())
        .then((data) => setPendingUsers(data))
        .catch((error) => console.error("Error fetching pending users:", error));
    }, []);

    useEffect(() => {
        if (notification) {
            const timer = setTimeout(() => {
                setNotification(null);
            }, 3000);

            return () => clearTimeout(timer);
        }
    }, [notification]);

    const handleApprove = async (userId) => {
            try {
                const response = await fetch(
                    `http://localhost:5000/admin/approve-user/${userId}`,
                    {
                        method: "PUT"
                    }
                );

                const data = await response.json();

                if (response.ok) {
                    setNotification({
                        type: "success",
                        message: "User approved successfully!"
                    });
                    setPendingUsers((prevUsers) =>
                        prevUsers.filter((user) => user.id !== userId)
                    );
                } else {
                    setNotification({
                        type: "error",
                        message: data.message
                    });
                }
            } catch (error) {
                console.error("Approval error:", error);
                setNotification({
                    type: "error",
                    message: "Unable to approve user."
                });
            }
    };

    const handleReject = (userId) => {
            setRejectUserId(userId);
    };

    const handleConfirmReject = async () => {
        try {
            const response = await fetch(
                `http://localhost:5000/admin/reject-user/${rejectUserId}`,
                {
                    method: "PUT"
                }
            );

            const data = await response.json();

            if (response.ok) {
                setNotification({
                    type: "success",
                    message: "User rejected successfully!"
                });

                setPendingUsers((prevUsers) =>
                    prevUsers.filter((user) => user.id !== rejectUserId)
                );

                setRejectUserId(null);
            } else {
                setNotification({
                    type: "error",
                    message: data.message
                });
            }
        } catch (error) {
            console.error("Rejection error:", error);

            setNotification({
                type: "error",
                message: "Unable to reject user."
            });
        }
    };

    return (
        <div className="pending-applications">
            <h2>Pending Applications</h2>

            {pendingUsers.length === 0 ? (
                <p>No pending applications.</p>
            ) : (
                pendingUsers.map((user) => (
                <div key={user.id} className="pending-user">

                    <div className="pending-user-info">
                        <h3>{user.full_name}</h3>
                        <p>Position: {user.position}</p>
                        <p>Email: {user.email}</p>

                        <div className="application-actions">
                            <button onClick={() => handleApprove(user.id)}>
                                Approve
                            </button>

                            <button onClick={() => handleReject(user.id)}>
                                Reject
                            </button>
                        </div>
                    </div>

                    <div className="pending-user-id">
                        <img
                            src={`http://localhost:5000/uploads/${user.id_picture}`}
                            alt="Uploaded CICS ID"
                            width="200"
                        />
                    </div>

                </div>
                ))
            )}

            {rejectUserId !== null && (
                <div className="confirmation-overlay">
                    <div className="confirmation-modal">
                        <h3>Confirm Rejection</h3>
                        <p>Are you sure you want to reject this application?</p>

                        <div className="confirmation-actions">
                            <button onClick={() => setRejectUserId(null)}>
                                Cancel
                            </button>

                            <button onClick={handleConfirmReject}>
                                Yes, Reject
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {notification && (
                <div className={`notification-popup ${notification.type}`}>
                    <p>{notification.message}</p>
                    <button onClick={() => setNotification(null)}>
                        OK
                    </button>
                </div>
            )}
        </div>
    );

}

export default PendingUsers;