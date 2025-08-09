import React, { useState, useEffect } from 'react';
import { CheckCircle, Plus, ArrowLeft, Target, Clock, Trophy, Zap, Trash2, AlertTriangle } from 'lucide-react';

function TaskList({ user, setUser }) {
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [completingTask, setCompletingTask] = useState(null);
  const [deletingTask, setDeletingTask] = useState(null);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [taskToDelete, setTaskToDelete] = useState(null);
  const [newTask, setNewTask] = useState({ title: '', description: '', points: '' });

  // Check if current user is admin
  const isAdmin = user?.username === 'admin' || user?.email === 'admin@test.com';

  useEffect(() => {
    fetchTasks();
  }, []);

  const fetchTasks = async () => {
    try {
      const response = await fetch('http://localhost:5000/api/tasks');
      const data = await response.json();
      setTasks(data);
    } catch (err) {
      console.error('Failed to fetch tasks:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleComplete = async (taskId) => {
    setCompletingTask(taskId);
    
    try {
      const response = await fetch('http://localhost:5000/api/tasks/complete', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-auth-token': localStorage.getItem('token'),
        },
        body: JSON.stringify({ taskId }),
      });

      const data = await response.json();
      
      if (response.ok) {
        // Update user points
        setUser({
          ...user,
          points: data.points,
          drawEntries: data.drawEntries
        });
        
        // Show success message
        alert(`Task completed! Earned points: ${tasks.find(t => t.id === taskId)?.points || 0}`);
      } else {
        alert(data.msg || 'Failed to complete task');
      }
    } catch (err) {
      alert('Error completing task');
    } finally {
      setCompletingTask(null);
    }
  };

  const handleDeleteClick = (task) => {
    setTaskToDelete(task);
    setShowDeleteModal(true);
  };

  const handleDeleteTask = async () => {
    if (!taskToDelete) return;
    
    setDeletingTask(taskToDelete.id);
    
    try {
      const response = await fetch(`http://localhost:5000/api/tasks/delete/${taskToDelete.id}`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
          'x-auth-token': localStorage.getItem('token'),
        },
      });

      const data = await response.json();
      
      if (response.ok) {
        // Remove task from local state
        setTasks(tasks.filter(task => task.id !== taskToDelete.id));
        alert('Task deleted successfully!');
      } else {
        alert(data.msg || 'Failed to delete task');
      }
    } catch (err) {
      alert('Error deleting task');
    } finally {
      setDeletingTask(null);
      setShowDeleteModal(false);
      setTaskToDelete(null);
    }
  };

  const handleCreateTask = async () => {
    if (!newTask.title || !newTask.points) return;
    
    try {
      const response = await fetch('http://localhost:5000/api/tasks/createTask', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-auth-token': localStorage.getItem('token'),
        },
        body: JSON.stringify(newTask),
      });

      const data = await response.json();
      
      if (response.ok) {
        setTasks([...tasks, data.task]);
        setNewTask({ title: '', description: '', points: '' });
        setShowCreateForm(false);
        alert('Task created successfully!');
      } else {
        alert(data.msg || 'Failed to create task');
      }
    } catch (err) {
      alert('Error creating task');
    }
  };

  const handleBack = () => {
    window.location.href = '/dashboard';
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-2 border-blue-600 border-t-transparent"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center">
              <button
                onClick={handleBack}
                className="mr-4 p-2 text-gray-400 hover:text-gray-600 focus:outline-none focus:ring-2 focus:ring-blue-500 rounded-md"
              >
                <ArrowLeft className="w-5 h-5" />
              </button>
              <h1 className="text-2xl font-bold text-gray-900">Tasks</h1>
              {isAdmin && (
                <span className="ml-3 inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800">
                  Admin
                </span>
              )}
            </div>
            <div className="flex items-center space-x-4">
              <div className="text-sm text-gray-600">
                <span className="font-medium">{user.points}</span> points
              </div>
              {isAdmin && (
                <button
                  onClick={() => setShowCreateForm(true)}
                  className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                >
                  <Plus className="w-4 h-4 mr-2" />
                  Add Task
                </button>
              )}
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <div className="flex items-center">
              <div className="p-3 rounded-lg bg-blue-50 mr-4">
                <Target className="w-6 h-6 text-blue-600" />
              </div>
              <div>
                <p className="text-sm font-medium text-gray-600 uppercase tracking-wide">Available Tasks</p>
                <p className="text-2xl font-bold text-gray-900">{tasks.length}</p>
              </div>
            </div>
          </div>
          
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <div className="flex items-center">
              <div className="p-3 rounded-lg bg-green-50 mr-4">
                <Zap className="w-6 h-6 text-green-600" />
              </div>
              <div>
                <p className="text-sm font-medium text-gray-600 uppercase tracking-wide">Your Points</p>
                <p className="text-2xl font-bold text-gray-900">{user.points}</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <div className="flex items-center">
              <div className="p-3 rounded-lg bg-purple-50 mr-4">
                <Trophy className="w-6 h-6 text-purple-600" />
              </div>
              <div>
                <p className="text-sm font-medium text-gray-600 uppercase tracking-wide">Draw Entries</p>
                <p className="text-2xl font-bold text-gray-900">{user.drawEntries}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Create Task Form Modal */}
        {showCreateForm && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-lg shadow-xl p-6 w-full max-w-md">
              <h3 className="text-lg font-bold text-gray-900 mb-4">Create New Task</h3>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Task Title</label>
                  <input
                    type="text"
                    value={newTask.title}
                    onChange={(e) => setNewTask({ ...newTask, title: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="Enter task title"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                  <input
                    type="text"
                    value={newTask.description}
                    onChange={(e) => setNewTask({ ...newTask, description: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="Enter task description"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Points</label>
                  <input
                    type="number"
                    value={newTask.points}
                    onChange={(e) => setNewTask({ ...newTask, points: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="Enter points value"
                  />
                </div>
              </div>
              <div className="flex justify-end space-x-3 mt-6">
                <button
                  onClick={() => setShowCreateForm(false)}
                  className="px-4 py-2 text-gray-700 bg-gray-200 rounded-md hover:bg-gray-300 focus:outline-none focus:ring-2 focus:ring-gray-500"
                >
                  Cancel
                </button>
                <button
                  onClick={handleCreateTask}
                  className="px-4 py-2 text-white bg-blue-600 rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  Create Task
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Delete Confirmation Modal */}
        {showDeleteModal && taskToDelete && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-lg shadow-xl p-6 w-full max-w-md">
              <div className="flex items-center mb-4">
                <div className="flex-shrink-0">
                  <AlertTriangle className="w-8 h-8 text-red-600" />
                </div>
                <div className="ml-4">
                  <h3 className="text-lg font-bold text-gray-900">Delete Task</h3>
                  <p className="text-sm text-gray-600">This action cannot be undone.</p>
                </div>
              </div>
              <div className="mb-6">
                <p className="text-gray-700">
                  Are you sure you want to delete "<span className="font-medium">{taskToDelete.title}</span>"?
                </p>
              </div>
              <div className="flex justify-end space-x-3">
                <button
                  onClick={() => {
                    setShowDeleteModal(false);
                    setTaskToDelete(null);
                  }}
                  className="px-4 py-2 text-gray-700 bg-gray-200 rounded-md hover:bg-gray-300 focus:outline-none focus:ring-2 focus:ring-gray-500"
                  disabled={deletingTask === taskToDelete?.id}
                >
                  Cancel
                </button>
                <button
                  onClick={handleDeleteTask}
                  disabled={deletingTask === taskToDelete?.id}
                  className="px-4 py-2 text-white bg-red-600 rounded-md hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-500 disabled:opacity-50 disabled:cursor-not-allowed flex items-center"
                >
                  {deletingTask === taskToDelete?.id ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent mr-2"></div>
                      Deleting...
                    </>
                  ) : (
                    <>
                      <Trash2 className="w-4 h-4 mr-2" />
                      Delete Task
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Tasks Grid */}
        <div className="grid gap-6">
          {tasks.map((task) => (
            <div
              key={task.id}
              className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 hover:shadow-md transition-shadow"
            >
              <div className="flex justify-between items-start">
                <div className="flex-1">
                  <h3 className="text-lg font-bold text-gray-900 mb-2">{task.title}</h3>
                  {task.description && (
                    <p className="text-gray-600 mb-4">{task.description}</p>
                  )}
                  <div className="flex items-center space-x-4">
                    <div className="flex items-center text-sm text-gray-600">
                      <Zap className="w-4 h-4 mr-1 text-amber-500" />
                      <span className="font-medium">{task.points} points</span>
                    </div>
                    <div className="flex items-center text-sm text-gray-600">
                      <Clock className="w-4 h-4 mr-1" />
                      Quick task
                    </div>
                  </div>
                </div>
                <div className="ml-6 flex items-center space-x-3">
                  {/* Delete Button - Only visible to admins */}
                  {isAdmin && (
                    <button
                      onClick={() => handleDeleteClick(task)}
                      disabled={deletingTask === task.id}
                      className="inline-flex items-center px-3 py-2 border border-red-300 text-sm font-medium rounded-md text-red-700 bg-red-50 hover:bg-red-100 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  )}
                  
                  {/* Complete Button */}
                  <button
                    onClick={() => handleComplete(task.id)}
                    disabled={completingTask === task.id}
                    className="inline-flex items-center px-6 py-3 border border-transparent text-base font-medium rounded-md text-white bg-gradient-to-r from-green-600 to-green-700 hover:from-green-700 hover:to-green-800 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                  >
                    {completingTask === task.id ? (
                      <>
                        <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent mr-2"></div>
                        Completing...
                      </>
                    ) : (
                      <>
                        <CheckCircle className="w-5 h-5 mr-2" />
                        Complete
                      </>
                    )}
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Empty State */}
        {tasks.length === 0 && (
          <div className="text-center py-12">
            <Target className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No tasks available</h3>
            <p className="text-gray-600 mb-4">
              {isAdmin ? "Create your first task to get started!" : "Check back later for new tasks!"}
            </p>
            {isAdmin && (
              <button
                onClick={() => setShowCreateForm(true)}
                className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
              >
                <Plus className="w-4 h-4 mr-2" />
                Add First Task
              </button>
            )}
          </div>
        )}
      </main>
    </div>
  );
}

export default TaskList;