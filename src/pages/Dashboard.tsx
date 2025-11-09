import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { CheckSquare, LogOut, Plus, Trash2, Sparkles, Check, ChevronDown, ChevronUp } from 'lucide-react';
import { supabase } from '../lib/supabase';

type Task = {
  id: string;
  title: string;
  priority: 'low' | 'medium' | 'high';
  status: 'pending' | 'in-progress' | 'done';
  created_at: string;
};

type Subtask = {
  id: string;
  task_id: string;
  title: string;
  completed: boolean;
};

export default function Dashboard() {
  const navigate = useNavigate();
  const [newTask, setNewTask] = useState('');
  const [priority, setPriority] = useState<'low' | 'medium' | 'high'>('medium');
  const [tasks, setTasks] = useState<Task[]>([]);
  const [subtasks, setSubtasks] = useState<Record<string, Subtask[]>>({});
  const [aiSuggestions, setAiSuggestions] = useState<Record<string, string[]>>({});
  const [expandedTasks, setExpandedTasks] = useState<Record<string, boolean>>({});
  const [generatingAI, setGeneratingAI] = useState<Record<string, boolean>>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    checkUser();
    fetchTasks();
  }, []);

  const checkUser = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      navigate('/login');
    }
  };

  const fetchTasks = async () => {
    try {
      const { data, error } = await supabase
        .from('tasks')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setTasks(data || []);

      if (data) {
        data.forEach(task => fetchSubtasks(task.id));
      }
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const fetchSubtasks = async (taskId: string) => {
    try {
      const { data, error } = await supabase
        .from('subtasks')
        .select('*')
        .eq('task_id', taskId)
        .order('created_at', { ascending: true });

      if (error) throw error;
      setSubtasks(prev => ({ ...prev, [taskId]: data || [] }));
    } catch (err: any) {
      console.error('Error fetching subtasks:', err);
    }
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    navigate('/');
  };

  const handleAddTask = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTask.trim()) return;

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { error } = await supabase
        .from('tasks')
        .insert([
          {
            user_id: user.id,
            title: newTask,
            priority,
            status: 'pending',
          },
        ]);

      if (error) throw error;

      setNewTask('');
      setPriority('medium');
      fetchTasks();
    } catch (err: any) {
      setError(err.message);
    }
  };

  const updateTaskStatus = async (id: string, newStatus: 'pending' | 'in-progress' | 'done') => {
    try {
      const { error } = await supabase
        .from('tasks')
        .update({ status: newStatus })
        .eq('id', id);

      if (error) throw error;
      fetchTasks();
    } catch (err: any) {
      setError(err.message);
    }
  };

  const deleteTask = async (id: string) => {
    try {
      const { error } = await supabase
        .from('tasks')
        .delete()
        .eq('id', id);

      if (error) throw error;
      fetchTasks();
    } catch (err: any) {
      setError(err.message);
    }
  };

  const generateSubtasks = async (taskId: string, taskTitle: string) => {
    setGeneratingAI(prev => ({ ...prev, [taskId]: true }));
    setError('');

    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) throw new Error('Not authenticated');

      const apiUrl = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/generate-subtasks`;

      const response = await fetch(apiUrl, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${session.access_token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ taskTitle }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to generate subtasks');
      }

      const { subtasks: suggestions } = await response.json();
      setAiSuggestions(prev => ({ ...prev, [taskId]: suggestions }));
      setExpandedTasks(prev => ({ ...prev, [taskId]: true }));
    } catch (err: any) {
      setError(err.message || 'Failed to generate subtasks');
    } finally {
      setGeneratingAI(prev => ({ ...prev, [taskId]: false }));
    }
  };

  const saveSubtask = async (taskId: string, subtaskTitle: string) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { error } = await supabase
        .from('subtasks')
        .insert([
          {
            task_id: taskId,
            user_id: user.id,
            title: subtaskTitle,
            completed: false,
          },
        ]);

      if (error) throw error;

      fetchSubtasks(taskId);

      setAiSuggestions(prev => ({
        ...prev,
        [taskId]: prev[taskId]?.filter(s => s !== subtaskTitle) || []
      }));
    } catch (err: any) {
      setError(err.message);
    }
  };

  const toggleSubtask = async (subtaskId: string, taskId: string, completed: boolean) => {
    try {
      const { error } = await supabase
        .from('subtasks')
        .update({ completed: !completed })
        .eq('id', subtaskId);

      if (error) throw error;
      fetchSubtasks(taskId);
    } catch (err: any) {
      setError(err.message);
    }
  };

  const deleteSubtask = async (subtaskId: string, taskId: string) => {
    try {
      const { error } = await supabase
        .from('subtasks')
        .delete()
        .eq('id', subtaskId);

      if (error) throw error;
      fetchSubtasks(taskId);
    } catch (err: any) {
      setError(err.message);
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high':
        return 'bg-red-100 text-red-700 border-red-200';
      case 'medium':
        return 'bg-yellow-100 text-yellow-700 border-yellow-200';
      case 'low':
        return 'bg-green-100 text-green-700 border-green-200';
      default:
        return 'bg-gray-100 text-gray-700 border-gray-200';
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'done':
        return 'bg-green-100 text-green-700 border-green-200';
      case 'in-progress':
        return 'bg-blue-100 text-blue-700 border-blue-200';
      case 'pending':
        return 'bg-gray-100 text-gray-700 border-gray-200';
      default:
        return 'bg-gray-100 text-gray-700 border-gray-200';
    }
  };

  const groupedTasks = {
    pending: tasks.filter(t => t.status === 'pending'),
    'in-progress': tasks.filter(t => t.status === 'in-progress'),
    done: tasks.filter(t => t.status === 'done'),
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50">
      <header className="sticky top-0 bg-white shadow-sm border-b border-gray-200 z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-blue-600 rounded-lg">
                <CheckSquare className="w-6 h-6 text-white" />
              </div>
              <h1 className="text-xl font-bold text-gray-900">My Task Manager</h1>
            </div>
            <button
              onClick={handleLogout}
              className="flex items-center gap-2 px-4 py-2 text-gray-700 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <LogOut className="w-5 h-5" />
              <span className="hidden sm:inline">Logout</span>
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12">
        <div className="mb-8">
          <h2 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-2">Your Tasks</h2>
          <p className="text-gray-600">{tasks.length} {tasks.length === 1 ? 'task' : 'tasks'}</p>
        </div>

        {error && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-xl">
            <p className="text-sm text-red-600">{error}</p>
          </div>
        )}

        <div className="bg-white rounded-2xl shadow-lg p-6 sm:p-8 mb-8">
          <h3 className="text-xl font-semibold text-gray-900 mb-4">Add New Task</h3>
          <form onSubmit={handleAddTask} className="space-y-4">
            <div className="flex flex-col sm:flex-row gap-3">
              <input
                type="text"
                value={newTask}
                onChange={(e) => setNewTask(e.target.value)}
                placeholder="Enter a new task"
                className="flex-1 px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-600 focus:border-transparent transition-all duration-200 outline-none"
              />
              <select
                value={priority}
                onChange={(e) => setPriority(e.target.value as 'low' | 'medium' | 'high')}
                className="px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-600 focus:border-transparent transition-all duration-200 outline-none"
              >
                <option value="low">Low Priority</option>
                <option value="medium">Medium Priority</option>
                <option value="high">High Priority</option>
              </select>
              <button
                type="submit"
                className="flex items-center justify-center gap-2 px-6 py-3 bg-blue-600 text-white rounded-xl font-semibold hover:bg-blue-700 active:scale-[0.98] transition-all duration-200 shadow-md hover:shadow-lg"
              >
                <Plus className="w-5 h-5" />
                Add
              </button>
            </div>
          </form>
        </div>

        {loading ? (
          <div className="text-center py-12">
            <p className="text-gray-600">Loading tasks...</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {(['pending', 'in-progress', 'done'] as const).map((status) => (
              <div key={status} className="bg-white rounded-2xl shadow-lg p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4 capitalize">
                  {status === 'in-progress' ? 'In Progress' : status}
                  <span className="ml-2 text-sm font-normal text-gray-500">
                    ({groupedTasks[status].length})
                  </span>
                </h3>
                <div className="space-y-3">
                  {groupedTasks[status].map((task) => (
                    <div
                      key={task.id}
                      className="p-4 rounded-xl border border-gray-200 hover:border-blue-300 transition-all duration-200 space-y-3"
                    >
                      <div className="flex items-start justify-between gap-3">
                        <p className="text-gray-900 flex-1 font-medium">{task.title}</p>
                        <button
                          onClick={() => deleteTask(task.id)}
                          className="text-gray-400 hover:text-red-600 transition-colors"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>

                      <div className="flex items-center gap-2">
                        <span className={`px-2 py-1 rounded-lg text-xs font-medium border ${getPriorityColor(task.priority)}`}>
                          {task.priority}
                        </span>
                      </div>

                      <select
                        value={task.status}
                        onChange={(e) => updateTaskStatus(task.id, e.target.value as any)}
                        className={`w-full px-3 py-2 rounded-lg text-sm font-medium border transition-colors ${getStatusColor(task.status)}`}
                      >
                        <option value="pending">Pending</option>
                        <option value="in-progress">In Progress</option>
                        <option value="done">Done</option>
                      </select>

                      <button
                        onClick={() => generateSubtasks(task.id, task.title)}
                        disabled={generatingAI[task.id]}
                        className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-gradient-to-r from-purple-600 to-blue-600 text-white rounded-lg text-sm font-medium hover:from-purple-700 hover:to-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                      >
                        <Sparkles className="w-4 h-4" />
                        {generatingAI[task.id] ? 'Generating...' : 'Generate Subtasks with AI'}
                      </button>

                      {aiSuggestions[task.id] && aiSuggestions[task.id].length > 0 && (
                        <div className="mt-3 space-y-2 bg-blue-50 p-3 rounded-lg border border-blue-200">
                          <p className="text-xs font-semibold text-blue-900 mb-2">AI Suggestions:</p>
                          {aiSuggestions[task.id].map((suggestion, idx) => (
                            <div key={idx} className="flex items-start gap-2 text-sm">
                              <span className="text-blue-700 flex-1">{suggestion}</span>
                              <button
                                onClick={() => saveSubtask(task.id, suggestion)}
                                className="px-2 py-1 bg-blue-600 text-white rounded text-xs hover:bg-blue-700 transition-colors"
                              >
                                Save
                              </button>
                            </div>
                          ))}
                        </div>
                      )}

                      {subtasks[task.id] && subtasks[task.id].length > 0 && (
                        <div className="mt-3">
                          <button
                            onClick={() => setExpandedTasks(prev => ({ ...prev, [task.id]: !prev[task.id] }))}
                            className="flex items-center gap-2 text-sm font-medium text-gray-700 mb-2"
                          >
                            {expandedTasks[task.id] ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                            Subtasks ({subtasks[task.id].length})
                          </button>
                          {expandedTasks[task.id] && (
                            <div className="space-y-2 pl-2 border-l-2 border-gray-200">
                              {subtasks[task.id].map((subtask) => (
                                <div key={subtask.id} className="flex items-center gap-2 text-sm">
                                  <button
                                    onClick={() => toggleSubtask(subtask.id, task.id, subtask.completed)}
                                    className={`w-4 h-4 rounded border-2 flex items-center justify-center transition-colors ${
                                      subtask.completed
                                        ? 'bg-green-600 border-green-600'
                                        : 'border-gray-300 hover:border-green-600'
                                    }`}
                                  >
                                    {subtask.completed && <Check className="w-3 h-3 text-white" />}
                                  </button>
                                  <span className={`flex-1 ${subtask.completed ? 'line-through text-gray-500' : 'text-gray-700'}`}>
                                    {subtask.title}
                                  </span>
                                  <button
                                    onClick={() => deleteSubtask(subtask.id, task.id)}
                                    className="text-gray-400 hover:text-red-600 transition-colors"
                                  >
                                    <Trash2 className="w-3 h-3" />
                                  </button>
                                </div>
                              ))}
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  ))}
                  {groupedTasks[status].length === 0 && (
                    <p className="text-center py-8 text-gray-400 text-sm">No tasks</p>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
