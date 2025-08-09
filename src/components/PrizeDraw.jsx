import React, { useState, useEffect } from 'react';
import axios from 'axios';

function PrizeDraw({ user }) {
  const [draws, setDraws] = useState([]);
  const [newDraw, setNewDraw] = useState({ name: '', drawDate: '' });

  useEffect(() => {
    const fetchDraws = async () => {
      try {
        const res = await axios.get('http://localhost:5000/api/prizeDraw');
        setDraws(res.data);
      } catch (err) {
        console.error(err);
      }
    };
    fetchDraws();
  }, []);

  const handleEnter = async (drawId) => {
    try {
      const res = await axios.post('http://localhost:5000/api/prizeDraw/enter', { drawId }, {
        headers: { 'x-auth-token': localStorage.getItem('token') }
      });
      alert(res.data.msg);
      user.drawEntries = res.data.drawEntries;
    } catch (err) {
      alert(err.response.data.msg);
    }
  };

  const handleCreateDraw = async (e) => {
    e.preventDefault();
    try {
      const res = await axios.post('http://localhost:5000/api/prizeDraw/create', newDraw, {
        headers: { 'x-auth-token': localStorage.getItem('token') }
      });
      setDraws([...draws, res.data.draw]);
      setNewDraw({ name: '', drawDate: '' });
      alert(res.data.msg);
    } catch (err) {
      alert(err.response.data.msg);
    }
  };

  return (
    <div className="container">
      <h2>Prize Draws</h2>
      <p>Your Entries: {user?.drawEntries || 0}</p>
      <ul>
        {draws.map(draw => (
          <li key={draw._id}>
            {draw.name} - Draw Date: {new Date(draw.drawDate).toLocaleDateString()}
            {draw.winner ? <p>Winner: {draw.winner.username}</p> : <button onClick={() => handleEnter(draw._id)}>Enter Draw</button>}
          </li>
        ))}
      </ul>
      <h3>Create New Prize Draw</h3>
      <form onSubmit={handleCreateDraw}>
        <input type="text" value={newDraw.name} onChange={(e) => setNewDraw({ ...newDraw, name: e.target.value })} placeholder="Draw Name" required />
        <input type="date" value={newDraw.drawDate} onChange={(e) => setNewDraw({ ...newDraw, drawDate: e.target.value })} required />
        <button type="submit">Create Draw</button>
      </form>
    </div>
  );
}

export default PrizeDraw;