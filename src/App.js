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

  const toggleSeatSelection = (seatId) => {
    setSelectedSeats((prev) =>
      prev.includes(seatId) ? prev.filter((id) => id !== seatId) : [...prev, seatId]
    );
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
    <div className="p-8 bg-gray-100 min-h-screen">
      <h1 className="text-2xl font-bold text-center mb-4">🚌 Bus Ticket Booking</h1>
      <input type="text" placeholder="Enter your name" className="border p-2 m-2 block mx-auto" onChange={(e) => setUserName(e.target.value)} />
      <h2 className="text-lg font-bold mt-4 text-center">Available Buses</h2>
      <ul className="flex flex-wrap justify-center">
        {buses.map(bus => (
          <li key={bus.id} className="cursor-pointer p-3 bg-blue-500 text-white m-2 rounded-md" onClick={() => fetchSeats(bus.id)}>{bus.name} - {bus.owner_name}</li>
        ))}
      </ul>
      {selectedBus && (
        <div className="mt-6 text-center">
          <h2 className="text-lg font-bold">💺 Select Your Seats</h2>
          <div className="flex flex-col md:flex-row justify-center items-center gap-6">
            <div>
              <h3 className="text-md font-bold">Upper Deck</h3>
              <div className="grid grid-cols-4 gap-3 p-4 bg-white shadow-md rounded-md">
                {seats.filter(seat => seat.deck === 'upper').map(seat => (
                  <button key={seat.id} className={`w-12 h-12 rounded-md font-bold border ${seat.is_booked ? "bg-red-500 text-white" : selectedSeats.includes(seat.id) ? "bg-green-400" : "bg-gray-200"}`} disabled={seat.is_booked} onClick={() => toggleSeatSelection(seat.id)}>{seat.seat_number}</button>
                ))}
              </div>
            </div>
            <div>
              <h3 className="text-md font-bold">Lower Deck</h3>
              <div className="grid grid-cols-4 gap-3 p-4 bg-white shadow-md rounded-md">
                {seats.filter(seat => seat.deck === 'lower').map(seat => (
                  <button key={seat.id} className={`w-12 h-12 rounded-md font-bold border ${seat.is_booked ? "bg-red-500 text-white" : selectedSeats.includes(seat.id) ? "bg-green-400" : "bg-gray-200"}`} disabled={seat.is_booked} onClick={() => toggleSeatSelection(seat.id)}>{seat.seat_number}</button>
                ))}
              </div>
            </div>
          </div>
          <button className="bg-green-600 text-white p-3 mt-4 rounded-md" onClick={handlePayment}>💰 Proceed to Pay & Book</button>
        </div>
      )}
    </div>
  );
};

export default App;
