import { useState, useEffect } from "react";
import "../style/Facilities.css";

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

function Facilities() {
    const [showForm, setShowForm] = useState(false);
    const [facilityName, setFacilityName] = useState("");
    const [description, setDescription] = useState("");
    const [location, setLocation] = useState("");
    const [openingTime, setOpeningTime] = useState("");
    const [closingTime, setClosingTime] = useState("");
    const [facilityImage, setFacilityImage] = useState(null);
    const [facilities, setFacilities] = useState([]);
    const [editingFacility, setEditingFacility] = useState(null);
    const [notification, setNotification] = useState(null);
    const [facilityToDelete, setFacilityToDelete] = useState(null);
    const [isDeleting, setIsDeleting] = useState(false);

    const showNotification = (type, message) => {
        setNotification({ type, message });

        setTimeout(() => {
            setNotification(null);
        }, 3000);
    };

    const fetchFacilities = async () => {
        try {
            const response = await fetch("http://localhost:5000/api/facilities");
            const data = await response.json();

            if (response.ok) {
                setFacilities(data);
            } else {
                console.error("Failed to retrieve facilities:", data.message);
            }
        } catch (error) {
            console.error("Fetch facilities error:", error);
        }
    };

    const handleEdit = (facility) => {
        setEditingFacility(facility);
        setFacilityName(facility.facility_name);
        setDescription(facility.description || "");
        setLocation(facility.location || "");
        setOpeningTime(facility.opening_time?.slice(0, 5) || "");
        setClosingTime(facility.closing_time?.slice(0, 5) || "");
        setFacilityImage(null);
        setShowForm(true);
    };

    const handleDelete = (facility) => {
        setFacilityToDelete(facility);
    };

    const confirmDelete = async () => {
        if (!facilityToDelete || isDeleting) return;

        setIsDeleting(true);

        try {
            const response = await fetch(
                `http://localhost:5000/api/facilities/${facilityToDelete.id}`,
                {
                    method: "DELETE"
                }
            );

            const data = await response.json();

            if (response.ok) {
                showNotification("success", data.message);
                fetchFacilities();
                setFacilityToDelete(null);
            } else {
                showNotification("error", data.message);
            }
        } catch (error) {
            console.error("Delete facility error:", error);
            showNotification("error", "Unable to connect to the server.");
        } finally {
            setIsDeleting(false);
        }
    };

    useEffect(() => {
        fetchFacilities();
    }, []);

    const handleSubmit = async (e) => {
        e.preventDefault();

        const formData = new FormData();

        formData.append("facility_name", facilityName);
        formData.append("description", description);
        formData.append("location", location);
        formData.append("opening_time", openingTime);
        formData.append("closing_time", closingTime);

        if (facilityImage) {
            formData.append("image", facilityImage);
        }

        try {
            const response = await fetch(
                editingFacility
                    ? `http://localhost:5000/api/facilities/${editingFacility.id}`
                    : "http://localhost:5000/api/facilities",
                {
                    method: editingFacility ? "PUT" : "POST",
                    body: formData
                }
            );

            const data = await response.json();

            if (response.ok) {
                showNotification(
                    "success",
                    editingFacility
                        ? "Facility updated successfully!"
                        : "Facility added successfully!"
                );

                setFacilityName("");
                setDescription("");
                setLocation("");
                setOpeningTime("");
                setClosingTime("");
                setFacilityImage(null);
                setEditingFacility(null);

                setShowForm(false);

                fetchFacilities();
            } else {
                showNotification("error", data.message || "Failed to add facility.");
            }

        } catch (error) {
            console.error("Add facility error:", error);
            showNotification("error", "Unable to connect to the server.");
        }
    };

    return (

        <div className="facilities-container">

            {facilityToDelete && (
                <div className="delete-modal-overlay">
                    <div className="delete-modal">
                        <h2>Delete Facility?</h2>

                        <p>
                            Are you sure you want to delete
                            <strong> {facilityToDelete.facility_name}</strong>?
                        </p>

                        <div className="delete-modal-buttons">
                            <button
                                className="cancel-delete-btn"
                                onClick={() => setFacilityToDelete(null)}
                            >
                                Cancel
                            </button>

                            <button
                                className="confirm-delete-btn"
                                onClick={confirmDelete}
                                disabled={isDeleting}
                            >
                                {isDeleting ? "Deleting..." : "Delete"}
                            </button>

                        </div>
                    </div>
                </div>
            )}

            {notification && (
                <div className={`profile-notification ${notification.type}`}>
                    {notification.message}
                </div>
            )}

            <h1>Facilities Management</h1>
            <p>Manage campus facilities and their availability.</p>

            <button
                className="add-facility-btn"
                onClick={() => setShowForm(!showForm)}
            >
                + Add Facility
            </button>

            {showForm && (
                <form className="facility-form" onSubmit={handleSubmit}>
                    <h2>{editingFacility ? "Edit Facility" : "Add New Facility"}</h2>

                    <div className="facility-form-group">
                        <label>Facility Name</label>
                        <input
                            type="text"
                            placeholder="Enter facility name"
                            value={facilityName}
                            onChange={(e) => setFacilityName(e.target.value)}
                        />
                    </div>

                    <div className="facility-form-group">
                        <label>Description</label>
                        <textarea
                            placeholder="Enter facility description"
                            rows="3"
                            value={description}
                            onChange={(e) => setDescription(e.target.value)}
                        />
                    </div>

                    <div className="facility-form-group">
                        <label>Location</label>
                        <input
                            type="text"
                            placeholder="Enter facility location"
                            value={location}
                            onChange={(e) => setLocation(e.target.value)}
                        />
                    </div>

                    <div className="facility-form-group">
                        <label>Facility Image</label>
                        <input
                            type="file"
                            accept="image/*"
                            onChange={(e) => setFacilityImage(e.target.files[0])}
                        />
                        <small>Upload an image of the facility.</small>
                    </div>

                    <div className="facility-form-group">
                        <label>Opening Time</label>
                        <input
                            type="time"
                            value={openingTime}
                            onChange={(e) => setOpeningTime(e.target.value)}
                        />
                    </div>

                    <div className="facility-form-group">
                        <label>Closing Time</label>
                        <input
                            type="time"
                            value={closingTime}
                            onChange={(e) => setClosingTime(e.target.value)}
                        />
                    </div>

                    <div className="facility-form-buttons">
                        <button type="submit" className="save-facility-btn">
                            {editingFacility ? "Update Facility" : "Save Facility"}
                        </button>

                        <button
                            type="button"
                            className="cancel-facility-btn"
                            onClick={() => {
                                setShowForm(false);
                                setEditingFacility(null);
                            }}
                        >
                            Cancel
                        </button>
                    </div>

                </form>
            )}

            <div className="facilities-list">
                {facilities.map((facility) => (
                    <div className="facility-card" key={facility.id}>
                        <img
                            src={`http://localhost:5000/uploads/${facility.image}`}
                            alt={facility.facility_name}
                        />

                        <h3>{facility.facility_name}</h3>
                        <p>{facility.description}</p>
                        <p>Location: {facility.location}</p>
                        <p>
                            Operating Hours: {formatTime(facility.opening_time)} - {formatTime(facility.closing_time)}
                        </p>
                        <button
                            className="edit-facility-btn"
                            onClick={() => handleEdit(facility)}
                        >
                            Edit
                        </button>
                        
                        <button
                            className="delete-facility-btn"
                            onClick={() => handleDelete(facility)}
                        >
                            Delete
                        </button>
                    </div>
                ))}
            </div>

        </div>
    );
}

export default Facilities;