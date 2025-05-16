from flask import Flask, jsonify
from pymongo import MongoClient
import pandas as pd

app = Flask(__name__)

# Connect to MongoDB
client = MongoClient("mongodb://localhost:27017/")
db = client["vinayaga-medical"]

@app.route("/api/demand-prediction", methods=["GET"])
def demand_prediction():
    try:
        # Fetch all invoices
        invoices = db["invoices"].find()

        # Create a list to store demand data
        data = []
        for invoice in invoices:
            for medicine in invoice["medicines"]:
                # Debugging: Log each medicine entry
                print("Processing medicine:", medicine)

                # Use 'name' as a fallback if 'medicineName' is missing
                medicine_name = medicine.get("medicineName") or medicine.get("name")
                if not medicine_name:
                    raise ValueError(f"Missing 'medicineName' or 'name' in medicine: {medicine}")

                data.append({
                    "medicineId": medicine["medicineId"],
                    "medicineName": medicine_name,  # Use the resolved name
                    "quantity": medicine["quantity"],
                    "date": invoice["date"]
                })

        # Convert data to a DataFrame
        df = pd.DataFrame(data)

        # Aggregate total quantity sold for each medicine
        demand = df.groupby("medicineName")["quantity"].sum().reset_index()
        demand = demand.sort_values(by="quantity", ascending=False)

        # Convert to JSON and return
        return jsonify(demand.to_dict(orient="records"))
    except Exception as e:
        print("Error in demand prediction:", str(e))  # Log the error
        return jsonify({"error": str(e)}), 500
    
if __name__ == "__main__":
    app.run(port=5001)