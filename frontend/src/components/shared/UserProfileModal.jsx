// User Profile Modal - Displays user info and allows password change
import { useState } from 'react';
import { X, User, Mail, Shield, Key, Eye, EyeOff, Loader2, CheckCircle, AlertCircle } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import authService from '../../services/authService';
import PropTypes from 'prop-types';

export default function UserProfileModal({ isOpen, onClose }) {
    const { user } = useAuth();
    const [showChangePassword, setShowChangePassword] = useState(false);
    const [currentPassword, setCurrentPassword] = useState('');
    const [newPassword, setNewPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [showCurrentPassword, setShowCurrentPassword] = useState(false);
    const [showNewPassword, setShowNewPassword] = useState(false);
    const [loading, setLoading] = useState(false);
    const [message, setMessage] = useState({ type: '', text: '' });

    if (!isOpen) return null;

    const handleChangePassword = async (e) => {
        e.preventDefault();
        setMessage({ type: '', text: '' });

        // Validation
        if (newPassword !== confirmPassword) {
            setMessage({ type: 'error', text: 'Password baru dan konfirmasi tidak cocok.' });
            return;
        }

        if (newPassword.length < 6) {
            setMessage({ type: 'error', text: 'Password baru minimal 6 karakter.' });
            return;
        }

        setLoading(true);

        try {
            const response = await authService.changePassword(currentPassword, newPassword);

            if (response.success) {
                setMessage({ type: 'success', text: 'Password berhasil diubah!' });
                setCurrentPassword('');
                setNewPassword('');
                setConfirmPassword('');
                setTimeout(() => {
                    setShowChangePassword(false);
                    setMessage({ type: '', text: '' });
                }, 2000);
            } else {
                setMessage({ type: 'error', text: response.message || 'Gagal mengubah password.' });
            }
        } catch (error) {
            setMessage({ type: 'error', text: error.message || 'Terjadi kesalahan.' });
        } finally {
            setLoading(false);
        }
    };

    const handleClose = () => {
        setShowChangePassword(false);
        setCurrentPassword('');
        setNewPassword('');
        setConfirmPassword('');
        setMessage({ type: '', text: '' });
        onClose();
    };

    return (
        <div
            className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm"
            onClick={handleClose}
        >
            <div
                className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden"
                onClick={(e) => e.stopPropagation()}
            >
                {/* Header */}
                <div className="bg-blue-500 p-6 flex items-center justify-between">
                    <div className="flex items-center gap-3 text-white">
                        <div className="p-2 bg-white/20 rounded-lg">
                            <User size={24} />
                        </div>
                        <div>
                            <h2 className="text-xl font-bold">Profil Pengguna</h2>
                            <p className="text-blue-100 text-sm">Informasi akun Anda</p>
                        </div>
                    </div>
                    <button
                        onClick={handleClose}
                        className="p-2 hover:bg-white/20 rounded-lg transition-colors"
                    >
                        <X className="w-5 h-5 text-white" />
                    </button>
                </div>

                {/* Content */}
                <div className="p-6">
                    {/* User Info */}
                    <div className="space-y-4 mb-6">
                        {/* Username */}
                        <div className="flex items-center gap-4 p-4 bg-gray-50 rounded-xl">
                            <div className="p-2 bg-blue-100 rounded-lg">
                                <User size={20} className="text-blue-600" />
                            </div>
                            <div>
                                <p className="text-xs text-gray-500 uppercase font-medium">Username</p>
                                <p className="text-gray-900 font-semibold">{user?.username || '-'}</p>
                            </div>
                        </div>

                        {/* Email */}
                        <div className="flex items-center gap-4 p-4 bg-gray-50 rounded-xl">
                            <div className="p-2 bg-green-100 rounded-lg">
                                <Mail size={20} className="text-green-600" />
                            </div>
                            <div>
                                <p className="text-xs text-gray-500 uppercase font-medium">Email</p>
                                <p className="text-gray-900 font-semibold">{user?.email || '-'}</p>
                            </div>
                        </div>

                        {/* Role */}
                        <div className="flex items-center gap-4 p-4 bg-gray-50 rounded-xl">
                            <div className="p-2 bg-purple-100 rounded-lg">
                                <Shield size={20} className="text-purple-600" />
                            </div>
                            <div>
                                <p className="text-xs text-gray-500 uppercase font-medium">Role</p>
                                <p className="text-gray-900 font-semibold">
                                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${user?.role === 'ADMIN'
                                        ? 'bg-purple-100 text-purple-800'
                                        : 'bg-blue-100 text-blue-800'
                                        }`}>
                                        {user?.role || '-'}
                                    </span>
                                </p>
                            </div>
                        </div>
                    </div>

                    {/* Change Password Section */}
                    {!showChangePassword ? (
                        <button
                            onClick={() => setShowChangePassword(true)}
                            className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-gray-100 hover:bg-gray-200 rounded-xl text-gray-700 font-medium transition-colors"
                        >
                            <Key size={18} />
                            Ganti Password
                        </button>
                    ) : (
                        <form onSubmit={handleChangePassword} className="space-y-4">
                            <div className="border-t pt-4">
                                <h3 className="text-sm font-semibold text-gray-700 mb-3 flex items-center gap-2">
                                    <Key size={16} />
                                    Ganti Password
                                </h3>

                                {/* Message */}
                                {message.text && (
                                    <div className={`mb-4 p-3 rounded-lg flex items-center gap-2 ${message.type === 'success'
                                        ? 'bg-green-50 text-green-700 border border-green-200'
                                        : 'bg-red-50 text-red-700 border border-red-200'
                                        }`}>
                                        {message.type === 'success' ? (
                                            <CheckCircle size={18} />
                                        ) : (
                                            <AlertCircle size={18} />
                                        )}
                                        <span className="text-sm">{message.text}</span>
                                    </div>
                                )}

                                {/* Current Password */}
                                <div className="mb-3">
                                    <label className="block text-xs text-gray-500 mb-1">Password Lama</label>
                                    <div className="relative">
                                        <input
                                            type={showCurrentPassword ? 'text' : 'password'}
                                            value={currentPassword}
                                            onChange={(e) => setCurrentPassword(e.target.value)}
                                            className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-400 pr-10"
                                            placeholder="Masukkan password lama"
                                            required
                                            disabled={loading}
                                        />
                                        <button
                                            type="button"
                                            onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                                            className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                                        >
                                            {showCurrentPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                                        </button>
                                    </div>
                                </div>

                                {/* New Password */}
                                <div className="mb-3">
                                    <label className="block text-xs text-gray-500 mb-1">Password Baru</label>
                                    <div className="relative">
                                        <input
                                            type={showNewPassword ? 'text' : 'password'}
                                            value={newPassword}
                                            onChange={(e) => setNewPassword(e.target.value)}
                                            className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-400 pr-10"
                                            placeholder="Masukkan password baru"
                                            required
                                            disabled={loading}
                                        />
                                        <button
                                            type="button"
                                            onClick={() => setShowNewPassword(!showNewPassword)}
                                            className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                                        >
                                            {showNewPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                                        </button>
                                    </div>
                                </div>

                                {/* Confirm Password */}
                                <div className="mb-4">
                                    <label className="block text-xs text-gray-500 mb-1">Konfirmasi Password Baru</label>
                                    <input
                                        type="password"
                                        value={confirmPassword}
                                        onChange={(e) => setConfirmPassword(e.target.value)}
                                        className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-400"
                                        placeholder="Konfirmasi password baru"
                                        required
                                        disabled={loading}
                                    />
                                </div>

                                {/* Buttons */}
                                <div className="flex gap-2">
                                    <button
                                        type="button"
                                        onClick={() => {
                                            setShowChangePassword(false);
                                            setCurrentPassword('');
                                            setNewPassword('');
                                            setConfirmPassword('');
                                            setMessage({ type: '', text: '' });
                                        }}
                                        className="flex-1 px-4 py-2 bg-gray-100 hover:bg-gray-200 rounded-lg text-gray-700 font-medium transition-colors"
                                        disabled={loading}
                                    >
                                        Batal
                                    </button>
                                    <button
                                        type="submit"
                                        disabled={loading}
                                        className="flex-1 px-4 py-2 bg-blue-500 hover:bg-blue-600 rounded-lg text-white font-medium transition-colors flex items-center justify-center gap-2 disabled:opacity-50"
                                    >
                                        {loading ? (
                                            <>
                                                <Loader2 size={18} className="animate-spin" />
                                                Menyimpan...
                                            </>
                                        ) : (
                                            'Simpan'
                                        )}
                                    </button>
                                </div>
                            </div>
                        </form>
                    )}
                </div>
            </div>
        </div>
    );
}

UserProfileModal.propTypes = {
    isOpen: PropTypes.bool.isRequired,
    onClose: PropTypes.func.isRequired
};
