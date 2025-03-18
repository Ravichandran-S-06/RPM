import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { auth, db } from "../firebase";
import { signOut, onAuthStateChanged } from "firebase/auth";
import { collection, onSnapshot } from "firebase/firestore";
import "./HODDashboard.css";

const HODDashboard = () => {
  const [papers, setPapers] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [user, setUser] = useState(null);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [sortBy, setSortBy] = useState("all");
  const [filterStatus, setFilterStatus] = useState("all");
  const [filterDepartment, setFilterDepartment] = useState("all");
  const [filterIndexing, setFilterIndexing] = useState("all");
  const [filterYear, setFilterYear] = useState("");
  const [filterMonth, setFilterMonth] = useState("");

  const navigate = useNavigate();

  useEffect(() => {
    const unsubscribeAuth = onAuthStateChanged(auth, (currentUser) => {
      if (!currentUser) {
        navigate("/");
      }
      setUser(currentUser);
    });
  
    const unsubscribePapers = onSnapshot(collection(db, "papers"), (snapshot) => {
      const papersData = snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
  
      // Use a Map to store unique paper titles with strict normalization
      const uniquePapersMap = new Map();
      papersData.forEach((paper) => {
        const normalizedTitle = paper.title
          .trim() // Remove leading/trailing spaces
          .replace(/\s+/g, " ") // Replace multiple spaces with a single space
          .toLowerCase(); // Convert to lowercase for consistency
  
        if (!uniquePapersMap.has(normalizedTitle)) {
          uniquePapersMap.set(normalizedTitle, paper);
        }
      });
  
      setPapers(Array.from(uniquePapersMap.values()));
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

  const toggleSidebar = () => {
    setSidebarOpen(!sidebarOpen);
  };

  const highlightAuthors = (authors) => {
    return authors.split(", ").map((author, index) => {
      const lowerAuthor = author.toLowerCase();
      const isHighlighted = lowerAuthor.startsWith("prof.") || lowerAuthor.startsWith("dr.");

      return (
        <React.Fragment key={index}>
          {isHighlighted ? (
            <span style={{ color: "blue", fontWeight: "bold" }}>{author}</span>
          ) : (
            author
          )}
          {index < authors.split(", ").length - 1 ? ", " : ""}
        </React.Fragment>
      );
    });
  };

  const handlePrint = () => {
    const formatAuthorsForPrint = (authors) => {
      return authors.split(", ").map((author) => {
        const lowerAuthor = author.toLowerCase();
        return lowerAuthor.startsWith("prof.") || lowerAuthor.startsWith("dr.")
          ? `<strong>${author}</strong>`
          : author;
      }).join(", ");
    };

    const printableContent = `
      <html>
        <head>
          <title>Print Papers</title>
          <style>
            @media print {
              body {
                font-family: Arial, sans-serif;
              }
              table {
                width: 100%;
                border-collapse: collapse;
              }
              th, td {
                border: 1px solid black;
                padding: 8px;
                text-align: left;
              }
              th {
                background-color: #f2f2f2;
              }
              a {
                display: none;
              }
            }
          </style>
        </head>
        <body>
          <h2>Research Papers</h2>
          <table>
            <thead>
              <tr>
                <th>Title</th>
                <th>Authors</th>
                <th>Department</th>
                <th>Indexing</th>
                <th>Status</th>
                <th>Month/Year</th>
                <th>Name</th>
              </tr>
            </thead>
            <tbody>
              ${filteredPapers
                .map(
                  (paper) => `
                  <tr>
                    <td>${paper.title} (${paper.type})</td>
                    <td>${formatAuthorsForPrint(paper.authors)}</td>
                    <td>${paper.department}</td>
                    <td>${paper.indexing}</td>
                    <td>${paper.status}</td>
                    <td>${paper.monthYear}</td>
                    <td>${paper.journalConferenceName}</td>
                  </tr>`
                )
                .join("")}
            </tbody>
          </table>
        </body>
      </html>
    `;

    const printWindow = window.open("", "_blank");
    printWindow.document.write(printableContent);
    printWindow.document.close();
    printWindow.print();
  };

  const filteredPapers = papers
    .filter((paper) =>
      paper.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      paper.authors.toLowerCase().includes(searchTerm.toLowerCase())
    )
    .filter((paper) => (filterStatus === "all" ? true : paper.status === filterStatus))
    .filter((paper) => (filterDepartment === "all" ? true : paper.department === filterDepartment))
    .filter((paper) => (filterIndexing === "all" ? true : paper.indexing === filterIndexing))
    .filter((paper) => {
      if (!filterYear && !filterMonth) return true;
      const date = new Date(paper.monthYear);
      const yearMatch = filterYear ? date.getFullYear().toString() === filterYear : true;
      const monthMatch = filterMonth ? (date.getMonth() + 1).toString() === filterMonth : true;
      return yearMatch && monthMatch;
    })
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

  const uniqueDepartments = [...new Set(papers.map((paper) => paper.department))];
  const uniqueIndexing = [...new Set(papers.map((paper) => paper.indexing))];
  const uniqueStatuses = [...new Set(papers.map((paper) => paper.status))];

  return (
    <div className="hod-dashboard-container">
      <button className="sidebar-toggle" onClick={toggleSidebar}>
        ☰
      </button>
      <div className={`hod-sidebar ${sidebarOpen ? "open" : ""}`}>
        <h2 style={{ color: "white" }}>Admin Dashboard</h2>
        <button onClick={handleLogout}>🔓 Logout</button>
        <button onClick={handlePrint}>🖨 Print</button>
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

          <input
            type="text"
            placeholder="Filter by Year (YYYY)"
            value={filterYear}
            onChange={(e) => setFilterYear(e.target.value)}
          />
          <input
            type="text"
            placeholder="Filter by Month (MM)"
            value={filterMonth}
            onChange={(e) => setFilterMonth(e.target.value)}
          />
        </div>

        <p>Total Papers: {filteredPapers.length}</p>

        <ul className="hod-paper-list" id="printable-area">
          {filteredPapers.map((paper, index) => (
            <React.Fragment key={paper.id}>
              <li>
                <strong>{paper.title}</strong> ({paper.type})
                <p>Authors: {highlightAuthors(paper.authors)}</p>
                <p>Department: {paper.department}</p>
                <p>Indexing: {paper.indexing}</p>
                <p>Status: {paper.status}</p>
                <p>Month/Year: {paper.monthYear}</p>
                <p>Journal/Conference Name: {paper.journalConferenceName}</p>
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