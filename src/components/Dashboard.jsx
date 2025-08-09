import React from 'react';
import { Trophy, Target, Gift, LogOut, Zap, Award } from 'lucide-react';

function Dashboard({ user, logout }) {
  const handleNavigation = (path) => {
    // This would be handled by your router in the actual app
    console.log(`Navigate to: ${path}`);
    if (path === '/tasks') {
      window.location.href = '/tasks';
    } else if (path === '/prizedraw') {
      window.location.href = '/prizedraw';
    }
  };

  const handleLogout = () => {
    logout();
    window.location.href = '/login';
  };

  const stats = [
    {
      label: 'Total Points',
      value: user.points,
      icon: Zap,
      color: 'text-amber-600',
      bg: 'bg-amber-50'
    },
    {
      label: 'Draw Entries',
      value: user.drawEntries,
      icon: Trophy,
      color: 'text-purple-600',
      bg: 'bg-purple-50'
    },
    {
      label: 'Level',
      value: Math.floor(user.points / 50) + 1,
      icon: Award,
      color: 'text-blue-600',
      bg: 'bg-blue-50'
    }
  ];

  const actions = [
    {
      title: 'Complete Tasks',
      description: 'Earn points by completing activities',
      icon: Target,
      color: 'bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800',
      action: () => handleNavigation('/tasks')
    },
    {
      title: 'Prize Draws',
      description: 'Enter draws and win rewards',
      icon: Gift,
      color: 'bg-gradient-to-r from-purple-600 to-purple-700 hover:from-purple-700 hover:to-purple-800',
      action: () => handleNavigation('/prizedraw')
    }
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center">
              <h1 className="text-2xl font-bold text-gray-900">
                Actyme
              </h1>
            </div>
            <div className="flex items-center space-x-4">
              <span className="text-gray-700 font-medium">
                Welcome, {user.username}
              </span>
              <button
                onClick={handleLogout}
                className="inline-flex items-center px-3 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors"
              >
                <LogOut className="w-4 h-4 mr-2" />
                Logout
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Welcome Section */}
        <div className="mb-8">
          <h2 className="text-3xl font-bold text-gray-900 mb-2">
            Ready to Earn?
          </h2>
          <p className="text-gray-600 text-lg">
            Complete tasks, earn points, and win amazing prizes.
          </p>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          {stats.map((stat, index) => (
            <div
              key={index}
              className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 hover:shadow-md transition-shadow"
            >
              <div className="flex items-center">
                <div className={`p-3 rounded-lg ${stat.bg} mr-4`}>
                  <stat.icon className={`w-6 h-6 ${stat.color}`} />
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-600 uppercase tracking-wide">
                    {stat.label}
                  </p>
                  <p className="text-2xl font-bold text-gray-900">
                    {stat.value.toLocaleString()}
                  </p>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Action Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
          {actions.map((action, index) => (
            <div
              key={index}
              className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden hover:shadow-md transition-shadow"
            >
              <div className="p-6">
                <div className="flex items-center mb-4">
                  <action.icon className="w-8 h-8 text-gray-600 mr-3" />
                  <div>
                    <h3 className="text-xl font-bold text-gray-900">
                      {action.title}
                    </h3>
                    <p className="text-gray-600">
                      {action.description}
                    </p>
                  </div>
                </div>
                <button
                  onClick={action.action}
                  className={`w-full inline-flex justify-center items-center px-6 py-3 border border-transparent text-base font-medium rounded-md text-white ${action.color} focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors`}
                >
                  Get Started
                </button>
              </div>
            </div>
          ))}
        </div>

        {/* Progress Section */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <h3 className="text-lg font-bold text-gray-900 mb-4">
            Your Progress
          </h3>
          <div className="space-y-4">
            {/* Level Progress */}
            <div>
              <div className="flex justify-between text-sm text-gray-600 mb-2">
                <span>Level {Math.floor(user.points / 50) + 1}</span>
                <span>{user.points % 50}/50 points to next level</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div
                  className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                  style={{ width: `${((user.points % 50) / 50) * 100}%` }}
                ></div>
              </div>
            </div>

            {/* Next Draw Entry */}
            <div>
              <div className="flex justify-between text-sm text-gray-600 mb-2">
                <span>Next Draw Entry</span>
                <span>{user.points % 10}/10 points</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div
                  className="bg-purple-600 h-2 rounded-full transition-all duration-300"
                  style={{ width: `${((user.points % 10) / 10) * 100}%` }}
                ></div>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}

export default Dashboard;