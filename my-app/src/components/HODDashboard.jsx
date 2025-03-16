import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { auth, db } from "../firebase";
import { signOut, onAuthStateChanged } from "firebase/auth";
import {
  collection,
  addDoc,
  updateDoc,
  deleteDoc,
  doc,
  onSnapshot,
} from "firebase/firestore";
import "./HODDashboard.css";

const HODDashboard = () => {
  const [papers, setPapers] = useState([]);
  const [title, setTitle] = useState("");
  const [authors, setAuthors] = useState("");
  const [type, setType] = useState("Journal");
  const [paperLink, setPaperLink] = useState("");
  const [certLink, setCertLink] = useState("");
  const [indexing, setIndexing] = useState("");
  const [monthYear, setMonthYear] = useState("");
  const [status, setStatus] = useState("Published");
  const [department, setDepartment] = useState("");
  const [editingId, setEditingId] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [loading, setLoading] = useState(false);
  const [user, setUser] = useState(null);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [sortBy, setSortBy] = useState("all");
  const [filterStatus, setFilterStatus] = useState("all");
  const [filterDepartment, setFilterDepartment] = useState("all");
  const [filterIndexing, setFilterIndexing] = useState("all");

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

  const handleLogout = async () => {
    await signOut(auth);
    navigate("/");
  };

  const handleAdd = async () => {
    if (!title || !authors || !paperLink || !certLink || !indexing || !monthYear || !department) {
      alert("Please fill in all fields.");
      return;
    }

    setLoading(true);

    try {
      const paperData = {
        title,
        authors,
        type,
        paperLink,
        certLink,
        indexing,
        monthYear,
        status,
        department,
        userEmail: user.email,
      };

      if (editingId) {
        await updateDoc(doc(db, "papers", editingId), paperData);
        setEditingId(null);
      } else {
        await addDoc(collection(db, "papers"), paperData);
      }

      setTitle("");
      setAuthors("");
      setType("Journal");
      setPaperLink("");
      setCertLink("");
      setIndexing("");
      setMonthYear("");
      setStatus("Published");
      setDepartment("");
      alert("Paper details saved successfully!");
    } catch (error) {
      console.error("Error adding document: ", error);
      alert("Failed to save!");
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (paper) => {
    setTitle(paper.title);
    setAuthors(paper.authors);
    setType(paper.type);
    setPaperLink(paper.paperLink);
    setCertLink(paper.certLink);
    setIndexing(paper.indexing);
    setMonthYear(paper.monthYear);
    setStatus(paper.status);
    setDepartment(paper.department);
    setEditingId(paper.id);
  };

  const handleDelete = async (id) => {
    if (window.confirm("Are you sure you want to delete this paper?")) {
      await deleteDoc(doc(db, "papers", id));
    }
  };

  const toggleSidebar = () => {
    setSidebarOpen(!sidebarOpen);
  };

  // Get unique values for filtering
  const uniqueDepartments = [...new Set(papers.map((paper) => paper.department))];
  const uniqueIndexing = [...new Set(papers.map((paper) => paper.indexing))];
  const uniqueStatuses = [...new Set(papers.map((paper) => paper.status))];

  // Filter and sort papers
  const filteredPapers = papers
    .filter((paper) =>
      paper.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      paper.authors.toLowerCase().includes(searchTerm.toLowerCase())
    )
    .filter((paper) => (filterStatus === "all" ? true : paper.status === filterStatus))
    .filter((paper) => (filterDepartment === "all" ? true : paper.department === filterDepartment))
    .filter((paper) => (filterIndexing === "all" ? true : paper.indexing === filterIndexing))
    .sort((a, b) => {
      if (sortBy === "monthYear") {
        return new Date(b.monthYear) - new Date(a.monthYear);
      } else if (sortBy === "title") {
        return a.title.localeCompare(b.title);
      } else if (sortBy === "status") {
        return a.status.localeCompare(b.status);
      } else if (sortBy === "department") {
        return a.department.localeCompare(b.department);
      } else if (sortBy === "indexing") {
        return a.indexing.localeCompare(b.indexing);
      } else {
        return 0;
      }
    });

  return (
    <div className="hod-dashboard-container">
      <button className="sidebar-toggle" onClick={toggleSidebar}>
        ☰
      </button>
      <div className={`hod-sidebar ${sidebarOpen ? "open" : ""}`}>
        <h2 style={{ color: "white" }}>Admin Dashboard</h2>
        <button onClick={handleLogout}>🔓 Logout</button>
      </div>

      <div className="hod-main-content">
        <h2>All Research Papers</h2>
        <input
          type="text"
          placeholder="🔍 Search by title or author..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="hod-search-bar"
        />

        <div className="filter-container">
          <select onChange={(e) => setSortBy(e.target.value)}>
            <option value="all">Sort By</option>
            <option value="monthYear">Month/Year</option>
            <option value="title">Title</option>
            <option value="status">Status</option>
            <option value="department">Department</option>
            <option value="indexing">Indexing</option>
          </select>

          <select onChange={(e) => setFilterStatus(e.target.value)}>
            <option value="all">All Statuses</option>
            {uniqueStatuses.map((status) => (
              <option key={status} value={status}>
                {status}
              </option>
            ))}
          </select>

          <select onChange={(e) => setFilterDepartment(e.target.value)}>
            <option value="all">All Departments</option>
            {uniqueDepartments.map((dept) => (
              <option key={dept} value={dept}>
                {dept}
              </option>
            ))}
          </select>

          <select onChange={(e) => setFilterIndexing(e.target.value)}>
            <option value="all">All Indexing</option>
            {uniqueIndexing.map((index) => (
              <option key={index} value={index}>
                {index}
              </option>
            ))}
          </select>
        </div>

        <ul className="hod-paper-list">
          {filteredPapers.map((paper, index) => (
            <React.Fragment key={paper.id}>
              <li>
                <strong>{paper.title}</strong> ({paper.type})
                <p>Authors: {paper.authors}</p>
                <p>Department: {paper.department}</p>
                <p>Indexing: {paper.indexing}</p>
                <p>Status: {paper.status}</p>
                <p>Month/Year: {paper.monthYear}</p>
                <a href={paper.paperLink} target="_blank" rel="noopener noreferrer">
                  📄 View Paper
                </a>
                {paper.certLink && (
                  <a href={paper.certLink} target="_blank" rel="noopener noreferrer">
                    📜 View Certificate
                  </a>
                )}
                
              </li>
              {index < filteredPapers.length - 1 && <hr className="dotted-line" />}
            </React.Fragment>
          ))}
        </ul>
      </div>
    </div>
  );
};

export default HODDashboard;