import React, { useEffect, useRef, useState, useContext } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import Quill from 'quill';
import 'quill/dist/quill.snow.css';
import QuillCursors from 'quill-cursors';
import * as Y from 'yjs';
import { WebsocketProvider } from 'y-websocket';

if (!Quill.imports['modules/cursors']) {
  Quill.register('modules/cursors', QuillCursors);
}

// Register custom numeric font sizes
const Size = Quill.import('attributors/style/size');
Size.whitelist = ['8px', '10px', '12px', '14px', '16px', '18px', '24px', '36px'];
if (!Quill.imports['attributors/style/size']) {
  Quill.register(Size, true);
}

import { QuillBinding } from 'y-quill';
import { AuthContext } from '../context/AuthContext';
import api from '../services/api';
import { ArrowLeft, Users, Share2, History, X, Trash2, MessageSquare, Check, CornerDownRight, Send, Download, Upload, Sun, Moon } from 'lucide-react';
import { IndexeddbPersistence } from 'y-indexeddb';
import TurndownService from 'turndown';
import { marked } from 'marked';
import mammoth from 'mammoth';
import * as pdfjsLib from 'pdfjs-dist';

// Use local worker provided by the npm package (Vite compatible)
pdfjsLib.GlobalWorkerOptions.workerSrc = new URL(
  'pdfjs-dist/build/pdf.worker.mjs',
  import.meta.url
).toString();

const TOOLBAR_OPTIONS = [
  [{ font: [] }, { size: ['8px', '10px', '12px', '14px', '16px', '18px', '24px', '36px'] }],
  ['bold', 'italic', 'underline', 'strike'],
  [{ color: [] }, { background: [] }],
  [{ script: 'sub' }, { script: 'super' }],
  ['blockquote', 'code-block'],
  [{ header: 1 }, { header: 2 }, { header: 3 }, { header: 4 }, { header: 5 }, { header: 6 }, { header: false }],
  [{ list: 'ordered' }, { list: 'bullet' }, { indent: '-1' }, { indent: '+1' }],
  [{ align: [] }],
  ['link', 'image', 'video'],
  ['clean'],
];

