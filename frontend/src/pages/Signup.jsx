import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function Signup() {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [phone, setPhone] = useState('');
  const [address, setAddress] = useState('');
  const { register } = useAuth();

  const handleSubmit = async (e) => {
    e.preventDefault();
    await register(name, email, password, phone, address);
  };

  return (
    <div className="max-w-md mx-auto mt-10 p-6 bg-white rounded-xl shadow-md">
      <h1 className="text-2xl font-bold text-center mb-6">Sign Up</h1>
      <form onSubmit={handleSubmit}>
        <div className="mb-4">
          <label className="block font-medium mb-1">Full Name</label>
          <input
            type="text"
            required
            className="w-full border rounded-lg p-2"
            value={name}
            onChange={(e) => setName(e.target.value)}
          />
        </div>
        <div className="mb-4">
          <label className="block font-medium mb-1">Email</label>
          <input
            type="email"
            required
            className="w-full border rounded-lg p-2"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
        </div>
        <div className="mb-4">
          <label className="block font-medium mb-1">Password</label>
          <input
            type="password"
            required
            className="w-full border rounded-lg p-2"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
        </div>
        <div className="mb-4">
          <label className="block font-medium mb-1">Phone (optional)</label>
          <input
            type="tel"
            className="w-full border rounded-lg p-2"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
          />
        </div>
        <div className="mb-4">
          <label className="block font-medium mb-1">Address (optional)</label>
          <textarea
            rows="2"
            className="w-full border rounded-lg p-2"
            value={address}
            onChange={(e) => setAddress(e.target.value)}
          />
        </div>
        <button type="submit" className="w-full bg-green-600 text-white py-2 rounded-lg hover:bg-green-700">
          Sign Up
        </button>
      </form>
      <p className="text-center mt-4">
        Already have an account? <Link to="/login" className="text-green-600">Login</Link>
      </p>
    </div>
  );
}