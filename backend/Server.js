const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
const bodyParser = require("body-parser");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const axios = require("axios");
require("dotenv").config();
const app = express();

app.use(cors());

app.use(bodyParser.json());

const JWT_SECRET = process.env.JWT_SECRET;

// MongoDB Connection
mongoose.connect("mongodb://localhost:27017/vinayaga-medical", {
  useNewUrlParser: true,
  useUnifiedTopology: true,
});

const db = mongoose.connection;
db.on("error", console.error.bind(console, "MongoDB connection error:"));
db.once("open", () => console.log("Connected to MongoDB"));

const MedicineSchema = new mongoose.Schema({
  name: { type: String, required: true },
  category: { type: String, required: true }, // e.g., Tablet, Syrup, Injection
  strengthDosage: { type: String, required: true }, // e.g., 500mg
  composition: { type: String, required: true },
  manufacturer: { type: String, required: true },
  gstTaxRate: { type: Number, required: true }, // in percentage
  createdAt: { type: Date, default: Date.now },
});
const Medicine = mongoose.model("Medicine", MedicineSchema);
module.exports = Medicine;

// Medicine Batch Schema
const MedicineBatchSchema = new mongoose.Schema({
  medicine: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Medicine",
    required: true,
  },
  batchNumber: { type: String, required: true },
  expiryDate: { type: Date, required: true },
  stockQuantity: { type: Number, required: true },
  purchasePrice: { type: Number, required: true },
  sellingPrice: { type: Number, required: true },
  storageLocation: { type: String }, // e.g., "Shelf A2"
  supplier: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Supplier",
    required: true,
  },
  dateReceived: { type: Date, default: Date.now },
});

const MedicineBatch = mongoose.model("MedicineBatch", MedicineBatchSchema);
module.exports = MedicineBatch;

// Supplier Schema
const SupplierSchema = new mongoose.Schema({
  name: { type: String, required: true },
  contactPerson: { type: String },
  phone: { type: String },
  email: { type: String },
  address: { type: String },
  gstNumber: { type: String },
  createdAt: { type: Date, default: Date.now },
});

const Supplier = mongoose.model("Supplier", SupplierSchema);

// Invoice Schema
const InvoiceSchema = new mongoose.Schema({
  billId: String,
  customerName: String,
  customerPhone: String,
  medicines: Array,
  totalAmount: Number,
  totalGST: Number,
  totalBill: Number,
  date: { type: Date, default: Date.now },
});
const Invoice = mongoose.model("Invoice", InvoiceSchema);

//user Schema
const UserSchema = new mongoose.Schema({
  name: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  role: { type: String, required: true },
});

const User = mongoose.model("User", UserSchema);

module.exports = User;

// MedicineRequest Schema
const MedicineRequestSchema = new mongoose.Schema({
  medicineName: { type: String, required: true },
  category: { type: String, required: true }, // e.g., Tablet, Syrup, Injection
  strengthDosage: { type: String, required: true }, // e.g., 500mg
  composition: { type: String, required: true },
  manufacturer: { type: String, required: true },
  requestedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true,
  }, // Reference to the pharmacist
  status: {
    type: String,
    enum: ["Pending", "Approved", "Rejected"],
    default: "Pending",
  },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now },
});

const MedicineRequest = mongoose.model(
  "MedicineRequest",
  MedicineRequestSchema
);

