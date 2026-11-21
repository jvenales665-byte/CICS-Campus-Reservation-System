import express from "express";
import cors from "cors";
import db from "./db.js";
import bcrypt from "bcryptjs";
import multer from "multer";

import path from "path";
import { fileURLToPath } from "url";
import fs from "fs";

import dashboardRoutes from "./routes/dashboard.js";
import facilitiesRoutes from "./routes/facilities.js";
import reservationRoutes from "./routes/reservations.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const uploadDir = path.join(__dirname, "../uploads");
fs.mkdirSync(uploadDir, { recursive: true });

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    cb(null, Date.now() + path.extname(file.originalname));
  },
});

const upload = multer({
  storage: storage,
  limits: {
    fileSize: 5 * 1024 * 1024,
  },
  fileFilter: (req, file, cb) => {
    if (file.mimetype.startsWith("image/")) {
      cb(null, true);
    } else {
      cb(new Error("Only image files are allowed."));
    }
  },
});

const app = express();

app.use(cors());
app.use(express.json());

app.use("/uploads", express.static(uploadDir));

app.use("/api/dashboard", dashboardRoutes);
app.use("/api/facilities", facilitiesRoutes);
app.use("/api/reservations", reservationRoutes);

app.get("/", (req, res) => {
  res.send("ZPPSU Reservation API is running!");
});

app.post("/register", upload.single("id_picture"), async (req, res) => {
  const { full_name, position, email, password } = req.body;
  const idPicture = req.file ? req.file.filename : null;

  if (!full_name || !position || !email || !password || !idPicture) {
    return res.status(400).json({
      message: "Please fill in all fields."
    });
  }

  try {
    const hashedPassword = await bcrypt.hash(password, 10);

    const sql = `
      INSERT INTO users (full_name, position, id_picture, email, password, role, account_status)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `;

  db.query(sql, [full_name, position, idPicture, email, hashedPassword, "user", "pending"], (err) => {
      if (err) {
        console.error("Registration database error:", err);
        if (err.code === "ER_DUP_ENTRY") {
          return res.status(409).json({
            message: "Email is already registered."
          });
        }

        return res.status(500).json({
          message: "Registration failed."
        });
      }

      res.status(201).json({
        message: "Account created successfully!"
      });
    });
  } catch (error) {
    res.status(500).json({
      message: "Something went wrong."
    });
  }
});

app.post("/login", async (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({
      message: "Please enter your email and password."
    });
  }

  const sql = "SELECT * FROM users WHERE email = ?";

  db.query(sql, [email], async (err, results) => {
    if (err) {
      return res.status(500).json({
        message: "Login failed."
      });
    }

    if (results.length === 0) {
      return res.status(401).json({
        message: "Invalid email or password."
      });
    }

    const user = results[0];
    const passwordMatch = await bcrypt.compare(password, user.password);

    if (!passwordMatch) {
      return res.status(401).json({
        message: "Invalid email or password."
      });
    }

    if (user.account_status !== "approved") {
      return res.status(403).json({
        message: "Your account is still awaiting admin approval."
      });
    }

    res.json({
      message: "Login successful!",
      user: {
        id: user.id,
        full_name: user.full_name,
        email: user.email,
        position: user.position,
        profile_picture: user.profile_picture,
        role: user.role
      }
    });
  });
});

app.put("/profile-picture/:id", upload.single("profile_picture"), (req, res) => {
  if (!req.file) {
    return res.status(400).json({
      message: "Please select a profile picture."
    });
  }

  const sql = `
    UPDATE users
    SET profile_picture = ?
    WHERE id = ?
  `;

  db.query(sql, [req.file.filename, req.params.id], (err, result) => {
    if (err) {
      console.error("Profile picture upload error:", err);

      return res.status(500).json({
        message: "Failed to update profile picture."
      });
    }

    if (result.affectedRows === 0) {
      return res.status(404).json({
        message: "User not found."
      });
    }

    res.json({
      message: "Profile picture updated successfully!",
      profile_picture: req.file.filename
    });
  });
});


