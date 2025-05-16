import React, { useEffect, useState } from "react";
import LogoutButton from "../login/LogoutButton";
import axios from "axios";
import {
  FaUsers,
  FaPills,
  FaReceipt,
  FaPlusSquare,
  FaChartBar,
  FaClipboardCheck,
  FaSearch,
  FaClock,
  FaChartLine,
} from "react-icons/fa";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
} from "recharts";
import "./AdminDashboard.css";
import { FaBoxes } from "react-icons/fa";
import logo from "../assets/logo.png";
const AdminDashboard = () => {
  const [suppliers, setSuppliers] = useState([]);
  const [newSupplier, setNewSupplier] = useState({
    name: "",
    contactPerson: "",
    phone: "",
    email: "",
    address: "",
    gstNumber: "",
  });
  const today = new Date().toISOString().split("T")[0];
  const [activeTab, setActiveTab] = useState("allStocks");
  const [stocks, setStocks] = useState([]);
  const [workers, setWorkers] = useState([]);
  const [invoices, setInvoices] = useState([]);
  const [expiryAlerts, setExpiryAlerts] = useState({
    expired: [],
    expiringSoon: [],
  });
  const [expiringMedicines, setExpiringMedicines] = useState({
    expired: [],
    expiringSoon: [],
  });
  const [requests, setRequests] = useState([]);
  const [totalSales, setTotalSales] = useState(0);
  const [dailySales, setDailySales] = useState([]);
  const [totalGST, setTotalGST] = useState(0);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedTransaction, setSelectedTransaction] = useState(null);
  const [transactionSearch, setTransactionSearch] = useState("");
  const [newWorker, setNewWorker] = useState({
    name: "",
    email: "",
    password: "",
    role: "Cashier",
  });
  const [formData, setFormData] = useState({
    name: "",
    category: "",
    strengthDosage: "",
    composition: "",
    manufacturer: "",
    gstTaxRate: "",
  });
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
  const [batches, setBatches] = useState([]);
  const [medicines, setMedicines] = useState([]);
  //const [activeTab, setActiveTab] = useState("stock");
  const [demandData, setDemandData] = useState([]);

  useEffect(() => {
    fetchSuppliers();
  }, []);
  useEffect(() => {
    const processSalesData = () => {
      const salesMap = new Map();

      invoices.forEach((invoice) => {
        const date = new Date(invoice.date);
        const day = date.getDate();
        const formattedDate = `${day}`;

        if (!salesMap.has(formattedDate)) {
          salesMap.set(formattedDate, { date: formattedDate, totalSales: 0 });
        }

        salesMap.get(formattedDate).totalSales += invoice.totalBill || 0;
      });

      const sortedData = Array.from(salesMap.values()).sort(
        (a, b) => a.date - b.date
      );
      setDailySales(sortedData);
    };

    processSalesData();
  }, [invoices]);

  useEffect(() => {
    fetchStocks();
    fetchWorkers();
    fetchInvoices();
    fetchExpiryAlerts();
    fetchRequests();
  }, []);

  useEffect(() => {
    if (activeTab === "medicineStock") {
      fetchBatches();
    }
  }, [activeTab]);

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
    const fetchDemandData = async () => {
      try {
        const response = await fetch(
          `${process.env.REACT_APP_BACKEND_URL}/api/demand-prediction`
        );
        const data = await response.json();
        console.log("Demand Data:", data); // Log the response to debug
        setDemandData(data); // Ensure the response is an array
      } catch (error) {
        console.error("Error fetching demand data:", error);
        setDemandData([]); // Set to an empty array on error
      }
    };

    fetchDemandData();
  }, []);

  useEffect(() => {
    console.log("Initial Demand Data:", demandData);
  }, [demandData]);

  const updateBatchForm = (field, value) => {
    setBatchForm((prev) => ({ ...prev, [field]: value }));
  };

  const fetchSuppliers = async () => {
    try {
      const response = await axios.get(
        `${process.env.REACT_APP_BACKEND_URL}/api/suppliers`
      );
      setSuppliers(response.data);
    } catch (error) {
      console.error("Error fetching suppliers:", error);
    }
  };

  const handleSupplierChange = (e) => {
    setNewSupplier({ ...newSupplier, [e.target.name]: e.target.value });
  };

  const handleSupplierSubmit = async (e) => {
    e.preventDefault();
    try {
      await axios.post(`${process.env.REACT_APP_BACKEND_URL}/api/suppliers`, newSupplier);
      alert("Supplier added successfully!");
      setNewSupplier({
        name: "",
        contactPerson: "",
        phone: "",
        email: "",
        address: "",
        gstNumber: "",
      });
      fetchSuppliers();
    } catch (error) {
      console.error("Error adding supplier:", error);
      alert("Failed to add supplier.");
    }
  };

  const handleEditSupplier = async (supplierId) => {
    const updatedName = prompt("Enter new Supplier Name:");
    if (!updatedName) return;

    try {
      await axios.put(`${process.env.REACT_APP_BACKEND_URL}/api/suppliers/${supplierId}`, {
        name: updatedName,
      });
      alert("Supplier updated successfully!");
      fetchSuppliers();
    } catch (error) {
      console.error("Error updating supplier:", error);
      alert("Failed to update supplier.");
    }
  };

  const handleDeleteSupplier = async (supplierId) => {
    if (window.confirm("Are you sure you want to delete this supplier?")) {
      try {
        await axios.delete(`${process.env.REACT_APP_BACKEND_URL}/api/suppliers/${supplierId}`
        );
        alert("Supplier deleted successfully!");
        fetchSuppliers();
      } catch (error) {
        console.error("Error deleting supplier:", error);
        alert("Failed to delete supplier.");
      }
    }
  };

  const fetchStocks = async () => {
    try {
      const response = await axios.get(`${process.env.REACT_APP_BACKEND_URL}/api/medicines`);
      console.log("Stocks fetched:", response.data);
      setStocks(response.data); // Set the fetched data into the state
    } catch (error) {
      console.error("Error fetching stocks:", error);
    }
  };

  const fetchWorkers = async () => {
    try {
      const response = await axios.get(`${process.env.REACT_APP_BACKEND_URL}/api/workers`);
      setWorkers(response.data);
    } catch (error) {
      console.error("Error fetching workers:", error);
    }
  };

  const handleWorkerChange = (e) => {
    setNewWorker({ ...newWorker, [e.target.name]: e.target.value });
  };

  const handleWorkerSubmit = async (e) => {
    e.preventDefault();
    try {
      await axios.post(`${process.env.REACT_APP_BACKEND_URL}/api/worker`, newWorker);
      alert("Worker added successfully!");
      setNewWorker({ name: "", email: "", password: "", role: "Cashier" });
      fetchWorkers();
    } catch (error) {
      console.error("Error adding worker:", error);
      alert("Failed to add worker.");
    }
  };

  const fetchInvoices = async () => {
    try {
      const response = await axios.get(`${process.env.REACT_APP_BACKEND_URL}/api/invoices`);
      setInvoices(response.data);
      calculateSalesOverview(response.data); // Call function here
    } catch (error) {
      console.error("Error fetching invoices:", error);
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
      console.error("Error fetching stock requests:", error);
    }
  };

  const deleteMedicine = async (id) => {
    if (window.confirm("Are you sure you want to delete this medicine?")) {
      try {
        await axios.delete(`${process.env.REACT_APP_BACKEND_URL}/api/delete-medicine/${id}`);
        fetchExpiryAlerts(); // Refresh data after deletion
        fetchStocks();
      } catch (error) {
        console.error("Error deleting medicine:", error);
      }
    }
  };

  const calculateSalesOverview = (invoices) => {
    if (!invoices || invoices.length === 0) {
      setTotalSales(0);
      setTotalGST(0);
      return;
    }

    let total = 0;
    let gst = 0;
    invoices.forEach((invoice) => {
      total += invoice.totalBill || 0;
      gst += invoice.totalGST || 0;
    });

    setTotalSales(total);
    setTotalGST(gst);
  };

  const handleApprove = async (id) => {
    try {
      const response = await fetch(
        `${process.env.REACT_APP_BACKEND_URL}/api/approve-request/${id}`,
        { method: "PUT" }
      );
      if (response.ok) {
        alert("Request approved");
        fetchRequests(); // Refresh the requests
      } else {
        alert("Failed to approve request");
      }
    } catch (error) {
      console.error("Error approving request:", error);
    }
  };

  const handleReject = async (id) => {
    try {
      const response = await fetch(
        `${process.env.REACT_APP_BACKEND_URL}/api/reject-request/${id}`,
        { method: "PUT" }
      );
      if (response.ok) {
        alert("Request rejected");
        fetchRequests(); // Refresh the requests
      } else {
        alert("Failed to reject request");
      }
    } catch (error) {
      console.error("Error rejecting request:", error);
    }
  };

  const addMedicine = async () => {
    const {
      name,
      category,
      strengthDosage,
      composition,
      manufacturer,
      gstTaxRate,
      strips,
      tabletsPerStrip,
    } = formData;

    // Validate required fields
    if (
      !name ||
      !category ||
      !strengthDosage ||
      !composition ||
      !manufacturer ||
      !gstTaxRate
    ) {
      alert("Please fill all required fields.");
      return;
    }

    // Calculate total quantity for Tablet or Capsule
    let totalQuantity = 0;
    if (category === "Tablet" || category === "Capsule") {
      if (!strips || !tabletsPerStrip) {
        alert("Please provide the number of strips and tablets per strip.");
        return;
      }
      totalQuantity = strips * tabletsPerStrip;
    }

    try {
      const payload = {
        name,
        category,
        strengthDosage,
        composition,
        manufacturer,
        gstTaxRate: Number(gstTaxRate),
        totalQuantity, // Include total quantity in the payload
      };

      await axios.post(`${process.env.REACT_APP_BACKEND_URL}/api/add-medicine`, payload);

      fetchStocks();

      // Reset the form
      setFormData({
        name: "",
        category: "",
        strengthDosage: "",
        composition: "",
        manufacturer: "",
        gstTaxRate: "",
        strips: "",
        tabletsPerStrip: "",
      });
    } catch (error) {
      console.error("Error adding medicine:", error);
    }
  };

  const handleTransactionClick = async (billId) => {
    try {
      const response = await axios.get(
        `${process.env.REACT_APP_BACKEND_URL}/api/invoice-details/${billId}`
      );
      setSelectedTransaction(response.data); // Store full details in state
    } catch (err) {
      console.error("Error fetching transaction details:", err);
    }
  };

  const filteredTransactions = invoices.filter((txn) => {
    return (
      txn.billId.toLowerCase().includes(transactionSearch.toLowerCase()) ||
      txn.customerName
        .toLowerCase()
        .includes(transactionSearch.toLowerCase()) ||
      txn.customerPhone.includes(transactionSearch) ||
      new Date(txn.date).toLocaleDateString().includes(transactionSearch)
    );
  });

  const handleEditWorker = async (workerId) => {
    const newPassword = prompt("Enter new Password: ");
    console.log(newPassword);
    try {
      await axios.put(
        `${process.env.REACT_APP_BACKEND_URL}/api/update-worker/${workerId}`,
        {
          newPassword: newPassword,
        }
      );
      alert("successful updated");
    } catch (error) {
      console.error("Error updating worker:", error);
    }
  };

  const handleDeleteWorker = async (workerId) => {
    if (window.confirm("Are you sure you want to delete this worker?")) {
      try {
        await axios.delete(
          `${process.env.REACT_APP_BACKEND_URL}/api/delete-worker/${workerId}`
        );
        fetchWorkers();
      } catch (error) {
        console.error("Error deleting worker:", error);
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

  return (
    <div className="admin-dashboard-container">
      <div className="admin-sidebar">
        <div className="dashboard-header">
          <img src={logo} alt="Logo" className="dashboard-logo" />
        </div>
        <h2 className="role-title">Admin</h2>
        <button
          className={
            activeTab === "allStocks"
              ? "admin-sidebar-button active"
              : "admin-sidebar-button"
          }
          onClick={() => setActiveTab("allStocks")}
        >
          <FaPills />
          Drugs
        </button>
        <button
          className={`sidebar-button ${
            activeTab === "allStock"
              ? "admin-sidebar-button active"
              : "admin-sidebar-button"
          }`}
          onClick={() => setActiveTab("AddStock")}
        >
          <FaPlusSquare /> Add Medicine
        </button>
        <button
          className={
            activeTab === "manageWorkers"
              ? "admin-sidebar-button active"
              : "admin-sidebar-button"
          }
          onClick={() => setActiveTab("manageWorkers")}
        >
          <FaUsers /> Manage Workers
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
          className={
            activeTab === "manageSuppliers"
              ? "admin-sidebar-button active"
              : "admin-sidebar-button"
          }
          onClick={() => setActiveTab("manageSuppliers")}
        >
          <FaClipboardCheck /> Manage Suppliers
        </button>
        <button
          className={
            activeTab === "salesOverview"
              ? "admin-sidebar-button active"
              : "admin-sidebar-button"
          }
          onClick={() => setActiveTab("salesOverview")}
        >
          <FaChartBar /> Sales Overview
        </button>
        <button
          className={`sidebar-button ${
            activeTab === "Transactions"
              ? "admin-sidebar-button active"
              : "admin-sidebar-button"
          }`}
          onClick={() => setActiveTab("Transactions")}
        >
          <FaReceipt />
          Transactions
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
            activeTab === "demand"
              ? "admin-sidebar-button active"
              : "admin-sidebar-button"
          }`}
          onClick={() => setActiveTab("demand")}
        >
          <FaChartLine /> Demand Prediction
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
        <button>
          <LogoutButton />
        </button>
      </div>
      <div>
        <div className="admin-content">
          {activeTab === "allStocks" && (
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
                        <th>Action</th> {/* NEW COLUMN */}
                      </tr>
                    </thead>
                    <tbody>
                      {stocks
                        .filter(
                          (med) =>
                            med.name.toLowerCase().includes(searchTerm) ||
                            med.category.toLowerCase().includes(searchTerm) ||
                            med.composition
                              .toLowerCase()
                              .includes(searchTerm) ||
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
                            <td>
                              <button
                                className="delete-btn"
                                onClick={() => deleteMedicine(med._id)}
                              >
                                Delete
                              </button>
                            </td>
                          </tr>
                        ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {activeTab === "AddStock" && (
            <div className="card card-blue">
              <h3>Stock Management</h3>
              <input
                type="text"
                placeholder="Medicine Name"
                required
                value={formData.name}
                onChange={(e) =>
                  setFormData({ ...formData, name: e.target.value })
                }
              />

              <select
                required
                value={formData.category}
                onChange={(e) =>
                  setFormData({ ...formData, category: e.target.value })
                }
              >
                <option value="">Select Category</option>
                <option value="Tablet">Tablet</option>
                <option value="Capsule">Capsule</option>
                <option value="Syrup">Syrup</option>
                <option value="Injection">Injection</option>
                <option value="Other">Other</option>
              </select>

              {/* Conditionally render fields for strips and tablets per strip */}
              {(formData.category === "Tablet" ||
                formData.category === "Capsule") && (
                <>
                  <input
                    type="number"
                    placeholder="Number of Strips"
                    required
                    value={formData.strips}
                    onChange={(e) =>
                      setFormData({ ...formData, strips: e.target.value })
                    }
                  />
                  <input
                    type="number"
                    placeholder="Tablets per Strip"
                    required
                    value={formData.tabletsPerStrip}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        tabletsPerStrip: e.target.value,
                      })
                    }
                  />
                </>
              )}

              <input
                type="text"
                placeholder="Dosage (e.g., 500mg)"
                required
                value={formData.strengthDosage}
                onChange={(e) =>
                  setFormData({ ...formData, strengthDosage: e.target.value })
                }
              />

              <input
                type="text"
                placeholder="Composition (Active Ingredients)"
                required
                value={formData.composition}
                onChange={(e) =>
                  setFormData({ ...formData, composition: e.target.value })
                }
              />

              <input
                type="text"
                placeholder="Manufacturer"
                required
                value={formData.manufacturer}
                onChange={(e) =>
                  setFormData({ ...formData, manufacturer: e.target.value })
                }
              />

              <input
                type="number"
                placeholder="GST/Tax Rate (%)"
                required
                value={formData.gstTaxRate}
                onChange={(e) =>
                  setFormData({ ...formData, gstTaxRate: e.target.value })
                }
              />

              <button onClick={addMedicine}>Add Medicine</button>
            </div>
          )}

          {activeTab === "manageWorkers" && (
            <div className="card card-green">
              <div className="manage-workers-container">
                <h3>Manage Workers</h3>
                <form
                  className="manage-workers-form"
                  onSubmit={handleWorkerSubmit}
                >
                  <input
                    type="text"
                    name="name"
                    placeholder="Worker Name"
                    value={newWorker.name}
                    onChange={handleWorkerChange}
                    required
                  />
                  <input
                    type="email"
                    name="email"
                    placeholder="Worker Email"
                    value={newWorker.email}
                    onChange={handleWorkerChange}
                    required
                  />
                  <input
                    type="password"
                    name="password"
                    placeholder="Password"
                    value={newWorker.password}
                    onChange={handleWorkerChange}
                    required
                  />
                  <select
                    name="role"
                    value={newWorker.role}
                    onChange={handleWorkerChange}
                  >
                    <option value="Cashier">Cashier</option>
                    <option value="Pharmacist">Pharmacist</option>
                  </select>
                  <button
                    type="submit"
                    className="btn btn-green"
                    style={{ width: "20%" }}
                  >
                    Add Worker
                  </button>
                </form>

                <table className="manage-workers-table">
                  <thead>
                    <tr>
                      <th>Name</th>
                      <th>Email</th>
                      <th>Role</th>
                      <th>Actions</th> {/* New column for actions */}
                    </tr>
                  </thead>
                  <tbody>
                    {workers.map((worker) => (
                      <tr key={worker._id}>
                        <td>{worker.name}</td>
                        <td>{worker.email}</td>
                        <td>{worker.role}</td>
                        <td>
                          {/* Edit Button */}
                          <button
                            className="edit-btn"
                            onClick={() => handleEditWorker(worker._id)}
                          >
                            ✏️ Edit
                          </button>

                          {/* Delete Button */}
                          <button
                            className="delete-btn"
                            onClick={() => handleDeleteWorker(worker._id)}
                          >
                            ❌ Delete
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
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
                    <input
                      type="text"
                      placeholder="Supplier Name"
                      value={batchForm.supplier}
                      onChange={(e) =>
                        updateBatchForm("supplier", e.target.value)
                      }
                      required
                    />
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
                        <td>{batch.medicine.name}</td>
                        <td>
                          {new Date(batch.expiryDate).toLocaleDateString()}
                        </td>
                        <td>{batch.stockQuantity}</td>
                        <td>₹{batch.purchasePrice}</td>
                        <td>₹{batch.sellingPrice}</td>
                        <td>{batch.supplier.name}</td>
                        <td>{batch.storageLocation}</td>
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

          {activeTab === "manageSuppliers" && (
            <div className="card card-yellow">
              <h3>Manage Suppliers</h3>
              <form
                className="manage-suppliers-form"
                onSubmit={handleSupplierSubmit}
              >
                <input
                  type="text"
                  name="name"
                  placeholder="Supplier Name"
                  value={newSupplier.name}
                  onChange={handleSupplierChange}
                  required
                />
                <input
                  type="text"
                  name="contactPerson"
                  placeholder="Contact Person"
                  value={newSupplier.contactPerson}
                  onChange={handleSupplierChange}
                />
                <input
                  type="text"
                  name="phone"
                  placeholder="Phone"
                  value={newSupplier.phone}
                  onChange={handleSupplierChange}
                />
                <input
                  type="email"
                  name="email"
                  placeholder="Email"
                  value={newSupplier.email}
                  onChange={handleSupplierChange}
                />
                <input
                  type="text"
                  name="address"
                  placeholder="Address"
                  value={newSupplier.address}
                  onChange={handleSupplierChange}
                />
                <input
                  type="text"
                  name="gstNumber"
                  placeholder="GST Number"
                  value={newSupplier.gstNumber}
                  onChange={handleSupplierChange}
                />
                <button type="submit" className="btn btn-green">
                  Add Supplier
                </button>
              </form>

              <table className="manage-suppliers-table">
                <thead>
                  <tr>
                    <th>Name</th>
                    <th>Contact Person</th>
                    <th>Phone</th>
                    <th>Email</th>
                    <th>Address</th>
                    <th>GST Number</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {suppliers.map((supplier) => (
                    <tr key={supplier._id}>
                      <td>{supplier.name}</td>
                      <td>{supplier.contactPerson}</td>
                      <td>{supplier.phone}</td>
                      <td>{supplier.email}</td>
                      <td>{supplier.address}</td>
                      <td>{supplier.gstNumber}</td>
                      <td>
                        <button
                          className="edit-btn"
                          onClick={() => handleEditSupplier(supplier._id)}
                        >
                          ✏️ Edit
                        </button>
                        <button
                          className="delete-btn"
                          onClick={() => handleDeleteSupplier(supplier._id)}
                        >
                          ❌ Delete
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {activeTab === "salesOverview" && (
            <div className="card card-yellow">
              <h3>Daily Sales for the Month</h3>
              <div className="chart-container">
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={dailySales}>
                    <XAxis dataKey="date" />
                    <YAxis />
                    <Tooltip />
                    <CartesianGrid strokeDasharray="3 3" />
                    <Bar dataKey="totalSales" fill="#007bff" />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
          )}

          {activeTab === "Transactions" && (
            <div className="card card-yellow">
              <div className="transactions-container">
                <h3>Transactions</h3>
                <input
                  type="text"
                  placeholder="Search by ID, Name, Mobile, Date"
                  value={transactionSearch}
                  onChange={(e) => setTransactionSearch(e.target.value)}
                  className="transaction-search"
                />

                {invoices.length === 0 ? (
                  <p>No transactions found.</p>
                ) : (
                  <table className="transactions-table">
                    <thead>
                      <tr>
                        <th>ID</th>
                        <th>Customer Name</th>
                        <th>Phone</th>
                        <th>Total Bill (₹)</th>
                        <th>Date</th>
                        <th>Time</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredTransactions.length > 0 ? (
                        filteredTransactions.map((txn, index) => (
                          <tr key={index}>
                            <td
                              style={{
                                color: "blue",
                                cursor: "pointer",
                                textDecoration: "underline",
                              }}
                              onClick={() => handleTransactionClick(txn.billId)}
                            >
                              {txn.billId}
                            </td>
                            <td>{txn.customerName}</td>
                            <td>{txn.customerPhone}</td>
                            <td>₹{txn.totalBill}</td>
                            <td>{new Date(txn.date).toLocaleDateString()}</td>
                            <td>{new Date(txn.date).toLocaleTimeString()}</td>
                          </tr>
                        ))
                      ) : (
                        <tr>
                          <td colSpan="6">No matching transactions found.</td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                )}

                {/* Show transaction details when a transaction is selected */}
                {selectedTransaction && (
                  <div className="transaction-details-modal">
                    <h2>Transaction Details</h2>
                    <p>
                      <strong>Invoice ID:</strong> {selectedTransaction.billId}
                    </p>
                    <p>
                      <strong>Customer Name:</strong>{" "}
                      {selectedTransaction.customerName}
                    </p>
                    <p>
                      <strong>Phone:</strong>{" "}
                      {selectedTransaction.customerPhone}
                    </p>
                    <p>
                      <strong>Total Amount:</strong> ₹
                      {selectedTransaction.totalAmount}
                    </p>
                    <p>
                      <strong>Total GST:</strong> ₹
                      {selectedTransaction.totalGST}
                    </p>
                    <p>
                      <strong>Total Bill:</strong> ₹
                      {selectedTransaction.totalBill}
                    </p>

                    <h3>Medicines Purchased:</h3>
                    <ul>
                      {selectedTransaction.medicines.map((med, i) => (
                        <li key={i}>
                          {med.medicineName} - {med.quantity} x ₹
                          {med.sellingPrice} = ₹{med.totalPrice}
                        </li>
                      ))}
                    </ul>

                    <button onClick={() => setSelectedTransaction(null)}>
                      Close
                    </button>
                  </div>
                )}
              </div>
            </div>
          )}

          {activeTab === "medicineRequests" && (
            <div className="card card-blue">
              <h3>Medicine Requests</h3>
              <table className="medicine-requests-table">
                <thead>
                  <tr>
                    <th>Date</th>
                    <th>Medicine Name</th>
                    <th>Category</th>
                    <th>Strength/Dosage</th>
                    <th>Requested By</th>
                    <th>Status</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {requests.map((request) => (
                    <tr key={request._id}>
                      <td>
                        {new Date(request.createdAt).toLocaleDateString()}
                      </td>
                      <td>{request.medicineName}</td>
                      <td>{request.category}</td>
                      <td>{request.strengthDosage}</td>
                      <td>{request.requestedBy?.name || "Unknown"}</td>
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
                      <td>
                        {request.status === "Pending" && (
                          <>
                            <button
                              className="approve-btn"
                              onClick={() => handleApprove(request._id)}
                            >
                              Approve
                            </button>
                            <button
                              className="reject-btn"
                              onClick={() => handleReject(request._id)}
                            >
                              Reject
                            </button>
                          </>
                        )}
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

          {activeTab === "demand" && (
            <div className="card card-blue">
              <h3>Demand Prediction</h3>
              {Array.isArray(demandData) && demandData.length > 0 ? (
                <table className="demand-table">
                  <thead>
                    <tr>
                      <th>Medicine Name</th>
                      <th>Total Quantity Sold</th>
                    </tr>
                  </thead>
                  <tbody>
                    {demandData.map((item) => (
                      <tr key={item.medicineName}>
                        <td>{item.medicineName}</td>
                        <td>{item.quantity}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              ) : (
                <p>No demand data available.</p>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default AdminDashboard;
