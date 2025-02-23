import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { auth, db } from "../firebase";
import { signOut, onAuthStateChanged } from "firebase/auth";
import { collection, addDoc, getDocs, updateDoc, deleteDoc, doc, onSnapshot } from "firebase/firestore";
import "./Dashboard.css";

const Dashboard = () => {
  const [papers, setPapers] = useState([]);
  const [title, setTitle] = useState("");
  const [authors, setAuthors] = useState("");
  const [type, setType] = useState("Journal");
  const [paperLink, setPaperLink] = useState("");
  const [certLink, setCertLink] = useState("");
  const [editingId, setEditingId] = useState(null);
  const [loading, setLoading] = useState(false);
  const [user, setUser] = useState(null);
  
  const navigate = useNavigate();

  useEffect(() => {
    const unsubscribeAuth = onAuthStateChanged(auth, (currentUser) => {
      if (!currentUser) {
        navigate("/"); // Redirect to home if not logged in
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
  };

  const handleLogout = async () => {
    await signOut(auth);
    navigate("/");
  };

  return (
    <div className="dashboard-container">
      <h2>Research Paper Dashboard</h2>

      {/* Input Form */}
      <div className="input-container">
        <input type="text" placeholder="Paper Title" value={title} onChange={(e) => setTitle(e.target.value)} required />
        <input type="text" placeholder="Authors (comma-separated)" value={authors} onChange={(e) => setAuthors(e.target.value)} required />
        <select value={type} onChange={(e) => setType(e.target.value)}>
          <option value="Journal">Journal</option>
          <option value="Conference">Conference</option>
        </select>
        <input type="url" placeholder="Google Drive Link (Paper PDF)" value={paperLink} onChange={(e) => setPaperLink(e.target.value)} required />
        <input type="url" placeholder="Google Drive Link (Certificate)" value={certLink} onChange={(e) => setCertLink(e.target.value)} required />

        <button onClick={handleAdd} disabled={loading}>
          {editingId ? "Update Paper" : loading ? "Saving..." : "Add Paper"}
        </button>
      </div>

      <button className="logout-btn" onClick={handleLogout}>Logout</button>

      {/* Paper List */}
      <h3>My Research Papers</h3>
      <ul className="paper-list">
        {papers
          .filter((paper) => paper.userEmail === user?.email) // Only show logged-in user's papers
          .map((paper) => (
            <li key={paper.id}>
              <strong>{paper.title}</strong> ({paper.type})
              <p>Authors: {paper.authors}</p>
              <a href={paper.paperLink} target="_blank" rel="noopener noreferrer">📄 View Paper</a>
              <a href={paper.certLink} target="_blank" rel="noopener noreferrer">📜 View Certificate</a>
              <div>
                <button onClick={() => handleEdit(paper)}>✏ Edit</button>
                <button onClick={() => handleDelete(paper.id)}>🗑 Delete</button>
              </div>
            </li>
          ))}
      </ul>
    </div>
  );
};

export default Dashboard;
