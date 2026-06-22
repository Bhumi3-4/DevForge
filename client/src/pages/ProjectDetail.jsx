import { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import {
  Users, Trash2, UserPlus, Check, X as XIcon,
  Plus, CheckSquare, Calendar, ChevronDown,
} from 'lucide-react';
import toast from 'react-hot-toast';
import api from '../api/axios';
import { useAuth } from '../context/AuthContext';
import StatusBadge from '../components/common/StatusBadge';
import ProjectChat from '../components/chat/ProjectChat';

const TASK_STATUSES = ['todo', 'in-progress', 'review', 'done'];
const PRIORITY_STYLES = {
  low: 'text-gray-400',
  medium: 'text-amber-400',
  high: 'text-red-400',
};

const ProjectDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();

  const [project, setProject] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Recruitment-related state
  const [applyMessage, setApplyMessage] = useState('');
  const [applying, setApplying] = useState(false);
  const [myApplicationStatus, setMyApplicationStatus] = useState(null);
  const [pendingRequests, setPendingRequests] = useState([]);
  const [requestsLoading, setRequestsLoading] = useState(false);

  // Task-related state
  const [tasks, setTasks] = useState([]);
  const [tasksLoading, setTasksLoading] = useState(true);
  const [showTaskForm, setShowTaskForm] = useState(false);
  const [taskForm, setTaskForm] = useState({ title: '', priority: 'medium', dueDate: '', assignee: '' });
  const [creatingTask, setCreatingTask] = useState(false);
  const [openAssignMenu, setOpenAssignMenu] = useState(null);

  const fetchProject = useCallback(async () => {
    try {
      const { data } = await api.get(`/projects/${id}`);
      setProject(data.project);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to load project');
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    fetchProject();
  }, [fetchProject]);

  const isOwner = project?.owner?._id === user?._id;
  const isMember = project?.members?.some((m) => m.user?._id === user?._id);

  //  Fetch tasks once we know the user is a member 
  const fetchTasks = useCallback(async () => {
    if (!isMember) {
      setTasksLoading(false);
      return;
    }
    setTasksLoading(true);
    try {
      const { data } = await api.get(`/tasks/${id}`);
      setTasks(data.tasks);
    } catch {
      // Non-members get a 403 here, which is expected — fail silently
    } finally {
      setTasksLoading(false);
    }
  }, [id, isMember]);

  useEffect(() => {
    fetchTasks();
  }, [fetchTasks]);

  //  Fetch my application status if I'm not a member 
  useEffect(() => {
    if (!project || isOwner || isMember) return;

    const checkMyApplication = async () => {
      try {
        const { data } = await api.get('/recruitment/my-applications');
        const existing = data.applications.find((a) => a.project?._id === id);
        if (existing && existing.status === 'pending') setMyApplicationStatus('pending');
      } catch {
        // Non-critical
      }
    };
    checkMyApplication();
  }, [project, isOwner, isMember, id]);

  //  Fetch pending requests if I'm the owner 
  useEffect(() => {
    if (!project || !isOwner) return;

    const fetchRequests = async () => {
      setRequestsLoading(true);
      try {
        const { data } = await api.get(`/recruitment/${id}/requests`);
        setPendingRequests(data.requests);
      } catch {
        // Non-critical
      } finally {
        setRequestsLoading(false);
      }
    };
    fetchRequests();
  }, [project, isOwner, id]);

  const handleApply = async (e) => {
    e.preventDefault();
    setApplying(true);
    try {
      await api.post(`/recruitment/${id}/apply`, { message: applyMessage });
      toast.success('Application submitted!');
      setMyApplicationStatus('pending');
      setApplyMessage('');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to apply');
    } finally {
      setApplying(false);
    }
  };

  const handleAccept = async (applicationId) => {
    try {
      await api.put(`/recruitment/requests/${applicationId}/accept`);
      toast.success('Applicant accepted');
      setPendingRequests((prev) => prev.filter((r) => r._id !== applicationId));
      fetchProject();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to accept');
    }
  };

  const handleReject = async (applicationId) => {
    try {
      await api.put(`/recruitment/requests/${applicationId}/reject`);
      toast.success('Application rejected');
      setPendingRequests((prev) => prev.filter((r) => r._id !== applicationId));
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to reject');
    }
  };

  const handleDelete = async () => {
    if (!window.confirm('Delete this project permanently? This cannot be undone.')) return;
    try {
      await api.delete(`/projects/${id}`);
      toast.success('Project deleted');
      navigate('/projects');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to delete project');
    }
  };

  //  Task handlers 

  const handleCreateTask = async (e) => {
    e.preventDefault();
    if (!taskForm.title.trim()) {
      toast.error('Task title is required');
      return;
    }
    setCreatingTask(true);
    try {
      const payload = {
        title: taskForm.title.trim(),
        priority: taskForm.priority,
        ...(taskForm.dueDate && { dueDate: taskForm.dueDate }),
        ...(taskForm.assignee && { assignee: taskForm.assignee }),
      };
      const { data } = await api.post(`/tasks/${id}`, payload);
      setTasks((prev) => [data.task, ...prev]);
      setTaskForm({ title: '', priority: 'medium', dueDate: '', assignee: '' });
      setShowTaskForm(false);
      toast.success('Task created');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to create task');
    } finally {
      setCreatingTask(false);
    }
  };

  const handleStatusChange = async (taskId, newStatus) => {
    try {
      const { data } = await api.put(`/tasks/${id}/${taskId}`, { status: newStatus });
      setTasks((prev) => prev.map((t) => (t._id === taskId ? data.task : t)));
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to update task');
    }
  };

  const handleAssign = async (taskId, assigneeId) => {
    try {
      const { data } = await api.put(`/tasks/${id}/${taskId}/assign`, { assignee: assigneeId || null });
      setTasks((prev) => prev.map((t) => (t._id === taskId ? data.task : t)));
      setOpenAssignMenu(null);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to assign task');
    }
  };

  const handleDeleteTask = async (taskId) => {
    if (!window.confirm('Delete this task?')) return;
    try {
      await api.delete(`/tasks/${id}/${taskId}`);
      setTasks((prev) => prev.filter((t) => t._id !== taskId));
      toast.success('Task deleted');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to delete task');
    }
  };

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

  return (
    <div className="space-y-6">
      {/*  Header  */}
      <div className="bg-gray-900 border border-gray-800 rounded-xl p-6">
        <div className="flex items-start justify-between gap-4">
          <div className="flex-1">
            <div className="flex items-center gap-3 mb-2">
              <h1 className="text-2xl font-bold text-white">{project.title}</h1>
              <StatusBadge status={project.status} />
              {project.isRecruiting && (
                <span className="text-xs font-medium text-green-400 bg-green-500/10 px-2.5 py-1 rounded-full">
                  Recruiting
                </span>
              )}
            </div>
            <p className="text-gray-400">{project.description}</p>
          </div>

          {isOwner && (
            <div className="flex gap-2 shrink-0">
              <Link
                to={`/projects/${id}/board`}
                className="text-sm bg-gray-800 hover:bg-gray-700 text-gray-300 px-3 py-2 rounded-lg transition-colors"
              >
                Board
              </Link>
              <button
                onClick={handleDelete}
                className="text-sm bg-red-500/10 hover:bg-red-500/20 text-red-400 px-3 py-2 rounded-lg transition-colors flex items-center gap-1.5"
              >
                <Trash2 size={14} /> Delete
              </button>
            </div>
          )}
          {isMember && !isOwner && (
            <Link
              to={`/projects/${id}/board`}
              className="text-sm bg-gray-800 hover:bg-gray-700 text-gray-300 px-3 py-2 rounded-lg transition-colors shrink-0"
            >
              View Board
            </Link>
          )}
        </div>

        {project.techStack?.length > 0 && (
          <div className="flex flex-wrap gap-2 mt-4">
            {project.techStack.map((tech) => (
              <span key={tech} className="bg-gray-800 px-2.5 py-1 rounded text-gray-400 text-xs">
                {tech}
              </span>
            ))}
          </div>
        )}
      </div>

      <div className="grid md:grid-cols-3 gap-6">
        {/*  Left: Team + Tasks + Chat  */}
        <div className="md:col-span-2 space-y-6">
          <section className="bg-gray-900 border border-gray-800 rounded-xl p-6">
            <h2 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
              <Users size={18} /> Team ({project.members?.length || 0}/{project.maxMembers})
            </h2>
            <div className="space-y-3">
              {project.members?.map((member) => (
                <div key={member.user?._id} className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    {member.user?.profileImage ? (
                      <img src={member.user.profileImage} alt="" className="h-9 w-9 rounded-full object-cover" />
                    ) : (
                      <div className="h-9 w-9 rounded-full bg-blue-600 flex items-center justify-center text-white text-sm font-semibold">
                        {member.user?.name?.charAt(0).toUpperCase()}
                      </div>
                    )}
                    <div>
                      <Link to={`/users/${member.user?._id}`} className="text-white text-sm font-medium hover:text-blue-400">
                        {member.user?.name}
                      </Link>
                      <p className="text-xs text-gray-500 capitalize">{member.role}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </section>

          {/*  Tasks  */}
          {isMember && (
            <section className="bg-gray-900 border border-gray-800 rounded-xl p-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-semibold text-white flex items-center gap-2">
                  <CheckSquare size={18} /> Tasks ({tasks.length})
                </h2>
                <button
                  onClick={() => setShowTaskForm((prev) => !prev)}
                  className="flex items-center gap-1.5 text-sm bg-blue-600 hover:bg-blue-700 text-white px-3 py-1.5 rounded-lg transition-colors"
                >
                  <Plus size={16} /> New Task
                </button>
              </div>

              {showTaskForm && (
                <form onSubmit={handleCreateTask} className="border border-gray-800 rounded-lg p-4 mb-4 space-y-3">
                  <input
                    type="text"
                    value={taskForm.title}
                    onChange={(e) => setTaskForm((p) => ({ ...p, title: e.target.value }))}
                    placeholder="Task title"
                    maxLength={150}
                    className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-sm text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                  <div className="grid grid-cols-3 gap-3">
                    <select
                      value={taskForm.priority}
                      onChange={(e) => setTaskForm((p) => ({ ...p, priority: e.target.value }))}
                      className="bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-sm text-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="low">Low priority</option>
                      <option value="medium">Medium priority</option>
                      <option value="high">High priority</option>
                    </select>
                    <input
                      type="date"
                      value={taskForm.dueDate}
                      onChange={(e) => setTaskForm((p) => ({ ...p, dueDate: e.target.value }))}
                      className="bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-sm text-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                    <select
                      value={taskForm.assignee}
                      onChange={(e) => setTaskForm((p) => ({ ...p, assignee: e.target.value }))}
                      className="bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-sm text-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="">Unassigned</option>
                      {project.members?.map((m) => (
                        <option key={m.user?._id} value={m.user?._id}>{m.user?.name}</option>
                      ))}
                    </select>
                  </div>
                  <div className="flex gap-2 justify-end">
                    <button
                      type="button"
                      onClick={() => setShowTaskForm(false)}
                      className="text-sm text-gray-400 hover:text-white px-3 py-1.5"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      disabled={creatingTask}
                      className="text-sm bg-blue-600 hover:bg-blue-700 disabled:bg-blue-800 text-white px-3 py-1.5 rounded-lg"
                    >
                      {creatingTask ? 'Creating...' : 'Create Task'}
                    </button>
                  </div>
                </form>
              )}

              {tasksLoading ? (
                <p className="text-sm text-gray-500">Loading tasks...</p>
              ) : tasks.length === 0 ? (
                <p className="text-sm text-gray-500">No tasks yet. Create the first one above.</p>
              ) : (
                <div className="space-y-2">
                  {tasks.map((task) => (
                    <div key={task._id} className="border border-gray-800 rounded-lg p-3">
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex-1">
                          <p className="text-white text-sm font-medium">{task.title}</p>
                          <div className="flex items-center gap-3 mt-1.5 text-xs">
                            <span className={`font-medium ${PRIORITY_STYLES[task.priority]}`}>
                              {task.priority} priority
                            </span>
                            {task.dueDate && (
                              <span className="text-gray-500 flex items-center gap-1">
                                <Calendar size={12} /> {new Date(task.dueDate).toLocaleDateString()}
                              </span>
                            )}
                          </div>
                        </div>

                        <div className="flex items-center gap-2 shrink-0">
                          {/* Status dropdown */}
                          <select
                            value={task.status}
                            onChange={(e) => handleStatusChange(task._id, e.target.value)}
                            className="text-xs bg-gray-800 border border-gray-700 rounded-lg px-2 py-1.5 text-gray-300 focus:outline-none focus:ring-1 focus:ring-blue-500"
                          >
                            {TASK_STATUSES.map((s) => (
                              <option key={s} value={s}>{s.replace('-', ' ')}</option>
                            ))}
                          </select>

                          {/* Assignee */}
                          <div className="relative">
                            <button
                              onClick={() => setOpenAssignMenu((prev) => (prev === task._id ? null : task._id))}
                              className="flex items-center gap-1 text-xs bg-gray-800 hover:bg-gray-700 text-gray-300 px-2 py-1.5 rounded-lg"
                            >
                              {task.assignee?.name || 'Unassigned'} <ChevronDown size={12} />
                            </button>
                            {openAssignMenu === task._id && (
                              <div className="absolute right-0 mt-1 w-40 bg-gray-800 border border-gray-700 rounded-lg shadow-lg py-1 z-10">
                                <button
                                  onClick={() => handleAssign(task._id, null)}
                                  className="block w-full text-left px-3 py-1.5 text-xs text-gray-400 hover:bg-gray-700"
                                >
                                  Unassigned
                                </button>
                                {project.members?.map((m) => (
                                  <button
                                    key={m.user?._id}
                                    onClick={() => handleAssign(task._id, m.user?._id)}
                                    className="block w-full text-left px-3 py-1.5 text-xs text-gray-300 hover:bg-gray-700"
                                  >
                                    {m.user?.name}
                                  </button>
                                ))}
                              </div>
                            )}
                          </div>

                          <button
                            onClick={() => handleDeleteTask(task._id)}
                            className="text-gray-500 hover:text-red-400"
                            aria-label="Delete task"
                          >
                            <Trash2 size={14} />
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </section>
          )}

          {/*  Team Chat  */}
          {isMember && (
            <section className="bg-gray-900 border border-gray-800 rounded-xl p-6">
              <h2 className="text-lg font-semibold text-white mb-4">Team Chat</h2>
              <div className="h-96">
                <ProjectChat projectId={id} />
              </div>
            </section>
          )}

          {/*  Owner: Pending Requests  */}
          {isOwner && (
            <section className="bg-gray-900 border border-gray-800 rounded-xl p-6">
              <h2 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                <UserPlus size={18} /> Pending Requests
                {pendingRequests.length > 0 && (
                  <span className="text-xs bg-blue-500/10 text-blue-400 px-2 py-0.5 rounded-full">
                    {pendingRequests.length}
                  </span>
                )}
              </h2>

              {requestsLoading ? (
                <p className="text-sm text-gray-500">Loading requests...</p>
              ) : pendingRequests.length === 0 ? (
                <p className="text-sm text-gray-500">No pending requests right now.</p>
              ) : (
                <div className="space-y-3">
                  {pendingRequests.map((req) => (
                    <div key={req._id} className="flex items-start justify-between gap-3 border border-gray-800 rounded-lg p-3">
                      <div className="flex-1">
                        <p className="text-white text-sm font-medium">{req.applicant?.name}</p>
                        {req.message && <p className="text-gray-400 text-sm mt-1">{req.message}</p>}
                        {req.applicant?.skills?.length > 0 && (
                          <div className="flex flex-wrap gap-1 mt-2">
                            {req.applicant.skills.slice(0, 5).map((s) => (
                              <span key={s} className="text-xs bg-gray-800 text-gray-400 px-2 py-0.5 rounded">{s}</span>
                            ))}
                          </div>
                        )}
                      </div>
                      <div className="flex gap-2 shrink-0">
                        <button
                          onClick={() => handleAccept(req._id)}
                          className="bg-green-500/10 hover:bg-green-500/20 text-green-400 p-2 rounded-lg"
                          aria-label="Accept"
                        >
                          <Check size={16} />
                        </button>
                        <button
                          onClick={() => handleReject(req._id)}
                          className="bg-red-500/10 hover:bg-red-500/20 text-red-400 p-2 rounded-lg"
                          aria-label="Reject"
                        >
                          <XIcon size={16} />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </section>
          )}
        </div>

        {/*  Right: Owner info + Apply  */}
        <div className="space-y-6">
          <section className="bg-gray-900 border border-gray-800 rounded-xl p-6">
            <h2 className="text-sm font-semibold text-gray-400 mb-3">Project Owner</h2>
            <Link to={`/users/${project.owner?._id}`} className="flex items-center gap-3">
              {project.owner?.profileImage ? (
                <img src={project.owner.profileImage} alt="" className="h-10 w-10 rounded-full object-cover" />
              ) : (
                <div className="h-10 w-10 rounded-full bg-blue-600 flex items-center justify-center text-white font-semibold">
                  {project.owner?.name?.charAt(0).toUpperCase()}
                </div>
              )}
              <div>
                <p className="text-white text-sm font-medium">{project.owner?.name}</p>
                <p className="text-xs text-gray-500">{project.owner?.email}</p>
              </div>
            </Link>
          </section>

          {!isOwner && !isMember && (
            <section className="bg-gray-900 border border-gray-800 rounded-xl p-6">
              <h2 className="text-sm font-semibold text-gray-400 mb-3">Join this project</h2>

              {myApplicationStatus === 'pending' ? (
                <p className="text-sm text-amber-400 bg-amber-500/10 rounded-lg px-3 py-2">
                  Your application is pending review.
                </p>
              ) : !project.isRecruiting ? (
                <p className="text-sm text-gray-500">This project isn't recruiting right now.</p>
              ) : project.members?.length >= project.maxMembers ? (
                <p className="text-sm text-gray-500">This team is full.</p>
              ) : (
                <form onSubmit={handleApply} className="space-y-3">
                  <textarea
                    value={applyMessage}
                    onChange={(e) => setApplyMessage(e.target.value)}
                    rows={3}
                    maxLength={500}
                    placeholder="Introduce yourself (optional)"
                    className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-sm text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
                  />
                  <button
                    type="submit"
                    disabled={applying}
                    className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-blue-800 text-white text-sm font-medium rounded-lg py-2.5 transition-colors"
                  >
                    {applying ? 'Submitting...' : 'Apply to Join'}
                  </button>
                </form>
              )}
            </section>
          )}
        </div>
      </div>
    </div>
  );
};

export default ProjectDetail;