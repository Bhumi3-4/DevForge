import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Plus, FolderKanban, Users, CheckSquare, Clock } from 'lucide-react';
import api from '../api/axios';
import { useAuth } from '../context/AuthContext';
import ProjectCard from '../components/common/ProjectCard';
import StatusBadge from '../components/common/StatusBadge';
import EmptyState from '../components/common/EmptyState';

const Dashboard = () => {
  const { user } = useAuth();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchDashboard = async () => {
      try {
        const { data } = await api.get('/dashboard');
        setData(data);
      } catch (err) {
        setError(err.response?.data?.message || 'Failed to load dashboard');
      } finally {
        setLoading(false);
      }
    };
    fetchDashboard();
  }, []);

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

  const { stats, myProjects, joinedProjects, recentTasks } = data;

  const statCards = [
    { label: 'Projects Owned', value: stats.totalProjectsOwned, icon: FolderKanban, color: 'text-blue-400' },
    { label: 'Projects Joined', value: stats.totalProjectsJoined, icon: Users, color: 'text-purple-400' },
    { label: 'Tasks Assigned', value: stats.totalAssignedTasks, icon: CheckSquare, color: 'text-green-400' },
    { label: 'In Progress', value: stats.tasksByStatus['in-progress'], icon: Clock, color: 'text-amber-400' },
  ];

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">Welcome back, {user?.name?.split(' ')[0]}</h1>
          <p className="text-gray-400 mt-1">Here's what's happening across your projects.</p>
        </div>
        <Link
          to="/projects/new"
          className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium px-4 py-2.5 rounded-lg transition-colors"
        >
          <Plus size={18} /> New Project
        </Link>
      </div>

      {/* Stat Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {statCards.map((card) => (
          <div key={card.label} className="bg-gray-900 border border-gray-800 rounded-xl p-5">
            <card.icon className={`${card.color} mb-3`} size={22} />
            <p className="text-2xl font-bold text-white">{card.value}</p>
            <p className="text-sm text-gray-400 mt-1">{card.label}</p>
          </div>
        ))}
      </div>

      <div className="grid md:grid-cols-2 gap-8">
        {/* My Projects */}
        <section>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-white">My Projects</h2>
            <Link to="/projects" className="text-sm text-blue-400 hover:text-blue-300">
              View all
            </Link>
          </div>

          {myProjects.length === 0 ? (
            <EmptyState text="You haven't created any projects yet." />
          ) : (
            <div className="space-y-3">
              {myProjects.map((project) => (
                <ProjectCard key={project._id} project={project} />
              ))}
            </div>
          )}
        </section>

        {/* Joined Projects */}
        <section>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-white">Joined Projects</h2>
            <Link to="/projects" className="text-sm text-blue-400 hover:text-blue-300">
              Browse more
            </Link>
          </div>

          {joinedProjects.length === 0 ? (
            <EmptyState text="You haven't joined any projects yet." />
          ) : (
            <div className="space-y-3">
              {joinedProjects.map((project) => (
                <ProjectCard key={project._id} project={project} />
              ))}
            </div>
          )}
        </section>
      </div>

      {/* Recent Tasks */}
      <section>
        <h2 className="text-lg font-semibold text-white mb-4">Recent Tasks</h2>

        {recentTasks.length === 0 ? (
          <EmptyState text="No tasks assigned to you yet." />
        ) : (
          <div className="bg-gray-900 border border-gray-800 rounded-xl divide-y divide-gray-800">
            {recentTasks.map((task) => (
              <div key={task._id} className="flex items-center justify-between px-5 py-3.5">
                <div>
                  <p className="text-white text-sm font-medium">{task.title}</p>
                  <p className="text-gray-500 text-xs mt-0.5">{task.project?.title}</p>
                </div>
                <StatusBadge status={task.status} />
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  );
};

export default Dashboard;