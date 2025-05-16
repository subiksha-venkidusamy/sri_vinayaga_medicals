import React, { useState, useEffect } from "react";
import LogoutButton from "../login/LogoutButton";
import axios from "axios";
import { ArrowLeft, CheckCircle, Pencil, Trash } from "lucide-react";
import "./CashierDashboard.css";
import jsPDF from "jspdf";
import logo from "../assets/logo.png";
import "./style.css";
const CashierDashboard = () => {
  const [customerName, setCustomerName] = useState("");
  const [customerPhone, setCustomerPhone] = useState("");
  const [customerDetailsEntered, setCustomerDetailsEntered] = useState(false);
  const [billId, setBillId] = useState("");
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [activeTab, setActiveTab] = useState("Dashboard");
  const [showSuccessPage, setShowSuccessPage] = useState(false);
  const [medicines, setMedicines] = useState([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedMedicines, setSelectedMedicines] = useState([]);
  const [totalAmount, setTotalAmount] = useState(0);
  const [totalGST, setTotalGST] = useState(0);
  const [totalBill, setTotalBill] = useState(0);
  const [invoiceGenerated, setInvoiceGenerated] = useState(false);
  const [transactions, setTransactions] = useState([]);
  const [selectedTransaction, setSelectedTransaction] = useState(null);
  const [transactionSearch, setTransactionSearch] = useState("");
  const [isBillingActive, setIsBillingActive] = useState(false);
  useEffect(() => {
    setBillId(`SVM-${Date.now()}-${Math.floor(Math.random() * 1000)}`);
  }, []);

  const fetchMedicines = async (query) => {
    try {
      const response = await axios.get(
        "http://localhost:5000/api/search-medicine",
        {
          params: { name: query },
        }
      );
      setMedicines(response.data);
    } catch (err) {
      console.error("Error fetching medicines:", err);
    }
  };

  useEffect(() => {
    if (searchQuery === "") {
      setMedicines([]);
    } else {
      fetchMedicines(searchQuery);
    }
  }, [searchQuery]);

  useEffect(() => {
    if (activeTab === "Transactions") {
      axios
        .get("http://localhost:5000/api/invoices")
        .then((response) => setTransactions(response.data))
        .catch((error) => console.error("Error fetching transactions:", error));
    }
  }, [activeTab]);

  useEffect(() => {
    if (searchQuery === "") {
      setMedicines([]);
    } else {
      fetchMedicines(searchQuery);
    }
  }, [searchQuery]);

  useEffect(() => {
    console.log("Medicines State:", medicines); // Debugging
  }, [medicines]);

  const handleTransactionClick = async (billId) => {
    try {
      const response = await axios.get(
        `http://localhost:5000/api/invoice-details/${billId}`
      );
      setSelectedTransaction(response.data); // Store full details in state
    } catch (err) {
      console.error("Error fetching transaction details:", err);
    }
  };

  const searchMedicines = (e) => {
    setSearchQuery(e.target.value);
  };

  const addMedicineToBill = async (medicineName, quantity) => {
    if (!quantity || quantity <= 0) {
      alert("Please enter a valid quantity.");
      return;
    }

    try {
      console.log("Medicine Name:", medicineName); // Debugging

      // Step 1: Fetch the medicine ID from the Medicine table
      const medicineResponse = await axios.get(
        `http://localhost:5000/api/search-medicine?name=${medicineName}`
      );

      console.log("Medicine Response:", medicineResponse.data); // Debugging

      if (medicineResponse.data.length === 0) {
        alert("Medicine not found in the database.");
        return;
      }

      const medicineId = medicineResponse.data[0]._id; // Get the first matching medicine ID
      console.log("Medicine ID:", medicineId); // Debugging

      // Step 2: Fetch the price and stock details from the MedicineBatch table
      const batchResponse = await axios.get(
        `http://localhost:5000/api/medicine-batch/${medicineId}`
      );

      console.log("Batch Response:", batchResponse.data); // Debugging

      const medicineBatch = batchResponse.data;

      if (quantity > medicineBatch.stockQuantity) {
        alert("Insufficient stock for this medicine.");
        return;
      }

      // Step 3: Add the medicine to the bill
      const gstRate = medicineBatch.gstTaxRate || 0;
      const gst = (medicineBatch.sellingPrice * quantity * gstRate) / 100;
      const totalPrice = medicineBatch.sellingPrice * quantity + gst;

      const newMedicine = {
        medicineId: medicineBatch._id,
        medicineName: medicineBatch.name,
        quantity,
        sellingPrice: medicineBatch.sellingPrice,
        gstTaxRate: gstRate,
        gst,
        totalPrice,
      };

      const updatedMedicines = [...selectedMedicines, newMedicine];

      setSelectedMedicines(updatedMedicines);
      setTotalAmount(
        updatedMedicines.reduce((sum, med) => sum + med.totalPrice, 0)
      );
      setTotalGST(updatedMedicines.reduce((sum, med) => sum + med.gst, 0));
      setTotalBill(
        updatedMedicines.reduce((sum, med) => sum + med.totalPrice, 0)
      );
    } catch (err) {
      console.error("Error fetching medicine details:", err);
      alert("Failed to fetch medicine details. Please try again.");
    }
  };

  const startBilling = () => {
    setIsBillingActive(true);
  };

  const endBilling = () => {
    setIsBillingActive(false);
  };

  const editMedicineQuantity = (index) => {
    const newQuantity = parseInt(prompt("Enter new quantity:"), 10);
    if (!newQuantity || newQuantity <= 0) {
      alert("Invalid quantity!");
      return;
    }

    const updatedMedicines = [...selectedMedicines];
    const medicine = updatedMedicines[index];

    if (newQuantity > medicine.stockQuantity) {
      alert("Insufficient stock for this medicine.");
      return;
    }

    // Recalculate GST & total price based on database GST percentage
    const oldTotal = medicine.totalPrice;
    const oldGST = medicine.gst;

    medicine.quantity = newQuantity;
    medicine.gst =
      (medicine.sellingPrice * newQuantity * medicine.gstTaxRate) / 100;
    medicine.totalPrice = medicine.sellingPrice * newQuantity + medicine.gst;

    const newTotalAmount =
      totalAmount - (oldTotal - oldGST) + (medicine.totalPrice - medicine.gst);
    const newTotalGST = totalGST - oldGST + medicine.gst;
    const newTotalBill = newTotalAmount + newTotalGST;

    setSelectedMedicines(updatedMedicines);
    setTotalAmount(newTotalAmount);
    setTotalGST(newTotalGST);
    setTotalBill(newTotalBill);
  };

  const deleteMedicineFromBill = (index) => {
    if (!window.confirm("Are you sure you want to delete this item?")) return;

    const updatedMedicines = [...selectedMedicines];
    const medicine = updatedMedicines[index];

    updatedMedicines.splice(index, 1);

    const newTotalAmount = totalAmount - (medicine.totalPrice - medicine.gst);
    const newTotalGST = totalGST - medicine.gst;
    const newTotalBill = newTotalAmount + newTotalGST;

    setSelectedMedicines(updatedMedicines);
    setTotalAmount(newTotalAmount);
    setTotalGST(newTotalGST);
    setTotalBill(newTotalBill);
  };

  const handlePayment = async () => {
    if (selectedMedicines.length === 0) {
      alert(
        "No items in the bill. Please add medicines before confirming payment."
      );
      return;
    }

    try {
      // Prepare the data for the invoice
      const invoiceData = {
        billId,
        customerName,
        customerPhone,
        medicines: selectedMedicines.map((med) => ({
          medicineId: med.medicineId,
          medicineName: med.medicineName,
          quantity: med.quantity,
          sellingPrice: med.sellingPrice,
          gstTaxRate: med.gstTaxRate,
          gst: med.gst,
          totalPrice: med.totalPrice,
        })),
        totalAmount,
        totalGST,
        totalBill,
      };

      // Send the invoice data to the backend
      await axios.post(
        "http://localhost:5000/api/generate-invoice",
        invoiceData
      );

      setInvoiceGenerated(true);
      setShowSuccessPage(true); // Show success page
    } catch (err) {
      console.error("Error generating invoice:", err);
      alert("Failed to generate invoice. Please try again.");
    }
  };

  const filteredTransactions = transactions.filter((txn) => {
    return (
      txn.billId.toLowerCase().includes(transactionSearch.toLowerCase()) ||
      txn.customerName
        .toLowerCase()
        .includes(transactionSearch.toLowerCase()) ||
      txn.customerPhone.includes(transactionSearch) ||
      new Date(txn.date).toLocaleDateString().includes(transactionSearch)
    );
  });
  // Function to reset and go back to customer details
  const handleDone = () => {
    setShowSuccessPage(false);
    setCustomerDetailsEntered(false);
    setSelectedMedicines([]);
    setTotalAmount(0);
    setTotalGST(0);
    setTotalBill(0);
    setBillId(`SVM-${Date.now()}-${Math.floor(Math.random() * 1000)}`);
    setCustomerName("");
    setCustomerPhone("");
  };

  const generatePDF = () => {
    const doc = new jsPDF();

    // Header
    doc.setFontSize(18);
    doc.text("Shri Vinayaga Medicals", 20, 20);
    doc.setFontSize(12);
    doc.text(`Invoice ID: ${billId}`, 20, 30);
    doc.text(`Customer Name: ${customerName}`, 20, 40);
    doc.text(`Phone: ${customerPhone}`, 20, 50);

    // Medicine List
    doc.text("Medicines:", 20, 60);
    let y = 70;
    selectedMedicines.forEach((med, index) => {
      doc.text(
        `${index + 1}. ${med.medicineName} - ${med.quantity} x ₹${
          med.sellingPrice
        } = ₹${med.totalPrice}`,
        20,
        y
      );
      y += 10;
    });

    // Totals
    doc.text(`Total Amount: ₹${totalAmount}`, 20, y + 10);
    doc.text(`Total GST: ₹${totalGST}`, 20, y + 20);
    doc.text(`Total Bill: ₹${totalBill}`, 20, y + 30);

    // Save the PDF
    doc.save(`Invoice_${billId}.pdf`);
  };

  return (
    <div className="dashboard-container">
      <div className={`sidebar ${sidebarOpen ? "open" : "closed"}`}>
        <img src={logo} alt="Logo" className="dashboard-logo" />
        <div className="role-title">Cashier Dashboard</div>
        <div
          className={`sidebar-button ${
            activeTab === "Dashboard" ? "active" : ""
          }`}
          onClick={() => setActiveTab("Dashboard")}
        >
          Dashboard
        </div>
        <div
          className={`sidebar-button ${
            activeTab === "Transactions" ? "active" : ""
          }`}
          onClick={() => setActiveTab("Transactions")}
        >
          Transactions
        </div>
        <button>
          <LogoutButton />
        </button>
      </div>

      <div className="content">
        <h1>{activeTab}</h1>

        {showSuccessPage ? (
          <div className="success-page">
            <div className="success-container">
              <CheckCircle size={50} color="green" className="success-icon" />
              <h2 className="success-title">Payment Successful!</h2>
              <p className="success-message">
                Thank you for your purchase at{" "}
                <strong>Shri Vinayaga Medicals</strong>.
              </p>

              <div className="invoice-details">
                <p>
                  <strong>Invoice ID:</strong> {billId}
                </p>
                <p>
                  <strong>Customer Name:</strong> {customerName}
                </p>
                <p>
                  <strong>Phone Number:</strong> {customerPhone}
                </p>
                <p>
                  <strong>Total Amount:</strong> ₹{totalBill}
                </p>
              </div>

              <p className="thank-you">
                We appreciate your business! Have a great day. 😊
              </p>

              <button className="done-button" onClick={handleDone}>
                Done
              </button>
            </div>
          </div>
        ) : (
          <>
            {activeTab === "Dashboard" &&
              (!customerDetailsEntered ? (
                <div className="customer-details">
                  <h3>Enter Customer Details</h3>
                  <input
                    type="text"
                    placeholder="Name"
                    value={customerName}
                    onChange={(e) => setCustomerName(e.target.value)}
                  />
                  <input
                    type="text"
                    placeholder="Phone"
                    value={customerPhone}
                    onChange={(e) => setCustomerPhone(e.target.value)}
                  />
                  <button
                    onClick={() => {
                      if (customerName && customerPhone) {
                        setCustomerDetailsEntered(true);
                      }
                      startBilling();
                    }}
                    className="proceed-to-bill-btn"
                  >
                    Proceed to Billing
                  </button>
                </div>
              ) : (
                <>
                  <span
                    className="back-button"
                    onClick={() => {
                      setCustomerDetailsEntered(false);
                      setSelectedMedicines([]);
                      setTotalAmount(0);
                      setTotalGST(0);
                      setTotalBill(0);
                      setBillId(
                        `SVM-${Date.now()}-${Math.floor(Math.random() * 1000)}`
                      );
                      setCustomerName("");
                      setCustomerPhone("");
                    }}
                    style={{ cursor: "pointer" }}
                  >
                    <ArrowLeft size={25} />
                  </span>

                  <div style={{ position: "relative" }}>
                    <input
                      type="text"
                      placeholder="Search Medicine"
                      value={searchQuery}
                      onChange={searchMedicines}
                    />

                    <div
                      className={`suggestion-container ${
                        medicines.length > 0 ? "show" : ""
                      }`}
                    >
                      {medicines.length > 0 ? (
                        medicines.map((medicine) => (
                          <div
                            key={medicine._id}
                            className={`suggestion-item ${
                              medicine.stockQuantity > 0
                                ? "available"
                                : "unavailable"
                            }`}
                            onClick={() => {
                              if (medicine.stockQuantity > 0) {
                                const quantity = prompt("Enter Quantity:");
                                if (quantity) {
                                  addMedicineToBill(
                                    medicine.name,
                                    parseInt(quantity, 10)
                                  );
                                }
                                setSearchQuery("");
                              }
                            }}
                          >
                            <div>
                              <strong>{medicine.name}</strong>
                            </div>
                            <div>
                              <div className="price">
                                ₹{medicine.sellingPrice}
                              </div>
                              <div
                                className={`stock ${
                                  medicine.stockQuantity > 0
                                    ? "in-stock"
                                    : "out-of-stock"
                                }`}
                              >
                                {medicine.stockQuantity > 0
                                  ? `${medicine.stockQuantity} in stock`
                                  : "Unavailable"}
                              </div>
                            </div>
                          </div>
                        ))
                      ) : (
                        <div className="no-results">No medicines found</div>
                      )}
                    </div>
                  </div>
                  <h2 className="bill-summary-title">Bill Summary</h2>

                  <div className="bill-summary-container">
                    <div className="bill-header">
                      <p style={{ textAlign: "right" }}>{billId}</p>
                      <h3 className="store-name">Shri Vinayaga Medicals</h3>
                      <p className="store-address">
                        46, Main Road, Aval Poondurai,
                      </p>
                      <p className="store-address">Erode-638115</p>

                      <div className="customer-bill-details">
                        <p>
                          <strong>Name:</strong> {customerName}
                        </p>
                        <p>
                          <strong>Phone:</strong> {customerPhone}
                        </p>
                      </div>
                    </div>

                    <table className="bill-table">
                      <thead>
                        <tr>
                          <th className="item-column">Item</th>
                          <th className="qty-column">Qty</th>
                          <th className="price-column">Price</th>
                          <th className="total-column">Total</th>
                          <th className="edit-column">Edit</th>
                          <th className="delete-column">Delete</th>
                        </tr>
                      </thead>
                      <tbody>
                        {selectedMedicines.map((medicine, index) => (
                          <tr key={index}>
                            <td>{medicine.medicineName}</td>
                            <td>{medicine.quantity}</td>
                            <td>₹{medicine.sellingPrice}</td>
                            <td>₹{medicine.totalPrice}</td>
                            <td>
                              <button
                                onClick={() => editMedicineQuantity(index)}
                                className="edit-button"
                              >
                                Edit
                              </button>
                            </td>
                            <td>
                              <button
                                onClick={() => deleteMedicineFromBill(index)}
                                className="delete-button"
                              >
                                Delete
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>

                    <div className="bill-footer">
                      <p>
                        <strong>Total Amount:</strong> ₹{totalAmount}
                      </p>
                      <p>
                        <strong>Total GST:</strong> ₹{totalGST}
                      </p>
                      <p>
                        <strong>Total Bill:</strong> ₹{totalBill}
                      </p>
                    </div>
                  </div>

                  <button
                    onClick={() => {
                      handlePayment(); // Your existing payment logic
                      endBilling();}
                    }
                    className="confirm-payment-button"
                  >
                    Confirm Payment
                  </button>
                  <button
                    className={`download-receipt-btn ${
                      isBillingActive ? "show" : ""
                    }`}
                    onClick={generatePDF}
                  >
                    Download Receipt
                  </button>
                </>
              ))}
          </>
        )}

        {activeTab === "Transactions" && (
          <div className="transactions-container">
            <input
              type="text"
              placeholder="Search by ID, Name, Mobile, Date"
              value={transactionSearch}
              onChange={(e) => setTransactionSearch(e.target.value)}
              className="transaction-search"
            />

            {transactions.length === 0 ? (
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
                  <strong>Phone:</strong> {selectedTransaction.customerPhone}
                </p>
                <p>
                  <strong>Total Amount:</strong> ₹
                  {selectedTransaction.totalAmount}
                </p>
                <p>
                  <strong>Total GST:</strong> ₹{selectedTransaction.totalGST}
                </p>
                <p>
                  <strong>Total Bill:</strong> ₹{selectedTransaction.totalBill}
                </p>

                <h3>Medicines Purchased:</h3>
                <ul>
                  {selectedTransaction.medicines.map((med, i) => (
                    <li key={i}>
                      {med.medicineName} - {med.quantity} x ₹{med.sellingPrice}{" "}
                      = ₹{med.totalPrice}
                    </li>
                  ))}
                </ul>

                <button onClick={() => setSelectedTransaction(null)}>
                  Close
                </button>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default CashierDashboard;
