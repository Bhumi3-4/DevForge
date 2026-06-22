import { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { Plus, Search, X } from 'lucide-react';
import api from '../api/axios';
import ProjectCard from '../components/common/ProjectCard';
import EmptyState from '../components/common/EmptyState';

const STATUS_OPTIONS = ['open', 'in-progress', 'completed', 'archived'];

const Projects = () => {
  const [projects, setProjects] = useState([]);
  const [pagination, setPagination] = useState({ page: 1, pages: 1, total: 0 });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  //  Filter state 
  const [searchInput, setSearchInput] = useState('');   // raw input, updates instantly
  const [search, setSearch] = useState('');             // debounced value, triggers fetch
  const [status, setStatus] = useState('');
  const [tech, setTech] = useState('');
  const [recruitingOnly, setRecruitingOnly] = useState(false);
  const [page, setPage] = useState(1);

  //  Debounce search input by 400ms 
  useEffect(() => {
    const timer = setTimeout(() => setSearch(searchInput), 400);
    return () => clearTimeout(timer);
  }, [searchInput]);

  //  Reset to page 1 whenever a filter changes 
  useEffect(() => {
    setPage(1);
  }, [search, status, tech, recruitingOnly]);

  const fetchProjects = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const params = { page, limit: 12 };
      if (search) params.search = search;
      if (status) params.status = status;
      if (tech) params.tech = tech;
      if (recruitingOnly) params.recruiting = 'true';

      const { data } = await api.get('/projects', { params });
      setProjects(data.projects);
      setPagination({ page: data.page, pages: data.pages, total: data.total });
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to load projects');
    } finally {
      setLoading(false);
    }
  }, [page, search, status, tech, recruitingOnly]);

  useEffect(() => {
    fetchProjects();
  }, [fetchProjects]);

  const clearFilters = () => {
    setSearchInput('');
    setStatus('');
    setTech('');
    setRecruitingOnly(false);
  };

  const hasActiveFilters = search || status || tech || recruitingOnly;

  return (
    <div className="space-y-6">
      {/*  Header  */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">Projects</h1>
          <p className="text-gray-400 mt-1">{pagination.total} projects found</p>
        </div>
        <Link
          to="/projects/new"
          className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium px-4 py-2.5 rounded-lg transition-colors"
        >
          <Plus size={18} /> New Project
        </Link>
      </div>

      {/*  Filter Bar  */}
      <div className="bg-gray-900 border border-gray-800 rounded-xl p-4 space-y-3">
        <div className="relative">
          <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" />
          <input
            type="text"
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            placeholder="Search by title or description..."
            className="w-full bg-gray-800 border border-gray-700 rounded-lg pl-10 pr-4 py-2.5 text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <select
            value={status}
            onChange={(e) => setStatus(e.target.value)}
            className="bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-sm text-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="">All Statuses</option>
            {STATUS_OPTIONS.map((s) => (
              <option key={s} value={s}>{s.replace('-', ' ')}</option>
            ))}
          </select>

          <input
            type="text"
            value={tech}
            onChange={(e) => setTech(e.target.value)}
            placeholder="Filter by tech (e.g. react, node)"
            className="bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-sm text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
          />

          <label className="flex items-center gap-2 text-sm text-gray-300 cursor-pointer">
            <input
              type="checkbox"
              checked={recruitingOnly}
              onChange={(e) => setRecruitingOnly(e.target.checked)}
              className="rounded border-gray-700 bg-gray-800 text-blue-500 focus:ring-blue-500"
            />
            Recruiting only
          </label>

          {hasActiveFilters && (
            <button
              onClick={clearFilters}
              className="flex items-center gap-1 text-sm text-gray-400 hover:text-white ml-auto"
            >
              <X size={14} /> Clear filters
            </button>
          )}
        </div>
      </div>

      {/*  Results  */}
      {loading ? (
        <div className="flex items-center justify-center py-24">
          <div className="h-8 w-8 border-4 border-gray-700 border-t-blue-500 rounded-full animate-spin" />
        </div>
      ) : error ? (
        <div className="bg-red-500/10 border border-red-500/30 text-red-400 rounded-lg px-4 py-3">
          {error}
        </div>
      ) : projects.length === 0 ? (
        <EmptyState text="No projects match your filters. Try adjusting your search." />
      ) : (
        <>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
            {projects.map((project) => (
              <ProjectCard key={project._id} project={project} />
            ))}
          </div>

          {/*  Pagination  */}
          {pagination.pages > 1 && (
            <div className="flex items-center justify-center gap-2 pt-4">
              <button
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={page === 1}
                className="px-3 py-1.5 text-sm bg-gray-800 text-gray-300 rounded-lg disabled:opacity-40 disabled:cursor-not-allowed hover:bg-gray-700"
              >
                Previous
              </button>
              <span className="text-sm text-gray-400">
                Page {pagination.page} of {pagination.pages}
              </span>
              <button
                onClick={() => setPage((p) => Math.min(pagination.pages, p + 1))}
                disabled={page === pagination.pages}
                className="px-3 py-1.5 text-sm bg-gray-800 text-gray-300 rounded-lg disabled:opacity-40 disabled:cursor-not-allowed hover:bg-gray-700"
              >
                Next
              </button>
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default Projects;