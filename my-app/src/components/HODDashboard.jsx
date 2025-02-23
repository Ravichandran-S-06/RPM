import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { auth, db } from "../firebase";
import { signOut, onAuthStateChanged } from "firebase/auth";
import { collection, getDocs, addDoc, updateDoc, deleteDoc, doc, onSnapshot } from "firebase/firestore";
import "./HODDashboard.css";

const HODDashboard = () => {
  const [papers, setPapers] = useState([]);
  const [title, setTitle] = useState("");
  const [authors, setAuthors] = useState("");
  const [type, setType] = useState("Journal");
  const [paperLink, setPaperLink] = useState("");
  const [certLink, setCertLink] = useState("");
  const [editingId, setEditingId] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [loading, setLoading] = useState(false);
  const [user, setUser] = useState(null);
  const [showMyPapers, setShowMyPapers] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [sortType, setSortType] = useState("all");

  const navigate = useNavigate();

  useEffect(() => {
    const unsubscribeAuth = onAuthStateChanged(auth, (currentUser) => {
      if (!currentUser) {
        navigate("/");
      }
      setUser(currentUser);
    });

    const unsubscribePapers = onSnapshot(collection(db, "papers"), (snapshot) => {
      setPapers(snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() })));
    });

    return () => {
      unsubscribeAuth();
      unsubscribePapers();
    };
  }, [navigate]);

  const handleAdd = async () => {
    if (!title || !authors || !paperLink || !certLink) {
      alert("Please fill in all fields.");
      return;
    }

    setLoading(true);

    try {
      if (editingId) {
        await updateDoc(doc(db, "papers", editingId), { title, authors, type, paperLink, certLink, userEmail: user.email });
        setEditingId(null);
      } else {
        await addDoc(collection(db, "papers"), { title, authors, type, paperLink, certLink, userEmail: user.email });
      }

      setTitle("");
      setAuthors("");
      setType("Journal");
      setPaperLink("");
      setCertLink("");
      alert("Paper details saved successfully!");
      setShowForm(false);
    } catch (error) {
      console.error("Error adding document: ", error);
      alert("Failed to save!");
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id) => {
    if (window.confirm("Are you sure you want to delete this paper?")) {
      await deleteDoc(doc(db, "papers", id));
    }
  };

  const handleEdit = (paper) => {
    setTitle(paper.title);
    setAuthors(paper.authors);
    setType(paper.type);
    setPaperLink(paper.paperLink);
    setCertLink(paper.certLink);
    setEditingId(paper.id);
    setShowForm(true);
  };

  const handleLogout = async () => {
    await signOut(auth);
    navigate("/");
  };

  const filteredPapers = papers
    .filter((paper) => (showMyPapers ? paper.userEmail === user?.email : true))
    .filter((paper) => paper.title.toLowerCase().includes(searchTerm.toLowerCase()))
    .filter((paper) => (sortType === "all" ? true : paper.type === sortType));

  return (
    <div className="hod-dashboard-container">
      <div className="hod-sidebar">
        <h2>HOD Dashboard</h2>
        <button onClick={() => { setShowForm(false); setShowMyPapers(false); setSortType("all"); }}>📄 All Research Papers</button>
        <button onClick={() => setShowMyPapers(true)}>📝 My Papers</button>
        <button onClick={() => setShowForm(true)}>➕ Research Paper Dashboard</button>
        <button onClick={handleLogout}>🔓 Logout</button>
      </div>

      <div className="hod-main-content">
        {showForm ? (
          <>
            <h2>📑 Add / Edit Research Paper</h2>
            <div className="input-container">
              <input type="text" placeholder="Paper Title" value={title} onChange={(e) => setTitle(e.target.value)} required />
              <input type="text" placeholder="Authors (comma-separated)" value={authors} onChange={(e) => setAuthors(e.target.value)} required />
              <select value={type} onChange={(e) => setType(e.target.value)}>
                <option value="Journal">Journal</option>
                <option value="Conference">Conference</option>
              </select>
              <input type="url" placeholder="Google Drive Link (Paper PDF)" value={paperLink} onChange={(e) => setPaperLink(e.target.value)} required />
              <input type="url" placeholder="Google Drive Link (Certificate)" value={certLink} onChange={(e) => setCertLink(e.target.value)} required />
              <button onClick={handleAdd} disabled={loading}>{editingId ? "Update Paper" : "Add Paper"}</button>
            </div>
          </>
        ) : (
          <>
            <h2>{showMyPapers ? "My Research Papers" : "All Research Papers"}</h2>
            <input type="text" placeholder="🔍 Search papers..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="hod-search-bar" />
            <select onChange={(e) => setSortType(e.target.value)} className="hod-sort-dropdown">
              <option value="all">All</option>
              <option value="Journal">Journal</option>
              <option value="Conference">Conference</option>
            </select>
            <ul className="hod-paper-list">
              {filteredPapers.map((paper) => (
                <li key={paper.id}>
                  <strong>{paper.title}</strong> ({paper.type})
                  <p>Authors: {paper.authors}</p>
                  <a href={paper.paperLink} target="_blank" rel="noopener noreferrer">📄 View Paper</a>
                  <a href={paper.certLink} target="_blank" rel="noopener noreferrer">📜 View Certificate</a>
                  <div>
                    <button onClick={() => handleEdit(paper)}>✏ </button>
                    <button className="hod-delete-btn" onClick={() => handleDelete(paper.id)}>🗑 </button>
                  </div>
                </li>
              ))}
            </ul>
          </>
        )}
      </div>
    </div>
  );
};

export default HODDashboard;
