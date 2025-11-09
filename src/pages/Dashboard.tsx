import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { CheckSquare, LogOut, Plus, Circle, CheckCircle2 } from 'lucide-react';

const INITIAL_TASKS = [
  { id: 1, text: 'Finish homework', completed: false },
  { id: 2, text: 'Call John', completed: false },
  { id: 3, text: 'Buy groceries', completed: false },
];

export default function Dashboard() {
  const navigate = useNavigate();
  const [newTask, setNewTask] = useState('');
  const [tasks, setTasks] = useState(INITIAL_TASKS);

  const handleLogout = () => {
    navigate('/');
  };

  const handleAddTask = (e: React.FormEvent) => {
    e.preventDefault();
    if (newTask.trim()) {
      console.log('Adding task:', newTask);
      setTasks([...tasks, { id: Date.now(), text: newTask, completed: false }]);
      setNewTask('');
    }
  };

  const toggleTask = (id: number) => {
    setTasks(tasks.map(task =>
      task.id === id ? { ...task, completed: !task.completed } : task
    ));
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50">
      <header className="sticky top-0 bg-white shadow-sm border-b border-gray-200 z-10">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
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

      <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12">
        <div className="mb-8">
          <h2 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-2">Your Tasks</h2>
          <p className="text-gray-600">{tasks.length} {tasks.length === 1 ? 'task' : 'tasks'}</p>
        </div>

        <div className="bg-white rounded-2xl shadow-lg p-6 sm:p-8 mb-6">
          <h3 className="text-xl font-semibold text-gray-900 mb-4">Add New Task</h3>
          <form onSubmit={handleAddTask} className="flex flex-col sm:flex-row gap-3">
            <input
              type="text"
              value={newTask}
              onChange={(e) => setNewTask(e.target.value)}
              placeholder="Enter a new task"
              className="flex-1 px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-600 focus:border-transparent transition-all duration-200 outline-none"
            />
            <button
              type="submit"
              className="flex items-center justify-center gap-2 px-6 py-3 bg-blue-600 text-white rounded-xl font-semibold hover:bg-blue-700 active:scale-[0.98] transition-all duration-200 shadow-md hover:shadow-lg"
            >
              <Plus className="w-5 h-5" />
              Add
            </button>
          </form>
        </div>

        <div className="bg-white rounded-2xl shadow-lg p-6 sm:p-8">
          <div className="space-y-3">
            {tasks.map((task, index) => (
              <div
                key={task.id}
                className="flex items-center gap-4 p-4 rounded-xl border border-gray-200 hover:border-blue-300 hover:bg-blue-50/50 transition-all duration-200 group"
              >
                <button
                  onClick={() => toggleTask(task.id)}
                  className="flex-shrink-0 transition-colors"
                >
                  {task.completed ? (
                    <CheckCircle2 className="w-6 h-6 text-blue-600" />
                  ) : (
                    <Circle className="w-6 h-6 text-gray-400 group-hover:text-blue-600" />
                  )}
                </button>
                <div className="flex-1 min-w-0">
                  <p className={`text-gray-900 ${task.completed ? 'line-through text-gray-500' : ''}`}>
                    {task.text}
                  </p>
                </div>
                <span className="flex-shrink-0 text-sm text-gray-400 font-medium">
                  #{index + 1}
                </span>
              </div>
            ))}
          </div>
        </div>
      </main>
    </div>
  );
}
