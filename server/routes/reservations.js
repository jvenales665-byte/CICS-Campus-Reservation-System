import express from "express";
import db from "../db.js";

const router = express.Router();

router.post("/", (req, res) => {
    const {
        user_id,
        facility_id,
        reservation_date,
        start_time,
        end_time,
        purpose
    } = req.body;

    // Check required fields
    if (
        !user_id ||
        !facility_id ||
        !reservation_date ||
        !start_time ||
        !end_time ||
        !purpose
    ) {
        return res.status(400).json({
            message: "Please complete all required fields."
        });
    }

    // Check if the starting time is before the ending time
    if (start_time >= end_time) {
        return res.status(400).json({
            message: "End time must be later than start time."
        });
    }

    // Get the selected facility's operating hours
    const facilitySql = `
        SELECT opening_time, closing_time
        FROM facilities
        WHERE id = ?
    `;

    db.query(facilitySql, [facility_id], (err, facilities) => {
        if (err) {
            return res.status(500).json({
                message: "Error checking facility operating hours."
            });
        }

        if (facilities.length === 0) {
            return res.status(404).json({
                message: "Facility not found."
            });
        }

        const openingTime = String(facilities[0].opening_time).slice(0, 5);
        const closingTime = String(facilities[0].closing_time).slice(0, 5);

        const requestedStart = String(start_time).slice(0, 5);
        const requestedEnd = String(end_time).slice(0, 5);

        // Check facility operating hours
        if (
            requestedStart < openingTime ||
            requestedEnd > closingTime
        ) {
            return res.status(400).json({
                message: `Reservations are only allowed between ${openingTime} and ${closingTime}.`
            });
        }

        const conflictSql = `
            SELECT id
            FROM reservations
            WHERE facility_id = ?
            AND reservation_date = ?
            AND status IN ('pending', 'approved')
            AND start_time < ?
            AND end_time > ?
        `;

        db.query(
            conflictSql,
            [facility_id, reservation_date, end_time, start_time],
            (err, conflicts) => {
                if (err) {
                    return res.status(500).json({
                        message: "Error checking reservation conflicts."
                    });
                }

                if (conflicts.length > 0) {
                    return res.status(409).json({
                        message: "This time slot is already reserved or occupied. Please choose another time."
                    });
                }
                
                const insertSql = `
                    INSERT INTO reservations
                    (user_id, facility_id, reservation_date, start_time, end_time, purpose, status)
                    VALUES (?, ?, ?, ?, ?, ?, 'pending')
                `;

                db.query(
                    insertSql,
                    [
                        user_id,
                        facility_id,
                        reservation_date,
                        start_time,
                        end_time,
                        purpose
                    ],
                    (err, result) => {
                        if (err) {
                            return res.status(500).json({
                                message: "Error creating reservation."
                            });
                        }

                        res.status(201).json({
                            message: "Reservation submitted successfully.",
                            reservationId: result.insertId
                        });
                    }
                );
            }
        );
    });
});

router.get("/", (req, res) => {
    const sql = `
        SELECT
            reservations.*,
            users.full_name,
            users.position,
            users.email,
            facilities.facility_name,
            facilities.location
        FROM reservations
        JOIN users ON reservations.user_id = users.id
        JOIN facilities ON reservations.facility_id = facilities.id
        ORDER BY reservations.created_at DESC
    `;

    db.query(sql, (err, results) => {
        if (err) {
            console.error("Fetch reservations error:", err);
            return res.status(500).json({
                message: "Failed to fetch reservations."
            });
        }

        res.json(results);
    });
});


