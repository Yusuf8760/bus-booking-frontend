import React, { useState, useEffect } from "react";
import axios from "axios";

const App = () => {
  const [buses, setBuses] = useState([]);
  const [selectedBus, setSelectedBus] = useState(null);
  const [seats, setSeats] = useState([]);
  const [selectedSeats, setSelectedSeats] = useState([]);
  const [userName, setUserName] = useState("");
  const [razorpayLoaded, setRazorpayLoaded] = useState(false);

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
    axios.get("https://bus-ticket-booking-production.up.railway.app/buses")
      .then(res => setBuses(res.data))
      .catch(error => console.error("Error fetching buses:", error));
  }, []);

  const fetchSeats = (busId) => {
    setSelectedBus(busId);
    axios.get(`https://bus-ticket-booking-production.up.railway.app/buses/${busId}/seats`)
      .then(res => setSeats(res.data))
      .catch(error => console.error("Error fetching seats:", error));
  };

const toggleSeatSelection = (seat) => {
  const pairSeat = seats.find(s => 
    s.deck === seat.deck &&
    (
      (seat.seat_label.includes('C') && s.seat_label === seat.seat_label.replace('C', 'B')) ||
      (seat.seat_label.includes('B') && s.seat_label === seat.seat_label.replace('B', 'C'))
    )
  );

  setSelectedSeats(prev => {
    if (prev.includes(seat.id)) {
      return prev.filter(id => id !== seat.id && (!pairSeat || id !== pairSeat.id));
    } else {
      return pairSeat ? [...prev, seat.id, pairSeat.id] : [...prev, seat.id];
    }
  });
};


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
try {
  const verifyResponse = await axios.post("https://bus-ticket-booking-production.up.railway.app/book", {
    user_name: userName,
    bus_id: selectedBus,
    seat_ids: selectedSeats,
    razorpay_order_id: response.razorpay_order_id,
    razorpay_payment_id: response.razorpay_payment_id,
    razorpay_signature: response.razorpay_signature,
  });

  console.log("🔍 Server verification response:", verifyResponse.data);

  if (verifyResponse.data.message.includes("Seats booked successfully")) {  // ✅ Fixed condition
    alert("✅ Seat booked successfully!");
    fetchSeats(selectedBus);
    setSelectedSeats([]);
  } else {
    alert("❌ Payment verification failed. Check logs.");
  }
} catch (error) {
  console.error("⚠️ Payment verification error:", error.response ? error.response.data : error.message);
  alert("⚠️ Payment verification error. Check console.");
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
    <div className="p-8 bg-gray-100 min-h-screen">
      <h1 className="text-3xl font-bold text-center mb-6 text-blue-600">🚌 Bus Ticket Booking</h1>
      <input type="text" placeholder="Enter your name" className="border p-3 m-3 block mx-auto rounded-md shadow-sm w-80 text-center" onChange={(e) => setUserName(e.target.value)} />
      <h2 className="text-xl font-semibold mt-6 text-center text-gray-700">Available Buses</h2>
      <ul className="flex flex-wrap justify-center mt-4">
        {buses.map(bus => (
          <li key={bus.id} className="cursor-pointer p-4 bg-blue-500 text-white m-3 rounded-lg shadow-md hover:bg-blue-700 transition" onClick={() => fetchSeats(bus.id)}>{bus.name} - {bus.owner_name}</li>
        ))}
      </ul>
      {selectedBus && (
        <div className="mt-8 text-center">
          <h2 className="text-xl font-bold text-gray-800">💺 Select Your Seats</h2>
          <div className="flex justify-center space-x-16">
            <div>
              <h3 className="text-lg font-semibold text-gray-700">Upper Deck</h3>
              <div className="grid grid-cols-3 gap-8 p-6 bg-white shadow-lg rounded-lg">
                {seats.filter(seat => seat.deck === 'upper').map(seat => (
                  <button key={seat.id} className={`w-12 h-24 rounded-lg font-bold border transition duration-300 ${seat.is_booked ? "bg-gray-500 text-white cursor-not-allowed" : selectedSeats.includes(seat.id) ? "bg-green-500 text-white" : "bg-gray-300 hover:bg-gray-400"}`} disabled={seat.is_booked} onClick={() => toggleSeatSelection(seat)}>{seat.seat_label}</button>
                ))}
              </div>
            </div>
            <div>
              <h3 className="text-lg font-semibold text-gray-700">Lower Deck</h3>
              <div className="grid grid-cols-3 gap-8 p-6 bg-white shadow-lg rounded-lg">
                {seats.filter(seat => seat.deck === 'lower').map(seat => (
                  <button key={seat.id} className={`w-12 h-24 rounded-lg font-bold border transition duration-300 ${seat.is_booked ? "bg-gray-500 text-white cursor-not-allowed" : selectedSeats.includes(seat.id) ? "bg-green-500 text-white" : "bg-gray-300 hover:bg-gray-400"}`} disabled={seat.is_booked} onClick={() => toggleSeatSelection(seat)}>{seat.seat_label}</button>
                ))}
              </div>
            </div>
          </div>
          <button className="bg-green-600 text-white p-4 mt-6 rounded-lg shadow-lg hover:bg-green-700 transition text-lg" onClick={handlePayment}>💰 Proceed to Pay & Book</button>
        </div>
      )}
    </div>
  );
};

export default App;
