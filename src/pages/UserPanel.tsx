import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { toast } from 'sonner';
import { auth, db } from '../firebase';
import { updateProfile, updatePassword, multiFactor, TotpMultiFactorGenerator, TotpSecret, deleteUser } from 'firebase/auth';
import { doc, updateDoc, collection, query, where, getDocs, orderBy } from 'firebase/firestore';
import { useAuth } from '../contexts/AuthContext';
import { handleFirestoreError, OperationType } from '../utils/firestoreErrorHandler';
import { 
  User, Shield, Search, Tag, Bell, AlertTriangle, 
  Camera, CheckCircle, Copy, AlertCircle, Key, 
  LogOut, ChevronRight, MapPin, Calendar, Clock, Edit
} from 'lucide-react';

export default function UserPanel() {
  const { user, profile } = useAuth();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('profile');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    document.title = 'User Panel | KhojTalas';
  }, []);

  // Profile Info State
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [avatarUrl, setAvatarUrl] = useState('');
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null);

  // Security State
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isEnrolling, setIsEnrolling] = useState(false);
  const [totpSecret, setTotpSecret] = useState<TotpSecret | null>(null);
  const [verificationCode, setVerificationCode] = useState('');
  const [isVerifying, setIsVerifying] = useState(false);
  const [enrolled, setEnrolled] = useState(false);

  // Items State
  const [lostItems, setLostItems] = useState<any[]>([]);
  const [foundItems, setFoundItems] = useState<any[]>([]);
  const [loadingItems, setLoadingItems] = useState(false);

  // Notifications State
  const [emailOnApproval, setEmailOnApproval] = useState(true);
  const [emailOnMatch, setEmailOnMatch] = useState(true);
  const [inAppNotifications, setInAppNotifications] = useState(true);

  // Danger Zone State
  const [deleteConfirmation, setDeleteConfirmation] = useState('');
  const [isOtpSent, setIsOtpSent] = useState(false);
  const [otpInput, setOtpInput] = useState('');
  const [generatedOtp, setGeneratedOtp] = useState('');

  // Sessions State (Mock)
  const [sessions, setSessions] = useState([
    { id: '1', device: 'Mac OS • Chrome', location: 'Kathmandu, Nepal', lastActive: 'Active now', current: true, icon: 'desktop' },
    { id: '2', device: 'iOS • Safari', location: 'Pokhara, Nepal', lastActive: 'Last active 2 days ago', current: false, icon: 'mobile' }
  ]);

  useEffect(() => {
    if (!user) {
      navigate('/login');
      return;
    }

    // Load profile data
    if (profile) {
      setName(profile.name || '');
      setPhone(profile.phone || '');
      setAvatarUrl(profile.avatarUrl || '');
      if (profile.notifications) {
        setEmailOnApproval(profile.notifications.emailOnApproval ?? true);
        setEmailOnMatch(profile.notifications.emailOnMatch ?? true);
        setInAppNotifications(profile.notifications.inAppNotifications ?? true);
      }
    }

    // Check MFA status
    try {
      const mfa = multiFactor(user);
      if (mfa.enrolledFactors.length > 0) {
        setEnrolled(true);
      }
    } catch (e) {
      console.error("MFA check failed", e);
    }

    // Fetch user items
    fetchUserItems();
  }, [user, profile, navigate]);

  const fetchUserItems = async () => {
    if (!user) return;
    setLoadingItems(true);
    try {
      const q = query(collection(db, 'items'), where('userId', '==', user.uid), orderBy('createdAt', 'desc'));
      const querySnapshot = await getDocs(q);
      const items = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as any));
      setLostItems(items.filter(item => item.type === 'lost'));
      setFoundItems(items.filter(item => item.type === 'found'));
    } catch (error) {
      console.error("Error fetching items:", error);
    } finally {
      setLoadingItems(false);
    }
  };

  const handleAvatarChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 1000000) {
        toast.error('Image must be less than 1MB');
        return;
      }
      const reader = new FileReader();
      reader.onloadend = () => {
        setAvatarPreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    
    // Validate Nepal phone number
    if (phone && !/^(98|97)\d{8}$/.test(phone)) {
      toast.error('Please enter a valid 10-digit Nepal phone number starting with 98 or 97');
      return;
    }

    setLoading(true);
    try {
      const finalAvatarUrl = avatarPreview || avatarUrl;
      
      await updateProfile(user, { 
        displayName: name,
        photoURL: finalAvatarUrl
      });

      await updateDoc(doc(db, 'users', user.uid), {
        name,
        phone,
        avatarUrl: finalAvatarUrl
      });

      setAvatarUrl(finalAvatarUrl);
      setAvatarPreview(null);
      toast.success('Profile updated successfully');
    } catch (error: any) {
      handleFirestoreError(error, OperationType.UPDATE, `users/${user.uid}`);
      toast.error(error.message || 'Failed to update profile');
    } finally {
      setLoading(false);
    }
  };

  const handleSaveNotifications = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    setLoading(true);
    try {
      await updateDoc(doc(db, 'users', user.uid), {
        notifications: {
          emailOnApproval,
          emailOnMatch,
          inAppNotifications
        }
      });
      toast.success('Notification preferences saved');
    } catch (error: any) {
      handleFirestoreError(error, OperationType.UPDATE, `users/${user.uid}`);
      toast.error('Failed to save preferences');
    } finally {
      setLoading(false);
    }
  };

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    
    if (newPassword !== confirmPassword) {
      toast.error('New passwords do not match');
      return;
    }

    // Basic password validation
    if (newPassword.length < 8 || !/[A-Z]/.test(newPassword) || !/[0-9]/.test(newPassword) || !/[!@#$%^&*]/.test(newPassword)) {
      toast.error('Password must be at least 8 characters long and contain 1 uppercase, 1 number, and 1 special character');
      return;
    }

    setLoading(true);
    try {
      // Note: In a real app, you'd need to re-authenticate the user first with currentPassword
      await updatePassword(user, newPassword);
      toast.success('Password updated successfully');
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
    } catch (error: any) {
      if (error.code === 'auth/requires-recent-login') {
        toast.error('Please log out and log back in to change your password');
      } else {
        toast.error(error.message || 'Failed to update password');
      }
    } finally {
      setLoading(false);
    }
  };

  const startEnrollment = async () => {
    if (!user) return;
    setIsEnrolling(true);
    try {
      const mfaSession = await multiFactor(user).getSession();
      const secret = await TotpMultiFactorGenerator.generateSecret(mfaSession);
      setTotpSecret(secret);
    } catch (error: any) {
      if (error.code === 'auth/requires-recent-login') {
        toast.error('Please log out and log back in to enable 2FA');
      } else {
        toast.error(error.message || 'Failed to start MFA enrollment');
      }
      setIsEnrolling(false);
    }
  };

  const verifyAndEnroll = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !totpSecret) return;
    setIsVerifying(true);
    try {
      const assertion = TotpMultiFactorGenerator.assertionForEnrollment(totpSecret, verificationCode);
      await multiFactor(user).enroll(assertion, 'Authenticator App');
      toast.success('Two-factor authentication enabled successfully');
      setEnrolled(true);
      setTotpSecret(null);
      setIsEnrolling(false);
      setVerificationCode('');
    } catch (error: any) {
      toast.error(error.message || 'Invalid verification code');
    } finally {
      setIsVerifying(false);
    }
  };

  const disableMfa = async () => {
    if (!user) return;
    try {
      const mfa = multiFactor(user);
      const enrolledFactors = mfa.enrolledFactors;
      if (enrolledFactors.length > 0) {
        await mfa.unenroll(enrolledFactors[0]);
        setEnrolled(false);
        toast.success('Two-factor authentication disabled');
      }
    } catch (error: any) {
      if (error.code === 'auth/requires-recent-login') {
        toast.error('Please log out and log back in to disable 2FA');
      } else {
        toast.error(error.message || 'Failed to disable MFA');
      }
    }
  };

  const handleDeleteAccount = async () => {
    if (!user) return;
    if (deleteConfirmation !== 'DELETE') {
      toast.error('Please type DELETE to confirm');
      return;
    }
    
    // Generate and "send" OTP
    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    setGeneratedOtp(otp);
    setIsOtpSent(true);
    
    // In a real app, this would be sent via email/SMS
    toast.success(`Verification code sent to ${user.email}`);
    console.log(`[DEMO] Account Deletion OTP: ${otp}`);
  };

  const handleVerifyOtpAndDelete = async () => {
    if (!user) return;
    if (otpInput !== generatedOtp) {
      toast.error('Invalid verification code');
      return;
    }

    setLoading(true);
    try {
      await deleteUser(user);
      toast.success('Account deleted successfully');
      navigate('/');
    } catch (error: any) {
      if (error.code === 'auth/requires-recent-login') {
        toast.error('Please log out and log back in to delete your account');
      } else {
        toast.error(error.message || 'Failed to delete account');
      }
    } finally {
      setLoading(false);
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast.success('Copied to clipboard');
  };

  const getPasswordStrength = (pass: string) => {
    if (!pass) return { label: '', color: 'bg-slate-200' };
    let score = 0;
    if (pass.length >= 8) score++;
    if (/[A-Z]/.test(pass)) score++;
    if (/[0-9]/.test(pass)) score++;
    if (/[^A-Za-z0-9]/.test(pass)) score++;
    
    if (score < 2) return { label: 'Weak', color: 'bg-red-500', width: '33%' };
    if (score < 4) return { label: 'Medium', color: 'bg-yellow-500', width: '66%' };
    return { label: 'Strong', color: 'bg-green-500', width: '100%' };
  };

  const getProviderName = () => {
    if (!user) return 'Email';
    const providerData = user.providerData[0];
    if (!providerData) return 'Email';
    if (providerData.providerId === 'google.com') return 'Google';
    if (providerData.providerId === 'github.com') return 'GitHub';
    if (providerData.providerId === 'facebook.com') return 'Facebook';
    return 'Email';
  };

  const revokeSession = (id: string) => {
    setSessions(sessions.filter(s => s.id !== id));
    toast.success('Session revoked successfully');
  };

  const handleUpdateStatus = async (itemId: string, newStatus: string) => {
    if (!user) return;
    try {
      await updateDoc(doc(db, 'items', itemId), {
        status: newStatus
      });
      toast.success('Item status updated successfully');
      fetchUserItems();
    } catch (error: any) {
      handleFirestoreError(error, OperationType.UPDATE, `items/${itemId}`);
      toast.error('Failed to update item status');
    }
  };

  const isEmailAuth = getProviderName() === 'Email';
  const strength = getPasswordStrength(newPassword);

  const renderItemCard = (item: any) => (
    <div key={item.id} className="bg-white border border-slate-200 rounded-2xl overflow-hidden hover:shadow-lg transition-all group flex flex-col sm:flex-row relative">
      <Link to={`/item/${item.id}`} className="w-full sm:w-48 h-48 sm:h-auto shrink-0 overflow-hidden bg-slate-100 block">
        {item.photoData ? (
          <img src={item.photoData} alt={item.category} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-slate-400">
            <Search className="w-8 h-8" />
          </div>
        )}
      </Link>
      <div className="p-6 flex flex-col justify-between flex-1">
        <div className="space-y-2">
          <div className="flex items-center justify-between gap-4">
            <span className="px-3 py-1 bg-slate-100 text-slate-600 rounded-full text-xs font-bold uppercase tracking-wider">
              {item.category}
            </span>
            <span className={`px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider ${
              item.status === 'approved' ? 'bg-green-100 text-green-700' :
              item.status === 'rejected' ? 'bg-red-100 text-red-700' :
              item.status === 'resolved' ? 'bg-slate-200 text-slate-700' :
              'bg-yellow-100 text-yellow-700'
            }`}>
              {item.status || 'Pending'}
            </span>
          </div>
          <Link to={`/item/${item.id}`} className="block">
            <h3 className="text-lg font-bold text-slate-900 line-clamp-1 hover:text-brand-orange transition-colors">
              {item.brand} {item.model} {item.category}
            </h3>
            <p className="text-slate-500 text-sm line-clamp-2 mt-1">{item.description}</p>
          </Link>
        </div>
        <div className="mt-4 pt-4 border-t border-slate-100 flex items-center justify-between text-sm text-slate-500">
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-1">
              <MapPin className="w-4 h-4" />
              <span className="truncate max-w-[150px]">{item.lostLocationDescription || item.foundLocationDescription}</span>
            </div>
            <div className="flex items-center gap-1">
              <Calendar className="w-4 h-4" />
              <span>{item.createdAt?.toDate ? new Date(item.createdAt.toDate()).toLocaleDateString() : 'N/A'}</span>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {item.status !== 'resolved' && (
              <button
                onClick={(e) => {
                  e.preventDefault();
                  handleUpdateStatus(item.id, 'resolved');
                }}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-green-50 hover:bg-green-500 hover:text-white text-green-700 rounded-lg transition-colors font-medium text-xs"
              >
                <CheckCircle className="w-3.5 h-3.5" /> Resolve
              </button>
            )}
            <Link 
              to={`/edit-item/${item.id}`}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-100 hover:bg-brand-orange hover:text-white text-slate-700 rounded-lg transition-colors font-medium text-xs"
            >
              <Edit className="w-3.5 h-3.5" /> Edit
            </Link>
          </div>
        </div>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-slate-50 py-12 px-4">
      <div className="max-w-6xl mx-auto flex flex-col lg:flex-row gap-8">
        
        {/* Sidebar */}
        <div className="w-full lg:w-64 shrink-0 space-y-2">
          <div className="bg-white p-6 rounded-3xl shadow-sm border border-slate-200 mb-6 flex flex-col items-center text-center">
            <div className="w-24 h-24 rounded-full overflow-hidden bg-slate-100 mb-4 border-4 border-white shadow-lg">
              {avatarPreview || avatarUrl ? (
                <img src={avatarPreview || avatarUrl} alt="Avatar" className="w-full h-full object-cover" />
              ) : (
                <div className="w-full h-full flex items-center justify-center bg-brand-orange/10 text-brand-orange text-2xl font-bold">
                  {name ? name.charAt(0).toUpperCase() : user?.email?.charAt(0).toUpperCase()}
                </div>
              )}
            </div>
            <h3 className="font-bold text-slate-900 text-lg">{name || 'User'}</h3>
            <p className="text-slate-500 text-sm">{user?.email}</p>
            
            <div className="mt-3 px-3 py-1 bg-slate-100 rounded-full text-xs font-bold text-slate-600 flex items-center gap-1">
              <Shield className="w-3 h-3" /> {getProviderName()} Account
            </div>
          </div>

          <nav className="bg-white rounded-3xl shadow-sm border border-slate-200 overflow-hidden p-2">
            {[
              { id: 'profile', icon: User, label: 'Profile Info' },
              { id: 'security', icon: Shield, label: 'Security' },
              { id: 'lost', icon: Search, label: 'My Lost Items' },
              { id: 'found', icon: Tag, label: 'My Found Reports' },
              { id: 'notifications', icon: Bell, label: 'Notifications' },
              { id: 'danger', icon: AlertTriangle, label: 'Danger Zone', className: 'text-red-600 hover:bg-red-50' },
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl font-medium transition-all text-left ${
                  activeTab === tab.id 
                    ? 'bg-brand-orange/10 text-brand-orange' 
                    : tab.className || 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
                }`}
              >
                <tab.icon className={`w-5 h-5 ${activeTab === tab.id ? 'text-brand-orange' : ''}`} />
                {tab.label}
              </button>
            ))}
          </nav>
        </div>

        {/* Main Content */}
        <div className="flex-1">
          <div className="bg-white rounded-3xl shadow-sm border border-slate-200 overflow-hidden min-h-[600px]">
            
            {/* PROFILE INFO */}
            {activeTab === 'profile' && (
              <div className="p-8 lg:p-10 space-y-8">
                <div>
                  <h2 className="text-2xl font-bold text-slate-900">Profile Information</h2>
                  <p className="text-slate-500 mt-1">Update your personal details and public profile.</p>
                </div>

                <form onSubmit={handleSaveProfile} className="space-y-6 max-w-2xl">
                  <div className="flex items-center gap-6">
                    <div className="relative group cursor-pointer">
                      <div className="w-24 h-24 rounded-full overflow-hidden bg-slate-100 border-4 border-white shadow-md">
                        {avatarPreview || avatarUrl ? (
                          <img src={avatarPreview || avatarUrl} alt="Avatar" className="w-full h-full object-cover" />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center bg-brand-orange/10 text-brand-orange text-2xl font-bold">
                            {name ? name.charAt(0).toUpperCase() : 'U'}
                          </div>
                        )}
                      </div>
                      <label className="absolute inset-0 flex items-center justify-center bg-black/50 text-white opacity-0 group-hover:opacity-100 rounded-full transition-opacity cursor-pointer">
                        <Camera className="w-6 h-6" />
                        <input type="file" accept="image/*" className="hidden" onChange={handleAvatarChange} />
                      </label>
                    </div>
                    <div>
                      <h3 className="font-bold text-slate-900">Profile Photo</h3>
                      <p className="text-sm text-slate-500">JPG, GIF or PNG. Max size of 1MB.</p>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-2">
                      <label className="text-sm font-bold text-slate-700">Full Name</label>
                      <input
                        type="text"
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:ring-2 focus:ring-brand-orange/20 focus:border-brand-orange outline-none transition-all bg-slate-50"
                        placeholder="John Doe"
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-sm font-bold text-slate-700">Email Address</label>
                      <input
                        type="email"
                        value={user?.email || ''}
                        disabled
                        className="w-full px-4 py-3 rounded-xl border border-slate-200 bg-slate-100 text-slate-500 cursor-not-allowed"
                      />
                      {!isEmailAuth && (
                        <p className="text-xs text-slate-500">Email is managed by {getProviderName()}</p>
                      )}
                    </div>
                    <div className="space-y-2 md:col-span-2">
                      <label className="text-sm font-bold text-slate-700">Phone Number (Nepal)</label>
                      <div className="flex">
                        <span className="inline-flex items-center px-4 rounded-l-xl border border-r-0 border-slate-200 bg-slate-100 text-slate-500 font-bold">
                          +977
                        </span>
                        <input
                          type="tel"
                          value={phone}
                          onChange={(e) => setPhone(e.target.value.replace(/\D/g, '').slice(0, 10))}
                          className="w-full px-4 py-3 rounded-r-xl border border-slate-200 focus:ring-2 focus:ring-brand-orange/20 focus:border-brand-orange outline-none transition-all bg-slate-50"
                          placeholder="98XXXXXXXX"
                        />
                      </div>
                    </div>
                  </div>

                  <div className="pt-4">
                    <button
                      type="submit"
                      disabled={loading}
                      className="bg-brand-orange text-white px-6 py-3 rounded-xl font-bold hover:bg-brand-orange/90 transition-all shadow-md shadow-brand-orange/20 disabled:opacity-50"
                    >
                      {loading ? 'Saving...' : 'Save Changes'}
                    </button>
                  </div>
                </form>
              </div>
            )}

            {/* SECURITY */}
            {activeTab === 'security' && (
              <div className="p-8 lg:p-10 space-y-10">
                <div>
                  <h2 className="text-2xl font-bold text-slate-900">Security Settings</h2>
                  <p className="text-slate-500 mt-1">Manage your password and two-factor authentication.</p>
                </div>

                {isEmailAuth && (
                  <div className="space-y-6 max-w-xl pb-10 border-b border-slate-100">
                    <h3 className="text-lg font-bold text-slate-900">Change Password</h3>
                    <form onSubmit={handleChangePassword} className="space-y-4">
                      <div className="space-y-2">
                        <label className="text-sm font-bold text-slate-700">Current Password</label>
                        <input
                          type="password"
                          required
                          value={currentPassword}
                          onChange={(e) => setCurrentPassword(e.target.value)}
                          className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:ring-2 focus:ring-brand-orange/20 focus:border-brand-orange outline-none transition-all bg-slate-50"
                        />
                      </div>
                      <div className="space-y-2">
                        <label className="text-sm font-bold text-slate-700">New Password</label>
                        <input
                          type="password"
                          required
                          value={newPassword}
                          onChange={(e) => setNewPassword(e.target.value)}
                          className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:ring-2 focus:ring-brand-orange/20 focus:border-brand-orange outline-none transition-all bg-slate-50"
                        />
                        {newPassword && (
                          <div className="space-y-1 mt-2">
                            <div className="h-1.5 w-full bg-slate-200 rounded-full overflow-hidden">
                              <div className={`h-full ${strength.color} transition-all duration-300`} style={{ width: strength.width }}></div>
                            </div>
                            <p className={`text-xs font-bold ${strength.color.replace('bg-', 'text-')}`}>{strength.label}</p>
                          </div>
                        )}
                      </div>
                      <div className="space-y-2">
                        <label className="text-sm font-bold text-slate-700">Confirm New Password</label>
                        <input
                          type="password"
                          required
                          value={confirmPassword}
                          onChange={(e) => setConfirmPassword(e.target.value)}
                          className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:ring-2 focus:ring-brand-orange/20 focus:border-brand-orange outline-none transition-all bg-slate-50"
                        />
                      </div>
                      <button
                        type="submit"
                        disabled={loading}
                        className="bg-slate-900 text-white px-6 py-3 rounded-xl font-bold hover:bg-slate-800 transition-all disabled:opacity-50 mt-2"
                      >
                        {loading ? 'Updating...' : 'Update Password'}
                      </button>
                    </form>
                  </div>
                )}

                <div className="space-y-6 max-w-2xl">
                  <div className="flex items-start justify-between">
                    <div className="space-y-1">
                      <h3 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                        Two-Factor Authentication (2FA)
                        {enrolled && <span className="px-2 py-0.5 bg-green-100 text-green-700 rounded-full text-xs font-bold flex items-center gap-1"><CheckCircle className="w-3 h-3" /> Enabled</span>}
                      </h3>
                      <p className="text-slate-600 text-sm max-w-md">
                        Add an extra layer of security to your account by requiring a code from an authenticator app when you log in.
                      </p>
                    </div>
                    {!enrolled && !isEnrolling && (
                      <button
                        onClick={startEnrollment}
                        className="px-4 py-2 bg-slate-900 text-white rounded-lg font-medium hover:bg-slate-800 transition-colors shrink-0"
                      >
                        Enable 2FA
                      </button>
                    )}
                    {enrolled && (
                      <button
                        onClick={disableMfa}
                        className="px-4 py-2 bg-red-50 text-red-600 rounded-lg font-medium hover:bg-red-100 transition-colors shrink-0"
                      >
                        Disable 2FA
                      </button>
                    )}
                  </div>

                  {isEnrolling && totpSecret && !enrolled && (
                    <div className="mt-8 pt-6 border-t border-slate-200 space-y-6">
                      <div className="bg-blue-50 text-blue-800 p-4 rounded-xl flex gap-3 text-sm">
                        <AlertCircle className="w-5 h-5 shrink-0" />
                        <p>
                          Scan the QR code with your authenticator app (like Google Authenticator or Authy), or enter the setup key manually.
                        </p>
                      </div>

                      <div className="flex flex-col md:flex-row gap-8 items-center">
                        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
                          <img 
                            src={`https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(totpSecret.generateQrCodeUrl(user?.email || 'User', 'KhojTalas'))}`} 
                            alt="QR Code" 
                            className="w-48 h-48"
                          />
                        </div>
                        
                        <div className="flex-1 space-y-4 w-full">
                          <div className="space-y-2">
                            <label className="text-sm font-bold text-slate-700">Setup Key</label>
                            <div className="flex gap-2">
                              <code className="flex-1 px-3 py-2 bg-slate-100 rounded-lg text-sm font-mono break-all">
                                {totpSecret.secretKey}
                              </code>
                              <button 
                                onClick={() => copyToClipboard(totpSecret.secretKey)}
                                className="p-2 text-slate-500 hover:text-brand-orange bg-slate-100 rounded-lg transition-colors"
                              >
                                <Copy className="w-4 h-4" />
                              </button>
                            </div>
                          </div>

                          <form onSubmit={verifyAndEnroll} className="space-y-4">
                            <div className="space-y-2">
                              <label className="text-sm font-bold text-slate-700 flex items-center gap-2">
                                <Key className="w-4 h-4 text-slate-400" /> Verification Code
                              </label>
                              <input
                                type="text"
                                required
                                placeholder="000000"
                                maxLength={6}
                                className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:ring-2 focus:ring-brand-orange/20 focus:border-brand-orange outline-none transition-all font-mono text-lg tracking-widest"
                                value={verificationCode}
                                onChange={(e) => setVerificationCode(e.target.value.replace(/\D/g, ''))}
                              />
                            </div>
                            <div className="flex gap-3">
                              <button
                                type="button"
                                onClick={() => {
                                  setIsEnrolling(false);
                                  setTotpSecret(null);
                                }}
                                className="flex-1 px-4 py-3 bg-slate-100 text-slate-700 rounded-xl font-bold hover:bg-slate-200 transition-colors"
                              >
                                Cancel
                              </button>
                              <button
                                type="submit"
                                disabled={isVerifying || verificationCode.length !== 6}
                                className="flex-1 px-4 py-3 bg-brand-orange text-white rounded-xl font-bold hover:bg-brand-orange/90 transition-colors disabled:opacity-50"
                              >
                                {isVerifying ? 'Verifying...' : 'Verify & Enable'}
                              </button>
                            </div>
                          </form>
                        </div>
                      </div>
                    </div>
                  )}
                </div>

                {/* Active Sessions */}
                <div className="space-y-6 max-w-2xl pt-10 border-t border-slate-100">
                  <div className="space-y-1">
                    <h3 className="text-lg font-bold text-slate-900">Active Sessions</h3>
                    <p className="text-slate-600 text-sm max-w-md">
                      These are the devices that have logged into your account. Revoke any sessions that you do not recognize.
                    </p>
                  </div>
                  
                  <div className="space-y-4">
                    {sessions.map(session => (
                      <div key={session.id} className={`flex items-center justify-between p-4 border rounded-xl ${session.current ? 'border-brand-orange/30 bg-brand-orange/5' : 'border-slate-200 bg-white'}`}>
                        <div className="flex items-center gap-4">
                          <div className={`w-10 h-10 rounded-lg flex items-center justify-center shadow-sm ${session.current ? 'bg-white' : 'bg-slate-50 border border-slate-100'}`}>
                            {session.icon === 'desktop' ? (
                              <svg className={`w-5 h-5 ${session.current ? 'text-slate-600' : 'text-slate-400'}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                              </svg>
                            ) : (
                              <svg className={`w-5 h-5 ${session.current ? 'text-slate-600' : 'text-slate-400'}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 18h.01M8 21h8a2 2 0 002-2V5a2 2 0 00-2-2H8a2 2 0 00-2 2v14a2 2 0 002 2z" />
                              </svg>
                            )}
                          </div>
                          <div>
                            <h4 className="font-bold text-slate-900 text-sm">{session.device}</h4>
                            <p className="text-xs text-slate-500">{session.location} • {session.lastActive}</p>
                          </div>
                        </div>
                        {session.current ? (
                          <span className="text-xs font-bold text-brand-orange bg-white px-2 py-1 rounded-md border border-brand-orange/20">Current</span>
                        ) : (
                          <button 
                            onClick={() => revokeSession(session.id)}
                            className="text-xs font-bold text-red-600 hover:bg-red-50 px-3 py-1.5 rounded-md transition-colors"
                          >
                            Revoke
                          </button>
                        )}
                      </div>
                    ))}
                  </div>
                </div>

              </div>
            )}

            {/* MY LOST ITEMS */}
            {activeTab === 'lost' && (
              <div className="p-8 lg:p-10 space-y-8">
                <div className="flex items-center justify-between">
                  <div>
                    <h2 className="text-2xl font-bold text-slate-900">My Lost Items</h2>
                    <p className="text-slate-500 mt-1">Items you have reported as lost.</p>
                  </div>
                  <Link to="/report-lost" className="bg-brand-orange text-white px-4 py-2 rounded-lg font-bold hover:bg-brand-orange/90 transition-all text-sm">
                    Report Lost
                  </Link>
                </div>

                {loadingItems ? (
                  <div className="flex justify-center py-12">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-brand-orange"></div>
                  </div>
                ) : lostItems.length > 0 ? (
                  <div className="grid grid-cols-1 gap-6">
                    {lostItems.map(renderItemCard)}
                  </div>
                ) : (
                  <div className="text-center py-16 bg-slate-50 rounded-2xl border border-slate-100 border-dashed">
                    <Search className="w-12 h-12 text-slate-300 mx-auto mb-4" />
                    <h3 className="text-lg font-bold text-slate-900 mb-2">No lost items reported</h3>
                    <p className="text-slate-500 mb-6">You haven't reported any lost items yet.</p>
                    <Link to="/report-lost" className="bg-white border border-slate-200 text-slate-700 px-6 py-2.5 rounded-xl font-bold hover:bg-slate-50 transition-all shadow-sm inline-block">
                      Report a Lost Item
                    </Link>
                  </div>
                )}
              </div>
            )}

            {/* MY FOUND REPORTS */}
            {activeTab === 'found' && (
              <div className="p-8 lg:p-10 space-y-8">
                <div className="flex items-center justify-between">
                  <div>
                    <h2 className="text-2xl font-bold text-slate-900">My Found Reports</h2>
                    <p className="text-slate-500 mt-1">Items you have found and reported.</p>
                  </div>
                  <Link to="/report-found" className="bg-brand-orange text-white px-4 py-2 rounded-lg font-bold hover:bg-brand-orange/90 transition-all text-sm">
                    Report Found
                  </Link>
                </div>

                {loadingItems ? (
                  <div className="flex justify-center py-12">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-brand-orange"></div>
                  </div>
                ) : foundItems.length > 0 ? (
                  <div className="grid grid-cols-1 gap-6">
                    {foundItems.map(renderItemCard)}
                  </div>
                ) : (
                  <div className="text-center py-16 bg-slate-50 rounded-2xl border border-slate-100 border-dashed">
                    <Tag className="w-12 h-12 text-slate-300 mx-auto mb-4" />
                    <h3 className="text-lg font-bold text-slate-900 mb-2">No found items reported</h3>
                    <p className="text-slate-500 mb-6">You haven't reported any found items yet.</p>
                    <Link to="/report-found" className="bg-white border border-slate-200 text-slate-700 px-6 py-2.5 rounded-xl font-bold hover:bg-slate-50 transition-all shadow-sm inline-block">
                      Report a Found Item
                    </Link>
                  </div>
                )}
              </div>
            )}

            {/* NOTIFICATIONS PREFERENCES */}
            {activeTab === 'notifications' && (
              <div className="p-8 lg:p-10 space-y-8">
                <div>
                  <h2 className="text-2xl font-bold text-slate-900">Notification Preferences</h2>
                  <p className="text-slate-500 mt-1">Choose how you want to be notified about your reports.</p>
                </div>

                <form onSubmit={handleSaveNotifications} className="space-y-6 max-w-2xl">
                  <div className="space-y-4">
                    <label className="flex items-start gap-4 p-4 border border-slate-200 rounded-xl cursor-pointer hover:bg-slate-50 transition-colors">
                      <div className="pt-1">
                        <input 
                          type="checkbox" 
                          className="w-5 h-5 rounded border-slate-300 text-brand-orange focus:ring-brand-orange"
                          checked={emailOnApproval}
                          onChange={(e) => setEmailOnApproval(e.target.checked)}
                        />
                      </div>
                      <div>
                        <h4 className="font-bold text-slate-900">Report Status Updates</h4>
                        <p className="text-sm text-slate-500">Email me when my item gets approved or rejected by admins.</p>
                      </div>
                    </label>

                    <label className="flex items-start gap-4 p-4 border border-slate-200 rounded-xl cursor-pointer hover:bg-slate-50 transition-colors">
                      <div className="pt-1">
                        <input 
                          type="checkbox" 
                          className="w-5 h-5 rounded border-slate-300 text-brand-orange focus:ring-brand-orange"
                          checked={emailOnMatch}
                          onChange={(e) => setEmailOnMatch(e.target.checked)}
                        />
                      </div>
                      <div>
                        <h4 className="font-bold text-slate-900">Match Found Alerts</h4>
                        <p className="text-sm text-slate-500">Email me immediately when a potential match is found for my item.</p>
                      </div>
                    </label>

                    <label className="flex items-start gap-4 p-4 border border-slate-200 rounded-xl cursor-pointer hover:bg-slate-50 transition-colors">
                      <div className="pt-1">
                        <input 
                          type="checkbox" 
                          className="w-5 h-5 rounded border-slate-300 text-brand-orange focus:ring-brand-orange"
                          checked={inAppNotifications}
                          onChange={(e) => setInAppNotifications(e.target.checked)}
                        />
                      </div>
                      <div>
                        <h4 className="font-bold text-slate-900">In-App Notifications</h4>
                        <p className="text-sm text-slate-500">Show notification badges inside the application.</p>
                      </div>
                    </label>
                  </div>

                  <div className="pt-4">
                    <button
                      type="submit"
                      disabled={loading}
                      className="bg-slate-900 text-white px-6 py-3 rounded-xl font-bold hover:bg-slate-800 transition-all disabled:opacity-50"
                    >
                      {loading ? 'Saving...' : 'Save Preferences'}
                    </button>
                  </div>
                </form>
              </div>
            )}

            {/* DANGER ZONE */}
            {activeTab === 'danger' && (
              <div className="p-8 lg:p-10 space-y-8">
                <div>
                  <h2 className="text-2xl font-bold text-red-600">Danger Zone</h2>
                  <p className="text-slate-500 mt-1">Irreversible and destructive actions for your account.</p>
                </div>

                <div className="space-y-6 max-w-2xl">
                  <div className="p-6 border border-red-200 bg-red-50 rounded-2xl space-y-4">
                    <h3 className="text-lg font-bold text-red-900">Deactivate Account</h3>
                    <p className="text-red-700 text-sm">
                      Deactivating your account will hide your profile and items from the public. You can reactivate it anytime by logging back in.
                    </p>
                    <button className="px-4 py-2 bg-white border border-red-200 text-red-600 rounded-lg font-bold hover:bg-red-50 transition-colors">
                      Deactivate Account
                    </button>
                  </div>

                  <div className="p-6 border border-red-200 bg-white rounded-2xl space-y-4">
                    <h3 className="text-lg font-bold text-red-900">Delete Account</h3>
                    <p className="text-slate-600 text-sm">
                      Once you delete your account, there is no going back. Please be certain. All your reports, matches, and personal data will be permanently deleted.
                    </p>
                    
                    <div className="pt-4 space-y-3">
                      {!isOtpSent ? (
                        <>
                          <label className="text-sm font-bold text-slate-700">Type "DELETE" to confirm</label>
                          <input
                            type="text"
                            value={deleteConfirmation}
                            onChange={(e) => setDeleteConfirmation(e.target.value)}
                            className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:ring-2 focus:ring-red-500/20 focus:border-red-500 outline-none transition-all"
                            placeholder="DELETE"
                          />
                          <button
                            onClick={handleDeleteAccount}
                            disabled={deleteConfirmation !== 'DELETE' || loading}
                            className="w-full bg-red-600 text-white px-6 py-3 rounded-xl font-bold hover:bg-red-700 transition-all disabled:opacity-50 disabled:hover:bg-red-600"
                          >
                            {loading ? 'Processing...' : 'Permanently Delete Account'}
                          </button>
                        </>
                      ) : (
                        <div className="space-y-4 p-4 bg-slate-50 rounded-xl border border-slate-200">
                          <div className="flex items-center gap-3 text-slate-900">
                            <Shield className="w-5 h-5 text-brand-orange" />
                            <h4 className="font-bold">Verify Identity</h4>
                          </div>
                          <p className="text-sm text-slate-600">
                            We've sent a 6-digit verification code to <strong>{user?.email}</strong>. Please enter it below to confirm deletion.
                          </p>
                          <div className="space-y-2">
                            <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Verification Code</label>
                            <input
                              type="text"
                              value={otpInput}
                              onChange={(e) => setOtpInput(e.target.value.replace(/\D/g, '').slice(0, 6))}
                              className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:ring-2 focus:ring-brand-orange/20 focus:border-brand-orange outline-none transition-all text-center text-2xl tracking-[0.5em] font-mono"
                              placeholder="000000"
                            />
                          </div>
                          <div className="flex gap-3">
                            <button
                              onClick={() => setIsOtpSent(false)}
                              className="flex-1 px-4 py-3 bg-white border border-slate-200 text-slate-600 rounded-xl font-bold hover:bg-slate-50 transition-all"
                            >
                              Back
                            </button>
                            <button
                              onClick={handleVerifyOtpAndDelete}
                              disabled={otpInput.length !== 6 || loading}
                              className="flex-[2] bg-red-600 text-white px-6 py-3 rounded-xl font-bold hover:bg-red-700 transition-all disabled:opacity-50"
                            >
                              {loading ? 'Deleting...' : 'Confirm & Delete'}
                            </button>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            )}

          </div>
        </div>
      </div>
    </div>
  );
}