router.put("/:id/approve", (req, res) => {
    const reservationId = req.params.id;

    const getReservationSql = `
        SELECT *
        FROM reservations
        WHERE id = ?
    `;

    db.query(getReservationSql, [reservationId], (err, results) => {
        if (err) {
            console.error("Get reservation error:", err);
            return res.status(500).json({
                message: "Failed to retrieve reservation."
            });
        }

        if (results.length === 0) {
            return res.status(404).json({
                message: "Reservation not found."
            });
        }

        const reservation = results[0];

        if (reservation.status !== "pending") {
            return res.status(400).json({
                message: "Only pending reservations can be approved."
            });
        }

        // Get the facility's operating hours
        const facilitySql = `
            SELECT opening_time, closing_time
            FROM facilities
            WHERE id = ?
        `;

        db.query(
            facilitySql,
            [reservation.facility_id],
            (err, facilities) => {
                if (err) {
                    console.error("Facility lookup error:", err);
                    return res.status(500).json({
                        message: "Failed to check facility operating hours."
                    });
                }

                if (facilities.length === 0) {
                    return res.status(404).json({
                        message: "Facility not found."
                    });
                }

                const openingTime = String(
                    facilities[0].opening_time
                ).slice(0, 5);

                const closingTime = String(
                    facilities[0].closing_time
                ).slice(0, 5);

                const requestedStart = String(
                    reservation.start_time
                ).slice(0, 5);

                const requestedEnd = String(
                    reservation.end_time
                ).slice(0, 5);

                // Check facility operating hours
                if (
                    requestedStart < openingTime ||
                    requestedEnd > closingTime
                ) {
                    return res.status(400).json({
                        message: `Cannot approve this reservation. The facility operates between ${openingTime} and ${closingTime}.`
                    });
                }

                // Check for conflicts with approved reservations
                const conflictSql = `
                    SELECT id
                    FROM reservations
                    WHERE facility_id = ?
                    AND reservation_date = ?
                    AND status IN ('pending', 'approved')
                    AND id != ?
                    AND start_time < ?
                    AND end_time > ?
                `;

                db.query(
                    conflictSql,
                    [
                        reservation.facility_id,
                        reservation.reservation_date,
                        reservationId,
                        reservation.end_time,
                        reservation.start_time
                    ],
                    (err, conflicts) => {
                        if (err) {
                            console.error("Conflict check error:", err);
                            return res.status(500).json({
                                message: "This time slot conflicts with another pending or approved reservation."
                            });
                        }

                        if (conflicts.length > 0) {
                            return res.status(409).json({
                                message: "This time slot conflicts with an existing approved reservation."
                            });
                        }

                        // Approve reservation
                        const updateSql = `
                            UPDATE reservations
                            SET status = 'approved'
                            WHERE id = ?
                        `;

                        db.query(updateSql, [reservationId], (err) => {
                            if (err) {
                                console.error("Approve reservation error:", err);
                                return res.status(500).json({
                                    message: "Failed to approve reservation."
                                });
                            }

                            res.json({
                                message: "Reservation approved successfully."
                            });
                        });
                    }
                );
            }
        );
    });
});

router.put("/:id/reject", (req, res) => {
    const reservationId = req.params.id;

    const sql = `
        UPDATE reservations
        SET status = 'rejected'
        WHERE id = ?
        AND status = 'pending'
    `;

    db.query(sql, [reservationId], (err, result) => {
        if (err) {
            console.error("Reject reservation error:", err);
            return res.status(500).json({
                message: "Failed to reject reservation."
            });
        }

        if (result.affectedRows === 0) {
            return res.status(400).json({
                message: "Reservation not found or is no longer pending."
            });
        }

        res.json({
            message: "Reservation rejected successfully."
        });
    });
});


router.put("/:id/cancel", (req, res) => {
    const reservationId = req.params.id;
    const { user_id } = req.body;

    if (!user_id) {
        return res.status(400).json({
            message: "User ID is required."
        });
    }

    const sql = `
        UPDATE reservations
        SET status = 'cancelled'
        WHERE id = ?
        AND user_id = ?
        AND status = 'approved'
    `;

    db.query(sql, [reservationId, user_id], (err, result) => {
        if (err) {
            console.error("Cancel reservation error:", err);
            return res.status(500).json({
                message: "Failed to cancel reservation."
            });
        }

        if (result.affectedRows === 0) {
            return res.status(400).json({
                message: "Reservation not found, does not belong to you, or is not approved."
            });
        }

        res.json({
            message: "Reservation cancelled successfully."
        });
    });
});


export default router;