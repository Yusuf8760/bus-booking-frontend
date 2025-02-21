import React, { useState, useEffect } from "react";
import axios from "axios";

const App = () => {
  const [buses, setBuses] = useState([]);
  const [selectedBus, setSelectedBus] = useState(null);
  const [seats, setSeats] = useState([]);
  const [selectedSeat, setSelectedSeat] = useState(null);
  const [userName, setUserName] = useState("");

  useEffect(() => {
    axios.get("https://bus-ticket-booking-production.up.railway.app/buses").then((res) => {
      setBuses(res.data);
    });
  }, []);

  const fetchSeats = (busId) => {
    setSelectedBus(busId);
    axios.get(`https://bus-ticket-booking-production.up.railway.app/buses/${busId}/seats`).then((res) => {
      setSeats(res.data);
    });
  };

  const bookSeat = () => {
    if (!userName || !selectedBus || !selectedSeat) {
      alert("Please enter details");
      return;
    }
    axios.post("https://bus-ticket-booking-production.up.railway.app/book", {
      user_name: userName,
      bus_id: selectedBus,
      seat_id: selectedSeat,
    }).then(() => {
      alert("Seat booked successfully!");
      fetchSeats(selectedBus);
    });
  };

  return (
    <div className="p-8">
      <h1 className="text-xl font-bold">Bus Ticket Booking</h1>
      <input
        type="text"
        placeholder="Enter your name"
        className="border p-2 m-2"
        onChange={(e) => setUserName(e.target.value)}
      />

      <h2 className="text-lg font-bold mt-4">Available Buses</h2>
      <ul>
        {buses.map((bus) => (
          <li
            key={bus.id}
            className="cursor-pointer p-2 bg-gray-200 m-2"
            onClick={() => fetchSeats(bus.id)}
          >
            {bus.name} - {bus.owner_name}
          </li>
        ))}
      </ul>

      {selectedBus && (
        <div>
          <h2 className="text-lg font-bold mt-4">Select Your Seat</h2>
          <div className="grid grid-cols-4 gap-2 mt-2">
            {seats.map((seat) => (
              <button
                key={seat.id}
                className={`p-4 rounded border ${
                  seat.is_booked ? "bg-red-500 text-white" : "bg-gray-300"
                } ${selectedSeat === seat.id ? "bg-green-400" : ""}`}
                disabled={seat.is_booked}
                onClick={() => setSelectedSeat(seat.id)}
              >
                {seat.seat_number}
              </button>
            ))}
          </div>
          <button
            className="bg-blue-500 text-white p-2 mt-4"
            onClick={bookSeat}
          >
            Book Selected Seat
          </button>
        </div>
      )}
    </div>
  );
};

export default App;
