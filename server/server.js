const express = require('express');
const cors = require('cors');
const bcrypt = require('bcryptjs');

const app = express();

// Middleware
app.use(cors());
app.use(express.json());

// In-memory storage (for testing purposes)
let users = [];
let tasks = [];
let prizeDraws = [];
let activities = [];

// Create default admin user
const createDefaultUser = async () => {
  const hashedPassword = await bcrypt.hash('admin123', 10);
  users.push({
    id: '1',
    username: 'admin',
    email: 'admin@test.com',
    password: hashedPassword,
    points: 100,
    drawEntries: 10
  });
  
  // Add some sample tasks
  tasks.push(
    { id: '1', title: 'Complete Profile', description: 'Fill out your profile information', points: 10 },
    { id: '2', title: 'First Login', description: 'Log into the system', points: 5 },
    { id: '3', title: 'Daily Check-in', description: 'Check in daily for points', points: 15 }
  );
  
  // Add sample prize draw
  prizeDraws.push({
    id: '1',
    name: 'Monthly Prize Draw',
    drawDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days from now
    entries: [],
    winner: null
  });
};

createDefaultUser();

// Simple token generation (just user ID encoded)
const generateToken = (userId) => {
  return Buffer.from(userId).toString('base64');
};

const verifyToken = (token) => {
  try {
    return Buffer.from(token, 'base64').toString();
  } catch {
    return null;
  }
};

// Auth middleware
const auth = (req, res, next) => {
  const token = req.header('x-auth-token');
  if (!token) {
    return res.status(401).json({ msg: 'No token, authorization denied' });
  }

  const userId = verifyToken(token);
  if (!userId) {
    return res.status(401).json({ msg: 'Token is not valid' });
  }

  req.user = { id: userId };
  next();
};

// Admin middleware
const adminAuth = (req, res, next) => {
  const user = users.find(u => u.id === req.user.id);
  if (!user) {
    return res.status(404).json({ msg: 'User not found' });
  }
  
  // Check if user is admin (either by username or email)
  if (user.username !== 'admin' && user.email !== 'admin@test.com') {
    return res.status(403).json({ msg: 'Access denied. Admin privileges required.' });
  }
  
  next();
};

// Routes

// AUTH ROUTES
app.post('/api/auth/register', async (req, res) => {
  const { username, email, password } = req.body;
  
  try {
    // Check if user exists
    const existingUser = users.find(u => u.email === email);
    if (existingUser) {
      return res.status(400).json({ msg: 'User already exists' });
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);
    
    // Create user
    const newUser = {
      id: (users.length + 1).toString(),
      username,
      email,
      password: hashedPassword,
      points: 0,
      drawEntries: 0
    };
    
    users.push(newUser);
    
    const token = generateToken(newUser.id);
    
    res.json({
      token,
      user: {
        id: newUser.id,
        username: newUser.username,
        email: newUser.email,
        points: newUser.points,
        drawEntries: newUser.drawEntries
      }
    });
  } catch (err) {
    console.error('Register error:', err);
    res.status(500).json({ msg: 'Server error' });
  }
});

app.post('/api/auth/login', async (req, res) => {
  const { email, password } = req.body;
  
  try {
    console.log('Login attempt for:', email);
    
    // Find user
    const user = users.find(u => u.email === email);
    if (!user) {
      console.log('User not found:', email);
      return res.status(400).json({ msg: 'Invalid credentials' });
    }
    
    // Check password
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      console.log('Password mismatch for:', email);
      return res.status(400).json({ msg: 'Invalid credentials' });
    }
    
    console.log('Login successful for:', email);
    
    const token = generateToken(user.id);
    
    res.json({
      token,
      user: {
        id: user.id,
        username: user.username,
        email: user.email,
        points: user.points,
        drawEntries: user.drawEntries
      }
    });
  } catch (err) {
    console.error('Login error:', err);
    res.status(500).json({ msg: 'Server error' });
  }
});

app.get('/api/auth/verify', auth, (req, res) => {
  try {
    const user = users.find(u => u.id === req.user.id);
    if (!user) {
      return res.status(404).json({ msg: 'User not found' });
    }
    
    res.json({
      user: {
        id: user.id,
        username: user.username,
        email: user.email,
        points: user.points,
        drawEntries: user.drawEntries
      }
    });
  } catch (err) {
    console.error('Verify error:', err);
    res.status(500).json({ msg: 'Server error' });
  }
});

// TASK ROUTES
app.get('/api/tasks', (req, res) => {
  res.json(tasks);
});

