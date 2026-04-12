import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import { MapContainer, TileLayer, Marker, useMapEvents, useMap } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';
import { ref, push, set, serverTimestamp } from 'firebase/database';
import { db } from '../firebase';
import { useAuth } from '../contexts/AuthContext';
import { handleFirestoreError, OperationType } from '../utils/firestoreErrorHandler';
import { fileToDataUrl, INLINE_IMAGE_MAX_BYTES, INLINE_VIDEO_MAX_BYTES } from '../utils/media';
import { matchFoundItem } from '../services/matchingService';
import MapSearch from '../components/MapSearch';
import LocationMarker from '../components/LocationMarker';
import LocationSelector from '../components/LocationSelector';
import MapController from '../components/MapController';

// Fix leaflet icon issue
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

import { MapPin, Clock, Tag, Search, Loader2, User, Smartphone, Wallet, FileText, Gem, Shirt, PawPrint, Key, Briefcase, Car, Music, Glasses, Package } from 'lucide-react';

export default function ReportFound() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [category, setCategory] = useState('');
  const [brand, setBrand] = useState('');
  const [model, setModel] = useState('');
  const [color, setColor] = useState('');
  const [secondaryColor, setSecondaryColor] = useState('');
  const [description, setDescription] = useState('');
  const [foundLocationDescription, setFoundLocationDescription] = useState('');
  const [policeReportFiled, setPoliceReportFiled] = useState(false);
  const [policeReportNumber, setPoliceReportNumber] = useState('');

  const now = new Date();
  now.setMinutes(now.getMinutes() - now.getTimezoneOffset());
  const maxDateTime = now.toISOString().slice(0, 16);

  // Dynamic fields
  const [name, setName] = useState('');
  const [age, setAge] = useState('');
  const [gender, setGender] = useState('');
  const [breed, setBreed] = useState('');
  const [size, setSize] = useState('');
  const [material, setMaterial] = useState('');
  const [documentType, setDocumentType] = useState('');

  // Extended fields
  const [os, setOs] = useState('');
  const [storage, setStorage] = useState('');
  const [height, setHeight] = useState('');
  const [lastSeenWearing, setLastSeenWearing] = useState('');
  const [microchipId, setMicrochipId] = useState('');
  const [collarColor, setCollarColor] = useState('');
  const [contents, setContents] = useState('');
  const [jewelryWeight, setJewelryWeight] = useState('');
  const [numberOfKeys, setNumberOfKeys] = useState('');
  const [keyType, setKeyType] = useState('');
  const [keychain, setKeychain] = useState('');
  const [itemName, setItemName] = useState('');
  const [vehicleType, setVehicleType] = useState('');
  const [licensePlate, setLicensePlate] = useState('');
  const [vin, setVin] = useState('');
  const [instrumentType, setInstrumentType] = useState('');
  const [serialNumber, setSerialNumber] = useState('');
  const [eyewearType, setEyewearType] = useState('');
  const [frameColor, setFrameColor] = useState('');
  const [lensColor, setLensColor] = useState('');
  const [district, setDistrict] = useState('');
  const [city, setCity] = useState('');

  const [timeFrom, setTimeFrom] = useState('');
  const [photo, setPhoto] = useState<File | null>(null);
  const [video, setVideo] = useState<File | null>(null);
  const [locationFrom, setLocationFrom] = useState<any>(null);
  const [contactName, setContactName] = useState('');
  const [contactEmail, setContactEmail] = useState('');
  const [contactPhone, setContactPhone] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [currentStep, setCurrentStep] = useState(1);

  React.useEffect(() => {
    if (user) {
      setContactName(user.displayName || '');
      setContactEmail(user.email || '');
    }
  }, [user]);

  const renderStepper = () => {
    const steps = [
      { number: 1, label: 'Category' },
      { number: 2, label: 'Item Details' },
      { number: 3, label: 'Location & Time' },
      { number: 4, label: 'Contact Info' },
    ];

    return (
      <div className="mb-8">
        <div className="flex items-center justify-between relative">
          <div className="absolute left-0 top-1/2 -translate-y-1/2 w-full h-1 bg-slate-100 rounded-full -z-10"></div>
          <div 
            className="absolute left-0 top-1/2 -translate-y-1/2 h-1 bg-brand-orange rounded-full -z-10 transition-all duration-300"
            style={{ width: `${((currentStep - 1) / (steps.length - 1)) * 100}%` }}
          ></div>
          
          {steps.map((step) => (
            <div key={step.number} className="flex flex-col items-center gap-2">
              <div 
                className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-sm transition-all duration-300 ${
                  currentStep >= step.number 
                    ? 'bg-brand-orange text-white shadow-lg shadow-brand-orange/30' 
                    : 'bg-white text-slate-400 border-2 border-slate-100'
                }`}
              >
                {currentStep > step.number ? (
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                  </svg>
                ) : (
                  step.number
                )}
              </div>
              <span className={`text-xs font-bold ${currentStep >= step.number ? 'text-slate-900' : 'text-slate-400'}`}>
                {step.label}
              </span>
            </div>
          ))}
        </div>
      </div>
    );
  };

  const handleBack = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (currentStep === 1 && !category) {
      toast.error('Please select a category');
      return;
    }

    if (currentStep < 4) {
      setCurrentStep(currentStep + 1);
      return;
    }

    if (!user) {
      toast.error('Please login first');
      navigate('/login');
      return;
    }

    if (!locationFrom) {
      toast.error('Please select a location on the map');
      return;
    }

    if (!district || !city) {
      toast.error('Please select a district and city');
      return;
    }

    if (!video) {
      toast.error('Please upload a video of the found item');
      return;
    }

    setIsSubmitting(true);
    try {
      let photoData = null;
      if (photo) {
        if (photo.size > INLINE_IMAGE_MAX_BYTES) {
          toast.error('Photo must be less than 250KB');
          setIsSubmitting(false);
          return;
        }
        photoData = await fileToDataUrl(photo);
      }

      let videoData = null;
      if (video) {
        if (video.size > INLINE_VIDEO_MAX_BYTES) {
          toast.error('Video must be less than 400KB');
          setIsSubmitting(false);
          return;
        }
        videoData = await fileToDataUrl(video);
      }

      const itemData: any = {
        userId: user.uid,
        type: 'found',
        category,
        description,
        foundLocationDescription,
        timeFrom,
        locationFromLat: locationFrom.lat,
        locationFromLng: locationFrom.lng,
        district,
        city,
        status: 'pending',
        contactName,
        contactEmail,
        contactPhone,
        createdAt: serverTimestamp()
      };

      if (secondaryColor) itemData.secondaryColor = secondaryColor;
      itemData.policeReportFiled = policeReportFiled;
      if (policeReportFiled && policeReportNumber) itemData.policeReportNumber = policeReportNumber;

      switch (category) {
        case 'electronics':
          if (brand) itemData.brand = brand;
          if (model) itemData.model = model;
          if (color) itemData.color = color;
          if (os) itemData.os = os;
          if (storage) itemData.storage = storage;
          break;
        case 'bags':
          if (brand) itemData.brand = brand;
          if (color) itemData.color = color;
          if (size) itemData.size = size;
          if (contents) itemData.contents = contents;
          break;
        case 'person':
          if (name) itemData.name = name;
          if (age) itemData.age = age;
          if (gender) itemData.gender = gender;
          if (height) itemData.height = height;
          if (lastSeenWearing) itemData.lastSeenWearing = lastSeenWearing;
          break;
        case 'pets':
          if (name) itemData.name = name;
          if (breed) itemData.breed = breed;
          if (color) itemData.color = color;
          if (microchipId) itemData.microchipId = microchipId;
          if (collarColor) itemData.collarColor = collarColor;
          break;
        case 'clothing':
          if (brand) itemData.brand = brand;
          if (size) itemData.size = size;
          if (color) itemData.color = color;
          break;
        case 'wallet':
          if (documentType) itemData.documentType = documentType;
          if (name) itemData.name = name;
          if (color) itemData.color = color;
          if (contents) itemData.contents = contents;
          break;
        case 'jewelry':
          if (brand) itemData.brand = brand;
          if (material) itemData.material = material;
          if (color) itemData.color = color;
          if (jewelryWeight) itemData.jewelryWeight = jewelryWeight;
          break;
        case 'keys':
          if (numberOfKeys) itemData.numberOfKeys = numberOfKeys;
          if (keyType) itemData.keyType = keyType;
          if (keychain) itemData.keychain = keychain;
          if (color) itemData.color = color;
          break;
        case 'vehicles':
          if (vehicleType) itemData.vehicleType = vehicleType;
          if (brand) itemData.brand = brand;
          if (model) itemData.model = model;
          if (color) itemData.color = color;
          if (licensePlate) itemData.licensePlate = licensePlate;
          if (vin) itemData.vin = vin;
          break;
        case 'musical_instruments':
          if (instrumentType) itemData.instrumentType = instrumentType;
          if (brand) itemData.brand = brand;
          if (model) itemData.model = model;
          if (color) itemData.color = color;
          if (serialNumber) itemData.serialNumber = serialNumber;
          break;
        case 'glasses':
          if (eyewearType) itemData.eyewearType = eyewearType;
          if (brand) itemData.brand = brand;
          if (frameColor) itemData.frameColor = frameColor;
          if (lensColor) itemData.lensColor = lensColor;
          break;
        case 'other':
          if (itemName) itemData.itemName = itemName;
          if (color) itemData.color = color;
          if (brand) itemData.brand = brand;
          break;
        default:
          if (brand) itemData.brand = brand;
          if (color) itemData.color = color;
          break;
      }

      if (photoData) itemData.photoData = photoData;
      if (videoData) itemData.videoData = videoData;

      const newItemRef = push(ref(db, 'items'));
      await set(newItemRef, itemData);
      const foundItemId = newItemRef.key!;

      toast.success('Found item reported successfully. Matching engine started.');
      navigate('/');

      matchFoundItem(foundItemId, itemData).catch(console.error);

    } catch (error) {
      handleFirestoreError(error, OperationType.CREATE, 'items');
    } finally {
      setIsSubmitting(false);
    }
  };

  const renderDynamicFields = () => {
    switch (category) {
      case 'electronics':
        return (
          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="space-y-2">
                <label className="text-sm font-bold text-slate-700">Brand</label>
                <input type="text" className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:ring-2 focus:ring-brand-orange/20 focus:border-brand-orange outline-none transition-all bg-slate-50" placeholder="e.g. Apple" value={brand} onChange={(e) => setBrand(e.target.value)} />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-bold text-slate-700">Model</label>
                <input type="text" className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:ring-2 focus:ring-brand-orange/20 focus:border-brand-orange outline-none transition-all bg-slate-50" placeholder="e.g. iPhone 15" value={model} onChange={(e) => setModel(e.target.value)} />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-bold text-slate-700">Color</label>
                <input type="text" className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:ring-2 focus:ring-brand-orange/20 focus:border-brand-orange outline-none transition-all bg-slate-50" placeholder="e.g. Space Gray" value={color} onChange={(e) => setColor(e.target.value)} />
              </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <label className="text-sm font-bold text-slate-700">OS (if applicable)</label>
                <input type="text" className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:ring-2 focus:ring-brand-orange/20 focus:border-brand-orange outline-none transition-all bg-slate-50" placeholder="e.g. iOS 17" value={os} onChange={(e) => setOs(e.target.value)} />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-bold text-slate-700">Storage (if applicable)</label>
                <input type="text" className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:ring-2 focus:ring-brand-orange/20 focus:border-brand-orange outline-none transition-all bg-slate-50" placeholder="e.g. 256GB" value={storage} onChange={(e) => setStorage(e.target.value)} />
              </div>
            </div>
          </div>
        );
      case 'bags':
        return (
          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="space-y-2">
                <label className="text-sm font-bold text-slate-700">Brand</label>
                <input type="text" className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:ring-2 focus:ring-brand-orange/20 focus:border-brand-orange outline-none transition-all bg-slate-50" placeholder="e.g. American Tourister" value={brand} onChange={(e) => setBrand(e.target.value)} />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-bold text-slate-700">Color</label>
                <input type="text" className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:ring-2 focus:ring-brand-orange/20 focus:border-brand-orange outline-none transition-all bg-slate-50" placeholder="e.g. Blue" value={color} onChange={(e) => setColor(e.target.value)} />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-bold text-slate-700">Size</label>
                <input type="text" className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:ring-2 focus:ring-brand-orange/20 focus:border-brand-orange outline-none transition-all bg-slate-50" placeholder="e.g. Medium" value={size} onChange={(e) => setSize(e.target.value)} />
              </div>
            </div>
            <div className="space-y-2">
              <label className="text-sm font-bold text-slate-700">Contents (if any)</label>
              <textarea rows={2} className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:ring-2 focus:ring-brand-orange/20 focus:border-brand-orange outline-none transition-all bg-slate-50 resize-none" placeholder="e.g. Contains a laptop and some books" value={contents} onChange={(e) => setContents(e.target.value)} />
            </div>
          </div>
        );
      case 'person':
        return (
          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="space-y-2">
                <label className="text-sm font-bold text-slate-700">Full Name</label>
                <input type="text" className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:ring-2 focus:ring-brand-orange/20 focus:border-brand-orange outline-none transition-all bg-slate-50" placeholder="e.g. John Doe" value={name} onChange={(e) => setName(e.target.value)} />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-bold text-slate-700">Age</label>
                <input type="text" className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:ring-2 focus:ring-brand-orange/20 focus:border-brand-orange outline-none transition-all bg-slate-50" placeholder="e.g. 25" value={age} onChange={(e) => setAge(e.target.value)} />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-bold text-slate-700">Gender</label>
                <select className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:ring-2 focus:ring-brand-orange/20 focus:border-brand-orange outline-none transition-all bg-slate-50" value={gender} onChange={(e) => setGender(e.target.value)}>
                  <option value="">Select Gender</option>
                  <option value="male">Male</option>
                  <option value="female">Female</option>
                  <option value="other">Other</option>
                </select>
              </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <label className="text-sm font-bold text-slate-700">Height (Approx)</label>
                <input type="text" className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:ring-2 focus:ring-brand-orange/20 focus:border-brand-orange outline-none transition-all bg-slate-50" placeholder="e.g. 5'8&quot;" value={height} onChange={(e) => setHeight(e.target.value)} />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-bold text-slate-700">Last Seen Wearing</label>
                <input type="text" className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:ring-2 focus:ring-brand-orange/20 focus:border-brand-orange outline-none transition-all bg-slate-50" placeholder="e.g. Blue shirt and jeans" value={lastSeenWearing} onChange={(e) => setLastSeenWearing(e.target.value)} />
              </div>
            </div>
          </div>
        );
      case 'pets':
        return (
          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="space-y-2">
                <label className="text-sm font-bold text-slate-700">Pet Name</label>
                <input type="text" className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:ring-2 focus:ring-brand-orange/20 focus:border-brand-orange outline-none transition-all bg-slate-50" placeholder="e.g. Buddy" value={name} onChange={(e) => setName(e.target.value)} />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-bold text-slate-700">Breed</label>
                <input type="text" className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:ring-2 focus:ring-brand-orange/20 focus:border-brand-orange outline-none transition-all bg-slate-50" placeholder="e.g. Golden Retriever" value={breed} onChange={(e) => setBreed(e.target.value)} />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-bold text-slate-700">Color</label>
                <input type="text" className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:ring-2 focus:ring-brand-orange/20 focus:border-brand-orange outline-none transition-all bg-slate-50" placeholder="e.g. Golden" value={color} onChange={(e) => setColor(e.target.value)} />
              </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <label className="text-sm font-bold text-slate-700">Microchip ID (If any)</label>
                <input type="text" className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:ring-2 focus:ring-brand-orange/20 focus:border-brand-orange outline-none transition-all bg-slate-50" placeholder="e.g. 985112345678" value={microchipId} onChange={(e) => setMicrochipId(e.target.value)} />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-bold text-slate-700">Collar Color</label>
                <input type="text" className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:ring-2 focus:ring-brand-orange/20 focus:border-brand-orange outline-none transition-all bg-slate-50" placeholder="e.g. Red" value={collarColor} onChange={(e) => setCollarColor(e.target.value)} />
              </div>
            </div>
          </div>
        );
      case 'clothing':
        return (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="space-y-2">
              <label className="text-sm font-bold text-slate-700">Type / Brand</label>
              <input type="text" className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:ring-2 focus:ring-brand-orange/20 focus:border-brand-orange outline-none transition-all bg-slate-50" placeholder="e.g. Nike Jacket" value={brand} onChange={(e) => setBrand(e.target.value)} />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-bold text-slate-700">Size</label>
              <input type="text" className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:ring-2 focus:ring-brand-orange/20 focus:border-brand-orange outline-none transition-all bg-slate-50" placeholder="e.g. XL" value={size} onChange={(e) => setSize(e.target.value)} />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-bold text-slate-700">Color</label>
              <input type="text" className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:ring-2 focus:ring-brand-orange/20 focus:border-brand-orange outline-none transition-all bg-slate-50" placeholder="e.g. Black" value={color} onChange={(e) => setColor(e.target.value)} />
            </div>
          </div>
        );
      case 'wallet':
        return (
          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="space-y-2">
                <label className="text-sm font-bold text-slate-700">Document Type</label>
                <input type="text" className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:ring-2 focus:ring-brand-orange/20 focus:border-brand-orange outline-none transition-all bg-slate-50" placeholder="e.g. Citizenship, License" value={documentType} onChange={(e) => setDocumentType(e.target.value)} />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-bold text-slate-700">Name on Document</label>
                <input type="text" className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:ring-2 focus:ring-brand-orange/20 focus:border-brand-orange outline-none transition-all bg-slate-50" placeholder="e.g. John Doe" value={name} onChange={(e) => setName(e.target.value)} />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-bold text-slate-700">Color</label>
                <input type="text" className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:ring-2 focus:ring-brand-orange/20 focus:border-brand-orange outline-none transition-all bg-slate-50" placeholder="e.g. Brown" value={color} onChange={(e) => setColor(e.target.value)} />
              </div>
            </div>
            <div className="space-y-2">
              <label className="text-sm font-bold text-slate-700">Contents (Cards, Cash, etc.)</label>
              <input type="text" className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:ring-2 focus:ring-brand-orange/20 focus:border-brand-orange outline-none transition-all bg-slate-50" placeholder="e.g. 2 Credit Cards, 5000 NPR, Pan Card" value={contents} onChange={(e) => setContents(e.target.value)} />
            </div>
          </div>
        );
      case 'jewelry':
        return (
          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="space-y-2">
                <label className="text-sm font-bold text-slate-700">Type</label>
                <input type="text" className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:ring-2 focus:ring-brand-orange/20 focus:border-brand-orange outline-none transition-all bg-slate-50" placeholder="e.g. Ring, Necklace" value={brand} onChange={(e) => setBrand(e.target.value)} />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-bold text-slate-700">Material</label>
                <input type="text" className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:ring-2 focus:ring-brand-orange/20 focus:border-brand-orange outline-none transition-all bg-slate-50" placeholder="e.g. Gold, Silver" value={material} onChange={(e) => setMaterial(e.target.value)} />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-bold text-slate-700">Color</label>
                <input type="text" className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:ring-2 focus:ring-brand-orange/20 focus:border-brand-orange outline-none transition-all bg-slate-50" placeholder="e.g. Golden" value={color} onChange={(e) => setColor(e.target.value)} />
              </div>
            </div>
            <div className="space-y-2">
              <label className="text-sm font-bold text-slate-700">Weight / Carat (Optional)</label>
              <input type="text" className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:ring-2 focus:ring-brand-orange/20 focus:border-brand-orange outline-none transition-all bg-slate-50" placeholder="e.g. 24K, 10 Grams" value={jewelryWeight} onChange={(e) => setJewelryWeight(e.target.value)} />
            </div>
          </div>
        );
      case 'keys':
        return (
          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <label className="text-sm font-bold text-slate-700">Number of Keys</label>
                <input type="text" className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:ring-2 focus:ring-brand-orange/20 focus:border-brand-orange outline-none transition-all bg-slate-50" placeholder="e.g. 3" value={numberOfKeys} onChange={(e) => setNumberOfKeys(e.target.value)} />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-bold text-slate-700">Key Type</label>
                <input type="text" className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:ring-2 focus:ring-brand-orange/20 focus:border-brand-orange outline-none transition-all bg-slate-50" placeholder="e.g. Car, House, Office" value={keyType} onChange={(e) => setKeyType(e.target.value)} />
              </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <label className="text-sm font-bold text-slate-700">Keychain Description</label>
                <input type="text" className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:ring-2 focus:ring-brand-orange/20 focus:border-brand-orange outline-none transition-all bg-slate-50" placeholder="e.g. Red leather tag, Mickey Mouse" value={keychain} onChange={(e) => setKeychain(e.target.value)} />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-bold text-slate-700">Color</label>
                <input type="text" className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:ring-2 focus:ring-brand-orange/20 focus:border-brand-orange outline-none transition-all bg-slate-50" placeholder="e.g. Silver, Brass" value={color} onChange={(e) => setColor(e.target.value)} />
              </div>
            </div>
          </div>
        );
      case 'vehicles':
        return (
          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="space-y-2">
                <label className="text-sm font-bold text-slate-700">Vehicle Type</label>
                <input type="text" className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:ring-2 focus:ring-brand-orange/20 focus:border-brand-orange outline-none transition-all bg-slate-50" placeholder="e.g. Bicycle, Motorcycle, Car" value={vehicleType} onChange={(e) => setVehicleType(e.target.value)} />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-bold text-slate-700">Make / Brand</label>
                <input type="text" className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:ring-2 focus:ring-brand-orange/20 focus:border-brand-orange outline-none transition-all bg-slate-50" placeholder="e.g. Honda, Trek" value={brand} onChange={(e) => setBrand(e.target.value)} />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-bold text-slate-700">Model / Year</label>
                <input type="text" className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:ring-2 focus:ring-brand-orange/20 focus:border-brand-orange outline-none transition-all bg-slate-50" placeholder="e.g. Civic 2020" value={model} onChange={(e) => setModel(e.target.value)} />
              </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="space-y-2">
                <label className="text-sm font-bold text-slate-700">Color</label>
                <input type="text" className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:ring-2 focus:ring-brand-orange/20 focus:border-brand-orange outline-none transition-all bg-slate-50" placeholder="e.g. Red" value={color} onChange={(e) => setColor(e.target.value)} />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-bold text-slate-700">License Plate (If any)</label>
                <input type="text" className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:ring-2 focus:ring-brand-orange/20 focus:border-brand-orange outline-none transition-all bg-slate-50" placeholder="e.g. BA 1 PA 1234" value={licensePlate} onChange={(e) => setLicensePlate(e.target.value)} />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-bold text-slate-700">VIN / Chassis No. (Optional)</label>
                <input type="text" className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:ring-2 focus:ring-brand-orange/20 focus:border-brand-orange outline-none transition-all bg-slate-50" placeholder="e.g. 1HGCM8..." value={vin} onChange={(e) => setVin(e.target.value)} />
              </div>
            </div>
          </div>
        );
      case 'musical_instruments':
        return (
          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="space-y-2">
                <label className="text-sm font-bold text-slate-700">Instrument Type</label>
                <input type="text" className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:ring-2 focus:ring-brand-orange/20 focus:border-brand-orange outline-none transition-all bg-slate-50" placeholder="e.g. Guitar, Keyboard" value={instrumentType} onChange={(e) => setInstrumentType(e.target.value)} />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-bold text-slate-700">Brand</label>
                <input type="text" className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:ring-2 focus:ring-brand-orange/20 focus:border-brand-orange outline-none transition-all bg-slate-50" placeholder="e.g. Yamaha, Fender" value={brand} onChange={(e) => setBrand(e.target.value)} />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-bold text-slate-700">Model</label>
                <input type="text" className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:ring-2 focus:ring-brand-orange/20 focus:border-brand-orange outline-none transition-all bg-slate-50" placeholder="e.g. Stratocaster" value={model} onChange={(e) => setModel(e.target.value)} />
              </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <label className="text-sm font-bold text-slate-700">Color</label>
                <input type="text" className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:ring-2 focus:ring-brand-orange/20 focus:border-brand-orange outline-none transition-all bg-slate-50" placeholder="e.g. Sunburst, Black" value={color} onChange={(e) => setColor(e.target.value)} />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-bold text-slate-700">Serial Number (Optional)</label>
                <input type="text" className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:ring-2 focus:ring-brand-orange/20 focus:border-brand-orange outline-none transition-all bg-slate-50" placeholder="e.g. US190..." value={serialNumber} onChange={(e) => setSerialNumber(e.target.value)} />
              </div>
            </div>
          </div>
        );
      case 'glasses':
        return (
          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <label className="text-sm font-bold text-slate-700">Eyewear Type</label>
                <input type="text" className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:ring-2 focus:ring-brand-orange/20 focus:border-brand-orange outline-none transition-all bg-slate-50" placeholder="e.g. Sunglasses, Prescription Glasses" value={eyewearType} onChange={(e) => setEyewearType(e.target.value)} />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-bold text-slate-700">Brand</label>
                <input type="text" className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:ring-2 focus:ring-brand-orange/20 focus:border-brand-orange outline-none transition-all bg-slate-50" placeholder="e.g. Ray-Ban, Oakley" value={brand} onChange={(e) => setBrand(e.target.value)} />
              </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <label className="text-sm font-bold text-slate-700">Frame Color</label>
                <input type="text" className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:ring-2 focus:ring-brand-orange/20 focus:border-brand-orange outline-none transition-all bg-slate-50" placeholder="e.g. Tortoise, Black" value={frameColor} onChange={(e) => setFrameColor(e.target.value)} />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-bold text-slate-700">Lens Color</label>
                <input type="text" className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:ring-2 focus:ring-brand-orange/20 focus:border-brand-orange outline-none transition-all bg-slate-50" placeholder="e.g. Clear, Dark Green" value={lensColor} onChange={(e) => setLensColor(e.target.value)} />
              </div>
            </div>
          </div>
        );
      case 'other':
        return (
          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="space-y-2">
                <label className="text-sm font-bold text-slate-700">Item Name</label>
                <input type="text" className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:ring-2 focus:ring-brand-orange/20 focus:border-brand-orange outline-none transition-all bg-slate-50" placeholder="e.g. Umbrella, Water Bottle" value={itemName} onChange={(e) => setItemName(e.target.value)} />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-bold text-slate-700">Brand / Make (Optional)</label>
                <input type="text" className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:ring-2 focus:ring-brand-orange/20 focus:border-brand-orange outline-none transition-all bg-slate-50" placeholder="e.g. Hydro Flask" value={brand} onChange={(e) => setBrand(e.target.value)} />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-bold text-slate-700">Color</label>
                <input type="text" className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:ring-2 focus:ring-brand-orange/20 focus:border-brand-orange outline-none transition-all bg-slate-50" placeholder="e.g. Black" value={color} onChange={(e) => setColor(e.target.value)} />
              </div>
            </div>
          </div>
        );
      default:
        return (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <label className="text-sm font-bold text-slate-700">Brand / Type</label>
              <input type="text" className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:ring-2 focus:ring-brand-orange/20 focus:border-brand-orange outline-none transition-all bg-slate-50" placeholder="e.g. Samsung" value={brand} onChange={(e) => setBrand(e.target.value)} />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-bold text-slate-700">Color</label>
              <input type="text" className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:ring-2 focus:ring-brand-orange/20 focus:border-brand-orange outline-none transition-all bg-slate-50" placeholder="e.g. Black" value={color} onChange={(e) => setColor(e.target.value)} />
            </div>
          </div>
        );
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 py-12 px-4">
      <div className="max-w-4xl mx-auto space-y-8">
        <div className="text-center space-y-2">
          <h2 className="text-4xl font-bold text-slate-900 tracking-tight">Report Found Item</h2>
          <p className="text-slate-500 text-lg">Help someone find their lost belonging by providing details about what you've found.</p>
        </div>
        
        <div className="bg-white rounded-3xl shadow-xl shadow-slate-200/50 border border-slate-100 overflow-hidden p-8 lg:p-12">
          {renderStepper()}
          
          <form onSubmit={handleSubmit} className="space-y-10">
            {/* Step 1: Category */}
            {currentStep === 1 && (
              <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
                <div className="flex items-center gap-3 pb-2 border-b border-slate-100">
                  <div className="w-8 h-8 bg-orange-100 rounded-lg flex items-center justify-center">
                    <Tag className="w-5 h-5 text-brand-orange" />
                  </div>
                  <h3 className="text-xl font-bold text-slate-900">Basic Information</h3>
                </div>

                <div className="space-y-4">
                  <label className="text-sm font-bold text-slate-700">Select Category</label>
                  <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
                    {[
                      { id: 'electronics', label: 'Electronics', icon: Smartphone },
                      { id: 'wallet', label: 'Wallet/Purse', icon: Wallet },
                      { id: 'documents', label: 'Documents', icon: FileText },
                      { id: 'jewelry', label: 'Jewelry', icon: Gem },
                      { id: 'clothing', label: 'Clothing', icon: Shirt },
                      { id: 'pets', label: 'Pet', icon: PawPrint },
                      { id: 'person', label: 'Person', icon: User },
                      { id: 'keys', label: 'Keys', icon: Key },
                      { id: 'bags', label: 'Bags', icon: Briefcase },
                      { id: 'vehicles', label: 'Vehicles', icon: Car },
                      { id: 'musical_instruments', label: 'Instruments', icon: Music },
                      { id: 'glasses', label: 'Eyewear', icon: Glasses },
                      { id: 'other', label: 'Other', icon: Package },
                    ].map((cat) => (
                      <button
                        key={cat.id}
                        type="button"
                        onClick={() => setCategory(category === cat.id ? '' : cat.id)}
                        className={`flex flex-col items-center justify-center p-4 rounded-xl border-2 transition-all ${
                          category === cat.id
                            ? 'border-brand-orange bg-orange-50 text-brand-orange'
                            : 'border-slate-100 bg-white text-slate-500 hover:border-slate-200 hover:bg-slate-50'
                        }`}
                      >
                        <cat.icon className={`w-8 h-8 mb-3 ${category === cat.id ? 'text-brand-orange' : 'text-slate-400'}`} />
                        <span className="text-sm font-semibold text-center">{cat.label}</span>
                      </button>
                    ))}
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-6 border-t border-slate-100">
                  <div className="space-y-2">
                    <label className="text-sm font-bold text-slate-700">Photo (Mandatory, max 500KB)</label>
                    <div className="relative group">
                      <input
                        type="file"
                        accept="image/*"
                        required
                        onChange={(e) => setPhoto(e.target.files?.[0] || null)}
                        className="w-full px-4 py-2.5 rounded-xl border border-slate-200 focus:ring-2 focus:ring-brand-orange/20 focus:border-brand-orange outline-none transition-all bg-slate-50 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-brand-orange/10 file:text-brand-orange hover:file:bg-brand-orange/20"
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <label className="text-sm font-bold text-slate-700">Video (Mandatory, max 5MB)</label>
                    <div className="relative group">
                      <input
                        type="file"
                        accept="video/*"
                        required
                        onChange={(e) => setVideo(e.target.files?.[0] || null)}
                        className="w-full px-4 py-2.5 rounded-xl border border-slate-200 focus:ring-2 focus:ring-brand-orange/20 focus:border-brand-orange outline-none transition-all bg-slate-50 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-brand-orange/10 file:text-brand-orange hover:file:bg-brand-orange/20"
                      />
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Step 2: Item Details */}
            {currentStep === 2 && (
              <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
                <div className="flex items-center gap-3 pb-2 border-b border-slate-100">
                  <div className="w-8 h-8 bg-orange-100 rounded-lg flex items-center justify-center">
                    <Search className="w-5 h-5 text-brand-orange" />
                  </div>
                  <h3 className="text-xl font-bold text-slate-900">Item Details</h3>
                </div>

                {renderDynamicFields()}

                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div className="space-y-2">
                    <label className="text-sm font-bold text-slate-700">Secondary Color</label>
                    <input
                      type="text"
                      className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:ring-2 focus:ring-brand-orange/20 focus:border-brand-orange outline-none transition-all bg-slate-50"
                      placeholder="e.g. Black"
                      value={secondaryColor}
                      onChange={(e) => setSecondaryColor(e.target.value)}
                    />
                  </div>
                  <div className="space-y-2 flex flex-col justify-center pt-6">
                    <label className="flex items-center gap-3 cursor-pointer">
                      <input
                        type="checkbox"
                        className="w-5 h-5 rounded border-slate-300 text-brand-orange focus:ring-brand-orange"
                        checked={policeReportFiled}
                        onChange={(e) => setPoliceReportFiled(e.target.checked)}
                      />
                      <span className="text-sm font-bold text-slate-700">Police Report Filed?</span>
                    </label>
                  </div>
                </div>

                {policeReportFiled && (
                  <div className="space-y-2">
                    <label className="text-sm font-bold text-slate-700">Police Report Number</label>
                    <input
                      type="text"
                      className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:ring-2 focus:ring-brand-orange/20 focus:border-brand-orange outline-none transition-all bg-slate-50"
                      placeholder="e.g. PR-123456"
                      value={policeReportNumber}
                      onChange={(e) => setPoliceReportNumber(e.target.value)}
                    />
                  </div>
                )}

                <div className="space-y-2">
                  <label className="text-sm font-bold text-slate-700">Detailed Description</label>
                  <textarea
                    required
                    rows={4}
                    className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:ring-2 focus:ring-brand-orange/20 focus:border-brand-orange outline-none transition-all bg-slate-50 resize-none"
                    placeholder="E.g. Found a black iPhone 17 Pro Max with a silver cover near Birtamode bus stand..."
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                  />
                </div>
              </div>
            )}

            {/* Step 3: Location & Time */}
            {currentStep === 3 && (
              <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
                <div className="flex items-center gap-3 pb-2 border-b border-slate-100">
                  <div className="w-8 h-8 bg-orange-100 rounded-lg flex items-center justify-center">
                    <Clock className="w-5 h-5 text-brand-orange" />
                  </div>
                  <h3 className="text-xl font-bold text-slate-900">Time & Location</h3>
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-bold text-slate-700">Time Found</label>
                  <input
                    type="datetime-local"
                    required
                    max={maxDateTime}
                    className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:ring-2 focus:ring-brand-orange/20 focus:border-brand-orange outline-none transition-all bg-slate-50"
                    value={timeFrom}
                    onChange={(e) => setTimeFrom(e.target.value)}
                  />
                </div>

                <div className="space-y-4">
                  <div className="space-y-2">
                    <label className="text-sm font-bold text-slate-700">District & City</label>
                    <LocationSelector 
                      onLocationSelect={(d, c) => {
                        setDistrict(d);
                        setCity(c);
                      }}
                      initialDistrict={district}
                      initialCity={city}
                    />
                  </div>

                  <div className="space-y-2">
                    <label className="text-sm font-bold text-slate-700">Location Description</label>
                    <textarea
                      className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:ring-2 focus:ring-brand-orange/20 focus:border-brand-orange outline-none transition-all bg-slate-50 min-h-[100px] resize-y"
                      placeholder="e.g. Near the main gate of the park, under the big oak tree"
                      value={foundLocationDescription}
                      onChange={(e) => setFoundLocationDescription(e.target.value)}
                    />
                  </div>

                  <label className="text-sm font-bold text-slate-700">Location Found (Click on map to pin)</label>
                  
                  <div className="h-[400px] rounded-2xl overflow-hidden border border-slate-200 relative z-0 shadow-inner">
                    <MapContainer center={[27.7172, 85.3240]} zoom={7} style={{ height: '100%', width: '100%' }}>
                      <TileLayer
                        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                      />
                      <MapSearch onLocationSelect={setLocationFrom} />
                      <MapController district={district} city={city} />
                      <LocationMarker 
                        position={locationFrom} 
                        setPosition={setLocationFrom} 
                        label="Location Found"
                      />
                    </MapContainer>
                  </div>
                  <div className={`px-3 py-1.5 rounded-lg border inline-block text-xs font-medium ${locationFrom ? 'bg-emerald-50 border-emerald-100 text-emerald-700' : 'bg-slate-50 border-slate-100 text-slate-400'}`}>
                    Pinned at: {locationFrom ? `${locationFrom.lat.toFixed(4)}, ${locationFrom.lng.toFixed(4)}` : 'Not pinned'}
                  </div>
                </div>
              </div>
            )}

            {/* Step 4: Contact Info */}
            {currentStep === 4 && (
              <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
                <div className="flex items-center gap-3 pb-2 border-b border-slate-100">
                  <div className="w-8 h-8 bg-orange-100 rounded-lg flex items-center justify-center">
                    <User className="w-5 h-5 text-brand-orange" />
                  </div>
                  <h3 className="text-xl font-bold text-slate-900">Your Contact Information</h3>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div className="space-y-2">
                    <label className="text-sm font-bold text-slate-700">Full Name</label>
                    <input type="text" className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:ring-2 focus:ring-brand-orange/20 focus:border-brand-orange outline-none transition-all bg-slate-50" placeholder="Your Name" value={contactName} onChange={(e) => setContactName(e.target.value)} required />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-bold text-slate-700">Email Address</label>
                    <input type="email" className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:ring-2 focus:ring-brand-orange/20 focus:border-brand-orange outline-none transition-all bg-slate-50" placeholder="Your Email" value={contactEmail} onChange={(e) => setContactEmail(e.target.value)} required />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-bold text-slate-700">Phone Number</label>
                    <input type="tel" className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:ring-2 focus:ring-brand-orange/20 focus:border-brand-orange outline-none transition-all bg-slate-50" placeholder="Your Phone Number" value={contactPhone} onChange={(e) => setContactPhone(e.target.value)} required />
                  </div>
                </div>
              </div>
            )}

            <div className="pt-8 mt-8 border-t border-slate-100 flex gap-4">
              {currentStep > 1 && (
                <button
                  type="button"
                  onClick={handleBack}
                  className="px-8 py-4 rounded-2xl font-bold text-lg border-2 border-slate-200 text-slate-600 hover:bg-slate-50 transition-all"
                >
                  Back
                </button>
              )}
              <button
                type="submit"
                disabled={isSubmitting}
                className="flex-1 bg-brand-orange text-white py-4 rounded-2xl font-bold text-lg hover:bg-brand-orange/90 transition-all shadow-xl shadow-brand-orange/20 flex items-center justify-center gap-3 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="w-6 h-6 animate-spin" /> Submitting...
                  </>
                ) : currentStep < 4 ? (
                  'Next Step'
                ) : (
                  'Submit Found Item Report'
                )}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
