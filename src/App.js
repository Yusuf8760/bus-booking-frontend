import React, { useState, useEffect } from "react";
import axios from "axios";

const App = () => {
  const [buses, setBuses] = useState([]);
  const [selectedBus, setSelectedBus] = useState(null);
  const [seats, setSeats] = useState([]);
  const [selectedSeats, setSelectedSeats] = useState([]);
  const [userName, setUserName] = useState("");
  const [razorpayLoaded, setRazorpayLoaded] = useState(false);

  // Load Razorpay script
useEffect(() => {
    const script = document.createElement("script");
    script.src = "https://checkout.razorpay.com/v1/checkout.js";
    script.async = true;
    script.onload = () => setRazorpayLoaded(true);
    script.onerror = () => alert("Failed to load Razorpay");
    document.body.appendChild(script);
    return () => document.body.removeChild(script);
  }, []);

  useEffect(() => {
    // Fetch available buses
axios.get("https://bus-ticket-booking-production.up.railway.app/buses")
      .then(res => setBuses(res.data))
      .catch(error => console.error("Error fetching buses:", error));
  }, []);

  // Fetch available seats for selected bus
const fetchSeats = (busId) => {
    setSelectedBus(busId);
    axios.get(`https://bus-ticket-booking-production.up.railway.app/buses/${busId}/seats`)
      .then(res => setSeats(res.data))
      .catch(error => console.error("Error fetching seats:", error));
  };

  // Toggle seat selection
const toggleSeatSelection = (seatId) => {
    setSelectedSeats(prev =>
      prev.includes(seatId) ? prev.filter(id => id !== seatId) : [...prev, seatId]
    );
  };

  // Handle Razorpay payment and booking
const handlePayment = async () => {
    if (!razorpayLoaded || !window.Razorpay) return alert("Razorpay not loaded");
    if (!userName || !selectedBus || selectedSeats.length === 0) return alert("Fill all details");
    
    try {
      const orderResponse = await axios.post("https://bus-ticket-booking-production.up.railway.app/create-order", { amount: selectedSeats.length * 500 });
      if (!orderResponse.data.success) throw new Error("Order creation failed");
      
      const options = {
        key: "rzp_test_QooNDwSUafjvWt",
        amount: orderResponse.data.order.amount,
        currency: "INR",
        name: "Bus Ticket Booking",
        description: "Seat Booking Payment",
        order_id: orderResponse.data.order.id,
        handler: async function (response) {
          const verifyResponse = await axios.post("https://bus-ticket-booking-production.up.railway.app/book", {
            user_name: userName,
            bus_id: selectedBus,
            seat_ids: selectedSeats,
            razorpay_order_id: response.razorpay_order_id,
            razorpay_payment_id: response.razorpay_payment_id,
            razorpay_signature: response.razorpay_signature,
          });
          if (verifyResponse.data.message === "Seat booked successfully!") {
            alert("Seat booked successfully!");
            fetchSeats(selectedBus);
            setSelectedSeats([]);
          } else {
            alert("Payment verification failed");
          }
        },
        prefill: { name: userName, email: "user@example.com", contact: "9876543210" },
        theme: { color: "#F37254" },
      };
      new window.Razorpay(options).open();
    } catch (error) {
      alert("Payment failed! " + error.message);
    }
  };

  return (
    <div className="p-8">
      <h1 className="text-xl font-bold">🎟️ Bus Ticket Booking</h1>
      <input type="text" placeholder="Enter your name" className="border p-2 m-2" onChange={(e) => setUserName(e.target.value)} />
      <h2 className="text-lg font-bold mt-4">🚌 Available Buses</h2>
      <ul>
        {buses.map(bus => (
          <li key={bus.id} className="cursor-pointer p-2 bg-gray-200 m-2" onClick={() => fetchSeats(bus.id)}>{bus.name} - {bus.owner_name}</li>
        ))}
      </ul>
      {selectedBus && (
        <div>
          <h2 className="text-lg font-bold mt-4">💺 Select Your Seats</h2>
          <div className="grid grid-cols-5 gap-2 mt-2 border p-4">
            {seats.map(seat => (
              <button key={seat.id} className={`w-12 h-12 rounded border text-sm font-bold ${seat.is_booked ? "bg-red-500 text-white" : selectedSeats.includes(seat.id) ? "bg-green-400" : "bg-gray-300"}`} disabled={seat.is_booked} onClick={() => toggleSeatSelection(seat.id)}>{seat.seat_number}</button>
            ))}
          </div>
          <button className="bg-blue-500 text-white p-2 mt-4" onClick={handlePayment}>💰 Proceed to Pay & Book</button>
        </div>
      )}
    </div>
  );
};

export default App;
