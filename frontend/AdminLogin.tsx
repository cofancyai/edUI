import { ArrowLeft } from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import { useState, useEffect } from "react";
import { toast } from "sonner";

const AdminLogin = () => {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();

  // Clear admin login status on component mount
  useEffect(() => {
    sessionStorage.removeItem('adminLoggedIn');
  }, []);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    
    // Simulate API call
    setTimeout(() => {
      if (username === "admin" && password === "admin") {
        // Set admin login status in sessionStorage - this is what App.tsx checks
        sessionStorage.setItem('adminLoggedIn', 'true');
        console.log("Admin login successful, set adminLoggedIn:", sessionStorage.getItem('adminLoggedIn'));
        
        toast.success("Login successful!");
        navigate("/admin/dashboard");
      } else {
        toast.error("Invalid credentials");
        setIsLoading(false);
      }
    }, 800);
  };

  return (
    <div style={{
      minHeight: "100vh",
      backgroundColor: "#1e293b",
      display: "flex",
      justifyContent: "center",
      alignItems: "center",
      padding: "1rem"
    }}>
      <div style={{
        width: "100%",
        maxWidth: "400px",
        animation: "fadeIn 0.5s ease-in-out"
      }}>
        <div style={{
          backgroundColor: "#292d3e", // Darker blue-purple
          borderRadius: "0.75rem",
          overflow: "hidden",
          boxShadow: "0 10px 25px -5px rgba(0, 0, 0, 0.3), 0 8px 10px -6px rgba(0, 0, 0, 0.2)",
          border: "1px solid rgba(255, 255, 255, 0.1)"
        }}>
          <div style={{
            padding: "1.75rem",
          }}>
            <div style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              marginBottom: "1.5rem"
            }}>
              <div style={{
                display: "flex",
                alignItems: "center"
              }}>
                <Link to="/" style={{
                  color: "#a5b4fc",
                  padding: "0.5rem",
                  borderRadius: "9999px",
                  transition: "all 0.2s ease",
                  marginLeft: "-0.5rem",
                  display: "flex"
                }}
                onMouseOver={(e) => {
                  e.currentTarget.style.backgroundColor = "rgba(165, 180, 252, 0.1)";
                  e.currentTarget.style.color = "#c4b5fd";
                }}
                onMouseOut={(e) => {
                  e.currentTarget.style.backgroundColor = "transparent";
                  e.currentTarget.style.color = "#a5b4fc";
                }}>
                  <ArrowLeft size={20} />
                </Link>
                <h2 style={{
                  fontSize: "1.5rem", 
                  fontWeight: "bold", 
                  color: "#f8fafc", 
                  marginLeft: "0.25rem", 
                  marginBottom: 0
                }}>Admin Login</h2>
              </div>
              <Link to="/" style={{
                fontSize: "0.875rem", 
                color: "#a5b4fc", 
                fontWeight: "500", 
                textDecoration: "none"
              }}>
                Back to Home
              </Link>
            </div>
            
            <form onSubmit={handleSubmit} style={{display: "flex", flexDirection: "column", gap: "1.25rem"}}>
              <div>
                <label htmlFor="username" style={{
                  display: "block", 
                  fontSize: "0.875rem", 
                  fontWeight: "500", 
                  color: "#cbd5e1", 
                  marginBottom: "0.5rem"
                }}>
                  Username
                </label>
                <input
                  id="username"
                  type="text"
                  placeholder="Enter your username"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  style={{
                    width: "100%",
                    padding: "0.75rem 1rem",
                    fontSize: "1rem",
                    borderRadius: "0.5rem",
                    border: "1px solid #4b5563",
                    backgroundColor: "#1e293b",
                    color: "#f8fafc",
                    transition: "all 0.3s ease",
                  }}
                  onFocus={(e) => {
                    e.target.style.outline = "none";
                    e.target.style.borderColor = "#8b5cf6";
                    e.target.style.boxShadow = "0 0 0 3px rgba(139, 92, 246, 0.3)";
                  }}
                  onBlur={(e) => {
                    e.target.style.borderColor = "#4b5563";
                    e.target.style.boxShadow = "none";
                  }}
                  required
                />
              </div>
              
              <div>
                <label htmlFor="password" style={{
                  display: "block", 
                  fontSize: "0.875rem", 
                  fontWeight: "500", 
                  color: "#cbd5e1", 
                  marginBottom: "0.5rem"
                }}>
                  Password
                </label>
                <input
                  id="password"
                  type="password"
                  placeholder="Enter your password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  style={{
                    width: "100%",
                    padding: "0.75rem 1rem",
                    fontSize: "1rem",
                    borderRadius: "0.5rem",
                    border: "1px solid #4b5563",
                    backgroundColor: "#1e293b",
                    color: "#f8fafc",
                    transition: "all 0.3s ease",
                  }}
                  onFocus={(e) => {
                    e.target.style.outline = "none";
                    e.target.style.borderColor = "#8b5cf6";
                    e.target.style.boxShadow = "0 0 0 3px rgba(139, 92, 246, 0.3)";
                  }}
                  onBlur={(e) => {
                    e.target.style.borderColor = "#4b5563";
                    e.target.style.boxShadow = "none";
                  }}
                  required
                />
              </div>

              <div style={{marginTop: "0.5rem"}}>
                <button
                  type="submit"
                  style={{
                    display: "flex",
                    justifyContent: "center",
                    alignItems: "center",
                    width: "100%",
                    padding: "0.875rem 1rem",
                    backgroundColor: "#7c3aed",
                    color: "white",
                    fontWeight: "600",
                    borderRadius: "0.5rem",
                    border: "none",
                    cursor: isLoading ? "not-allowed" : "pointer",
                    transition: "all 0.3s ease",
                    fontSize: "1rem",
                    boxShadow: "0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)",
                    opacity: isLoading ? 0.7 : 1,
                  }}
                  onMouseOver={(e) => {
                    if (!isLoading) {
                      e.currentTarget.style.backgroundColor = "#6d28d9";
                      e.currentTarget.style.boxShadow = "0 4px 8px -1px rgba(0, 0, 0, 0.2), 0 2px 6px -1px rgba(0, 0, 0, 0.1)";
                    }
                  }}
                  onMouseOut={(e) => {
                    e.currentTarget.style.backgroundColor = "#7c3aed";
                    e.currentTarget.style.boxShadow = "0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)";
                  }}
                  disabled={isLoading}
                >
                  {isLoading ? (
                    <span style={{display: "flex", alignItems: "center"}}>
                      <svg style={{
                        animation: "spin 1s linear infinite",
                        marginRight: "0.5rem", 
                        height: "1rem", 
                        width: "1rem"
                      }} xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle style={{opacity: "0.25"}} cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path style={{opacity: "0.75"}} fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                      Logging in...
                    </span>
                  ) : (
                    "Login"
                  )}
                </button>
              </div>
            </form>
            
            <div style={{marginTop: "1.5rem", textAlign: "center", fontSize: "0.875rem", color: "#94a3b8"}}>
              <p style={{margin: 0}}>Default credentials for demo: username "admin" password "admin"</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminLogin;