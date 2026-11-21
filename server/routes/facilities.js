import express from "express";
import db from "../db.js";
import multer from "multer";
import path from "path";
import fs from "fs";
import { fileURLToPath } from "url";

const router = express.Router();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const uploadDir = path.join(__dirname, "../../uploads");

fs.mkdirSync(uploadDir, { recursive: true });

const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, uploadDir);
    },
    filename: (req, file, cb) => {
        cb(null, Date.now() + path.extname(file.originalname));
    }
});

const upload = multer({
    storage: storage,
    limits: {
        fileSize: 5 * 1024 * 1024
    }
});

router.get("/", (req, res) => {
    const sql = `
        SELECT * FROM facilities
        ORDER BY created_at DESC
    `;

    db.query(sql, (err, results) => {
        if (err) {
            console.error("Get facilities error:", err);

            return res.status(500).json({
                message: "Failed to retrieve facilities."
            });
        }

        res.json(results);
    });
});

router.post("/", upload.single("image"), (req, res) => {

    const {
        facility_name,
        description,
        location,
        opening_time,
        closing_time
    } = req.body;

    const image = req.file ? req.file.filename : null;

    const sql = `
        INSERT INTO facilities
        (facility_name, description, location, image, opening_time, closing_time)
        VALUES (?, ?, ?, ?, ?, ?)
    `;

    db.query(
        sql,
        [
            facility_name,
            description,
            location,
            image,
            opening_time,
            closing_time
        ],
        (err, result) => {
            if (err) {
                console.error("Add facility error:", err);
                return res.status(500).json({
                    message: "Failed to add facility."
                });
            }

            res.status(201).json({
                message: "Facility added successfully!",
                facilityId: result.insertId
            });
        }
    );
});

router.put("/:id", upload.single("image"), (req, res) => {

    const {
        facility_name,
        description,
        location,
        opening_time,
        closing_time
    } = req.body;

    const { id } = req.params;

    const sql = `
        UPDATE facilities
        SET
            facility_name = ?,
            description = ?,
            location = ?,
            opening_time = ?,
            closing_time = ?,
            image = COALESCE(?, image)
        WHERE id = ?
    `;

    const image = req.file ? req.file.filename : null;

    db.query(
        sql,
        [
            facility_name,
            description,
            location,
            opening_time,
            closing_time,
            image,
            id
        ],
        (err, result) => {
            if (err) {
                console.error("Update facility error:", err);

                return res.status(500).json({
                    message: "Failed to update facility."
                });
            }

            if (result.affectedRows === 0) {
                return res.status(404).json({
                    message: "Facility not found."
                });
            }

            res.json({
                message: "Facility updated successfully!"
            });
        }
    );
});

router.delete("/:id", (req, res) => {
    const { id } = req.params;

    const checkSql = `
        SELECT COUNT(*) AS total
        FROM reservations
        WHERE facility_id = ?
    `;

    db.query(checkSql, [id], (err, results) => {
        if (err) {
            console.error("Check facility reservations error:", err);

            return res.status(500).json({
                message: "Failed to check facility reservations."
            });
        }

        if (results[0].total > 0) {
            return res.status(400).json({
                message: "This facility cannot be deleted because it has existing reservations."
            });
        }

        const deleteSql = "DELETE FROM facilities WHERE id = ?";

        db.query(deleteSql, [id], (deleteErr, result) => {
            if (deleteErr) {
                console.error("Delete facility error:", deleteErr);

                return res.status(500).json({
                    message: "Failed to delete facility."
                });
            }

            if (result.affectedRows === 0) {
                return res.status(404).json({
                    message: "Facility not found."
                });
            }

            res.json({
                message: "Facility deleted successfully!"
            });
        });
    });
});

export default router;