import { useState, useRef } from 'react';
import { Code2, Link2, Camera, Save } from 'lucide-react';
import toast from 'react-hot-toast';
import api from '../api/axios';
import { useAuth } from '../context/AuthContext';

const MAX_IMAGE_SIZE = 5 * 1024 * 1024; // 5MB — matches backend's limit

const Profile = () => {
  const { user, updateUser } = useAuth();
  const fileInputRef = useRef(null);

  const [formData, setFormData] = useState({
    name: user?.name || '',
    bio: user?.bio || '',
    skills: user?.skills?.join(', ') || '',
    github: user?.github || '',
    linkedin: user?.linkedin || '',
  });
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);
  const [uploadingImage, setUploadingImage] = useState(false);

  const handleChange = (e) => {
    setFormData((prev) => ({ ...prev, [e.target.name]: e.target.value }));
    if (error) setError('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (!formData.name.trim()) {
      setError('Name cannot be empty');
      return;
    }

    setSaving(true);
    try {
      const payload = {
        name: formData.name.trim(),
        bio: formData.bio.trim(),
        skills: formData.skills, // Backend accepts comma-separated string directly
        github: formData.github.trim(),
        linkedin: formData.linkedin.trim(),
      };
      const { data } = await api.put('/users/profile', payload);
      updateUser(data.user);
      toast.success('Profile updated');
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to update profile');
    } finally {
      setSaving(false);
    }
  };

  // ─── Converts a File object into a base64 data URI string ────────────────
  const fileToBase64 = (file) =>
    new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result);
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });

  const handleImageSelect = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!['image/jpeg', 'image/jpg', 'image/png', 'image/webp'].includes(file.type)) {
      toast.error('Please use a JPEG, PNG, or WebP image');
      return;
    }

    if (file.size > MAX_IMAGE_SIZE) {
      toast.error('Image must be smaller than 5MB');
      return;
    }

    setUploadingImage(true);
    try {
      const base64 = await fileToBase64(file);
      const { data } = await api.put('/users/profile/image', { image: base64 });
      updateUser({ profileImage: data.profileImage });
      toast.success('Profile image updated');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to upload image');
    } finally {
      setUploadingImage(false);
      e.target.value = ''; // Allow re-selecting the same file later
    }
  };

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-white">My Profile</h1>
        <p className="text-gray-400 mt-1">Update your info so teammates know who they're working with.</p>
      </div>

      {/* ─── Avatar ────────────────────────────────────────────────────── */}
      <div className="bg-gray-900 border border-gray-800 rounded-xl p-6 flex items-center gap-5">
        <div className="relative">
          {user?.profileImage ? (
            <img src={user.profileImage} alt={user.name} className="h-20 w-20 rounded-full object-cover" />
          ) : (
            <div className="h-20 w-20 rounded-full bg-blue-600 flex items-center justify-center text-white text-2xl font-semibold">
              {user?.name?.charAt(0).toUpperCase()}
            </div>
          )}
          <button
            onClick={() => fileInputRef.current?.click()}
            disabled={uploadingImage}
            className="absolute bottom-0 right-0 bg-gray-800 hover:bg-gray-700 border-2 border-gray-900 rounded-full p-1.5"
            aria-label="Change profile photo"
          >
            <Camera size={14} className="text-white" />
          </button>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/jpeg,image/png,image/webp"
            onChange={handleImageSelect}
            className="hidden"
          />
        </div>
        <div>
          <p className="text-white font-medium">{user?.name}</p>
          <p className="text-sm text-gray-500">{user?.email}</p>
          {uploadingImage && <p className="text-xs text-blue-400 mt-1">Uploading...</p>}
        </div>
      </div>

      {/* ─── Editable fields ───────────────────────────────────────────── */}
      <form onSubmit={handleSubmit} className="bg-gray-900 border border-gray-800 rounded-xl p-6 space-y-5">
        {error && (
          <div className="bg-red-500/10 border border-red-500/30 text-red-400 text-sm rounded-lg px-4 py-3">
            {error}
          </div>
        )}

        <div>
          <label htmlFor="name" className="block text-sm font-medium text-gray-300 mb-1.5">Name</label>
          <input
            id="name"
            name="name"
            type="text"
            value={formData.name}
            onChange={handleChange}
            maxLength={50}
            className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-2.5 text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        <div>
          <label htmlFor="bio" className="block text-sm font-medium text-gray-300 mb-1.5">Bio</label>
          <textarea
            id="bio"
            name="bio"
            rows={3}
            value={formData.bio}
            onChange={handleChange}
            maxLength={300}
            placeholder="Tell teammates a bit about yourself"
            className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-2.5 text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
          />
          <p className="text-xs text-gray-500 mt-1 text-right">{formData.bio.length}/300</p>
        </div>

        <div>
          <label htmlFor="skills" className="block text-sm font-medium text-gray-300 mb-1.5">Skills</label>
          <input
            id="skills"
            name="skills"
            type="text"
            value={formData.skills}
            onChange={handleChange}
            placeholder="react, node, mongodb (comma-separated)"
            className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-2.5 text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label htmlFor="github" className="block text-sm font-medium text-gray-300 mb-1.5 flex items-center gap-1.5">
              <Code2 size={14} /> GitHub
            </label>
            <input
              id="github"
              name="github"
              type="text"
              value={formData.github}
              onChange={handleChange}
              placeholder="https://github.com/username"
              className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-2.5 text-white placeholder-gray-500 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div>
            <label htmlFor="linkedin" className="block text-sm font-medium text-gray-300 mb-1.5 flex items-center gap-1.5">
              <Link2 size={14} />LinkedIn
            </label>
            <input
              id="linkedin"
              name="linkedin"
              type="text"
              value={formData.linkedin}
              onChange={handleChange}
              placeholder="https://linkedin.com/in/username"
              className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-2.5 text-white placeholder-gray-500 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
        </div>

        <button
          type="submit"
          disabled={saving}
          className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-800 text-white text-sm font-medium px-5 py-2.5 rounded-lg transition-colors"
        >
          <Save size={16} /> {saving ? 'Saving...' : 'Save Changes'}
        </button>
      </form>
    </div>
  );
};

export default Profile;