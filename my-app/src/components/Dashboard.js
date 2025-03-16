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
  const [monthYear, setMonthYear] = useState("");
  const [status, setStatus] = useState("Published");
  const [department, setDepartment] = useState("");
  const [paperLink, setPaperLink] = useState("");
  const [certLink, setCertLink] = useState("");
  const [indexing, setIndexing] = useState("");
  const [editingId, setEditingId] = useState(null);
  const [loading, setLoading] = useState(false);
  const [user, setUser] = useState(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [sortBy, setSortBy] = useState("newest");
  const [filterStatus, setFilterStatus] = useState("all");

  const navigate = useNavigate();

  useEffect(() => {
    const unsubscribeAuth = onAuthStateChanged(auth, (currentUser) => {
      if (!currentUser) {
        navigate("/");
      }
      setUser(currentUser);
    });

    const unsubscribePapers = onSnapshot(collection(db, "papers"), (snapshot) => {
      setPapers(snapshot.docs.map((doc, index) => ({ id: doc.id, index: index + 1, ...doc.data() })));
    });

    return () => {
      unsubscribeAuth();
      unsubscribePapers();
    };
  }, [navigate]);

  const handleAdd = async () => {
    if (!title || !authors || !paperLink || !monthYear || !department || !indexing) {
      alert("Please fill in all required fields.");
      return;
    }

    setLoading(true);

    try {
      const paperData = { title, authors, type, monthYear, status, department, paperLink, certLink, indexing, userEmail: user.email };

      if (editingId) {
        await updateDoc(doc(db, "papers", editingId), paperData);
        setEditingId(null);
      } else {
        await addDoc(collection(db, "papers"), paperData);
      }

      setTitle("");
      setAuthors("");
      setType("Journal");
      setMonthYear("");
      setStatus("Published");
      setDepartment("");
      setPaperLink("");
      setCertLink("");
      setIndexing("");
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
    setMonthYear(paper.monthYear);
    setStatus(paper.status);
    setDepartment(paper.department);
    setPaperLink(paper.paperLink);
    setCertLink(paper.certLink);
    setIndexing(paper.indexing);
    setEditingId(paper.id);
  };

  const handleLogout = async () => {
    await signOut(auth);
    navigate("/");
  };

  const filteredPapers = papers
    .filter((paper) => paper.userEmail === user?.email)
    .filter((paper) => paper.title.toLowerCase().includes(searchQuery.toLowerCase()))
    .filter((paper) => (filterStatus === "all" ? true : paper.status === filterStatus))
    .sort((a, b) => (sortBy === "newest" ? new Date(b.monthYear) - new Date(a.monthYear) : a.status.localeCompare(b.status)));

  return (
    <div className="dashboard-container">
      <h2>Research Paper Dashboard</h2>

      <div className="input-container">
        <input type="text" placeholder="Paper Title" value={title} onChange={(e) => setTitle(e.target.value)} required />
        <input type="text" placeholder="Authors (comma-separated)" value={authors} onChange={(e) => setAuthors(e.target.value)} required />
        <select value={type} onChange={(e) => setType(e.target.value)}>
          <option value="Journal">Journal</option>
          <option value="Conference">Conference</option>
        </select>
        <input type="month" value={monthYear} onChange={(e) => setMonthYear(e.target.value)} required />
        <select value={status} onChange={(e) => setStatus(e.target.value)}>
          <option value="Published">Published</option>
          <option value="In Review">In Review</option>
          <option value="Accepted">Accepted</option>
        </select>
        <input type="text" placeholder="Full Name of the Department" value={department} onChange={(e) => setDepartment(e.target.value)} required />
        <input type="url" placeholder="Google Drive Link (Paper PDF) Make the link accessible to view" value={paperLink} onChange={(e) => setPaperLink(e.target.value)} required />
        <input type="url" placeholder="Google Drive Link (Certificate) (Optional)" value={certLink} onChange={(e) => setCertLink(e.target.value)} />
        <input type="text" placeholder="Indexing (e.g., Springer, Scopus)" value={indexing} onChange={(e) => setIndexing(e.target.value)} required />

        <button onClick={handleAdd} disabled={loading}>
          {editingId ? "Update Paper" : loading ? "Saving..." : "Add Paper"}
        </button>
      </div>

      <button className="logout-btn" onClick={handleLogout}>Logout</button>

      <h3>My Research Papers</h3>

      <div className="filter-container">
        <input
          type="text"
          placeholder="Search papers..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
        />

        <select value={sortBy} onChange={(e) => setSortBy(e.target.value)}>
          <option value="newest">Sort by Newest</option>
          <option value="status">Sort by Status</option>
        </select>

        <select value={filterStatus} onChange={(e) => setFilterStatus(e.target.value)}>
          <option value="all">All Statuses</option>
          <option value="Published">Published</option>
          <option value="In Review">In Review</option>
          <option value="Accepted">Accepted</option>
        </select>
      </div>

      <ul className="paper-list">
        {filteredPapers.map((paper, index) => (
          <li key={paper.id}>
            <strong>{index + 1}. {paper.title}</strong> ({paper.type})
            <p>Authors: {paper.authors}</p>
            <p>Month/Year: {paper.monthYear}</p>
            <p>Status: {paper.status}</p>
            <p>Department: {paper.department}</p>
            <p>Indexing: {paper.indexing}</p>
            <a href={paper.paperLink} target="_blank" rel="noopener noreferrer">📄 View Paper</a>
            {paper.certLink && <a href={paper.certLink} target="_blank" rel="noopener noreferrer">📜 View Certificate</a>}
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