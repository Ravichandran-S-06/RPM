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
  const [journalConferenceName, setJournalConferenceName] = useState("");
  const [scopusQuartile, setScopusQuartile] = useState("");
  const [editingId, setEditingId] = useState(null);
  const [loading, setLoading] = useState(false);
  const [user, setUser] = useState(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [sortBy, setSortBy] = useState("newest");
  const [filterStatus, setFilterStatus] = useState("all");
  const [showOtherDepartmentInput, setShowOtherDepartmentInput] = useState(false);
  const [showOtherIndexingInput, setShowOtherIndexingInput] = useState(false);
  const [showAddPaper, setShowAddPaper] = useState(true);

  const departments = [
    "Select Department",
    "Computer Science & Engineering",
    "Computer Science & Engineering (AI & ML)",
    "Information Science & Engineering",
    "Mechanical Engineering",
    "Electronics & Communication Engineering",
    "Electrical & Electronics Engineering",
    "Civil Engineering",
    "Other"
  ];

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
    if (!title || !authors || !monthYear || !department || !indexing || !journalConferenceName) {
      alert("Please fill in all required fields.");
      return;
    }

    setLoading(true);

    try {
      const paperData = { 
        title, 
        authors, 
        type, 
        monthYear, 
        status, 
        department, 
        paperLink, 
        certLink, 
        indexing: indexing === "Scopus" ? `Scopus (${scopusQuartile})` : indexing, 
        journalConferenceName,
        userEmail: user.email 
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
      setMonthYear("");
      setStatus("Published");
      setDepartment("");
      setPaperLink("");
      setCertLink("");
      setIndexing("");
      setJournalConferenceName("");
      setScopusQuartile("");
      setShowOtherDepartmentInput(false);
      setShowOtherIndexingInput(false);
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
    setIndexing(paper.indexing.includes("Scopus") ? "Scopus" : paper.indexing);
    setScopusQuartile(paper.indexing.includes("Scopus") ? paper.indexing.split(" ")[1].replace(/[()]/g, "") : "");
    setJournalConferenceName(paper.journalConferenceName);
    setEditingId(paper.id);
    setShowOtherDepartmentInput(!departments.includes(paper.department));
    setShowOtherIndexingInput(paper.indexing !== "Scopus" && paper.indexing !== "Web of Science" && paper.indexing !== "");
    setShowAddPaper(true);
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
      <div className="sidebar">
        <button onClick={() => setShowAddPaper(true)}>Add Papers</button>
        <button onClick={() => setShowAddPaper(false)}>My Research Papers</button>
        <button className="logout-btn" onClick={handleLogout}>Logout</button>
      </div>
      <div className="content">
        {showAddPaper ? (
          <>
            <h2>Add Research Paper</h2>
            <div className="input-container">
              <input type="text" placeholder="Paper Title" value={title} onChange={(e) => setTitle(e.target.value)} required />
              <input type="text" placeholder="Authors (comma-separated)" value={authors} onChange={(e) => setAuthors(e.target.value)} required />
              <select value={type} onChange={(e) => setType(e.target.value)}>
                <option value="Journal">Journal</option>
                <option value="Conference">Conference</option>
              </select>
              <input
                type="text"
                placeholder={type === "Journal" ? "Journal Name" : "Conference Name"}
                value={journalConferenceName}
                onChange={(e) => setJournalConferenceName(e.target.value)}
                required
              />
              <input type="month" value={monthYear} onChange={(e) => setMonthYear(e.target.value)} required />
              <select value={status} onChange={(e) => setStatus(e.target.value)}>
                <option value="Published">Published</option>
                <option value="In Review">In Review</option>
                <option value="Accepted">Accepted</option>
              </select>
              <select
  value={showOtherDepartmentInput ? "Other" : department}
  onChange={(e) => {
    if (e.target.value === "Other") {
      setDepartment(""); // Keep this empty to allow typing
      setShowOtherDepartmentInput(true);
    } else {
      setDepartment(e.target.value);
      setShowOtherDepartmentInput(false);
    }
  }}
  
>
  {departments.map((dept) => (
    <option key={dept} value={dept}>
      {dept}
    </option>
  ))}
</select>

{showOtherDepartmentInput && (
  <input
    type="text"
    placeholder="Enter Department Name"
    value={department}
    onChange={(e) => setDepartment(e.target.value)}
    required
  />
)}

              <input type="url" placeholder="DOI Link (Update once published)" value={paperLink} onChange={(e) => setPaperLink(e.target.value)} />
              <select
  value={showOtherIndexingInput ? "Other" : indexing}
  onChange={(e) => {
    if (e.target.value === "Other") {
      setIndexing(""); // Allow user to enter custom indexing
      setShowOtherIndexingInput(true);
    } else {
      setIndexing(e.target.value);
      setShowOtherIndexingInput(false);
    }
  }}
  required
>
  <option value="">Select Indexing</option>
  <option value="Web of Science">Web of Science</option>
  <option value="Scopus">Scopus</option>
  <option value="Other">Other</option>
</select>
            {indexing === "Scopus" && (
              <select value={scopusQuartile} onChange={(e) => setScopusQuartile(e.target.value)} required>
                <option value="">Select Quartile</option>
                <option value="Q1">Q1</option>
                <option value="Q2">Q2</option>
                <option value="Q3">Q3</option>
                <option value="Q4">Q4</option>
              </select>
            )}
            {showOtherIndexingInput && (
              <input
                type="text"
                placeholder="Enter Indexing Name"
                value={indexing}
                onChange={(e) => setIndexing(e.target.value)}
                required
              />
            )}
            
            <input type="url" placeholder="Google Drive Link (Certificate) (Optional)" value={certLink} onChange={(e) => setCertLink(e.target.value)} />
            <button onClick={handleAdd} disabled={loading}>
              {editingId ? "Update Paper" : loading ? "Saving..." : "Add Paper"}
            </button>
          </div>
        </>
      ) : (
        <>
          <h2>My Research Papers</h2>
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
                <p>{paper.type === "Journal" ? "Journal Name" : "Conference Name"}: {paper.journalConferenceName}</p>
                {paper.paperLink && <a href={paper.paperLink} target="_blank" rel="noopener noreferrer">📄 View Paper</a>}
                {paper.certLink && <a href={paper.certLink} target="_blank" rel="noopener noreferrer">📜 View Certificate</a>}
                <div>
                  <button onClick={() => handleEdit(paper)}>✏ Edit</button>
                  <button onClick={() => handleDelete(paper.id)}>🗑 Delete</button>
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

export default Dashboard;