import React, { useState, useEffect } from 'react';
import { Trash2, Users } from 'lucide-react';
import toast from 'react-hot-toast';
import api from '../utils/api';
import PageHeader from '../components/PageHeader';

export default function ManageUsers() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);

  const loadUsers = async () => {
    try {
      const res = await api.get('/users');
      setUsers(res.data.data);
    } catch (err) {
      toast.error('Failed to load users');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { loadUsers(); }, []);

  const handleDelete = async (username) => {
    if (!window.confirm(`Delete user "${username}" and ALL their data? This cannot be undone!`)) return;
    
    try {
      await api.delete(`/users/${username}`);
      toast.success(`User "${username}" deleted`);
      loadUsers();
    } catch (err) {
      toast.error(err.message);
    }
  };

  return (
    <div className="animate-fade-in">
      <PageHeader
        title="Manage Users"
        subtitle="View and delete user accounts"
      />

      <div className="glass overflow-hidden">
        <table className="data-table">
          <thead>
            <tr>
              <th>Username</th>
              <th>Joined</th>
              <th>Products</th>
              <th>Sales</th>
              <th>Customers</th>
              <th>Suppliers</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {users.map(user => (
              <tr key={user.username}>
                <td className="font-medium text-slate-200">{user.username}</td>
                <td className="text-slate-400 text-sm">{user.createdAt}</td>
                <td><span className="badge badge-blue">{user.products}</span></td>
                <td><span className="badge badge-purple">{user.sales}</span></td>
                <td><span className="badge badge-green">{user.customers}</span></td>
                <td><span className="badge badge-yellow">{user.suppliers}</span></td>
                <td>
                  <button 
                    className="btn-danger" 
                    onClick={() => handleDelete(user.username)}
                    title="Delete user and all data"
                  >
                    <Trash2 size={14} />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}