app.put("/update-profile/:id", (req, res) => {
  const { full_name, position, email } = req.body;

  if (!full_name || !position || !email) {
    return res.status(400).json({
      message: "Please fill in all profile fields."
    });
  }

  const sql = `
    UPDATE users
    SET full_name = ?, position = ?, email = ?
    WHERE id = ?
  `;

  db.query(
    sql,
    [full_name, position, email, req.params.id],
    (err, result) => {
      if (err) {
        console.error("Profile update error:", err);

        if (err.code === "ER_DUP_ENTRY") {
          return res.status(409).json({
            message: "This email address is already registered."
          });
        }

        return res.status(500).json({
          message: "Failed to update profile."
        });
      }

      if (result.affectedRows === 0) {
        return res.status(404).json({
          message: "User not found."
        });
      }

      res.json({
        message: "Profile updated successfully!",
        user: {
          id: req.params.id,
          full_name,
          position,
          email
        }
      });
    }
  );
});

app.put("/change-password/:id", async (req, res) => {
    const { currentPassword, newPassword } = req.body;
    const userId = req.params.id;

    if (!currentPassword || !newPassword) {
        return res.status(400).json({
            message: "Please fill in all password fields."
        });
    }

    if (newPassword.length < 8) {
        return res.status(400).json({
            message: "New password must be at least 8 characters."
        });
    }

    try {
        const [users] = await db.promise().query(
            "SELECT password FROM users WHERE id = ?",
            [userId]
        );

        if (users.length === 0) {
            return res.status(404).json({
                message: "User not found."
            });
        }

        const isMatch = await bcrypt.compare(
            currentPassword,
            users[0].password
        );

        if (!isMatch) {
            return res.status(401).json({
                message: "Current password is incorrect."
            });
        }

        const hashedPassword = await bcrypt.hash(newPassword, 10);

        await db.promise().query(
            "UPDATE users SET password = ? WHERE id = ?",
            [hashedPassword, userId]
        );

        res.json({
            message: "Password changed successfully!"
        });

    } catch (error) {
        console.error("Change password error:", error);

        res.status(500).json({
            message: "Failed to change password."
        });
    }
});


const PORT = 5000;

app.get("/admin/pending-users", (req, res) => {
  const sql = `
    SELECT id, full_name, position, email, id_picture, created_at
    FROM users
    WHERE account_status = 'pending'
    ORDER BY created_at DESC
  `;

  db.query(sql, (err, results) => {
    if (err) {
      console.error("Pending users error:", err);
      return res.status(500).json({
        message: "Failed to retrieve pending applications."
      });
    }

    res.json(results);
  });
});

app.put("/admin/approve-user/:id", (req, res) => {
  const sql = `
    UPDATE users
    SET account_status = 'approved'
    WHERE id = ? AND account_status = 'pending'
  `;

  db.query(sql, [req.params.id], (err, result) => {
    if (err) {
      console.error("Approval error:", err);
      return res.status(500).json({
        message: "Failed to approve application."
      });
    }

    if (result.affectedRows === 0) {
      return res.status(404).json({
        message: "Pending application not found."
      });
    }

    res.json({
      message: "User approved successfully!"
    });
  });
});

app.put("/admin/reject-user/:id", (req, res) => {
  const sql = `
    UPDATE users
    SET account_status = 'rejected'
    WHERE id = ? AND account_status = 'pending'
  `;

  db.query(sql, [req.params.id], (err, result) => {
    if (err) {
      console.error("Rejection error:", err);
      return res.status(500).json({
        message: "Failed to reject application."
      });
    }

    if (result.affectedRows === 0) {
      return res.status(404).json({
        message: "Pending application not found."
      });
    }

    res.json({
      message: "User rejected successfully!"
    });
  });
});

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});