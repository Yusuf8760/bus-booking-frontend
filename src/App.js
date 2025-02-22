import React, { useState, useEffect } from "react";
import axios from "axios";

const App = () => {
  const [buses, setBuses] = useState([]);
  const [selectedBus, setSelectedBus] = useState(null);
  const [seats, setSeats] = useState([]);
  const [selectedSeat, setSelectedSeat] = useState(null);
  const [userName, setUserName] = useState("");

  useEffect(() => {
    axios.get("https://bus-ticket-booking-production.up.railway.app/buses")
      .then((res) => setBuses(res.data))
      .catch((err) => console.error("Error fetching buses:", err));
  }, []);

  const fetchSeats = (busId) => {
    setSelectedBus(busId);
    setSelectedSeat(null);
    axios.get(`https://bus-ticket-booking-production.up.railway.app/buses/${busId}/seats`)
      .then((res) => setSeats(res.data))
      .catch((err) => console.error("Error fetching seats:", err));
  };

  const handlePayment = async () => {
    if (!userName || !selectedBus || !selectedSeat) {
      alert("Please enter all details before booking.");
      return;
    }

    try {
      // Step 1: Create Razorpay Order
      const orderResponse = await axios.post("https://bus-ticket-booking-production.up.railway.app/create-order", {
        amount: 500, // Replace with actual amount
      });

      if (!orderResponse.data.success) {
        throw new Error("Failed to create order.");
      }

      const { order } = orderResponse.data;

      // Step 2: Open Razorpay Payment Gateway
      const options = {
        key: "rzp_test_QooNDwSUafjvWt", // Replace with your Razorpay Test Key
        amount: order.amount,
        currency: "INR",
        name: "Bus Ticket Booking",
        description: "Seat Booking Payment",
        order_id: order.id,
        handler: async function (response) {
          console.log("✅ Payment successful:", response);

          // Step 3: Verify Payment and Book Seat
          try {
            const verifyResponse = await axios.post("https://bus-ticket-booking-production.up.railway.app/book", {
              user_name: userName,
              bus_id: selectedBus,
              seat_id: selectedSeat,
              razorpay_order_id: response.razorpay_order_id,
              razorpay_payment_id: response.razorpay_payment_id,
              razorpay_signature: response.razorpay_signature,
            });

            if (verifyResponse.data.message === "Seat booked successfully!") {
              alert("🎉 Seat booked successfully!");
              fetchSeats(selectedBus);
            } else {
              alert("❌ Payment verification failed.");
            }
          } catch (error) {
            console.error("Error verifying payment:", error);
            alert("Payment verification failed. Please contact support.");
          }
        },
        prefill: {
          name: userName,
          email: "user@example.com",
          contact: "9876543210",
        },
        theme: {
          color: "#F37254",
        },
      };

      const rzp = new window.Razorpay(options);
      rzp.open();
    } catch (error) {
      console.error("Payment error:", error);
      alert("Payment failed! " + error.message);
    }
  };

  return (
    <div className="p-8">
      <h1 className="text-xl font-bold">🚌 Bus Ticket Booking</h1>
      <input
        type="text"
        placeholder="Enter your name"
        className="border p-2 m-2"
        onChange={(e) => setUserName(e.target.value)}
      />

      <h2 className="text-lg font-bold mt-4">🚍 Available Buses</h2>
      <ul>
        {buses.map((bus) => (
          <li
            key={bus.id}
            className={`cursor-pointer p-2 m-2 ${selectedBus === bus.id ? "bg-blue-300" : "bg-gray-200"}`}
            onClick={() => fetchSeats(bus.id)}
          >
            {bus.name} - {bus.owner_name}
          </li>
        ))}
      </ul>

      {selectedBus && (
        <div>
          <h2 className="text-lg font-bold mt-4">🎟 Select Your Seat</h2>
          <div className="grid grid-cols-4 gap-2 mt-2">
            {seats.map((seat) => (
              <button
                key={seat.id}
                className={`p-4 rounded border transition-all ${
                  seat.is_booked ? "bg-red-500 text-white cursor-not-allowed" : "bg-gray-300 hover:bg-green-400"
                } ${selectedSeat === seat.id ? "bg-green-500" : ""}`}
                disabled={seat.is_booked}
                onClick={() => setSelectedSeat(seat.id)}
              >
                {seat.seat_number}
              </button>
            ))}
          </div>
          <button className="bg-blue-500 text-white p-2 mt-4 hover:bg-blue-600" onClick={handlePayment}>
            💳 Proceed to Pay & Book
          </button>
        </div>
      )}
    </div>
  );
};

export default App;
