import express from "express";
import db from "../db.js";

const router = express.Router();

router.get("/total-users", (req, res) => {

    const sql = `
        SELECT
            COUNT(CASE WHEN account_status = 'approved' THEN 1 END) AS totalUsers,
            COUNT(CASE WHEN account_status = 'pending' THEN 1 END) AS pendingUsers
        FROM users
    `;

    db.query(sql, (err, results) => {
        if (err) {
            console.error("Dashboard users count error:", err);

            return res.status(500).json({
                message: "Failed to retrieve total users."
            });
        }

        res.json({
            totalUsers: results[0].totalUsers,
            pendingUsers: results[0].pendingUsers
        });
    });
});

export default router;