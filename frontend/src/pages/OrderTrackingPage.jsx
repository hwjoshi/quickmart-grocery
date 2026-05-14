import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";

export default function OrderTrackingPage() {
  const { orderId } = useParams();
  const [status, setStatus] = useState("Order Confirmed");
  const [driverLat, setDriverLat] = useState(null);
  const [driverLng, setDriverLng] = useState(null);
  const [seconds, setSeconds] = useState(0);

  // Progress status over time
  useEffect(() => {
    const timer = setInterval(() => {
      setSeconds(prev => {
        const newSec = prev + 1;
        if (newSec === 4) setStatus("Packing");
        if (newSec === 8) setStatus("Out for Delivery");
        if (newSec === 15) setStatus("Delivered");
        return newSec;
      });
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  // Simulate driver location only when out for delivery
  useEffect(() => {
    if (status !== "Out for Delivery") return;
    const interval = setInterval(() => {
      setDriverLat(28.4595 + (Math.random() - 0.5) * 0.02);
      setDriverLng(77.0266 + (Math.random() - 0.5) * 0.02);
    }, 3000);
    return () => clearInterval(interval);
  }, [status]);

  return (
    <div className="max-w-2xl mx-auto">
      <h1 className="text-2xl font-bold mb-4">Order #{orderId}</h1>
      <div className="bg-white rounded-lg shadow p-6">
        <div className="flex items-center gap-2 mb-4">
          <div className={`w-3 h-3 rounded-full ${status === "Delivered" ? "bg-green-600" : "bg-yellow-500 animate-pulse"}`}></div>
          <span className="font-medium">Status: {status}</span>
        </div>

        {status === "Out for Delivery" && driverLat && (
          <div className="mt-4 p-3 bg-gray-100 rounded">
            <p className="text-sm font-medium">Driver Live Location (Simulated):</p>
            <p className="text-xs font-mono">Lat: {driverLat.toFixed(5)}, Lng: {driverLng.toFixed(5)}</p>
            <p className="text-xs text-gray-500 mt-1">(Map integration will replace this)</p>
          </div>
        )}

        {status === "Delivered" && (
          <div className="mt-4 p-3 bg-green-50 text-green-700 rounded">
            ✅ Your order has been delivered. Enjoy your fresh groceries!
          </div>
        )}

        {status === "Packing" && (
          <div className="mt-4 p-3 bg-blue-50 text-blue-700 rounded">
            📦 Your items are being carefully packed.
          </div>
        )}
      </div>
    </div>
  );
}