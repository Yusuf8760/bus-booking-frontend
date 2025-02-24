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
    if (seat.seat_type === 'double') {
      const pair = seats.filter(s => s.position === seat.position && s.deck === seat.deck);
      const pairIds = pair.map(s => s.id);
      setSelectedSeats(prev => prev.some(id => pairIds.includes(id))
        ? prev.filter(id => !pairIds.includes(id))
        : [...prev, ...pairIds]);
    } else {
      setSelectedSeats(prev => prev.includes(seat.id) ? prev.filter(id => id !== seat.id) : [...prev, seat.id]);
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
          <div className="flex flex-col md:flex-row justify-center gap-12">
            <div>
              <h3 className="text-lg font-semibold text-gray-700">Upper Deck</h3>
              <div className="grid grid-cols-[auto_auto_auto_auto] gap-4 p-6 bg-white shadow-lg rounded-lg">
                {seats.filter(seat => seat.deck === 'upper').map(seat => (
                  <button key={seat.id} className={`w-24 h-12 rounded-lg font-bold border transition duration-300 ${seat.is_booked ? "bg-gray-500 text-white cursor-not-allowed" : selectedSeats.includes(seat.id) ? "bg-green-500 text-white" : "bg-gray-300 hover:bg-gray-400"}`} disabled={seat.is_booked} onClick={() => toggleSeatSelection(seat)}>{seat.seat_label}</button>
                ))}
              </div>
            </div>
            <div>
              <h3 className="text-lg font-semibold text-gray-700">Lower Deck</h3>
              <div className="grid grid-cols-[auto_auto_auto_auto] gap-4 p-6 bg-white shadow-lg rounded-lg">
                {seats.filter(seat => seat.deck === 'lower').map(seat => (
                  <button key={seat.id} className={`w-24 h-12 rounded-lg font-bold border transition duration-300 ${seat.is_booked ? "bg-gray-500 text-white cursor-not-allowed" : selectedSeats.includes(seat.id) ? "bg-green-500 text-white" : "bg-gray-300 hover:bg-gray-400"}`} disabled={seat.is_booked} onClick={() => toggleSeatSelection(seat)}>{seat.seat_label}</button>
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
