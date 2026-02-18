import React, { useState, useEffect } from 'react';
import Map from './components/Map';
import Sidebar from './components/Sidebar';
import { LocationService } from './utils/LocationService';
import ImageService from './utils/ImageService';
import './index.css';

function App() {
  const [data, setData] = useState({ visitedCities: [], visitedCountries: [], bucketListCountries: [], bucketListCities: [] });
  const [stats, setStats] = useState({ visitedCount: 0, totalCount: 195, percentage: 0, achievements: [], continentStats: [] });
  const [isLoading, setIsLoading] = useState(true);
  const [selectedCity, setSelectedCity] = useState(null);

  useEffect(() => {
    const savedData = LocationService.loadData();
    setData(savedData);
    setStats(LocationService.calculateStats(savedData));
    setIsLoading(false);
  }, []);

  const handleAddCity = async (city) => {
    const weather = await LocationService.fetchWeather(city.lat, city.lng);
    const newData = LocationService.addCity({ ...city, weather }, data);
    setData(newData);
    setStats(LocationService.calculateStats(newData));
    setSelectedCity({ ...city, weather });
  };

  const handleUpdateCity = (cityId, updates) => {
    const newData = LocationService.updateCity(cityId, updates, data);
    setData(newData);
    setStats(LocationService.calculateStats(newData));
  };

  const handleToggleCountry = (countryName) => {
    const newData = LocationService.toggleCountry(countryName, data);
    setData(newData);
    setStats(LocationService.calculateStats(newData));
  };

  const handleToggleBucketList = (countryName) => {
    const newData = LocationService.toggleBucketList(countryName, data);
    setData(newData);
    setStats(LocationService.calculateStats(newData));
  };

  const handleAddBucketCity = async (city) => {
    const weather = await LocationService.fetchWeather(city.lat, city.lng);
    const newData = LocationService.addBucketCity({ ...city, weather }, data);
    setData(newData);
    setStats(LocationService.calculateStats(newData));
    setSelectedCity({ ...city, weather });
  };

  const handleSelectCity = (city) => {
    setSelectedCity(city);
  };

  const handleRemoveCity = (cityId) => {
    const newData = LocationService.removeCity(cityId, data);
    setData(newData);
    setStats(LocationService.calculateStats(newData));
  };

  const handleRemoveBucketCity = (cityId) => {
    const newData = LocationService.removeBucketCity(cityId, data);
    setData(newData);
    setStats(LocationService.calculateStats(newData));
  };

  const handleImport = (jsonText) => {
    try {
      const newData = LocationService.importData(jsonText, data);
      setData(newData);
      setStats(LocationService.calculateStats(newData));
      alert("Import successful! Your travel map has been updated.");
    } catch (e) {
      alert(`Import failed: ${e.message}`);
    }
  };

  const handleUpdateSettings = (newSettings) => {
    const newData = LocationService.updateSettings(newSettings, data);
    setData(newData);
  };

  const handleAddPassportStamp = async (source) => {
    let stampMetadata;

    if (source instanceof File) {
      const id = `local_${Date.now()}`;
      await ImageService.saveImage(id, source);
      stampMetadata = { localId: id };
    } else {
      stampMetadata = { url: source };
    }

    const newData = LocationService.addPassportStamp(stampMetadata, data);
    setData(newData);
  };

  const handleRemovePassportStamp = async (id) => {
    const stamp = data.passportStamps.find(s => s.id === id);
    if (stamp?.localId) {
      await ImageService.deleteImage(stamp.localId);
    }

    const newData = LocationService.removePassportStamp(id, data);
    setData(newData);
  };

  if (isLoading) return null;

  return (
    <div className="w-full h-screen bg-slate-950 flex overflow-hidden">
      <Sidebar
        data={data}
        stats={stats}
        settings={data.settings}
        onAddCity={handleAddCity}
        onAddBucketCity={handleAddBucketCity}
        onUpdateCity={handleUpdateCity}
        onRemoveCity={handleRemoveCity}
        onRemoveBucketCity={handleRemoveBucketCity}
        onToggleCountry={handleToggleCountry}
        onToggleBucketList={handleToggleBucketList}
        onImport={handleImport}
        onUpdateSettings={handleUpdateSettings}
        onSelectCity={handleSelectCity}
        onAddPassportStamp={handleAddPassportStamp}
        onRemovePassportStamp={handleRemovePassportStamp}
      />
      <Map
        visitedCities={data.visitedCities}
        bucketListCities={data.bucketListCities}
        visitedCountries={data.visitedCountries}
        bucketListCountries={data.bucketListCountries}
        settings={data.settings}
        selectedCity={selectedCity}
        onToggleCountry={handleToggleCountry}
        onToggleBucketList={handleToggleBucketList}
      />
    </div>
  );
}

export default App;
