import React, { useState, useEffect, useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';
import api from '../services/api';
import { format, formatDistanceToNow } from 'date-fns';
import { Plus, FileText, Trash2, Files, LayoutDashboard, Clock, FolderHeart, Users, Pencil, Share2, Sun, Moon, Settings, Check } from 'lucide-react';

const Dashboard = () => {
  const { user, logout, theme, toggleTheme } = useContext(AuthContext);
  const [documents, setDocuments] = useState([]);
  const [activeTab, setActiveTab] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const navigate = useNavigate();

  useEffect(() => {
    fetchDocuments();
    const interval = setInterval(fetchDocuments, 3000);
    return () => clearInterval(interval);
  }, []);

  const fetchDocuments = async () => {
    try {
      const res = await api.get('/documents');
      setDocuments(res.data);
    } catch (error) {
      console.error('Failed to fetch documents', error);
    }
  };

  const createDocument = async () => {
    try {
      const res = await api.post('/documents', { title: 'Untitled Document' });
      navigate(`/document/${res.data._id}`);
    } catch (error) {
      console.error('Failed to create document', error);
    }
  };

  const deleteDocument = async (id, e) => {
    e.stopPropagation();
    try {
      await api.delete(`/documents/${id}`);
      setDocuments(documents.filter(doc => doc._id !== id));
    } catch (error) {
      alert('Failed to delete document. Only owners can delete.');
    }
  };
  
  const duplicateDocument = async (doc, e) => {
    e.stopPropagation();
    try {
      const res = await api.post('/documents', { title: `${doc.title} (Copy)` });
      if(doc.data) {
        await api.put(`/documents/${res.data._id}`, { data: doc.data });
      }
      fetchDocuments();
    } catch (error) {
      console.error('Failed to duplicate document', error);
    }
  };

  const renameDocument = async (doc, e) => {
    e.stopPropagation();
    const newTitle = window.prompt('Enter new title:', doc.title);
    if (newTitle && newTitle.trim() !== '' && newTitle !== doc.title) {
      try {
        await api.put(`/documents/${doc._id}`, { title: newTitle.trim() });
        setDocuments(documents.map(d => d._id === doc._id ? { ...d, title: newTitle.trim() } : d));
      } catch (error) {
        alert('Failed to rename document. Only owners or editors can rename.');
      }
    }
  };

  const ownedDocuments = documents.filter(doc => doc.owner._id === user?.id);
  const sharedDocuments = documents.filter(doc => doc.owner._id !== user?.id);
  const sharedByMeDocuments = documents.filter(doc => doc.owner._id === user?.id && doc.collaborators && doc.collaborators.length > 0);
  const recentDocuments = documents.slice(0, 4);

  const renderDocumentCard = (doc) => (
    <div 
      key={doc._id} 
      className="document-card"
      onClick={() => navigate(`/document/${doc._id}`)}
    >
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <h3 title={doc.title}>{doc.title}</h3>
        <div style={{ display: 'flex', gap: '0.5rem' }}>
          <button 
            onClick={(e) => renameDocument(doc, e)} 
            style={{ background: 'transparent', border: 'none', color: 'var(--text-secondary)', cursor: 'pointer' }}
            title="Rename"
          >
            <Pencil size={16} />
          </button>
          <button 
            onClick={(e) => duplicateDocument(doc, e)} 
            style={{ background: 'transparent', border: 'none', color: 'var(--text-secondary)', cursor: 'pointer' }}
            title="Duplicate"
          >
            <Files size={16} />
          </button>
          {doc.owner._id === user?.id && (
            <button 
              onClick={(e) => deleteDocument(doc._id, e)} 
              style={{ background: 'transparent', border: 'none', color: 'var(--danger-color)', cursor: 'pointer' }}
              title="Delete"
            >
              <Trash2 size={16} />
            </button>
          )}
        </div>
      </div>
      <p style={{ marginTop: '0.5rem' }}>
        Owner: {doc.owner._id === user?.id ? 'Me' : doc.owner.name}
      </p>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '0.75rem' }}>
        <p style={{ fontSize: '0.75rem', margin: 0, opacity: 0.7 }}>
          Created: {doc.createdAt ? format(new Date(doc.createdAt), 'MMM d, yyyy') : 'Unknown'}
        </p>
        <p style={{ fontSize: '0.75rem', margin: 0, opacity: 0.7 }}>
          Modified: {formatDistanceToNow(new Date(doc.updatedAt), { addSuffix: true })}
        </p>
      </div>
    </div>
  );

  let displayedDocuments = [];
  let tabTitle = "All Documents";
  
  if (activeTab === 'all') {
    displayedDocuments = documents;
  } else if (activeTab === 'recent') {
    displayedDocuments = recentDocuments;
    tabTitle = "Recently Opened";
  } else if (activeTab === 'owned') {
    displayedDocuments = ownedDocuments;
    tabTitle = "My Documents";
  } else if (activeTab === 'shared') {
    displayedDocuments = sharedDocuments;
    tabTitle = "Shared with Me";
  } else if (activeTab === 'sharedByMe') {
    displayedDocuments = sharedByMeDocuments;
    tabTitle = "Shared by Me";
  }

  if (searchQuery.trim() !== '') {
    displayedDocuments = displayedDocuments.filter(doc => 
      doc.title.toLowerCase().includes(searchQuery.toLowerCase())
    );
  }


  return (
    <div className="dashboard-layout">
      <aside className="sidebar">
        <div className="sidebar-header">
          <h1>SyncWrite</h1>
        </div>
        
        <button onClick={createDocument} className="create-btn" style={{ width: '100%', justifyContent: 'center' }}>
          <Plus size={20} /> New Document
        </button>
        
        <nav className="sidebar-nav">
          <button onClick={() => setActiveTab('all')} className={`sidebar-nav-btn ${activeTab === 'all' ? 'active' : ''}`}>
            <LayoutDashboard size={18} /> All Documents
          </button>
          <button onClick={() => setActiveTab('recent')} className={`sidebar-nav-btn ${activeTab === 'recent' ? 'active' : ''}`}>
            <Clock size={18} /> Recently Opened
          </button>
          <button onClick={() => setActiveTab('owned')} className={`sidebar-nav-btn ${activeTab === 'owned' ? 'active' : ''}`}>
            <FolderHeart size={18} /> My Documents
          </button>
          <button onClick={() => setActiveTab('shared')} className={`sidebar-nav-btn ${activeTab === 'shared' ? 'active' : ''}`}>
            <Users size={18} /> Shared with Me
          </button>
          <button onClick={() => setActiveTab('sharedByMe')} className={`sidebar-nav-btn ${activeTab === 'sharedByMe' ? 'active' : ''}`}>
            <Share2 size={18} /> Shared by Me
          </button>
        </nav>
        
        <div className="sidebar-footer" style={{ flexDirection: 'column', alignItems: 'stretch', gap: '1rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <button onClick={() => navigate('/profile')} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', background: 'transparent', border: 'none', color: 'var(--text-primary)', cursor: 'pointer', padding: 0, fontWeight: 500 }} title="Account Settings">
              <Settings size={16} /> <span style={{ maxWidth: '100px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{user?.name}</span>
            </button>
            <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
              <button onClick={toggleTheme} className="theme-toggle-btn" title="Toggle Light/Dark Mode">
                {theme === 'dark' ? <Sun size={18} /> : <Moon size={18} />}
              </button>
            </div>
          </div>
          <button onClick={logout} className="logout-btn" style={{ width: '100%', marginTop: '0.5rem' }}>Sign Out</button>
        </div>
      </aside>

      <main className="dashboard-content">
        <header className="dashboard-header">
          <h2>{tabTitle}</h2>
          <input 
            type="text" 
            aria-label="Search documents"
            className="search-input"
            placeholder="Search documents..." 
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </header>

        {displayedDocuments.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '4rem', color: 'var(--text-secondary)' }}>
            <FileText size={48} style={{ opacity: 0.5, marginBottom: '1rem' }} />
            <p>No documents found in this category.</p>
          </div>
        ) : (
          <div className="document-grid">
            {displayedDocuments.map(renderDocumentCard)}
          </div>
        )}
      </main>
    </div>
  );
};

export default Dashboard;