app.post('/api/tasks/complete', auth, (req, res) => {
  try {
    const { taskId } = req.body;
    const task = tasks.find(t => t.id === taskId);
    
    if (!task) {
      return res.status(404).json({ msg: 'Task not found' });
    }
    
    const user = users.find(u => u.id === req.user.id);
    if (!user) {
      return res.status(404).json({ msg: 'User not found' });
    }
    
    // Check if user already completed this task
    const alreadyCompleted = activities.find(a => a.userId === req.user.id && a.taskId === taskId);
    if (alreadyCompleted) {
      return res.status(400).json({ msg: 'Task already completed' });
    }
    
    // Add activity
    activities.push({
      id: (activities.length + 1).toString(),
      userId: req.user.id,
      taskId: taskId,
      completedAt: new Date(),
      pointsEarned: task.points
    });
    
    // Update user points
    user.points += task.points;
    user.drawEntries += Math.floor(task.points / 10);
    
    console.log(`User ${user.username} completed task: ${task.title}, earned ${task.points} points`);
    
    res.json({
      msg: 'Task completed',
      points: user.points,
      drawEntries: user.drawEntries,
      pointsEarned: task.points
    });
  } catch (err) {
    console.error('Complete task error:', err);
    res.status(500).json({ msg: 'Server error' });
  }
});

app.post('/api/tasks/createTask', auth, adminAuth, (req, res) => {
  try {
    const { title, description, points } = req.body;
    
    if (!title || !points) {
      return res.status(400).json({ msg: 'Title and points are required' });
    }
    
    if (isNaN(points) || points <= 0) {
      return res.status(400).json({ msg: 'Points must be a positive number' });
    }
    
    const newTask = {
      id: (tasks.length + 1).toString(),
      title,
      description: description || '',
      points: parseInt(points)
    };
    
    tasks.push(newTask);
    
    console.log(`Admin created new task: ${title} (${points} points)`);
    
    res.json({
      msg: 'Task created',
      task: newTask
    });
  } catch (err) {
    console.error('Create task error:', err);
    res.status(500).json({ msg: 'Server error' });
  }
});

// Delete task endpoint (admin only)
app.delete('/api/tasks/delete/:taskId', auth, adminAuth, (req, res) => {
  try {
    const { taskId } = req.params;
    
    // Find task index
    const taskIndex = tasks.findIndex(t => t.id === taskId);
    
    if (taskIndex === -1) {
      return res.status(404).json({ msg: 'Task not found' });
    }
    
    // Remove task from array
    const deletedTask = tasks.splice(taskIndex, 1)[0];
    
    // Remove associated activities
    const removedActivities = activities.filter(activity => activity.taskId === taskId);
    activities = activities.filter(activity => activity.taskId !== taskId);
    
    // Optional: Refund points to users who completed the deleted task
    removedActivities.forEach(activity => {
      const user = users.find(u => u.id === activity.userId);
      if (user) {
        user.points -= activity.pointsEarned;
        user.drawEntries -= Math.floor(activity.pointsEarned / 10);
        // Ensure points don't go negative
        user.points = Math.max(0, user.points);
        user.drawEntries = Math.max(0, user.drawEntries);
      }
    });
    
    console.log(`Admin deleted task: ${deletedTask.title} (ID: ${taskId})`);
    
    res.json({
      msg: 'Task deleted successfully',
      deletedTask: deletedTask
    });
  } catch (err) {
    console.error('Delete task error:', err);
    res.status(500).json({ msg: 'Server error' });
  }
});

// Get user activities
app.get('/api/activities', auth, (req, res) => {
  try {
    const userActivities = activities
      .filter(activity => activity.userId === req.user.id)
      .map(activity => {
        const task = tasks.find(t => t.id === activity.taskId);
        return {
          ...activity,
          taskTitle: task ? task.title : 'Deleted Task'
        };
      });
    
    res.json(userActivities);
  } catch (err) {
    console.error('Get activities error:', err);
    res.status(500).json({ msg: 'Server error' });
  }
});

// PRIZE DRAW ROUTES
app.get('/api/prizeDraw', (req, res) => {
  try {
    const drawsWithWinners = prizeDraws.map(draw => ({
      ...draw,
      winner: draw.winner ? users.find(u => u.id === draw.winner) : null,
      totalEntries: draw.entries.length
    }));
    res.json(drawsWithWinners);
  } catch (err) {
    console.error('Get prize draws error:', err);
    res.status(500).json({ msg: 'Server error' });
  }
});