const DocumentEditor = () => {
  const { id } = useParams();
  const { user, theme, toggleTheme } = useContext(AuthContext);
  const navigate = useNavigate();
  const wrapperRef = useRef(null);
  const [quill, setQuill] = useState(null);
  const [doc, setDoc] = useState(null);
  const [title, setTitle] = useState('Loading...');
  const [awarenessUsers, setAwarenessUsers] = useState([]);
  const [awareness, setAwareness] = useState(null);
  const [saveStatus, setSaveStatus] = useState('Saved');
  const [showHistory, setShowHistory] = useState(false);
  const [showComments, setShowComments] = useState(false);
  const [comments, setComments] = useState([]);
  const [newCommentText, setNewCommentText] = useState('');
  const [replyTexts, setReplyTexts] = useState({});
  const [commentsTrigger, setCommentsTrigger] = useState(null);
  const [myRole, setMyRole] = useState(null);
  const [showShareModal, setShowShareModal] = useState(false);
  const [shareEmail, setShareEmail] = useState('');
  const [shareRole, setShareRole] = useState('Editor');
  
  useEffect(() => {
    if (myRole !== 'Owner') {
      setShowShareModal(false);
    }
  }, [myRole]);
  
  // Custom cursor colors based on random selection or hashing user id
  const cursorColor = `#${Math.floor(Math.random()*16777215).toString(16).padEnd(6, '0')}`;

  // 1. Initialize Quill
  useEffect(() => {
    if (!wrapperRef.current) return;
    wrapperRef.current.innerHTML = ""; // Clean up previous instance
    const editor = document.createElement('div');
    wrapperRef.current.append(editor);
    const q = new Quill(editor, { 
      theme: 'snow', 
      modules: { 
        toolbar: TOOLBAR_OPTIONS,
        cursors: true
      },
      formats: [
        'font', 'size', 'bold', 'italic', 'underline', 'strike',
        'color', 'background', 'script', 'blockquote', 'code-block',
        'header', 'list', 'bullet', 'indent', 'align',
        'link', 'image', 'video'
      ]
    });
    setQuill(q);

    // Add tooltips to toolbar buttons for better UX (Hover effects)
    setTimeout(() => {
      const tooltipMapping = {
        'ql-bold': 'Bold (Ctrl+B)',
        'ql-italic': 'Italic (Ctrl+I)',
        'ql-underline': 'Underline (Ctrl+U)',
        'ql-strike': 'Strikethrough',
        'ql-font': 'Font Style',
        'ql-size': 'Font Size',
        'ql-header': 'Heading',
        'ql-color': 'Text Color',
        'ql-background': 'Background Color',
        'ql-script': 'Subscript / Superscript',
        'ql-list': 'List',
        'ql-indent': 'Indent',
        'ql-direction': 'Text Direction',
        'ql-align': 'Alignment',
        'ql-link': 'Insert Link',
        'ql-image': 'Insert Image',
        'ql-video': 'Insert Video',
        'ql-formula': 'Insert Formula',
        'ql-blockquote': 'Blockquote',
        'ql-code-block': 'Code Block',
        'ql-clean': 'Clear Formatting'
      };

      const toolbar = wrapperRef.current?.querySelector('.ql-toolbar');
      if (toolbar) {
        const buttonsAndPickers = toolbar.querySelectorAll('button, .ql-picker');
        buttonsAndPickers.forEach(el => {
          const className = Array.from(el.classList).find(c => c.startsWith('ql-'));
          if (className && tooltipMapping[className]) {
            let title = tooltipMapping[className];
            if (className === 'ql-list' && el.value === 'ordered') title = 'Numbered List';
            if (className === 'ql-list' && el.value === 'bullet') title = 'Bulleted List';
            if (className === 'ql-script' && el.value === 'sub') title = 'Subscript';
            if (className === 'ql-script' && el.value === 'super') title = 'Superscript';
            if (className === 'ql-indent' && el.value === '-1') title = 'Decrease Indent';
            if (className === 'ql-indent' && el.value === '+1') title = 'Increase Indent';
            
            el.setAttribute('title', title);
          }
        });
      }
    }, 100);

  }, []);

  // 2. Fetch Document metadata & Init Yjs
  useEffect(() => {
    if (quill == null) return;

    const loadDocAndConnect = async () => {
      try {
        const res = await api.get(`/documents/${id}`);
        setDoc(res.data);
        setTitle(res.data.title);

        const isOwner = res.data.owner?._id === user?.id || res.data.owner?._id === user?._id;
        const collaborator = res.data.collaborators?.find(c => c.user?._id === user?.id || c.user?._id === user?._id);
        const role = isOwner ? 'Owner' : (collaborator ? collaborator.role : 'Viewer');
        setMyRole(role);

        // Optional: If doc.data exists, we could load it as initial state, 
        // but Yjs handles syncing state from peers if they are online. 
        // For a full implementation, we'd inject res.data.data here if it's the first time, 
        // but let's just stick to Yjs WebSocket sync for prototype.
        
        // Setup Yjs Document
        const ydoc = new Y.Doc();
        const ytext = ydoc.getText('quill');

        // Setup IndexedDB for offline persistence
        const indexeddbProvider = new IndexeddbPersistence(`syncwrite-doc-${id}`, ydoc);

        // Setup WebSocket Provider
        const wsProvider = new WebsocketProvider(
          'ws://localhost:5000/yjs', // Matches server setup
          id, // Document room
          ydoc
        );

        wsProvider.on('sync', (isSynced) => {
          if (isSynced) {
            if (ytext.length === 0 && res.data.data && res.data.data !== '<p><br></p>') {
              quill.clipboard.dangerouslyPasteHTML(res.data.data);
            }
          }
        });

        // Setup real-time signaling for comments
        const ycomments = ydoc.getMap('commentsTrigger');
        ycomments.observe(() => {
          fetchComments();
        });
        setCommentsTrigger(ycomments);

        // Setup Awareness (Presence)
        const awareness = wsProvider.awareness;
        awareness.setLocalStateField('user', {
          name: user.name,
          color: cursorColor,
          isTyping: false
        });

        setAwareness(awareness);

        awareness.on('change', () => {
          const users = Array.from(awareness.getStates().values())
            .filter(state => state.user)
            .map(state => state.user);
          setAwarenessUsers(users);
        });

        // Bind Quill to Yjs
        const binding = new QuillBinding(ytext, quill, awareness);
        
        if (role === 'Viewer' || role === 'Commenter') {
          quill.disable();
        }

        return () => {
          binding.destroy();
          wsProvider.destroy();
          indexeddbProvider.destroy();
          ydoc.destroy();
        };

      } catch (error) {
        console.error(error);
        if (error.response?.status === 403 || error.response?.status === 404) {
          navigate('/');
        }
      }
    };

    const cleanup = loadDocAndConnect();
    return () => {
      cleanup.then(cleanFn => {
        if (cleanFn) cleanFn();
      });
    }
  }, [quill, id, user, navigate]);

  // 3. Auto Save
  useEffect(() => {
    if (quill == null || (myRole !== 'Editor' && myRole !== 'Owner')) return;

    const interval = setInterval(async () => {
      setSaveStatus('Saving...');
      try {
        // Save HTML content to MongoDB as a backup/persistence
        const data = quill.root.innerHTML;
        await api.put(`/documents/${id}`, { data, title });
        setSaveStatus('Saved');
      } catch (error) {
        setSaveStatus('Error Saving');
      }
    }, 5000); // Auto-save every 5 seconds

    return () => clearInterval(interval);
  }, [quill, id, title]);

  // 4. Handle Typing Indicator
  useEffect(() => {
    if (quill == null || awareness == null) return;
    
    let typingTimeout;

    const handleTextChange = (delta, oldDelta, source) => {
      if (source === 'user') {
        const currentUserState = awareness.getLocalState()?.user;
        if (currentUserState && !currentUserState.isTyping) {
           awareness.setLocalStateField('user', { ...currentUserState, isTyping: true });
        }
        
        clearTimeout(typingTimeout);
        typingTimeout = setTimeout(() => {
           const state = awareness.getLocalState()?.user;
           if (state) {
              awareness.setLocalStateField('user', { ...state, isTyping: false });
           }
        }, 1500);
      }
    };

    quill.on('text-change', handleTextChange);

    return () => {
      quill.off('text-change', handleTextChange);
      clearTimeout(typingTimeout);
    };
  }, [quill, awareness]);

  const handleTitleChange = (e) => {
    setTitle(e.target.value);
    setSaveStatus('Unsaved changes');
  };

  const saveDocument = async (currentTitle) => {
    if (quill == null || (myRole !== 'Editor' && myRole !== 'Owner')) return;
    setSaveStatus('Saving...');
    try {
      const data = quill.root.innerHTML;
      await api.put(`/documents/${id}`, { data, title: currentTitle || title });
      setSaveStatus('Saved');
    } catch (error) {
      setSaveStatus('Error Saving');
    }
  };

  const handleBack = async () => {
    if (saveStatus === 'Unsaved changes') {
      await saveDocument(title);
    }
    navigate('/');
  };

  const handleShare = async () => {
    if (!shareEmail) return;
    try {
      const res = await api.post(`/documents/${id}/share`, { email: shareEmail, role: shareRole });
      setDoc(res.data.doc);
      alert(`Document successfully shared with ${shareEmail} as ${shareRole}!`);
      setShareEmail('');
      setShareRole('Editor');
    } catch (error) {
      alert(error.response?.data?.error || 'Failed to share document.');
    }
  };

  const handleUnshare = async (userId) => {
    if (window.confirm("Are you sure you want to remove this collaborator?")) {
      try {
        const res = await api.delete(`/documents/${id}/share/${userId}`);
        setDoc(res.data.doc);
        alert('Collaborator removed.');
      } catch (error) {
        alert(error.response?.data?.error || 'Failed to remove collaborator.');
      }
    }
  };

  const saveVersion = async () => {
    if (quill == null) return;
    try {
      const data = quill.root.innerHTML;
      const res = await api.post(`/documents/${id}/versions`, { data });
      setDoc(prev => ({ ...prev, versions: res.data.versions }));
      alert('Version saved successfully!');
    } catch (error) {
      alert('Failed to save version.');
    }
  };

  // Keyboard Shortcuts
  useEffect(() => {
    const handleKeyDown = (e) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 's') {
        e.preventDefault();
        saveVersion();
      }
      if ((e.ctrlKey || e.metaKey) && e.shiftKey && e.key.toLowerCase() === 'c') {
        e.preventDefault();
        setShowComments(true);
        setShowHistory(false);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [quill, title, id, saveVersion]);

  const handleExportPDF = () => {
    if (!quill) return;
    const printWindow = window.open('', '', 'height=600,width=800');
    if (!printWindow) {
      alert("Please allow pop-ups to export as PDF.");
      return;
    }
    
    printWindow.document.write('<html><head><title>' + (title || 'Document') + '</title>');
    printWindow.document.write('<style>');
    printWindow.document.write('body { font-family: "Inter", Arial, sans-serif; padding: 40px; color: black; background: white; line-height: 1.6; }');
    printWindow.document.write('h1, h2, h3 { margin-bottom: 0.5em; }');
    printWindow.document.write('p { margin-bottom: 1em; }');
    printWindow.document.write('</style>');
    printWindow.document.write('</head><body>');
    printWindow.document.write(quill.root.innerHTML);
    printWindow.document.write('</body></html>');
    printWindow.document.close();
    printWindow.focus();
    
    setTimeout(() => {
      printWindow.print();
      printWindow.close();
    }, 250);
  };

  const handleExportMarkdown = () => {
    if (!quill) return;
    const turndownService = new TurndownService();
    const markdown = turndownService.turndown(quill.root.innerHTML);
    
    const blob = new Blob([markdown], { type: 'text/markdown' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${title || 'document'}.md`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const handleImportFile = () => {
    if (myRole === 'Viewer' || myRole === 'Commenter') {
       alert("You do not have permission to modify this document.");
       return;
    }
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.md,.markdown,.pdf,.docx';
    input.onchange = async (e) => {
      const file = e.target.files[0];
      if (!file) return;
      
      let html = '';
      
      try {
        if (file.name.endsWith('.md') || file.name.endsWith('.markdown')) {
          const text = await file.text();
          html = await marked(text);
        } else if (file.name.endsWith('.docx')) {
          const arrayBuffer = await file.arrayBuffer();
          const result = await mammoth.convertToHtml({ arrayBuffer });
          html = result.value;
        } else if (file.name.endsWith('.pdf')) {
          const arrayBuffer = await file.arrayBuffer();
          const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
          let text = '';
          for (let i = 1; i <= pdf.numPages; i++) {
            const page = await pdf.getPage(i);
            const content = await page.getTextContent();
            const strings = content.items.map(item => item.str);
            text += strings.join(' ') + '\n';
          }
          html = text.split('\n').map(p => `<p>${p}</p>`).join('');
        }
        
        if (quill && html) {
          quill.clipboard.dangerouslyPasteHTML(html);
          saveDocument(title);
        }
      } catch (err) {
        console.error(err);
        alert('Failed to import file');
      }
    };
    input.click();
  };

  const restoreVersion = async (versionData) => {
    if (window.confirm("Are you sure you want to restore this version? This will overwrite the current document for everyone.")) {
      if (quill) {
        quill.clipboard.dangerouslyPasteHTML(versionData);
        await saveDocument(title);
        setShowHistory(false);
      }
    }
  };

  const deleteVersion = async (versionId) => {
    if (window.confirm("Are you sure you want to delete this version?")) {
      try {
        const res = await api.delete(`/documents/${id}/versions/${versionId}`);
        setDoc(prev => ({ ...prev, versions: res.data.versions }));
      } catch (error) {
        alert('Failed to delete version.');
      }
    }
  };

  const fetchComments = async () => {
    try {
      const res = await api.get(`/comments/${id}`);
      setComments(res.data);
    } catch (error) {
      console.error(error);
    }
  };

  useEffect(() => {
    fetchComments();
  }, [id]);

  const notifyPeers = () => {
    if (commentsTrigger) {
      commentsTrigger.set('lastUpdate', Date.now());
    }
  };

  const addComment = async () => {
    if (!newCommentText.trim()) return;
    try {
      const res = await api.post(`/comments/${id}`, { text: newCommentText });
      setComments([res.data, ...comments]);
      setNewCommentText('');
      notifyPeers();
    } catch (error) {
      console.error(error);
    }
  };

  const addReply = async (commentId) => {
    const text = replyTexts[commentId];
    if (!text?.trim()) return;
    try {
      const res = await api.post(`/comments/${id}/${commentId}/reply`, { text });
      setComments(comments.map(c => c._id === commentId ? res.data : c));
      setReplyTexts(prev => ({ ...prev, [commentId]: '' }));
      notifyPeers();
    } catch (error) {
      console.error(error);
    }
  };

  const resolveComment = async (commentId) => {
    try {
      const res = await api.put(`/comments/${id}/${commentId}/resolve`);
      setComments(comments.map(c => c._id === commentId ? res.data : c));
      notifyPeers();
    } catch (error) {
      console.error(error);
    }
  };

  const deleteComment = async (commentId) => {
    if (!window.confirm("Are you sure you want to delete this comment?")) return;
    try {
      await api.delete(`/comments/${id}/${commentId}`);
      setComments(prev => prev.filter(c => c._id !== commentId));
      notifyPeers();
      alert('Comment deleted');
    } catch (error) {
      console.error('Failed to delete comment:', error);
      const msg = error?.response?.data?.error || error?.message || 'Failed to delete comment.';
      alert(msg);
    }
  };

  return (
    <div className="editor-container">
      <nav className="editor-nav">
        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
          <button 
            onClick={handleBack} 
            style={{ background: 'none', border: 'none', color: 'var(--text-primary)', cursor: 'pointer' }}
          >
            <ArrowLeft size={24} />
          </button>
          <input 
            type="text" 
            value={title} 
            onChange={handleTitleChange} 
            onBlur={() => saveDocument(title)}
            className="editor-title-input"
            disabled={myRole === 'Viewer' || myRole === 'Commenter'}
            style={{ opacity: (myRole === 'Viewer' || myRole === 'Commenter') ? 0.7 : 1 }}
          />
          <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>
            {myRole === 'Viewer' || myRole === 'Commenter' ? `Read-only (${myRole})` : saveStatus}
          </span>
        </div>
        <div className="presence-indicators">
          <button onClick={toggleTheme} className="theme-toggle-btn" title="Toggle Light/Dark Mode" style={{ marginRight: '0.5rem' }}>
            {theme === 'dark' ? <Sun size={18} /> : <Moon size={18} />}
          </button>
          
          <button 
            onClick={() => { setShowComments(!showComments); setShowHistory(false); fetchComments(); }} 
            style={{ 
              background: 'transparent', color: 'var(--text-secondary)', border: '1px solid var(--border-color)', 
              padding: '0.4rem 0.8rem', borderRadius: '6px', cursor: 'pointer',
              display: 'flex', alignItems: 'center', gap: '0.5rem', marginRight: '0.5rem',
              fontWeight: '600', fontSize: '0.875rem', position: 'relative'
            }}
            title="Comments (Ctrl+Shift+C)"
          >
            <MessageSquare size={16} /> Comments
            {comments.filter(c => !c.resolved).length > 0 && (
              <span style={{
                position: 'absolute', top: '-6px', right: '-6px',
                background: 'var(--danger-color)', color: 'white', borderRadius: '50%',
                width: '18px', height: '18px', display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: '0.7rem', fontWeight: 'bold', boxShadow: '0 2px 4px rgba(0,0,0,0.2)'
              }}>
                {comments.filter(c => !c.resolved).length}
              </span>
            )}
          </button>
          <button 
            onClick={() => { setShowHistory(!showHistory); setShowComments(false); }} 
            style={{ 
              background: 'transparent', color: 'var(--text-secondary)', border: '1px solid var(--border-color)', 
              padding: '0.4rem 0.8rem', borderRadius: '6px', cursor: 'pointer',
              display: 'flex', alignItems: 'center', gap: '0.5rem', marginRight: '0.5rem',
              fontWeight: '600', fontSize: '0.875rem'
            }}
          >
            <History size={16} /> History
          </button>
          
          {(myRole === 'Owner' || myRole === 'Editor') && (
            <button 
              onClick={handleImportFile} 
              style={{ 
                background: 'transparent', color: 'var(--text-secondary)', border: '1px solid var(--border-color)', 
                padding: '0.4rem 0.8rem', borderRadius: '6px', cursor: 'pointer',
                display: 'flex', alignItems: 'center', gap: '0.5rem', marginRight: '0.5rem',
                fontWeight: '600', fontSize: '0.875rem'
              }}
              title="Import Markdown, PDF, or DOCX"
            >
              <Upload size={16} /> Import
            </button>
          )}
          {myRole === 'Owner' && (
            <button 
              onClick={() => setShowShareModal(true)} 
              style={{ 
                background: 'var(--primary-color)', color: 'white', border: 'none', 
                padding: '0.4rem 0.8rem', borderRadius: '6px', cursor: 'pointer',
                display: 'flex', alignItems: 'center', gap: '0.5rem', marginRight: '0.5rem',
                fontWeight: '600', fontSize: '0.875rem'
              }}
            >
              <Share2 size={16} /> Share
            </button>
          )}

          <div className="export-dropdown-container" style={{ marginRight: '0.5rem' }}>
            <button 
              onClick={() => {
                const menu = document.getElementById('export-menu');
                if (menu) {
                  menu.style.display = menu.style.display === 'block' ? 'none' : 'block';
                }
              }}
              className="secondary-btn"
              style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.875rem' }}
            >
              <Download size={16} /> Export
            </button>
            <div id="export-menu" className="dropdown-menu" style={{ display: 'none', width: '170px' }}>
              <button onClick={() => { const menu = document.getElementById('export-menu'); if (menu) menu.style.display='none'; handleExportPDF(); }}>Export to PDF</button>
              <button onClick={() => { const menu = document.getElementById('export-menu'); if (menu) menu.style.display='none'; handleExportMarkdown(); }}>Export to Markdown</button>
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', marginLeft: '0.5rem', paddingLeft: '1rem', borderLeft: '1px solid var(--border-color)' }}>
             <Users size={16} color="var(--text-secondary)" />
             <span style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', fontWeight: '500', marginRight: '0.2rem' }}>
               Online Users:
             </span>
             {awarenessUsers.length === 0 && (
               <span style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>Just You</span>
             )}
          </div>

          {awarenessUsers.map((u, i) => (
            <div 
              key={i} 
              className="presence-avatar" 
              style={{ backgroundColor: u.color, position: 'relative' }}
              title={u.name}
            >
              {u.name.charAt(0).toUpperCase()}
              {u.isTyping && (
                <div className="typing-popup">
                  {u.name} is typing...
                </div>
              )}
            </div>
          ))}
        </div>
      </nav>
      <div style={{ display: 'flex', flex: 1, overflow: 'hidden' }}>
        <div className="quill-wrapper" ref={wrapperRef}></div>
        {showHistory && (
          <div className="history-sidebar">
            <div className="history-header">
              <h3>Version History</h3>
              <button onClick={() => setShowHistory(false)}><X size={20} /></button>
            </div>
            {(myRole === 'Owner' || myRole === 'Editor') && (
              <button className="save-version-btn" onClick={saveVersion} title="Save Version (Ctrl+S)">
                + Save Current Version
              </button>
            )}
            <div className="history-list">
              {doc?.versions && doc.versions.length > 0 ? (
                [...doc.versions].reverse().map((v, i) => (
                  <div key={i} className="history-item">
                    <div className="history-meta">
                      <span className="history-date">{new Date(v.createdAt).toLocaleString()}</span>
                      <span className="history-author">By {v.createdBy?.name || 'Unknown'}</span>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: '0.25rem' }}>
                      {(myRole === 'Owner' || myRole === 'Editor') ? (
                        <>
                          <button className="restore-btn" onClick={() => restoreVersion(v.data)}>Restore</button>
                          <button 
                            onClick={() => deleteVersion(v._id)}
                            style={{ background: 'transparent', border: 'none', color: 'var(--danger-color)', cursor: 'pointer', padding: '0.4rem', display: 'flex', alignItems: 'center' }}
                            title="Delete Version"
                          >
                            <Trash2 size={16} />
                          </button>
                        </>
                      ) : (
                        <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>View Only</span>
                      )}
                    </div>
                  </div>
                ))
              ) : (
                <p style={{ color: 'var(--text-secondary)', textAlign: 'center', marginTop: '2rem', fontSize: '0.875rem' }}>No versions saved yet.</p>
              )}
            </div>
          </div>
        )}

        {showComments && (
          <div className="history-sidebar">
            <div className="history-header">
              <h3>Comments</h3>
              <button onClick={() => setShowComments(false)}><X size={20} /></button>
            </div>
            
            {myRole !== 'Viewer' && (
              <div className="comment-input-box">
                <input 
                  type="text" 
                  placeholder="Add a comment..." 
                  value={newCommentText}
                  onChange={(e) => setNewCommentText(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && addComment()}
                />
                <button onClick={addComment}><Send size={16} /></button>
              </div>
            )}

            <div className="history-list">
              {comments.map((c, i) => (
                <div key={i} className={`comment-item ${c.resolved ? 'resolved' : ''}`}>
                  <div className="comment-header">
                    <span className="comment-author">{c.createdBy?.name || 'Unknown'}</span>
                    <span className="comment-date">{new Date(c.createdAt).toLocaleDateString()}</span>
                  </div>
                  <p className="comment-text">{c.text}</p>
                  
                  <div className="comment-actions">
                    {myRole !== 'Viewer' && (
                      <button onClick={() => resolveComment(c._id)} className={c.resolved ? 'active' : ''}>
                        <Check size={14} /> {c.resolved ? 'Resolved' : 'Resolve'}
                      </button>
                    )}
                    {(c.createdBy?._id === user?.id || myRole === 'Owner') && (
                      <button onClick={() => deleteComment(c._id)} style={{ color: 'var(--danger-color)', marginLeft: '0.5rem' }} title="Delete Comment">
                        <Trash2 size={14} /> Delete
                      </button>
                    )}
                  </div>

                  <div className="replies-list">
                    {c.replies.map((r, j) => (
                      <div key={j} className="reply-item">
                        <CornerDownRight size={12} color="var(--text-secondary)" />
                        <div className="reply-content">
                          <span className="reply-author">{r.createdBy?.name || 'Unknown'}</span>
                          <p className="reply-text">{r.text}</p>
                        </div>
                      </div>
                    ))}
                  </div>

                  {myRole !== 'Viewer' && (
                    <div className="reply-input-box">
                      <input 
                        type="text" 
                        placeholder="Reply..." 
                        value={replyTexts[c._id] || ''}
                        onChange={(e) => setReplyTexts(prev => ({ ...prev, [c._id]: e.target.value }))}
                        onKeyDown={(e) => e.key === 'Enter' && addReply(c._id)}
                      />
                      <button onClick={() => addReply(c._id)}><Send size={14} /></button>
                    </div>
                  )}
                </div>
              ))}
              {comments.length === 0 && (
                <p style={{ color: 'var(--text-secondary)', textAlign: 'center', marginTop: '2rem', fontSize: '0.875rem' }}>No comments yet.</p>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Share Modal */}
      {myRole === 'Owner' && showShareModal && (
        <div className="modal-overlay">
          <div className="modal-content">
            <div className="modal-header">
              <h2>Share Document</h2>
              <button onClick={() => setShowShareModal(false)} className="close-btn"><X size={24} /></button>
            </div>
            <div className="modal-body">
              <div className="form-group">
                <label>Email Address</label>
                <input 
                  type="email" 
                  placeholder="collaborator@example.com" 
                  value={shareEmail} 
                  onChange={(e) => setShareEmail(e.target.value)} 
                />
              </div>
              <div className="form-group">
                <label>Permission Role</label>
                <select value={shareRole} onChange={(e) => setShareRole(e.target.value)} style={{ padding: '0.8rem', borderRadius: '6px', border: '1px solid var(--border-color)', background: 'var(--surface-strong)', color: 'var(--text-primary)', width: '100%', fontSize: '0.9rem' }}>
                  <option value="Editor">Editor (Can edit document and settings)</option>
                  <option value="Commenter">Commenter (Can add comments only)</option>
                  <option value="Viewer">Viewer (Can view only)</option>
                </select>
              </div>
              <button className="primary-btn" onClick={handleShare} style={{ width: '100%', marginTop: '1rem', padding: '0.8rem', fontSize: '1rem', borderRadius: '6px' }}>
                Share Document
              </button>
              
              {doc?.collaborators && doc.collaborators.length > 0 && (
                <div style={{ marginTop: '2rem', borderTop: '1px solid var(--border-color)', paddingTop: '1rem' }}>
                  <h3 style={{ fontSize: '1rem', marginBottom: '1rem' }}>Collaborators</h3>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                    {doc.collaborators.map((c, i) => (
                      <div key={i} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'var(--surface-strong)', padding: '0.5rem 1rem', borderRadius: '6px' }}>
                        <div>
                          <p style={{ margin: 0, fontWeight: 500 }}>{c.user?.name || 'Unknown'}</p>
                          <p style={{ margin: 0, fontSize: '0.75rem', color: 'var(--text-secondary)' }}>{c.user?.email} - {c.role}</p>
                        </div>
                        {myRole === 'Owner' && (
                          <button 
                            onClick={() => handleUnshare(c.user?._id)} 
                            style={{ background: 'transparent', border: 'none', color: 'var(--danger-color)', cursor: 'pointer', padding: '0.4rem', display: 'flex', alignItems: 'center', gap: '0.25rem' }}
                            title="Remove Collaborator"
                          >
                            <X size={16} />
                            <span style={{ fontSize: '0.85rem' }}>Unshare</span>
                          </button>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default DocumentEditor;
