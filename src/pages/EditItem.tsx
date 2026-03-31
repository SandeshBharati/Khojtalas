import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { toast } from 'sonner';
import { MapContainer, TileLayer, Marker, useMapEvents, useMap } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';
import { doc, getDoc, updateDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '../firebase';
import { useAuth } from '../contexts/AuthContext';
import { handleFirestoreError, OperationType } from '../utils/firestoreErrorHandler';
import MapSearch from '../components/MapSearch';

// Fix leaflet icon issue
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

function LocationMarker({ position, setPosition }: any) {
  useMapEvents({
    click(e) {
      setPosition(e.latlng);
    },
  });

  return position === null ? null : (
    <Marker position={position}>
    </Marker>
  );
}

const fileToBase64 = (file: File): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = error => reject(error);
  });
};

import { Search, MapPin, Calendar, Camera, Video, Tag, Info, Phone, Award, Save, ArrowLeft, User } from 'lucide-react';

export default function EditItem() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  
  const [loading, setLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [itemType, setItemType] = useState<'lost' | 'found'>('lost');
  const [category, setCategory] = useState('electronics');
  const [brand, setBrand] = useState('');
  const [model, setModel] = useState('');
  const [color, setColor] = useState('');
  const [secondaryColor, setSecondaryColor] = useState('');
  const [contactName, setContactName] = useState('');
  const [contactEmail, setContactEmail] = useState('');
  const [contactPhone, setContactPhone] = useState('');
  const [description, setDescription] = useState('');
  const [foundLocationDescription, setFoundLocationDescription] = useState('');
  const [lostLocationDescription, setLostLocationDescription] = useState('');
  const [timeFrom, setTimeFrom] = useState('');
  const [timeTo, setTimeTo] = useState('');
  const [photo, setPhoto] = useState<File | null>(null);
  const [video, setVideo] = useState<File | null>(null);
  const [existingPhoto, setExistingPhoto] = useState<string | null>(null);
  const [existingVideo, setExistingVideo] = useState<string | null>(null);
  const [locationFrom, setLocationFrom] = useState<any>(null);
  const [locationTo, setLocationTo] = useState<any>(null);
  const [selectingLocation, setSelectingLocation] = useState<'from' | 'to'>('from');
  const [estimatedValue, setEstimatedValue] = useState('');
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
  const [itemCondition, setItemCondition] = useState('good');
  const [distinguishingFeatures, setDistinguishingFeatures] = useState('');

  useEffect(() => {
    const fetchItem = async () => {
      if (!id) return;
      try {
        const docRef = doc(db, 'items', id);
        const docSnap = await getDoc(docRef);
        
        if (docSnap.exists()) {
          const data = docSnap.data();
          
          if (data.userId !== user?.uid) {
            toast.error('You do not have permission to edit this item');
            navigate('/');
            return;
          }

          setItemType(data.type);
          setCategory(data.category);
          setBrand(data.brand || '');
          setModel(data.model || '');
          setColor(data.color || '');
          setSecondaryColor(data.secondaryColor || '');
          setContactName(data.contactName || '');
          setContactEmail(data.contactEmail || '');
          setContactPhone(data.contactPhone || '');
          setDescription(data.description);
          setFoundLocationDescription(data.foundLocationDescription || '');
          setLostLocationDescription(data.lostLocationDescription || '');
          setTimeFrom(data.timeFrom);
          setTimeTo(data.timeTo || '');
          setExistingPhoto(data.photoData || null);
          setExistingVideo(data.videoData || null);
          setLocationFrom({ lat: data.locationFromLat, lng: data.locationFromLng });
          if (data.locationToLat && data.locationToLng) {
            setLocationTo({ lat: data.locationToLat, lng: data.locationToLng });
          }
          setEstimatedValue(data.estimatedValue || '');
          setPoliceReportFiled(data.policeReportFiled || false);
          setPoliceReportNumber(data.policeReportNumber || '');

          // Set dynamic fields
          setName(data.name || '');
          setAge(data.age || '');
          setGender(data.gender || '');
          setBreed(data.breed || '');
          setSize(data.size || '');
          setMaterial(data.material || '');
          setDocumentType(data.documentType || '');
          setOs(data.os || '');
          setStorage(data.storage || '');
          setHeight(data.height || '');
          setLastSeenWearing(data.lastSeenWearing || '');
          setMicrochipId(data.microchipId || '');
          setCollarColor(data.collarColor || '');
          setContents(data.contents || '');
          setJewelryWeight(data.jewelryWeight || '');
          setNumberOfKeys(data.numberOfKeys || '');
          setKeyType(data.keyType || '');
          setKeychain(data.keychain || '');
          setItemName(data.itemName || '');
          setVehicleType(data.vehicleType || '');
          setLicensePlate(data.licensePlate || '');
          setVin(data.vin || '');
          setInstrumentType(data.instrumentType || '');
          setSerialNumber(data.serialNumber || '');
          setEyewearType(data.eyewearType || '');
          setFrameColor(data.frameColor || '');
          setLensColor(data.lensColor || '');
          setItemCondition(data.itemCondition || 'good');
          setDistinguishingFeatures(data.distinguishingFeatures || '');
        } else {
          toast.error('Item not found');
          navigate('/');
        }
      } catch (error) {
        handleFirestoreError(error, OperationType.GET, `items/${id}`);
      } finally {
        setLoading(false);
      }
    };

    if (user) {
      fetchItem();
    } else {
      setLoading(false);
    }
  }, [id, user, navigate]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !id) {
      toast.error('Please login first');
      navigate('/login');
      return;
    }

    if (!locationFrom) {
      toast.error('Please select a location on the map');
      return;
    }

    if (itemType === 'found' && !video && !existingVideo) {
      toast.error('Please upload a video of the found item');
      return;
    }

    setIsSubmitting(true);
    try {
      let photoData = existingPhoto;
      if (photo) {
        if (photo.size > 500000) {
          toast.error('Photo must be less than 500KB');
          setIsSubmitting(false);
          return;
        }
        photoData = await fileToBase64(photo);
      }

      let videoData = existingVideo;
      if (video) {
        if (video.size > 5000000) {
          toast.error('Video must be less than 5MB');
          setIsSubmitting(false);
          return;
        }
        videoData = await fileToBase64(video);
      }

      const itemData: any = {
        category,
        secondaryColor,
        contactName,
        contactEmail,
        contactPhone,
        description,
        foundLocationDescription,
        lostLocationDescription,
        timeFrom,
        locationFromLat: locationFrom.lat,
        locationFromLng: locationFrom.lng,
        updatedAt: serverTimestamp(),
        itemCondition,
        distinguishingFeatures,
        estimatedValue,
        policeReportFiled,
        policeReportNumber: policeReportFiled ? policeReportNumber : null
      };

      switch (category) {
        case 'electronics':
          itemData.brand = brand || null;
          itemData.model = model || null;
          itemData.color = color || null;
          itemData.os = os || null;
          itemData.storage = storage || null;
          break;
        case 'bags':
          itemData.brand = brand || null;
          itemData.color = color || null;
          itemData.size = size || null;
          itemData.contents = contents || null;
          break;
        case 'person':
          itemData.name = name || null;
          itemData.age = age || null;
          itemData.gender = gender || null;
          itemData.height = height || null;
          itemData.lastSeenWearing = lastSeenWearing || null;
          break;
        case 'pets':
          itemData.name = name || null;
          itemData.breed = breed || null;
          itemData.color = color || null;
          itemData.microchipId = microchipId || null;
          itemData.collarColor = collarColor || null;
          break;
        case 'clothing':
          itemData.brand = brand || null;
          itemData.size = size || null;
          itemData.color = color || null;
          break;
        case 'wallet':
          itemData.documentType = documentType || null;
          itemData.name = name || null;
          itemData.color = color || null;
          itemData.contents = contents || null;
          break;
        case 'jewelry':
          itemData.brand = brand || null;
          itemData.material = material || null;
          itemData.color = color || null;
          itemData.jewelryWeight = jewelryWeight || null;
          break;
        case 'keys':
          itemData.numberOfKeys = numberOfKeys || null;
          itemData.keyType = keyType || null;
          itemData.keychain = keychain || null;
          itemData.color = color || null;
          break;
        case 'vehicles':
          itemData.vehicleType = vehicleType || null;
          itemData.brand = brand || null;
          itemData.model = model || null;
          itemData.color = color || null;
          itemData.licensePlate = licensePlate || null;
          itemData.vin = vin || null;
          break;
        case 'musical_instruments':
          itemData.instrumentType = instrumentType || null;
          itemData.brand = brand || null;
          itemData.model = model || null;
          itemData.color = color || null;
          itemData.serialNumber = serialNumber || null;
          break;
        case 'glasses':
          itemData.eyewearType = eyewearType || null;
          itemData.brand = brand || null;
          itemData.frameColor = frameColor || null;
          itemData.lensColor = lensColor || null;
          break;
        case 'other':
          itemData.itemName = itemName || null;
          itemData.color = color || null;
          itemData.brand = brand || null;
          break;
        default:
          itemData.brand = brand || null;
          itemData.color = color || null;
          break;
      }

      if (timeTo) itemData.timeTo = timeTo;
      else itemData.timeTo = null;

      if (locationTo) {
        itemData.locationToLat = locationTo.lat;
        itemData.locationToLng = locationTo.lng;
      } else {
        itemData.locationToLat = null;
        itemData.locationToLng = null;
      }

      if (photoData) itemData.photoData = photoData;
      if (videoData) itemData.videoData = videoData;

      await updateDoc(doc(db, 'items', id), itemData);

      toast.success('Item report updated successfully');
      navigate('/');
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, `items/${id}`);
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
                <input type="text" className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:ring-2 focus:ring-brand-orange/20 focus:border-brand-orange outline-none transition-all bg-white" placeholder="e.g. Apple" value={brand} onChange={(e) => setBrand(e.target.value)} />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-bold text-slate-700">Model</label>
                <input type="text" className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:ring-2 focus:ring-brand-orange/20 focus:border-brand-orange outline-none transition-all bg-white" placeholder="e.g. iPhone 15" value={model} onChange={(e) => setModel(e.target.value)} />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-bold text-slate-700">Color</label>
                <input type="text" className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:ring-2 focus:ring-brand-orange/20 focus:border-brand-orange outline-none transition-all bg-white" placeholder="e.g. Space Gray" value={color} onChange={(e) => setColor(e.target.value)} />
              </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <label className="text-sm font-bold text-slate-700">OS (if applicable)</label>
                <input type="text" className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:ring-2 focus:ring-brand-orange/20 focus:border-brand-orange outline-none transition-all bg-white" placeholder="e.g. iOS 17" value={os} onChange={(e) => setOs(e.target.value)} />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-bold text-slate-700">Storage (if applicable)</label>
                <input type="text" className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:ring-2 focus:ring-brand-orange/20 focus:border-brand-orange outline-none transition-all bg-white" placeholder="e.g. 256GB" value={storage} onChange={(e) => setStorage(e.target.value)} />
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
                <input type="text" className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:ring-2 focus:ring-brand-orange/20 focus:border-brand-orange outline-none transition-all bg-white" placeholder="e.g. American Tourister" value={brand} onChange={(e) => setBrand(e.target.value)} />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-bold text-slate-700">Color</label>
                <input type="text" className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:ring-2 focus:ring-brand-orange/20 focus:border-brand-orange outline-none transition-all bg-white" placeholder="e.g. Blue" value={color} onChange={(e) => setColor(e.target.value)} />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-bold text-slate-700">Size</label>
                <input type="text" className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:ring-2 focus:ring-brand-orange/20 focus:border-brand-orange outline-none transition-all bg-white" placeholder="e.g. Medium" value={size} onChange={(e) => setSize(e.target.value)} />
              </div>
            </div>
            <div className="space-y-2">
              <label className="text-sm font-bold text-slate-700">Contents (if any)</label>
              <textarea rows={2} className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:ring-2 focus:ring-brand-orange/20 focus:border-brand-orange outline-none transition-all bg-white resize-none" placeholder="e.g. Contains a laptop and some books" value={contents} onChange={(e) => setContents(e.target.value)} />
            </div>
          </div>
        );
      case 'person':
        return (
          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="space-y-2">
                <label className="text-sm font-bold text-slate-700">Full Name</label>
                <input type="text" className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:ring-2 focus:ring-brand-orange/20 focus:border-brand-orange outline-none transition-all bg-white" placeholder="e.g. John Doe" value={name} onChange={(e) => setName(e.target.value)} />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-bold text-slate-700">Age</label>
                <input type="text" className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:ring-2 focus:ring-brand-orange/20 focus:border-brand-orange outline-none transition-all bg-white" placeholder="e.g. 25" value={age} onChange={(e) => setAge(e.target.value)} />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-bold text-slate-700">Gender</label>
                <select className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:ring-2 focus:ring-brand-orange/20 focus:border-brand-orange outline-none transition-all bg-white" value={gender} onChange={(e) => setGender(e.target.value)}>
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
                <input type="text" className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:ring-2 focus:ring-brand-orange/20 focus:border-brand-orange outline-none transition-all bg-white" placeholder="e.g. 5'8&quot;" value={height} onChange={(e) => setHeight(e.target.value)} />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-bold text-slate-700">Last Seen Wearing</label>
                <input type="text" className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:ring-2 focus:ring-brand-orange/20 focus:border-brand-orange outline-none transition-all bg-white" placeholder="e.g. Blue shirt and jeans" value={lastSeenWearing} onChange={(e) => setLastSeenWearing(e.target.value)} />
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
                <input type="text" className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:ring-2 focus:ring-brand-orange/20 focus:border-brand-orange outline-none transition-all bg-white" placeholder="e.g. Buddy" value={name} onChange={(e) => setName(e.target.value)} />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-bold text-slate-700">Breed</label>
                <input type="text" className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:ring-2 focus:ring-brand-orange/20 focus:border-brand-orange outline-none transition-all bg-white" placeholder="e.g. Golden Retriever" value={breed} onChange={(e) => setBreed(e.target.value)} />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-bold text-slate-700">Color</label>
                <input type="text" className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:ring-2 focus:ring-brand-orange/20 focus:border-brand-orange outline-none transition-all bg-white" placeholder="e.g. Golden" value={color} onChange={(e) => setColor(e.target.value)} />
              </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <label className="text-sm font-bold text-slate-700">Microchip ID (If any)</label>
                <input type="text" className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:ring-2 focus:ring-brand-orange/20 focus:border-brand-orange outline-none transition-all bg-white" placeholder="e.g. 985112345678" value={microchipId} onChange={(e) => setMicrochipId(e.target.value)} />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-bold text-slate-700">Collar Color</label>
                <input type="text" className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:ring-2 focus:ring-brand-orange/20 focus:border-brand-orange outline-none transition-all bg-white" placeholder="e.g. Red" value={collarColor} onChange={(e) => setCollarColor(e.target.value)} />
              </div>
            </div>
          </div>
        );
      case 'clothing':
        return (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="space-y-2">
              <label className="text-sm font-bold text-slate-700">Type / Brand</label>
              <input type="text" className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:ring-2 focus:ring-brand-orange/20 focus:border-brand-orange outline-none transition-all bg-white" placeholder="e.g. Nike Jacket" value={brand} onChange={(e) => setBrand(e.target.value)} />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-bold text-slate-700">Size</label>
              <input type="text" className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:ring-2 focus:ring-brand-orange/20 focus:border-brand-orange outline-none transition-all bg-white" placeholder="e.g. XL" value={size} onChange={(e) => setSize(e.target.value)} />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-bold text-slate-700">Color</label>
              <input type="text" className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:ring-2 focus:ring-brand-orange/20 focus:border-brand-orange outline-none transition-all bg-white" placeholder="e.g. Black" value={color} onChange={(e) => setColor(e.target.value)} />
            </div>
          </div>
        );
      case 'wallet':
        return (
          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="space-y-2">
                <label className="text-sm font-bold text-slate-700">Document Type</label>
                <input type="text" className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:ring-2 focus:ring-brand-orange/20 focus:border-brand-orange outline-none transition-all bg-white" placeholder="e.g. Citizenship, License" value={documentType} onChange={(e) => setDocumentType(e.target.value)} />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-bold text-slate-700">Name on Document</label>
                <input type="text" className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:ring-2 focus:ring-brand-orange/20 focus:border-brand-orange outline-none transition-all bg-white" placeholder="e.g. John Doe" value={name} onChange={(e) => setName(e.target.value)} />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-bold text-slate-700">Color</label>
                <input type="text" className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:ring-2 focus:ring-brand-orange/20 focus:border-brand-orange outline-none transition-all bg-white" placeholder="e.g. Brown" value={color} onChange={(e) => setColor(e.target.value)} />
              </div>
            </div>
            <div className="space-y-2">
              <label className="text-sm font-bold text-slate-700">Contents (Cards, Cash, etc.)</label>
              <input type="text" className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:ring-2 focus:ring-brand-orange/20 focus:border-brand-orange outline-none transition-all bg-white" placeholder="e.g. 2 Credit Cards, 5000 NPR, Pan Card" value={contents} onChange={(e) => setContents(e.target.value)} />
            </div>
          </div>
        );
      case 'jewelry':
        return (
          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="space-y-2">
                <label className="text-sm font-bold text-slate-700">Type</label>
                <input type="text" className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:ring-2 focus:ring-brand-orange/20 focus:border-brand-orange outline-none transition-all bg-white" placeholder="e.g. Ring, Necklace" value={brand} onChange={(e) => setBrand(e.target.value)} />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-bold text-slate-700">Material</label>
                <input type="text" className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:ring-2 focus:ring-brand-orange/20 focus:border-brand-orange outline-none transition-all bg-white" placeholder="e.g. Gold, Silver" value={material} onChange={(e) => setMaterial(e.target.value)} />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-bold text-slate-700">Color</label>
                <input type="text" className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:ring-2 focus:ring-brand-orange/20 focus:border-brand-orange outline-none transition-all bg-white" placeholder="e.g. Golden" value={color} onChange={(e) => setColor(e.target.value)} />
              </div>
            </div>
            <div className="space-y-2">
              <label className="text-sm font-bold text-slate-700">Weight / Carat (Optional)</label>
              <input type="text" className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:ring-2 focus:ring-brand-orange/20 focus:border-brand-orange outline-none transition-all bg-white" placeholder="e.g. 24K, 10 Grams" value={jewelryWeight} onChange={(e) => setJewelryWeight(e.target.value)} />
            </div>
          </div>
        );
      case 'keys':
        return (
          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <label className="text-sm font-bold text-slate-700">Number of Keys</label>
                <input type="text" className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:ring-2 focus:ring-brand-orange/20 focus:border-brand-orange outline-none transition-all bg-white" placeholder="e.g. 3" value={numberOfKeys} onChange={(e) => setNumberOfKeys(e.target.value)} />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-bold text-slate-700">Key Type</label>
                <input type="text" className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:ring-2 focus:ring-brand-orange/20 focus:border-brand-orange outline-none transition-all bg-white" placeholder="e.g. Car, House, Office" value={keyType} onChange={(e) => setKeyType(e.target.value)} />
              </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <label className="text-sm font-bold text-slate-700">Keychain Description</label>
                <input type="text" className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:ring-2 focus:ring-brand-orange/20 focus:border-brand-orange outline-none transition-all bg-white" placeholder="e.g. Red leather tag, Mickey Mouse" value={keychain} onChange={(e) => setKeychain(e.target.value)} />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-bold text-slate-700">Color</label>
                <input type="text" className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:ring-2 focus:ring-brand-orange/20 focus:border-brand-orange outline-none transition-all bg-white" placeholder="e.g. Silver, Brass" value={color} onChange={(e) => setColor(e.target.value)} />
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
                <input type="text" className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:ring-2 focus:ring-brand-orange/20 focus:border-brand-orange outline-none transition-all bg-white" placeholder="e.g. Bicycle, Motorcycle, Car" value={vehicleType} onChange={(e) => setVehicleType(e.target.value)} />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-bold text-slate-700">Make / Brand</label>
                <input type="text" className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:ring-2 focus:ring-brand-orange/20 focus:border-brand-orange outline-none transition-all bg-white" placeholder="e.g. Honda, Trek" value={brand} onChange={(e) => setBrand(e.target.value)} />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-bold text-slate-700">Model / Year</label>
                <input type="text" className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:ring-2 focus:ring-brand-orange/20 focus:border-brand-orange outline-none transition-all bg-white" placeholder="e.g. Civic 2020" value={model} onChange={(e) => setModel(e.target.value)} />
              </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="space-y-2">
                <label className="text-sm font-bold text-slate-700">Color</label>
                <input type="text" className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:ring-2 focus:ring-brand-orange/20 focus:border-brand-orange outline-none transition-all bg-white" placeholder="e.g. Red" value={color} onChange={(e) => setColor(e.target.value)} />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-bold text-slate-700">License Plate (If any)</label>
                <input type="text" className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:ring-2 focus:ring-brand-orange/20 focus:border-brand-orange outline-none transition-all bg-white" placeholder="e.g. BA 1 PA 1234" value={licensePlate} onChange={(e) => setLicensePlate(e.target.value)} />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-bold text-slate-700">VIN / Chassis No. (Optional)</label>
                <input type="text" className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:ring-2 focus:ring-brand-orange/20 focus:border-brand-orange outline-none transition-all bg-white" placeholder="e.g. 1HGCM8..." value={vin} onChange={(e) => setVin(e.target.value)} />
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
                <input type="text" className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:ring-2 focus:ring-brand-orange/20 focus:border-brand-orange outline-none transition-all bg-white" placeholder="e.g. Guitar, Keyboard" value={instrumentType} onChange={(e) => setInstrumentType(e.target.value)} />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-bold text-slate-700">Brand</label>
                <input type="text" className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:ring-2 focus:ring-brand-orange/20 focus:border-brand-orange outline-none transition-all bg-white" placeholder="e.g. Yamaha, Fender" value={brand} onChange={(e) => setBrand(e.target.value)} />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-bold text-slate-700">Model</label>
                <input type="text" className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:ring-2 focus:ring-brand-orange/20 focus:border-brand-orange outline-none transition-all bg-white" placeholder="e.g. Stratocaster" value={model} onChange={(e) => setModel(e.target.value)} />
              </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <label className="text-sm font-bold text-slate-700">Color</label>
                <input type="text" className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:ring-2 focus:ring-brand-orange/20 focus:border-brand-orange outline-none transition-all bg-white" placeholder="e.g. Sunburst, Black" value={color} onChange={(e) => setColor(e.target.value)} />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-bold text-slate-700">Serial Number (Optional)</label>
                <input type="text" className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:ring-2 focus:ring-brand-orange/20 focus:border-brand-orange outline-none transition-all bg-white" placeholder="e.g. US190..." value={serialNumber} onChange={(e) => setSerialNumber(e.target.value)} />
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
                <input type="text" className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:ring-2 focus:ring-brand-orange/20 focus:border-brand-orange outline-none transition-all bg-white" placeholder="e.g. Sunglasses, Prescription Glasses" value={eyewearType} onChange={(e) => setEyewearType(e.target.value)} />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-bold text-slate-700">Brand</label>
                <input type="text" className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:ring-2 focus:ring-brand-orange/20 focus:border-brand-orange outline-none transition-all bg-white" placeholder="e.g. Ray-Ban, Oakley" value={brand} onChange={(e) => setBrand(e.target.value)} />
              </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <label className="text-sm font-bold text-slate-700">Frame Color</label>
                <input type="text" className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:ring-2 focus:ring-brand-orange/20 focus:border-brand-orange outline-none transition-all bg-white" placeholder="e.g. Tortoise, Black" value={frameColor} onChange={(e) => setFrameColor(e.target.value)} />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-bold text-slate-700">Lens Color</label>
                <input type="text" className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:ring-2 focus:ring-brand-orange/20 focus:border-brand-orange outline-none transition-all bg-white" placeholder="e.g. Clear, Dark Green" value={lensColor} onChange={(e) => setLensColor(e.target.value)} />
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
                <input type="text" className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:ring-2 focus:ring-brand-orange/20 focus:border-brand-orange outline-none transition-all bg-white" placeholder="e.g. Umbrella, Water Bottle" value={itemName} onChange={(e) => setItemName(e.target.value)} />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-bold text-slate-700">Brand / Make (Optional)</label>
                <input type="text" className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:ring-2 focus:ring-brand-orange/20 focus:border-brand-orange outline-none transition-all bg-white" placeholder="e.g. Hydro Flask" value={brand} onChange={(e) => setBrand(e.target.value)} />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-bold text-slate-700">Color</label>
                <input type="text" className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:ring-2 focus:ring-brand-orange/20 focus:border-brand-orange outline-none transition-all bg-white" placeholder="e.g. Black" value={color} onChange={(e) => setColor(e.target.value)} />
              </div>
            </div>
          </div>
        );
      default:
        return (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <label className="text-sm font-bold text-slate-700">Brand / Type</label>
              <input type="text" className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:ring-2 focus:ring-brand-orange/20 focus:border-brand-orange outline-none transition-all bg-white" placeholder="e.g. Samsung" value={brand} onChange={(e) => setBrand(e.target.value)} />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-bold text-slate-700">Color</label>
              <input type="text" className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:ring-2 focus:ring-brand-orange/20 focus:border-brand-orange outline-none transition-all bg-white" placeholder="e.g. Black" value={color} onChange={(e) => setColor(e.target.value)} />
            </div>
          </div>
        );
    }
  };

  if (loading) {
    return (
      <div className="min-h-[60vh] flex flex-col items-center justify-center gap-4">
        <div className="w-12 h-12 border-4 border-brand-orange border-t-transparent rounded-full animate-spin"></div>
        <p className="text-slate-500 font-medium">Loading item details...</p>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto px-4 py-12">
      <div className="mb-8 flex items-center justify-between">
        <div className="space-y-1">
          <button 
            onClick={() => navigate(-1)}
            className="flex items-center gap-2 text-slate-500 hover:text-brand-orange font-bold transition-colors mb-2"
          >
            <ArrowLeft className="w-4 h-4" /> Back
          </button>
          <h2 className="text-3xl font-bold text-slate-900 tracking-tight">
            Edit <span className="text-brand-orange">{itemType === 'lost' ? 'Lost' : 'Found'}</span> Item
          </h2>
          <p className="text-slate-500">Update the details of your report below.</p>
        </div>
      </div>
      
      <form onSubmit={handleSubmit} className="bg-white rounded-3xl shadow-xl shadow-slate-200/50 border border-slate-100 overflow-hidden">
        {/* Section 1: Basic Info */}
        <div className="p-8 lg:p-10 border-b border-slate-100 space-y-8">
          <div className="flex items-center gap-3 text-brand-orange">
            <div className="w-10 h-10 bg-brand-orange/10 rounded-xl flex items-center justify-center">
              <Tag className="w-5 h-5" />
            </div>
            <h3 className="text-xl font-bold text-slate-900">Basic Information</h3>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div className="space-y-2">
              <label className="text-sm font-bold text-slate-700">Category</label>
              <select
                className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:ring-2 focus:ring-brand-orange/20 focus:border-brand-orange outline-none transition-all bg-slate-50 font-medium"
                value={category}
                onChange={(e) => setCategory(e.target.value)}
              >
                <option value="electronics">Electronics (Phone, Laptop, etc.)</option>
                <option value="wallet">Wallet / Documents</option>
                <option value="person">Person</option>
                <option value="keys">Keys</option>
                <option value="clothing">Clothing</option>
                <option value="jewelry">Jewelry</option>
                <option value="pets">Pets</option>
                <option value="bags">Bags / Backpacks</option>
                <option value="vehicles">Vehicles (Bicycle, Car, etc.)</option>
                <option value="musical_instruments">Musical Instruments</option>
                <option value="glasses">Eyewear / Glasses</option>
                <option value="other">Other</option>
              </select>
            </div>
            
            <div className="space-y-2">
              <label className="text-sm font-bold text-slate-700 flex items-center gap-2">
                <Camera className="w-4 h-4 text-slate-400" /> Photo (max 500KB)
              </label>
              <input
                type="file"
                accept="image/*"
                onChange={(e) => setPhoto(e.target.files?.[0] || null)}
                className="w-full px-4 py-2.5 rounded-xl border border-slate-200 focus:ring-2 focus:ring-brand-orange/20 focus:border-brand-orange outline-none transition-all bg-slate-50 text-sm"
              />
              {existingPhoto && !photo && (
                <p className="text-xs text-slate-400 font-medium">Current photo will be kept if no new file is selected.</p>
              )}
            </div>
          </div>
        </div>

        {/* Section 2: Item Details */}
        <div className="p-8 lg:p-10 border-b border-slate-100 bg-slate-50/50 space-y-8">
          <div className="flex items-center gap-3 text-brand-orange">
            <div className="w-10 h-10 bg-brand-orange/10 rounded-xl flex items-center justify-center">
              <Info className="w-5 h-5" />
            </div>
            <h3 className="text-xl font-bold text-slate-900">Item Details</h3>
          </div>

          {renderDynamicFields()}

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="space-y-2">
              <label className="text-sm font-bold text-slate-700">Item Condition</label>
              <select className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:ring-2 focus:ring-brand-orange/20 focus:border-brand-orange outline-none transition-all bg-white" value={itemCondition} onChange={(e) => setItemCondition(e.target.value)}>
                <option value="new">New / Like New</option>
                <option value="good">Good</option>
                <option value="fair">Fair</option>
                <option value="poor">Poor / Damaged</option>
              </select>
            </div>
            <div className="space-y-2">
              <label className="text-sm font-bold text-slate-700">Distinguishing Features</label>
              <input
                type="text"
                className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:ring-2 focus:ring-brand-orange/20 focus:border-brand-orange outline-none transition-all bg-white"
                placeholder="e.g. Scratches on back, stickers"
                value={distinguishingFeatures}
                onChange={(e) => setDistinguishingFeatures(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-bold text-slate-700 flex items-center gap-2">
                <Phone className="w-4 h-4 text-slate-400" /> Contact Phone
              </label>
              <input
                type="tel"
                className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:ring-2 focus:ring-brand-orange/20 focus:border-brand-orange outline-none transition-all bg-white"
                placeholder="98XXXXXXXX"
                value={contactPhone}
                onChange={(e) => setContactPhone(e.target.value)}
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <label className="text-sm font-bold text-slate-700 flex items-center gap-2">
                <User className="w-4 h-4 text-slate-400" /> Contact Name
              </label>
              <input
                type="text"
                className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:ring-2 focus:ring-brand-orange/20 focus:border-brand-orange outline-none transition-all bg-white"
                placeholder="Name"
                value={contactName}
                onChange={(e) => setContactName(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-bold text-slate-700 flex items-center gap-2">
                <User className="w-4 h-4 text-slate-400" /> Contact Email
              </label>
              <input
                type="email"
                className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:ring-2 focus:ring-brand-orange/20 focus:border-brand-orange outline-none transition-all bg-white"
                placeholder="Email"
                value={contactEmail}
                onChange={(e) => setContactEmail(e.target.value)}
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="space-y-2">
              <label className="text-sm font-bold text-slate-700">Secondary Color</label>
              <input
                type="text"
                className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:ring-2 focus:ring-brand-orange/20 focus:border-brand-orange outline-none transition-all bg-white"
                placeholder="e.g. Black"
                value={secondaryColor}
                onChange={(e) => setSecondaryColor(e.target.value)}
              />
            </div>
            {itemType === 'lost' && (
              <>
                <div className="space-y-2">
                  <label className="text-sm font-bold text-slate-700">Reward (NPR)</label>
                  <input
                    type="number"
                    className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:ring-2 focus:ring-brand-orange/20 focus:border-brand-orange outline-none transition-all bg-white"
                    placeholder="e.g. 5000"
                    value={estimatedValue}
                    onChange={(e) => setEstimatedValue(e.target.value)}
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
              </>
            )}
          </div>

          {itemType === 'lost' && policeReportFiled && (
            <div className="space-y-2">
              <label className="text-sm font-bold text-slate-700">Police Report Number</label>
              <input
                type="text"
                className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:ring-2 focus:ring-brand-orange/20 focus:border-brand-orange outline-none transition-all bg-white"
                placeholder="e.g. PR-123456"
                value={policeReportNumber}
                onChange={(e) => setPoliceReportNumber(e.target.value)}
              />
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-1 gap-8">
            <div className="space-y-2">
              <label className="text-sm font-bold text-slate-700 flex items-center gap-2">
                <Video className="w-4 h-4 text-slate-400" /> Video {itemType === 'found' ? '(Mandatory, max 5MB)' : '(max 5MB)'}
              </label>
              <input
                type="file"
                accept="video/*"
                required={itemType === 'found' && !existingVideo}
                onChange={(e) => setVideo(e.target.files?.[0] || null)}
                className="w-full px-4 py-2.5 rounded-xl border border-slate-200 focus:ring-2 focus:ring-brand-orange/20 focus:border-brand-orange outline-none transition-all bg-white text-sm"
              />
              {existingVideo && !video && (
                <p className="text-xs text-slate-400 font-medium">Current video will be kept if no new file is selected.</p>
              )}
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-bold text-slate-700">Description</label>
            <textarea
              required
              rows={3}
              className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:ring-2 focus:ring-brand-orange/20 focus:border-brand-orange outline-none transition-all bg-white"
              placeholder="Describe the item in detail..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
            />
          </div>
        </div>

        {/* Section 3: Time & Location */}
        <div className="p-8 lg:p-10 space-y-8">
          <div className="flex items-center gap-3 text-brand-orange">
            <div className="w-10 h-10 bg-brand-orange/10 rounded-xl flex items-center justify-center">
              <MapPin className="w-5 h-5" />
            </div>
            <h3 className="text-xl font-bold text-slate-900">Time & Location</h3>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div className="space-y-2">
              <label className="text-sm font-bold text-slate-700 flex items-center gap-2">
                <Calendar className="w-4 h-4 text-slate-400" /> Time {itemType === 'lost' ? 'Lost' : 'Found'} (From)
              </label>
              <input
                type="datetime-local"
                required
                max={maxDateTime}
                className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:ring-2 focus:ring-brand-orange/20 focus:border-brand-orange outline-none transition-all bg-slate-50"
                value={timeFrom}
                onChange={(e) => setTimeFrom(e.target.value)}
              />
            </div>
            {itemType === 'lost' && (
              <div className="space-y-2">
                <label className="text-sm font-bold text-slate-700 flex items-center gap-2">
                  <Calendar className="w-4 h-4 text-slate-400" /> Time Lost (To)
                </label>
                <input
                  type="datetime-local"
                  max={maxDateTime}
                  className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:ring-2 focus:ring-brand-orange/20 focus:border-brand-orange outline-none transition-all bg-slate-50"
                  value={timeTo}
                  onChange={(e) => setTimeTo(e.target.value)}
                />
              </div>
            )}
          </div>

          <div className="space-y-4">
            <div className="space-y-2">
              <label className="text-sm font-bold text-slate-700">Location Description</label>
              <textarea
                className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:ring-2 focus:ring-brand-orange/20 focus:border-brand-orange outline-none transition-all bg-slate-50 min-h-[100px] resize-y"
                placeholder="e.g. Near the main gate of the park"
                value={itemType === 'found' ? foundLocationDescription : lostLocationDescription}
                onChange={(e) => itemType === 'found' ? setFoundLocationDescription(e.target.value) : setLostLocationDescription(e.target.value)}
              />
            </div>

            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <label className="text-sm font-bold text-slate-700">Select Location on Map</label>
              <div className="flex bg-slate-100 p-1 rounded-xl">
                <button
                  type="button"
                  onClick={() => setSelectingLocation('from')}
                  className={`px-4 py-2 text-xs font-bold rounded-lg transition-all ${selectingLocation === 'from' ? 'bg-white text-brand-orange shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
                >
                  {itemType === 'lost' ? 'Start' : 'Found'} Location
                </button>
                {itemType === 'lost' && (
                  <button
                    type="button"
                    onClick={() => setSelectingLocation('to')}
                    className={`px-4 py-2 text-xs font-bold rounded-lg transition-all ${selectingLocation === 'to' ? 'bg-white text-brand-orange shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
                  >
                    End Location
                  </button>
                )}
              </div>
            </div>
            
            <div className="h-[400px] rounded-2xl overflow-hidden border border-slate-200 relative z-0 shadow-inner">
              <MapContainer center={locationFrom || [27.7172, 85.3240]} zoom={locationFrom ? 13 : 7} style={{ height: '100%', width: '100%' }}>
                <TileLayer
                  attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                  url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                />
                <MapSearch onLocationSelect={(pos) => {
                  if (selectingLocation === 'from') setLocationFrom(pos);
                  else setLocationTo(pos);
                }} />
                <LocationMarker 
                  position={selectingLocation === 'from' ? locationFrom : locationTo} 
                  setPosition={selectingLocation === 'from' ? setLocationFrom : setLocationTo} 
                />
                {locationFrom && selectingLocation !== 'from' && <Marker position={locationFrom} opacity={0.5} />}
                {locationTo && selectingLocation !== 'to' && <Marker position={locationTo} opacity={0.5} />}
              </MapContainer>
            </div>
            
            <div className="bg-slate-50 p-4 rounded-xl border border-slate-100">
              <p className="text-sm font-medium text-slate-600 flex items-center gap-2">
                <MapPin className="w-4 h-4 text-brand-orange" />
                {locationFrom ? (
                  <span>{itemType === 'lost' ? 'Start' : 'Found'} pinned at: <span className="font-bold text-slate-900">{locationFrom.lat.toFixed(4)}, {locationFrom.lng.toFixed(4)}</span></span>
                ) : (
                  <span className="text-slate-400 italic">Location not pinned yet.</span>
                )}
              </p>
              {itemType === 'lost' && locationTo && (
                <p className="text-sm font-medium text-slate-600 flex items-center gap-2 mt-1">
                  <MapPin className="w-4 h-4 text-brand-orange" />
                  <span>End pinned at: <span className="font-bold text-slate-900">{locationTo.lat.toFixed(4)}, {locationTo.lng.toFixed(4)}</span></span>
                </p>
              )}
            </div>
          </div>
        </div>

        <div className="p-8 lg:p-10 bg-slate-50 border-t border-slate-100">
          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full bg-brand-orange text-white py-4 rounded-2xl font-bold text-lg hover:bg-brand-orange/90 transition-all shadow-xl shadow-brand-orange/20 flex items-center justify-center gap-2 disabled:opacity-50"
          >
            {isSubmitting ? 'Updating...' : (
              <>
                <Save className="w-5 h-5" /> Update Report
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  );
}