app.post('/api/prizeDraw/enter', auth, (req, res) => {
  try {
    const { drawId } = req.body;
    const draw = prizeDraws.find(d => d.id === drawId);
    
    if (!draw) {
      return res.status(404).json({ msg: 'Prize draw not found' });
    }
    
    const user = users.find(u => u.id === req.user.id);
    if (!user) {
      return res.status(404).json({ msg: 'User not found' });
    }
    
    if (user.drawEntries <= 0) {
      return res.status(400).json({ msg: 'No draw entries available' });
    }
    
    // Check if user already entered this draw
    if (draw.entries.includes(req.user.id)) {
      return res.status(400).json({ msg: 'Already entered this draw' });
    }
    
    // Check if draw is still open
    if (new Date() > new Date(draw.drawDate)) {
      return res.status(400).json({ msg: 'This draw has already ended' });
    }
    
    draw.entries.push(req.user.id);
    user.drawEntries -= 1;
    
    console.log(`User ${user.username} entered prize draw: ${draw.name}`);
    
    res.json({
      msg: 'Entered prize draw',
      drawEntries: user.drawEntries
    });
  } catch (err) {
    console.error('Enter draw error:', err);
    res.status(500).json({ msg: 'Server error' });
  }
});

app.post('/api/prizeDraw/create', auth, adminAuth, (req, res) => {
  try {
    const { name, drawDate } = req.body;
    
    if (!name || !drawDate) {
      return res.status(400).json({ msg: 'Name and draw date are required' });
    }
    
    const newDraw = {
      id: (prizeDraws.length + 1).toString(),
      name,
      drawDate: new Date(drawDate),
      entries: [],
      winner: null
    };
    
    prizeDraws.push(newDraw);
    
    console.log(`Admin created new prize draw: ${name}`);
    
    res.json({
      msg: 'Prize draw created',
      draw: newDraw
    });
  } catch (err) {
    console.error('Create draw error:', err);
    res.status(500).json({ msg: 'Server error' });
  }
});

// Conduct prize draw (admin only)
app.post('/api/prizeDraw/conduct/:drawId', auth, adminAuth, (req, res) => {
  try {
    const { drawId } = req.params;
    const draw = prizeDraws.find(d => d.id === drawId);
    
    if (!draw) {
      return res.status(404).json({ msg: 'Prize draw not found' });
    }
    
    if (draw.winner) {
      return res.status(400).json({ msg: 'This draw has already been conducted' });
    }
    
    if (draw.entries.length === 0) {
      return res.status(400).json({ msg: 'No entries in this draw' });
    }
    
    // Select random winner
    const randomIndex = Math.floor(Math.random() * draw.entries.length);
    const winnerId = draw.entries[randomIndex];
    const winner = users.find(u => u.id === winnerId);
    
    if (!winner) {
      return res.status(500).json({ msg: 'Winner user not found' });
    }
    
    draw.winner = winnerId;
    
    console.log(`Prize draw conducted: ${draw.name}, Winner: ${winner.username}`);
    
    res.json({
      msg: 'Prize draw conducted',
      winner: {
        id: winner.id,
        username: winner.username,
        email: winner.email
      }
    });
  } catch (err) {
    console.error('Conduct draw error:', err);
    res.status(500).json({ msg: 'Server error' });
  }
});

// Get all users (admin only)
app.get('/api/admin/users', auth, adminAuth, (req, res) => {
  try {
    const userList = users.map(user => ({
      id: user.id,
      username: user.username,
      email: user.email,
      points: user.points,
      drawEntries: user.drawEntries
    }));
    
    res.json(userList);
  } catch (err) {
    console.error('Get users error:', err);
    res.status(500).json({ msg: 'Server error' });
  }
});

// Get system stats (admin only)
app.get('/api/admin/stats', auth, adminAuth, (req, res) => {
  try {
    const stats = {
      totalUsers: users.length,
      totalTasks: tasks.length,
      totalActivities: activities.length,
      totalPrizeDraws: prizeDraws.length,
      totalPointsAwarded: activities.reduce((sum, activity) => sum + activity.pointsEarned, 0)
    };
    
    res.json(stats);
  } catch (err) {
    console.error('Get stats error:', err);
    res.status(500).json({ msg: 'Server error' });
  }
});

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({ 
    status: 'OK', 
    message: 'Server is running',
    timestamp: new Date().toISOString()
  });
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error('Unhandled error:', err);
  res.status(500).json({ msg: 'Something went wrong!' });
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({ msg: 'Route not found' });
});

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
  console.log(`Default admin credentials:`);
  console.log(`Email: admin@test.com`);
  console.log(`Password: admin123`);
});