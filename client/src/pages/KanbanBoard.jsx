import { useState, useEffect, useCallback } from 'react';
import { useParams, Link } from 'react-router-dom';
import { DragDropContext, Droppable, Draggable } from '@hello-pangea/dnd';
import { ArrowLeft, Calendar } from 'lucide-react';
import toast from 'react-hot-toast';
import api from '../api/axios';

const COLUMNS = [
  { id: 'todo', label: 'Todo' },
  { id: 'in-progress', label: 'In Progress' },
  { id: 'review', label: 'Review' },
  { id: 'done', label: 'Done' },
];

const PRIORITY_STYLES = {
  low: 'border-l-gray-500',
  medium: 'border-l-amber-500',
  high: 'border-l-red-500',
};

const KanbanBoard = () => {
  const { id } = useParams();

  const [project, setProject] = useState(null);
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const fetchData = useCallback(async () => {
    try {
      const [projectRes, tasksRes] = await Promise.all([
        api.get(`/projects/${id}`),
        api.get(`/tasks/${id}`),
      ]);
      setProject(projectRes.data.project);
      setTasks(tasksRes.data.tasks);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to load board');
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  //  Group flat task list into columns by status 
  const tasksByStatus = COLUMNS.reduce((acc, col) => {
    acc[col.id] = tasks.filter((t) => t.status === col.id);
    return acc;
  }, {});

  const handleDragEnd = async (result) => {
    const { source, destination, draggableId } = result;

    // Dropped outside any column, or dropped back in the exact same spot
    if (!destination) return;
    if (source.droppableId === destination.droppableId && source.index === destination.index) {
      return;
    }

    const newStatus = destination.droppableId;
    const taskId = draggableId;

    //  Optimistic update: move the card immediately, before the API responds 
    // Makes dragging feel instant rather than waiting on a network round-trip
    const previousTasks = tasks;
    setTasks((prev) => prev.map((t) => (t._id === taskId ? { ...t, status: newStatus } : t)));

    try {
      await api.put(`/tasks/${id}/${taskId}`, { status: newStatus });
    } catch (err) {
      // Revert on failure — the optimistic move was wrong, undo it
      setTasks(previousTasks);
      toast.error(err.response?.data?.message || 'Failed to move task');
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
      <div>
        <Link to={`/projects/${id}`} className="inline-flex items-center gap-1.5 text-sm text-gray-400 hover:text-white mb-3">
          <ArrowLeft size={14} /> Back to project
        </Link>
        <h1 className="text-2xl font-bold text-white">{project?.title} — Board</h1>
      </div>

      <DragDropContext onDragEnd={handleDragEnd}>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {COLUMNS.map((column) => (
            <div key={column.id} className="bg-gray-900 border border-gray-800 rounded-xl flex flex-col">
              <div className="px-4 py-3 border-b border-gray-800 flex items-center justify-between">
                <h2 className="text-sm font-semibold text-gray-300">{column.label}</h2>
                <span className="text-xs bg-gray-800 text-gray-500 px-2 py-0.5 rounded-full">
                  {tasksByStatus[column.id].length}
                </span>
              </div>

              <Droppable droppableId={column.id}>
                {(provided, snapshot) => (
                  <div
                    ref={provided.innerRef}
                    {...provided.droppableProps}
                    className={`flex-1 p-2 space-y-2 min-h-[200px] transition-colors ${
                      snapshot.isDraggingOver ? 'bg-gray-800/50' : ''
                    }`}
                  >
                    {tasksByStatus[column.id].map((task, index) => (
                      <Draggable key={task._id} draggableId={task._id} index={index}>
                        {(provided, snapshot) => (
                          <div
                            ref={provided.innerRef}
                            {...provided.draggableProps}
                            {...provided.dragHandleProps}
                            className={`bg-gray-800 border-l-4 ${PRIORITY_STYLES[task.priority]} rounded-lg p-3 cursor-grab active:cursor-grabbing ${
                              snapshot.isDragging ? 'shadow-xl ring-2 ring-blue-500/50' : ''
                            }`}
                          >
                            <p className="text-sm text-white font-medium">{task.title}</p>

                            <div className="flex items-center justify-between mt-2.5">
                              {task.dueDate ? (
                                <span className="text-xs text-gray-500 flex items-center gap-1">
                                  <Calendar size={11} />
                                  {new Date(task.dueDate).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
                                </span>
                              ) : (
                                <span />
                              )}

                              {task.assignee ? (
                                <div
                                  className="h-6 w-6 rounded-full bg-blue-600 flex items-center justify-center text-white text-[10px] font-semibold shrink-0"
                                  title={task.assignee.name}
                                >
                                  {task.assignee.name?.charAt(0).toUpperCase()}
                                </div>
                              ) : (
                                <span className="text-xs text-gray-600">Unassigned</span>
                              )}
                            </div>
                          </div>
                        )}
                      </Draggable>
                    ))}
                    {provided.placeholder}
                  </div>
                )}
              </Droppable>
            </div>
          ))}
        </div>
      </DragDropContext>
    </div>
  );
};

export default KanbanBoard;