// User Login API
// **Login Route**
app.post("/api/login", async (req, res) => {
  const { email, password } = req.body;
  try {
    // Explicitly select `email`, `password`, and `role`
    const user = await User.findOne({ email }).select("email password role");

    console.log("Fetched User:", user); // ✅ Debugging Step

    if (!user) {
      return res.status(401).json({ error: "User not found" });
    }

    // Check role before proceeding
    if (!user.role) {
      return res
        .status(500)
        .json({ error: "User role is missing from the database" });
    }

    // Compare Passwords
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(401).json({ error: "Invalid credentials" });
    }

    // Generate JWT Token
    const token = jwt.sign({ userId: user._id, role: user.role }, JWT_SECRET, {
      expiresIn: "1h",
    });

    console.log("User role before sending response:", user.role); // ✅ Debugging Step

    // Send response with role
    res.json({
      message: "Login successful",
      token,
      email: user.email,
      role: user.role, // ✅ Make sure this is sent
    });
  } catch (error) {
    console.error("Login Error:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

// Get all medicines (or filter by name)
// Backend: Search Medicines with Stock Quantity
app.get("/api/search-medicine", async (req, res) => {
  try {
    const { name } = req.query;

    // Find medicines by name
    const medicines = await Medicine.find({
      name: { $regex: name, $options: "i" },
    });

    // Fetch stock quantity for each medicine from MedicineBatch
    const medicinesWithStock = await Promise.all(
      medicines.map(async (medicine) => {
        const batches = await MedicineBatch.find({ medicine: medicine._id });
        const totalStock = batches.reduce(
          (sum, batch) => sum + batch.stockQuantity,
          0
        );

        return {
          _id: medicine._id,
          name: medicine.name,
          sellingPrice: medicine.sellingPrice,
          stockQuantity: totalStock, // Total stock from all batches
        };
      })
    );

    res.json(medicinesWithStock);
  } catch (err) {
    console.error("Error searching medicines:", err);
    res.status(500).json({ error: "Failed to search medicines" });
  }
});

app.get("/api/workers", async (req, res) => {
  try {
    const workers = await User.find({ role: { $ne: "Admin" } });
    res.json(workers);
  } catch (error) {
    res.status(500).json({ message: "Error fetching workers", error });
  }
});

app.post("/api/worker", async (req, res) => {
  try {
    const { name, email, password, role } = req.body;

    // Hash Password
    const hashedPassword = await bcrypt.hash(password, 10);

    const newWorker = new User({
      name,
      email,
      password: hashedPassword,
      role,
    });

    await newWorker.save();
    res.json({ message: "Worker added successfully", worker: newWorker });
  } catch (error) {
    res.status(500).json({ message: "Error adding worker", error });
  }
});

// ➤ Update Worker (without Changing Password)
app.put("/api/update-worker/:id", async (req, res) => {
  try {
    const { newPassword } = req.body;
    const worker = await User.findById(req.params.id);

    if (!worker) {
      return res.status(404).json({ error: "Worker not found" });
    }

    console.log("pass:" + newPassword);
    // Hash new password before saving
    const hashedPassword = await bcrypt.hash(newPassword, 10);
    worker.password = hashedPassword;
    await worker.save();
    console.log(User.password);
    res.json({ message: "Password updated successfully" });
  } catch (error) {
    res.status(500).json({ error: "Error updating password" });
  }
});

// ➤ Delete a Worker
app.delete("/api/delete-worker/:id", async (req, res) => {
  try {
    const { id } = req.params;
    await User.findByIdAndDelete(id);
    res.json({ message: "Worker deleted successfully" });
  } catch (error) {
    res.status(500).json({ message: "Error deleting worker", error });
  }
});

// Get all medicines (stocks)
app.get("/api/medicines", async (req, res) => {
  try {
    const medicines = await Medicine.find();
    res.json(medicines); // Send the medicines data as response
  } catch (err) {
    console.error("Error fetching medicines:", err);
    res.status(500).json({ error: "Failed to fetch medicines" });
  }
});

// Add new medicine
app.post("/api/add-medicine", async (req, res) => {
  try {
    const {
      name,
      category,
      strengthDosage,
      composition,
      manufacturer,
      gstTaxRate,
      totalQuantity,
    } = req.body;

    const newMedicine = new Medicine({
      name,
      category,
      strengthDosage,
      composition,
      manufacturer,
      gstTaxRate,
      totalQuantity: totalQuantity || 0, // Default to 0 if not provided
    });

    await newMedicine.save();
    res.status(201).json({ message: "Medicine added successfully" });
  } catch (error) {
    console.error("Error adding medicine:", error);
    res.status(500).json({ error: "Failed to add medicine" });
  }
});

// Delete medicine
app.delete("/api/delete-medicine/:id", async (req, res) => {
  try {
    await Medicine.findByIdAndDelete(req.params.id);
    res.json({ message: "Medicine deleted successfully" });
  } catch (err) {
    console.error("Error deleting medicine:", err);
    res.status(500).json({ error: "Failed to delete medicine" });
  }
});

// Generate Invoice & Update Stock
// Generate Invoice & Update Stock (FIFO Logic)
// Generate Invoice & Update Stock (FIFO Logic)
app.post("/api/generate-invoice", async (req, res) => {
  try {
    const {
      billId,
      customerName,
      customerPhone,
      medicines,
      totalAmount,
      totalGST,
      totalBill,
    } = req.body;

    const invoice = new Invoice({
      billId,
      customerName,
      customerPhone,
      medicines,
      totalAmount,
      totalGST,
      totalBill,
    });

    // Save the invoice
    await invoice.save();

    // Deduct stock quantities using FIFO logic
    for (const item of medicines) {
      let remainingQuantity = item.quantity;

      // Fetch batches for the medicine, sorted by dateReceived (FIFO)
      const batches = await MedicineBatch.find({
        medicine: item.medicineId,
      }).sort({ dateReceived: 1 });

      for (const batch of batches) {
        if (remainingQuantity <= 0) break;

        if (batch.stockQuantity >= remainingQuantity) {
          // Deduct the required quantity from the current batch
          batch.stockQuantity -= remainingQuantity;
          await batch.save();
          remainingQuantity = 0;
        } else {
          // Deduct the entire stock of the current batch and move to the next
          remainingQuantity -= batch.stockQuantity;
          batch.stockQuantity = 0;
          await batch.save();
        }
      }

      // If stock is insufficient, throw an error
      if (remainingQuantity > 0) {
        throw new Error(
          `Insufficient stock for medicine: ${item.medicineName}`
        );
      }
    }

    res.status(201).json({ message: "Invoice generated and stock updated" });
  } catch (err) {
    console.error("Error generating invoice:", err);
    res
      .status(500)
      .json({ error: err.message || "Failed to generate invoice" });
  }
});

// Get all invoices/transactions
app.get("/api/invoices", async (req, res) => {
  try {
    const invoices = await Invoice.find().sort({ date: -1 });
    res.json(invoices);
  } catch (err) {
    res.status(500).json({ error: "Failed to fetch invoices" });
  }
});

// Get all invoices/transactions/using id
app.get("/api/invoice-details/:billId", async (req, res) => {
  try {
    const invoice = await Invoice.findOne({ billId: req.params.billId });
    res.json(invoice);
  } catch (error) {
    res.status(500).json({ error: "Failed to fetch invoice details" });
  }
});

// Get expiry alerts
// Get expiry alerts
app.get("/api/expiry-alerts", async (req, res) => {
  try {
    const today = new Date();
    const fourDaysFromNow = new Date();
    fourDaysFromNow.setDate(today.getDate() + 4);

    const medicines = await MedicineBatch.find()
      .populate("medicine", "name")
      .populate("supplier", "name phone email");

    const validMedicines = medicines.filter((batch) => batch.medicine !== null);

    const expiringSoon = validMedicines.filter(
      (med) =>
        new Date(med.expiryDate) > today &&
        new Date(med.expiryDate) <= fourDaysFromNow
    );

    const expired = validMedicines.filter(
      (med) => new Date(med.expiryDate) <= today
    );

    res.json({
      expiringSoon: expiringSoon || [], // Ensure empty arrays are returned
      expired: expired || [],
    });
  } catch (error) {
    console.error("Error fetching expiry alerts:", error);
    res.status(500).json({ expiringSoon: [], expired: [] }); // Return empty arrays on error
  }
});

// Request medicine
app.post("/api/request-medicine", async (req, res) => {
  try {
    const {
      medicineName,
      category,
      strengthDosage,
      composition,
      manufacturer,
      requestedBy, // This will be the email sent from the frontend
    } = req.body;

    // Fetch the pharmacist's ObjectId using their email
    const pharmacist = await User.findOne({
      email: requestedBy,
      role: "Pharmacist",
    });
    if (!pharmacist) {
      return res.status(400).json({ error: "Pharmacist not found" });
    }

    // Create a new medicine request
    const newRequest = new MedicineRequest({
      medicineName,
      category,
      strengthDosage,
      composition,
      manufacturer,
      requestedBy: pharmacist._id, // Use the ObjectId
    });

    await newRequest.save();
    res.status(201).json({
      message: "Medicine request submitted successfully",
      request: newRequest,
    });
  } catch (err) {
    console.error("Error requesting medicine:", err);
    res.status(500).json({ error: "Failed to request medicine" });
  }
});

app.put("/api/approve-request/:id", async (req, res) => {
  try {
    const request = await MedicineRequest.findById(req.params.id);
    if (!request) {
      return res.status(404).json({ error: "Request not found" });
    }

    // Add the medicine to the Medicine schema
    const newMedicine = new Medicine({
      name: request.medicineName,
      category: request.category,
      strengthDosage: request.strengthDosage,
      composition: request.composition,
      manufacturer: request.manufacturer,
      gstTaxRate: 0, // Default GST rate, can be updated later
    });

    await newMedicine.save();

    // Update the request status to "Approved"
    request.status = "Approved";
    await request.save();

    res
      .status(200)
      .json({ message: "Request approved and medicine added", request });
  } catch (err) {
    console.error("Error approving request:", err);
    res.status(500).json({ error: "Failed to approve request" });
  }
});

app.put("/api/reject-request/:id", async (req, res) => {
  try {
    const request = await MedicineRequest.findById(req.params.id);
    if (!request) {
      return res.status(404).json({ error: "Request not found" });
    }

    // Update the request status to "Rejected"
    request.status = "Rejected";
    await request.save();

    res.json({ message: "Request rejected", request });
  } catch (err) {
    console.error("Error rejecting request:", err);
    res.status(500).json({ error: "Failed to reject request" });
  }
});

// Get all medicine requests
app.get("/api/medicine-requests", async (req, res) => {
  try {
    const requests = await MedicineRequest.find().populate(
      "requestedBy",
      "name email"
    );
    res.json(requests);
  } catch (err) {
    console.error("Error fetching medicine requests:", err);
    res.status(500).json({ error: "Failed to fetch requests" });
  }
});

app.get("/api/suppliers", async (req, res) => {
  try {
    const suppliers = await Supplier.find();
    res.json(suppliers);
  } catch (error) {
    console.error("Error fetching suppliers:", error);
    res.status(500).json({ error: "Failed to fetch suppliers" });
  }
});

app.post("/api/suppliers", async (req, res) => {
  try {
    const { name, contactPerson, phone, email, address, gstNumber } = req.body;

    const newSupplier = new Supplier({
      name,
      contactPerson,
      phone,
      email,
      address,
      gstNumber,
    });

    await newSupplier.save();
    res
      .status(201)
      .json({ message: "Supplier added successfully", supplier: newSupplier });
  } catch (error) {
    console.error("Error adding supplier:", error);
    res.status(500).json({ error: "Failed to add supplier" });
  }
});

app.put("/api/suppliers/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const { name, contactPerson, phone, email, address, gstNumber } = req.body;

    const updatedSupplier = await Supplier.findByIdAndUpdate(
      id,
      { name, contactPerson, phone, email, address, gstNumber },
      { new: true } // Return the updated document
    );

    if (!updatedSupplier) {
      return res.status(404).json({ error: "Supplier not found" });
    }

    res.json({
      message: "Supplier updated successfully",
      supplier: updatedSupplier,
    });
  } catch (error) {
    console.error("Error updating supplier:", error);
    res.status(500).json({ error: "Failed to update supplier" });
  }
});

app.delete("/api/suppliers/:id", async (req, res) => {
  try {
    const { id } = req.params;

    const deletedSupplier = await Supplier.findByIdAndDelete(id);

    if (!deletedSupplier) {
      return res.status(404).json({ error: "Supplier not found" });
    }

    res.json({ message: "Supplier deleted successfully" });
  } catch (error) {
    console.error("Error deleting supplier:", error);
    res.status(500).json({ error: "Failed to delete supplier" });
  }
});

// Delete batch
app.delete("/api/batches/:id", async (req, res) => {
  try {
    await MedicineBatch.findByIdAndDelete(req.params.id);
    res.json({ message: "Batch deleted successfully" });
  } catch (err) {
    res.status(500).json({ error: "Failed to delete batch" });
  }
});

// Approve medicine request
app.put("/api/approve-request/:id", async (req, res) => {
  try {
    const request = await MedicineRequest.findById(req.params.id);
    if (!request) {
      return res.status(404).json({ error: "Request not found" });
    }
    request.status = "Approved";
    await request.save();
    res.status(200).json({ message: "Request approved successfully", request });
  } catch (err) {
    console.error("Error approving request:", err);
    res.status(500).json({ error: "Failed to approve request" });
  }
});

// Reject medicine request
app.put("/api/reject-request/:id", async (req, res) => {
  try {
    const request = await MedicineRequest.findById(req.params.id);
    if (!request) {
      return res.status(404).json({ error: "Request not found" });
    }

    request.status = "Rejected";
    await request.save();

    res.json({ message: "Request rejected" });
  } catch (err) {
    console.error("Error rejecting request:", err);
    res.status(500).json({ error: "Failed to reject request" });
  }
});

// GET all batches
app.get("/api/batches", async (req, res) => {
  try {
    const batches = await MedicineBatch.find()
      .populate("medicine", "name") // Populate only the `name` field
      .populate("supplier", "name"); // Populate supplier details

    // Filter out batches with missing or null `medicine` fields
    const validBatches = batches.filter((batch) => batch.medicine !== null);

    res.json(validBatches);
  } catch (err) {
    console.error("Error fetching batches:", err);
    res.status(500).json({ message: "Server Error: " + err.message });
  }
});

app.post("/api/batches", async (req, res) => {
  try {
    const {
      batchNumber,
      medicine,
      expiryDate,
      stockQuantity,
      purchasePrice,
      sellingPrice,
      supplier,
      storageLocation,
      dateReceived,
    } = req.body;

    // Create a new batch
    const newBatch = new MedicineBatch({
      batchNumber,
      medicine,
      expiryDate,
      stockQuantity,
      purchasePrice,
      sellingPrice,
      supplier,
      storageLocation,
      dateReceived,
    });

    // Save the batch to the database
    const savedBatch = await newBatch.save();
    res.status(201).json(savedBatch);
  } catch (error) {
    console.error("Error adding batch:", error);
    res.status(500).json({ error: "Failed to add batch" });
  }
});

app.get("/api/medicine-batch/:id", async (req, res) => {
  try {
    const { id } = req.params;
    console.log("Received Medicine ID:", id); // Debugging

    // Validate the ID
    if (!mongoose.isValidObjectId(id)) {
      console.error("Invalid Medicine ID:", id); // Debugging
      return res.status(400).json({ error: "Invalid medicine ID." });
    }

    // Fetch the first batch (FIFO) for the given medicine ID
    const medicineBatch = await MedicineBatch.findOne({
      medicine: id,
    })
      .sort({ dateReceived: 1 }) // FIFO logic
      .populate("medicine", "name gstTaxRate"); // Populate `name` and `gstTaxRate` from Medicine

    console.log("Medicine Batch Found:", medicineBatch); // Debugging

    if (!medicineBatch) {
      return res.status(404).json({ error: "Medicine not found in stock." });
    }

    res.json({
      _id: medicineBatch.medicine._id,
      name: medicineBatch.medicine.name,
      sellingPrice: medicineBatch.sellingPrice,
      stockQuantity: medicineBatch.stockQuantity,
      gstTaxRate: medicineBatch.medicine.gstTaxRate,
    });
  } catch (err) {
    console.error("Error fetching medicine batch:", err);
    res.status(500).json({ error: "Failed to fetch medicine batch." });
  }
});

app.get("/api/demand-prediction", async (req, res) => {
  try {
    const response = await axios.get(
      "http://127.0.0.1:5001/api/demand-prediction"
    );
    res.json(response.data);
  } catch (error) {
    console.error("Error fetching demand prediction:", error);
    res.status(500).json({ error: "Failed to fetch demand prediction" });
  }
});
// Start Server
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
