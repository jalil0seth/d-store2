import React, { useState, useEffect } from 'react';
import { PocketBaseService } from '../../services/PocketBaseService';
import { toast } from 'react-hot-toast';
import { FiSave, FiSettings, FiGlobe, FiBarChart } from 'react-icons/fi';
import { FaFacebook, FaGoogle, FaTiktok } from 'react-icons/fa';

interface StoreConfig {
  store_name: string;
  currency: string;
  facebook_pixel?: string;
  google_analytics?: string;
  tiktok_pixel?: string;
  store_logo?: string;
}

const StoreConfigPage: React.FC = () => {
  const [config, setConfig] = useState<StoreConfig>({
    store_name: '',
    currency: 'USD',
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    loadConfig();
  }, []);

  const loadConfig = async () => {
    try {
      setLoading(true);
      const pb = PocketBaseService.getInstance().pb;
      const records = await pb.collection('store_config').getList(1, 1);
      
      if (records.items.length > 0) {
        setConfig(records.items[0]);
      }
    } catch (error) {
      console.error('Error loading store config:', error);
      toast.error('Failed to load store configuration');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setSaving(true);
      const pb = PocketBaseService.getInstance().pb;
      const records = await pb.collection('store_config').getList(1, 1);
      
      if (records.items.length > 0) {
        await pb.collection('store_config').update(records.items[0].id, config);
      } else {
        await pb.collection('store_config').create(config);
      }
      
      toast.success('Store configuration saved successfully');
    } catch (error) {
      console.error('Error saving store config:', error);
      toast.error('Failed to save store configuration');
    } finally {
      setSaving(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setConfig(prev => ({ ...prev, [name]: value }));
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-50">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  const inputClasses = "mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm h-11";
  const selectClasses = "mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm h-11";

  return (
    <div className="min-h-screen bg-gray-50 py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto">
        <div className="bg-white shadow rounded-lg">
          {/* Header */}
          <div className="px-6 py-5 border-b border-gray-200">
            <div className="flex items-center space-x-3">
              <FiSettings className="h-6 w-6 text-gray-600" />
              <h1 className="text-2xl font-bold text-gray-900">Store Configuration</h1>
            </div>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="divide-y divide-gray-200">
            {/* General Settings */}
            <div className="px-6 py-6">
              <h2 className="flex items-center text-lg font-medium text-gray-900 mb-4">
                <FiGlobe className="mr-2" /> General Settings
              </h2>
              <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
                <div>
                  <label className="block text-sm font-medium text-gray-700">Store Name</label>
                  <input
                    type="text"
                    name="store_name"
                    value={config.store_name}
                    onChange={handleChange}
                    className={inputClasses}
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700">Currency</label>
                  <select
                    name="currency"
                    value={config.currency}
                    onChange={handleChange}
                    className={selectClasses}
                  >
                    <option value="USD">USD - US Dollar</option>
                    <option value="EUR">EUR - Euro</option>
                    <option value="GBP">GBP - British Pound</option>
                    <option value="JPY">JPY - Japanese Yen</option>
                    <option value="CAD">CAD - Canadian Dollar</option>
                    <option value="AUD">AUD - Australian Dollar</option>
                  </select>
                </div>
              </div>
            </div>

            {/* Analytics Settings */}
            <div className="px-6 py-6">
              <h2 className="flex items-center text-lg font-medium text-gray-900 mb-4">
                <FiBarChart className="mr-2" /> Analytics & Tracking
              </h2>
              <div className="space-y-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700">Facebook Pixel ID</label>
                  <div className="mt-1 relative rounded-md shadow-sm">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <FaFacebook className="h-5 w-5 text-blue-600" />
                    </div>
                    <input
                      type="text"
                      name="facebook_pixel"
                      value={config.facebook_pixel || ''}
                      onChange={handleChange}
                      placeholder="Enter your Facebook Pixel ID"
                      className={`${inputClasses} pl-10`}
                    />
                  </div>
                  <p className="mt-1 text-sm text-gray-500">Used for Facebook Ads tracking and analytics</p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700">Google Analytics ID</label>
                  <div className="mt-1 relative rounded-md shadow-sm">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <FaGoogle className="h-5 w-5 text-red-500" />
                    </div>
                    <input
                      type="text"
                      name="google_analytics"
                      value={config.google_analytics || ''}
                      onChange={handleChange}
                      placeholder="Enter your Google Analytics ID"
                      className={`${inputClasses} pl-10`}
                    />
                  </div>
                  <p className="mt-1 text-sm text-gray-500">Used for tracking website traffic and user behavior</p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700">TikTok Pixel ID</label>
                  <div className="mt-1 relative rounded-md shadow-sm">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <FaTiktok className="h-5 w-5 text-gray-900" />
                    </div>
                    <input
                      type="text"
                      name="tiktok_pixel"
                      value={config.tiktok_pixel || ''}
                      onChange={handleChange}
                      placeholder="Enter your TikTok Pixel ID"
                      className={`${inputClasses} pl-10`}
                    />
                  </div>
                  <p className="mt-1 text-sm text-gray-500">Used for TikTok Ads tracking and analytics</p>
                </div>
              </div>
            </div>

            {/* Submit Button */}
            <div className="px-6 py-4 bg-gray-50 flex items-center justify-end rounded-b-lg">
              <button
                type="submit"
                disabled={saving}
                className={`inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 ${
                  saving ? 'opacity-75 cursor-not-allowed' : ''
                }`}
              >
                <FiSave className="mr-2 -ml-1 h-4 w-4" />
                {saving ? 'Saving...' : 'Save Changes'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default StoreConfigPage;
