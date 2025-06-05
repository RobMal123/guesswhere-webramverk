import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';

const SubmitLocation = () => {
  const navigate = useNavigate();
  const [categories, setCategories] = useState([]);
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    latitude: '',
    longitude: '',
    category_id: '',
    difficulty_level: 'medium',
    country: '',
    region: '',
    image: null
  });
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const token = localStorage.getItem('token');
        const response = await axios.get(`${import.meta.env.VITE_API_URL}/categories`, {
          headers: {
            'Authorization': `Bearer ${token}`
          },
          withCredentials: true
        });
        setCategories(response.data);
      } catch (error) {
        console.error('Error fetching categories:', error);
      }
    };
    fetchCategories();
  }, []);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleImageChange = (e) => {
    setFormData(prev => ({
      ...prev,
      image: e.target.files[0]
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    try {
      const formDataToSend = new FormData();
      Object.keys(formData).forEach(key => {
        if (key === 'image') {
          if (formData[key]) {
            formDataToSend.append('image', formData[key]);
          }
        } else {
          formDataToSend.append(key, formData[key]);
        }
      });

      // Get the token from localStorage
      const token = localStorage.getItem('token');

      const response = await axios.post(`${import.meta.env.VITE_API_URL}/api/locations/pending`, formDataToSend, {
        headers: {
          'Content-Type': 'multipart/form-data',
          'Authorization': `Bearer ${token}`
        },
        withCredentials: true,
      });

      setSuccess('Location submitted successfully! Waiting for admin approval.');
      setFormData({
        name: '',
        description: '',
        latitude: '',
        longitude: '',
        category_id: '',
        difficulty_level: 'medium',
        country: '',
        region: '',
        image: null
      });
    } catch (err) {
      setError(err.response?.data?.detail || 'Error submitting location');
    }
  };

  return (
    <div className="relative z-10">
      <div className="w-full p-8 mx-auto max-w-7xl">
        <div className="p-8 border shadow-lg backdrop-blur-sm bg-white/10 rounded-2xl border-white/20">
          <div className="pb-6 mb-8 border-b border-white/20">
            <h2 className="text-3xl font-bold text-white">Submit a New Location</h2>
          </div>

          {error && (
            <div className="p-4 mb-6 text-red-200 border rounded-xl bg-red-500/10 border-red-500/20">
              {error}
            </div>
          )}
          
          {success && (
            <div className="p-4 mb-6 text-green-200 border rounded-xl bg-green-500/10 border-green-500/20">
              {success}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label className="block mb-2 text-sm font-medium text-white/90">Name</label>
              <input
                type="text"
                name="name"
                value={formData.name}
                onChange={handleChange}
                required
                className="w-full px-4 py-2 text-white border rounded-xl bg-white/10 border-white/20 focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-transparent placeholder-white/50"
              />
            </div>

            <div>
              <label className="block mb-2 text-sm font-medium text-white/90">Description</label>
              <textarea
                name="description"
                value={formData.description}
                onChange={handleChange}
                className="w-full px-4 py-2 text-white border rounded-xl bg-white/10 border-white/20 focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-transparent placeholder-white/50"
                rows="3"
              />
            </div>

            <div className="grid grid-cols-2 gap-6">
              <div>
                <label className="block mb-2 text-sm font-medium text-white/90">Latitude</label>
                <input
                  type="number"
                  name="latitude"
                  value={formData.latitude}
                  onChange={handleChange}
                  required
                  step="any"
                  min="-90"
                  max="90"
                  className="w-full px-4 py-2 text-white border rounded-xl bg-white/10 border-white/20 focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-transparent placeholder-white/50"
                />
              </div>

              <div>
                <label className="block mb-2 text-sm font-medium text-white/90">Longitude</label>
                <input
                  type="number"
                  name="longitude"
                  value={formData.longitude}
                  onChange={handleChange}
                  required
                  step="any"
                  min="-180"
                  max="180"
                  className="w-full px-4 py-2 text-white border rounded-xl bg-white/10 border-white/20 focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-transparent placeholder-white/50"
                />
              </div>
            </div>

            <div>
              <label className="block mb-2 text-sm font-medium text-white/90">Category</label>
              <select
                name="category_id"
                value={formData.category_id}
                onChange={handleChange}
                required
                className="w-full px-4 py-2 text-white border rounded-xl bg-white/10 border-white/20 focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-transparent"
              >
                <option value="">Select a category</option>
                {categories.map(category => (
                  <option key={category.id} value={category.id}>
                    {category.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block mb-2 text-sm font-medium text-white/90">Difficulty Level</label>
              <select
                name="difficulty_level"
                value={formData.difficulty_level}
                onChange={handleChange}
                required
                className="w-full px-4 py-2 text-white border rounded-xl bg-white/10 border-white/20 focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-transparent"
              >
                <option value="easy">Easy</option>
                <option value="medium">Medium</option>
                <option value="hard">Hard</option>
              </select>
            </div>

            <div>
              <label className="block mb-2 text-sm font-medium text-white/90">Country</label>
              <input
                type="text"
                name="country"
                value={formData.country}
                onChange={handleChange}
                required
                className="w-full px-4 py-2 text-white border rounded-xl bg-white/10 border-white/20 focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-transparent placeholder-white/50"
              />
            </div>

            <div>
              <label className="block mb-2 text-sm font-medium text-white/90">Region</label>
              <input
                type="text"
                name="region"
                value={formData.region}
                onChange={handleChange}
                required
                className="w-full px-4 py-2 text-white border rounded-xl bg-white/10 border-white/20 focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-transparent placeholder-white/50"
              />
            </div>

            <div>
              <label className="block mb-2 text-sm font-medium text-white/90">Image</label>
              <input
                type="file"
                name="image"
                onChange={handleImageChange}
                accept="image/*"
                required
                className="w-full px-4 py-2 text-white border rounded-xl bg-white/10 border-white/20 file:mr-4 file:py-2 file:px-4 file:rounded-xl file:border-0 file:text-sm file:font-semibold file:bg-blue-500/20 file:text-white hover:file:bg-blue-500/30"
              />
            </div>

            <div className="flex justify-end pt-4 space-x-4">
              <button
                type="button"
                onClick={() => navigate(-1)}
                className="px-6 py-2 text-white transition-all duration-300 border rounded-xl bg-white/10 border-white/20 hover:bg-white/20"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-6 py-2 text-white transition-all duration-300 border rounded-xl bg-blue-500/80 border-blue-500/20 hover:bg-blue-500/90"
              >
                Submit Location
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default SubmitLocation; 