import React, { useEffect, useState } from "react";
import LogoutButton from "../login/LogoutButton";
import axios from "axios";
import {
  FaPills,
  FaClock,
  FaShoppingCart,
  FaBoxes,
  FaSearch,
  FaClipboardCheck,
} from "react-icons/fa";
import { useLocation } from "react-router-dom";
import "./PharmacistDashboard.css";
import logo from "../assets/logo.png";
import "./style.css";
const PharmacistDashboard = () => {
  const [activeTab, setActiveTab] = useState("stock");
  const [medicines, setMedicines] = useState([]);
  const [expiringMedicines, setExpiringMedicines] = useState({
    expired: [],
    expiringSoon: [],
  });
  const [requests, setRequests] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [medicineName, setMedicineName] = useState("");
  const [quantity, setQuantity] = useState("");
  const [category, setCategory] = useState("");
  const [dosage, setDosage] = useState("");
  const [supplier, setSupplier] = useState("");
  const [contact, setContact] = useState("");
  const location = useLocation();
  const email = location.state?.email;
  const [stocks, setStocks] = useState([]);
  const [batches, setBatches] = useState([]);
  const [medicineSearchText, setMedicineSearchText] = useState("");
  const [showBatchForm, setShowBatchForm] = useState(false);
  const [batchForm, setBatchForm] = useState({
    batchNumber: "",
    medicine: "",
    expiryDate: "",
    stockQuantity: "",
    purchasePrice: "",
    sellingPrice: "",
    supplier: "",
    storageLocation: "",
    dateReceived: "",
  });
  const today = new Date().toISOString().split("T")[0]; // Get today's date in YYYY-MM-DD format
  const [suppliers, setSuppliers] = useState([]);
  const [manufacturer, setManufacturer] = useState("");
  const [composition, setComposition] = useState("");
  const [strengthDosage, setStrengthDosage] = useState("");
  useEffect(() => {
    fetchStocks();
    fetchExpiryAlerts();
    fetchRequests();
    fetchSuppliers();
  }, []);

  useEffect(() => {
    const fetchMedicines = async () => {
      try {
        const response = await fetch(`${process.env.REACT_APP_BACKEND_URL}/api/medicines`);
        if (!response.ok) {
          throw new Error("Failed to fetch medicines");
        }
        const data = await response.json();
        setMedicines(data); // Store the fetched medicines in state
      } catch (error) {
        console.error(error);
      }
    };
    fetchMedicines();
  }, []);

  useEffect(() => {
    if (activeTab === "medicineStock") {
      fetchBatches();
    }
  }, [activeTab]);

  useEffect(() => {
    const fetchExpiryAlerts = async () => {
      try {
        const response = await axios.get(
          `${process.env.REACT_APP_BACKEND_URL}/api/expiry-alerts`
        );
        const { expiringSoon, expired } = response.data;

        setExpiringMedicines({
          expiringSoon: expiringSoon || [],
          expired: expired || [],
        });
      } catch (error) {
        console.error("Error fetching expiry alerts:", error);
        setExpiringMedicines({ expiringSoon: [], expired: [] });
      }
    };

    fetchExpiryAlerts();
  }, []);

  const fetchStocks = async () => {
    try {
      const response = await axios.get(`${process.env.REACT_APP_BACKEND_URL}/api/medicines`);
      console.log("Stocks fetched:", response.data);
      setStocks(response.data); // Set the fetched data into the state
    } catch (error) {
      console.error("Error fetching stocks:", error);
    }
  };

  const fetchExpiryAlerts = async () => {
    try {
      const response = await axios.get(
        `${process.env.REACT_APP_BACKEND_URL}/api/expiry-alerts`
      );
      const { expiringSoon, expired } = response.data;

      setExpiringMedicines({ expiringSoon, expired });
    } catch (error) {
      console.error("Error fetching expiry alerts:", error);
      setExpiringMedicines({ expired: [], expiringSoon: [] }); // Prevent undefined errors
    }
  };

  const fetchRequests = async () => {
    try {
      const response = await axios.get(
        `${process.env.REACT_APP_BACKEND_URL}/api/medicine-requests`
      );
      setRequests(response.data);
    } catch (error) {
      console.error("Error fetching medicine requests:", error);
    }
  };

  const openAddBatchModal = () => {
    // Ensure it's not in edit mode
    setBatchForm({
      batchNumber: "",
      medicine: "",
      expiryDate: "",
      stockQuantity: "",
      purchasePrice: "",
      sellingPrice: "",
      supplier: "",
      storageLocation: "",
      dateReceived: today,
    });
    setShowBatchForm(true); // Show the form
  };

  const handleFormSubmit = async (e) => {
    e.preventDefault();

    try {
      const url = `${process.env.REACT_APP_BACKEND_URL}/api/batches`; // Always use POST for adding new batches

      const response = await fetch(url, {
        method: "POST", // Always POST since we're not editing
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(batchForm), // Send the form data
      });

      if (!response.ok) {
        const err = await response.json();
        alert("Error: " + (err.error || "Failed to save batch"));
        return;
      }

      const savedBatch = await response.json();

      // Add the newly saved batch to the list
      setBatches((prev) => [...prev, savedBatch]);
      console.log("Batch added successfully:", savedBatch);

      // Reset form and close
      setShowBatchForm(false);
      setBatchForm({
        batchNumber: "",
        medicine: "",
        expiryDate: "",
        stockQuantity: "",
        purchasePrice: "",
        sellingPrice: "",
        supplier: "",
        storageLocation: "",
        dateReceived: "",
      });
    } catch (error) {
      console.error("Error while saving batch:", error);
    }
  };

  const updateBatchForm = (field, value) => {
    setBatchForm((prev) => ({ ...prev, [field]: value }));
  };

  const handleDelete = async (id) => {
    if (window.confirm("Are you sure you want to delete this batch?")) {
      try {
        await axios.delete(
          `${process.env.REACT_APP_BACKEND_URL}/api/batches/${id}`
        );
        fetchBatches(); // Refresh list
      } catch (error) {
        console.error("Error deleting batch:", error);
      }
    }
  };

  const fetchBatches = async () => {
    try {
      const res = await axios.get(`${process.env.REACT_APP_BACKEND_URL}/api/batches`);
      setBatches(res.data);
    } catch (error) {
      console.error("Error fetching batches:", error);
    }
  };

  const fetchSuppliers = async () => {
    try {
      const response = await axios.get(`${process.env.REACT_APP_BACKEND_URL}/api/suppliers`);
      setSuppliers(response.data);
    } catch (error) {
      console.error("Error fetching suppliers:", error);
    }
  };

  const handleRequestSubmit = async (e) => {
    e.preventDefault();

    if (!dosage) {
      alert("Please provide the strength/dosage of the medicine.");
      return;
    }

    try {
      const response = await fetch(
        "http://localhost:5000/api/request-medicine",
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            medicineName,
            category,
            strengthDosage: dosage,
            composition,
            manufacturer,
            requestedBy: email, // Send the pharmacist's email
          }),
        }
      );

      const data = await response.json();
      if (response.ok) {
        alert("Medicine request submitted successfully");
        fetchRequests(); // Refresh the requests
        setMedicineName("");
        setCategory("");
        setDosage("");
        setComposition("");
        setManufacturer("");
      } else {
        alert(data.error || "Failed to submit request");
      }
    } catch (error) {
      console.error("Error submitting request:", error);
      alert("Failed to submit request");
    }
  };

  return (
    <div className="dashboard-container">
      <div className="sidebar">
        <img src={logo} alt="Logo" className="dashboard-logo" />
        <h2 className="role-title">Pharmacist</h2>
        <button
          className={`sidebar-button ${
            activeTab === "allStock"
              ? "admin-sidebar-button active"
              : "admin-sidebar-button"
          }`}
          onClick={() => setActiveTab("stock")}
        >
          <FaPills /> Drugs
        </button>
        <button
          className={
            activeTab === "medicineStock"
              ? "admin-sidebar-button active"
              : "admin-sidebar-button"
          }
          onClick={() => setActiveTab("medicineStock")}
        >
          <FaBoxes />
          Medicine Stock
        </button>
        <button
          className={`sidebar-button ${
            activeTab === "expiry"
              ? "admin-sidebar-button active"
              : "admin-sidebar-button"
          }`}
          onClick={() => setActiveTab("expiry")}
        >
          <FaClock /> Expiry
        </button>
        <button
          className={`sidebar-button ${
            activeTab === "medicineRequests"
              ? "admin-sidebar-button active"
              : "admin-sidebar-button"
          }`}
          onClick={() => setActiveTab("medicineRequests")}
        >
          <FaClipboardCheck /> Medicine Requests
        </button>
        <button
          className={`sidebar-button ${
            activeTab === "suppliers"
              ? "admin-sidebar-button active"
              : "admin-sidebar-button"
          }`}
          onClick={() => setActiveTab("suppliers")}
        >
          <FaClipboardCheck /> Suppliers
        </button>
        <button>
          <LogoutButton />
        </button>
      </div>

      <div className="content">
        {activeTab === "stock" && (
          <div className="card card-gray">
            <h3>Drugs</h3>
            <div className="search-box">
              <FaSearch className="search-icon" />
              <input
                type="text"
                placeholder="Search by Name or Category or Composition or Manufacturer"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value.toLowerCase())}
              />
            </div>
            <div className="table-wrapper">
              <div className="table-container">
                <table className="medicine-table">
                  <thead>
                    <tr>
                      <th>Name</th>
                      <th>Category</th>
                      <th>Strength/Dosage</th>
                      <th>Composition</th>
                      <th>Manufacturer</th>
                      <th>GST/Tax</th>
                      <th>Created At</th>
                    </tr>
                  </thead>
                  <tbody>
                    {stocks
                      .filter(
                        (med) =>
                          med.name.toLowerCase().includes(searchTerm) ||
                          med.category.toLowerCase().includes(searchTerm) ||
                          med.composition.toLowerCase().includes(searchTerm) ||
                          med.manufacturer.toLowerCase().includes(searchTerm)
                      )
                      .map((med) => (
                        <tr key={med._id}>
                          <td>{med.name}</td>
                          <td>{med.category}</td>
                          <td>{med.strengthDosage}</td>
                          <td>{med.composition}</td>
                          <td>{med.manufacturer}</td>
                          <td>{med.gstTaxRate}%</td>
                          <td>
                            {new Date(med.createdAt).toLocaleDateString()}
                          </td>
                        </tr>
                      ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {activeTab === "medicineStock" && (
          <div className="card card-gray">
            <h3>Stock Batches</h3>

            <div
              style={{
                display: "flex",
                justifyContent: "flex-end",
                marginBottom: "10px",
              }}
            >
              <button onClick={openAddBatchModal}>Add Stock</button>
            </div>

            {showBatchForm && (
              <div className="batch-form">
                <h4></h4>
                <form onSubmit={handleFormSubmit}>
                  <input
                    type="text"
                    placeholder="Batch Number"
                    value={batchForm.batchNumber}
                    onChange={(e) =>
                      updateBatchForm("batchNumber", e.target.value)
                    }
                    required
                  />
                  <select
                    value={batchForm.medicine}
                    onChange={(e) =>
                      updateBatchForm("medicine", e.target.value)
                    }
                    required
                  >
                    <option value="">Select Medicine</option>
                    {medicines.map((medicine) => (
                      <option key={medicine._id} value={medicine._id}>
                        {medicine.name}
                      </option>
                    ))}
                  </select>
                  <input
                    type="date"
                    value={batchForm.expiryDate}
                    onChange={(e) =>
                      updateBatchForm("expiryDate", e.target.value)
                    }
                    required
                  />
                  <input
                    type="number"
                    placeholder="Stock Quantity"
                    value={batchForm.stockQuantity}
                    onChange={(e) =>
                      updateBatchForm("stockQuantity", e.target.value)
                    }
                    required
                  />
                  <input
                    type="number"
                    placeholder="Purchase Price"
                    value={batchForm.purchasePrice}
                    onChange={(e) =>
                      updateBatchForm("purchasePrice", e.target.value)
                    }
                    required
                  />
                  <input
                    type="number"
                    placeholder="Selling Price"
                    value={batchForm.sellingPrice}
                    onChange={(e) =>
                      updateBatchForm("sellingPrice", e.target.value)
                    }
                    required
                  />
                  <select
                    value={batchForm.supplier}
                    onChange={(e) =>
                      updateBatchForm("supplier", e.target.value)
                    }
                    required
                  >
                    <option value="">Select Supplier</option>
                    {suppliers.map((supplier) => (
                      <option key={supplier._id} value={supplier._id}>
                        {supplier.name}
                      </option>
                    ))}
                  </select>
                  <input
                    type="text"
                    placeholder="Storage Location"
                    value={batchForm.storageLocation}
                    onChange={(e) =>
                      updateBatchForm("storageLocation", e.target.value)
                    }
                    required
                  />
                  <input
                    type="date"
                    value={batchForm.dateReceived}
                    onChange={(e) =>
                      updateBatchForm("dateReceived", e.target.value)
                    }
                    required
                  />

                  <div style={{ marginTop: "10px" }}>
                    <button type="submit">Add</button>
                    <button
                      type="button"
                      onClick={() => setShowBatchForm(false)}
                      style={{ marginLeft: "10px" }}
                    >
                      Cancel
                    </button>
                  </div>
                </form>
              </div>
            )}

            <input
              type="text"
              placeholder="Search by medicine name..."
              value={medicineSearchText}
              onChange={(e) => setMedicineSearchText(e.target.value)}
              style={{ margin: "10px 0", padding: "5px" }}
            />

            <table className="batch-table">
              <thead>
                <tr>
                  <th>Batch Number</th>
                  <th>Medicine Name</th>
                  <th>Expiry Date</th>
                  <th>Stock Qty</th>
                  <th>Purchase Price</th>
                  <th>Selling Price</th>
                  <th>Supplier</th>
                  <th>Storage</th>
                  <th>Received On</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {batches
                  .filter((batch) =>
                    batch.medicine && batch.medicine.name
                      ? batch.medicine.name
                          .toLowerCase()
                          .includes(medicineSearchText.toLowerCase())
                      : false
                  )
                  .map((batch) => (
                    <tr key={batch._id}>
                      <td>{batch.batchNumber}</td>
                      <td>{batch.medicine?.name || "N/A"}</td>{" "}
                      {/* Handle missing name */}
                      <td>{new Date(batch.expiryDate).toLocaleDateString()}</td>
                      <td>{batch.stockQuantity}</td>
                      <td>₹{batch.purchasePrice}</td>
                      <td>₹{batch.sellingPrice}</td>
                      <td>{batch.supplier?.name || "N/A"}</td>{" "}
                      {/* Handle missing supplier */}
                      <td>{batch.storageLocation || "N/A"}</td>
                      <td>
                        {new Date(batch.dateReceived).toLocaleDateString()}
                      </td>
                      <td>
                        <button onClick={() => handleDelete(batch._id)}>
                          Delete
                        </button>
                      </td>
                    </tr>
                  ))}
              </tbody>
            </table>
          </div>
        )}

        {activeTab === "expiry" && (
          <div className="card card-red">
            {/* Expiring Soon Section */}
            <h3>Expiring Soon (Next 4 Days)</h3>
            {expiringMedicines?.expiringSoon?.length > 0 ? (
              <table className="expiry-table">
                <thead>
                  <tr>
                    <th>Name</th>
                    <th>Quantity</th>
                    <th>Batch No</th>
                    <th>Supplier Name</th>
                    <th>Supplier Contact</th>
                    <th>Expiry Date</th>
                  </tr>
                </thead>
                <tbody>
                  {expiringMedicines.expiringSoon.map((med) => (
                    <tr key={med._id}>
                      <td>{med.medicine?.name || "N/A"}</td>
                      <td>{med.stockQuantity} units</td>
                      <td>{med.batchNumber}</td>
                      <td>{med.supplier?.name || "N/A"}</td>
                      <td>{med.supplier?.phone || "N/A"}</td>
                      <td>{new Date(med.expiryDate).toLocaleDateString()}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            ) : (
              <p>No medicines expiring within the next 4 days.</p>
            )}
            {/* Expired Medicines Section */}
            <h3 style={{ marginTop: "20px", color: "darkred" }}>
              Expired Medicines
            </h3>
            {expiringMedicines?.expired?.length > 0 ? (
              <table className="expired-medicine-table">
                <thead>
                  <tr>
                    <th>Name</th>
                    <th>Quantity</th>
                    <th>Batch No</th>
                    <th>Supplier Name</th>
                    <th>Supplier Contact</th>
                    <th>Expired On</th>
                  </tr>
                </thead>
                <tbody>
                  {expiringMedicines.expired.map((med) => (
                    <tr key={med._id}>
                      <td>{med.medicine?.name || "N/A"}</td>
                      <td>{med.stockQuantity} units</td>
                      <td>{med.batchNumber}</td>
                      <td>{med.supplier?.name || "N/A"}</td>
                      <td>{med.supplier?.phone || "N/A"}</td>
                      <td>{new Date(med.expiryDate).toLocaleDateString()}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            ) : (
              <p>No expired medicines found.</p>
            )}
          </div>
        )}

        {activeTab === "medicineRequests" && (
          <div className="card card-blue">
            <h3>Request Medicine</h3>
            <form onSubmit={handleRequestSubmit}>
              <input
                type="text"
                placeholder="Medicine Name"
                value={medicineName}
                onChange={(e) => setMedicineName(e.target.value)}
                required
              />
              <input
                type="text"
                placeholder="Category (e.g., Tablet, Syrup)"
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                required
              />
              <input
                type="text"
                placeholder="Strength/Dosage (e.g., 500mg)"
                value={dosage}
                onChange={(e) => setDosage(e.target.value)}
                required
              />
              <input
                type="text"
                placeholder="Composition"
                value={composition}
                onChange={(e) => setComposition(e.target.value)}
                required
              />
              <input
                type="text"
                placeholder="Manufacturer"
                value={manufacturer}
                onChange={(e) => setManufacturer(e.target.value)}
                required
              />
              <button type="submit">Request Medicine</button>
            </form>

            <h3>Requested Medicines</h3>
            <table className="medicine-requests-table">
              <thead>
                <tr>
                  <th>Date</th>
                  <th>Medicine Name</th>
                  <th>Category</th>
                  <th>Strength/Dosage</th>
                  <th>Composition</th>
                  <th>Manufacturer</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {requests.map((request) => (
                  <tr key={request._id}>
                    <td>{new Date(request.createdAt).toLocaleDateString()}</td>
                    <td>{request.medicineName}</td>
                    <td>{request.category}</td>
                    <td>{request.strengthDosage}</td>
                    <td>{request.composition}</td>
                    <td>{request.manufacturer}</td>
                    <td>
                      <span
                        className={`status-badge ${
                          request.status === "Approved"
                            ? "approved"
                            : request.status === "Rejected"
                            ? "rejected"
                            : "pending"
                        }`}
                      >
                        {request.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {activeTab === "suppliers" && (
          <div className="card card-gray">
            <h3>Suppliers</h3>
            <table className="suppliers-table">
              <thead>
                <tr>
                  <th>Name</th>
                  <th>Contact Person</th>
                  <th>Phone</th>
                  <th>Email</th>
                  <th>Address</th>
                  <th>GST Number</th>
                </tr>
              </thead>
              <tbody>
                {suppliers.map((supplier) => (
                  <tr key={supplier._id}>
                    <td>{supplier.name}</td>
                    <td>{supplier.contactPerson || "N/A"}</td>
                    <td>{supplier.phone || "N/A"}</td>
                    <td>{supplier.email || "N/A"}</td>
                    <td>{supplier.address || "N/A"}</td>
                    <td>{supplier.gstNumber || "N/A"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};

export default PharmacistDashboard;
