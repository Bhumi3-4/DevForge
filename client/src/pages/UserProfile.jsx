import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { Code2, Link2, ArrowLeft } from 'lucide-react';
import api from '../api/axios';
import { useAuth } from '../context/AuthContext';

const UserProfile = () => {
  const { id } = useParams();
  const { user: currentUser } = useAuth();

  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchUser = async () => {
      setLoading(true);
      setError('');

      try {
        const { data } = await api.get(`/users/${id}`);
        setProfile(data.user);
      } catch (err) {
        setError(err.response?.data?.message || 'Failed to load profile');
      } finally {
        setLoading(false);
      }
    };

    fetchUser();
  }, [id]);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-24">
        <div className="h-8 w-8 border-4 border-gray-700 border-t-blue-500 rounded-full animate-spin" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-500/10 border border-red-500/30 text-red-400 rounded-lg px-4 py-3">
        {error}
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="text-center text-gray-400 py-12">
        User not found.
      </div>
    );
  }

  if (currentUser?._id === id) {
    return (
      <div className="max-w-2xl mx-auto text-center py-12">
        <p className="text-gray-400 mb-4">This is your own profile.</p>
        <Link
          to="/profile"
          className="text-blue-400 hover:text-blue-300 font-medium"
        >
          Go to your editable profile →
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <Link
        to="/projects"
        className="inline-flex items-center gap-1.5 text-sm text-gray-400 hover:text-white"
      >
        <ArrowLeft size={14} />
        Back
      </Link>

      <div className="bg-gray-900 border border-gray-800 rounded-xl p-6">
        <div className="flex items-center gap-5">
          {profile.profileImage ? (
            <img
              src={profile.profileImage}
              alt={profile.name}
              className="h-20 w-20 rounded-full object-cover"
            />
          ) : (
            <div className="h-20 w-20 rounded-full bg-blue-600 flex items-center justify-center text-white text-2xl font-semibold">
              {profile.name?.charAt(0).toUpperCase()}
            </div>
          )}

          <div>
            <h1 className="text-xl font-bold text-white">
              {profile.name}
            </h1>
            <p className="text-sm text-gray-500">
              {profile.email}
            </p>
          </div>
        </div>

        {profile.bio && (
          <p className="text-gray-300 mt-5 leading-relaxed">
            {profile.bio}
          </p>
        )}

        {profile.skills?.length > 0 && (
          <div className="mt-5">
            <h2 className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">
              Skills
            </h2>

            <div className="flex flex-wrap gap-2">
              {profile.skills.map((skill, index) => (
                <span
                  key={index}
                  className="bg-gray-800 px-3 py-1 rounded-full text-gray-300 text-sm"
                >
                  {skill}
                </span>
              ))}
            </div>
          </div>
        )}

        {(profile.github || profile.linkedin) && (
          <div className="flex gap-4 mt-5 pt-5 border-t border-gray-800">
            {profile.github && (
              <a
                href={profile.github}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-1.5 text-sm text-gray-400 hover:text-white"
              >
<Code2 size={16} /> GitHub
              </a>
            )}

            {profile.linkedin && (
              <a
                href={profile.linkedin}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-1.5 text-sm text-gray-400 hover:text-white"
              >
<Link2 size={16} /> LinkedIn
              </a>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default UserProfile;