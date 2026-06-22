import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import api from '../api/axios';

const CreateProject = () => {
  const navigate = useNavigate();

  const [formData, setFormData] = useState({
    title: '',
    description: '',
    techStack: '',
    tags: '',
    maxMembers: 5,
    isRecruiting: true,
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value,
    }));
    if (error) setError('');
  };

  // Converts "react, node, mongodb" into ["react", "node", "mongodb"]
  // Backend's schema setters lowercase/trim these too, but doing it here
  // means the user sees the cleaned-up version immediately if we echo it back
  const parseCommaList = (str) =>
    str
      .split(',')
      .map((s) => s.trim())
      .filter(Boolean);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (!formData.title.trim() || !formData.description.trim()) {
      setError('Title and description are required');
      return;
    }

    setLoading(true);
    try {
      const payload = {
        title: formData.title.trim(),
        description: formData.description.trim(),
        techStack: parseCommaList(formData.techStack),
        tags: parseCommaList(formData.tags),
        maxMembers: Number(formData.maxMembers) || 5,
        isRecruiting: formData.isRecruiting,
      };

      const { data } = await api.post('/projects', payload);
      toast.success('Project created!');
      navigate(`/projects/${data.project._id}`);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to create project');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto">
      <h1 className="text-2xl font-bold text-white mb-1">Create a New Project</h1>
      <p className="text-gray-400 mb-6">Set up your project and start recruiting teammates.</p>

      <form onSubmit={handleSubmit} className="bg-gray-900 border border-gray-800 rounded-xl p-6 space-y-5">
        {error && (
          <div className="bg-red-500/10 border border-red-500/30 text-red-400 text-sm rounded-lg px-4 py-3">
            {error}
          </div>
        )}

        <div>
          <label htmlFor="title" className="block text-sm font-medium text-gray-300 mb-1.5">
            Project Title
          </label>
          <input
            id="title"
            name="title"
            type="text"
            value={formData.title}
            onChange={handleChange}
            maxLength={100}
            placeholder="e.g. DevForge"
            className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-2.5 text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        <div>
          <label htmlFor="description" className="block text-sm font-medium text-gray-300 mb-1.5">
            Description
          </label>
          <textarea
            id="description"
            name="description"
            rows={4}
            value={formData.description}
            onChange={handleChange}
            maxLength={2000}
            placeholder="What is this project about? What are you building?"
            className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-2.5 text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
          />
          <p className="text-xs text-gray-500 mt-1 text-right">
            {formData.description.length}/2000
          </p>
        </div>

        <div>
          <label htmlFor="techStack" className="block text-sm font-medium text-gray-300 mb-1.5">
            Tech Stack
          </label>
          <input
            id="techStack"
            name="techStack"
            type="text"
            value={formData.techStack}
            onChange={handleChange}
            placeholder="react, node, mongodb (comma-separated)"
            className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-2.5 text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        <div>
          <label htmlFor="tags" className="block text-sm font-medium text-gray-300 mb-1.5">
            Tags
          </label>
          <input
            id="tags"
            name="tags"
            type="text"
            value={formData.tags}
            onChange={handleChange}
            placeholder="fullstack, hackathon, open-source (comma-separated)"
            className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-2.5 text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label htmlFor="maxMembers" className="block text-sm font-medium text-gray-300 mb-1.5">
              Max Team Size
            </label>
            <input
              id="maxMembers"
              name="maxMembers"
              type="number"
              min={1}
              max={20}
              value={formData.maxMembers}
              onChange={handleChange}
              className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-2.5 text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div className="flex items-end pb-2.5">
            <label className="flex items-center gap-2 text-sm text-gray-300 cursor-pointer">
              <input
                type="checkbox"
                name="isRecruiting"
                checked={formData.isRecruiting}
                onChange={handleChange}
                className="rounded border-gray-700 bg-gray-800 text-blue-500 focus:ring-blue-500"
              />
              Open for recruiting
            </label>
          </div>
        </div>

        <div className="flex gap-3 pt-2">
          <button
            type="button"
            onClick={() => navigate('/projects')}
            className="flex-1 bg-gray-800 hover:bg-gray-700 text-gray-300 font-medium rounded-lg py-2.5 transition-colors"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={loading}
            className="flex-1 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-800 disabled:cursor-not-allowed text-white font-medium rounded-lg py-2.5 transition-colors"
          >
            {loading ? 'Creating...' : 'Create Project'}
          </button>
        </div>
      </form>
    </div>
  );
};

export default CreateProject;