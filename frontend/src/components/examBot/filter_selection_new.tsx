  // Render: Filter Selection Screen (Step 2) - Dropdowns
  const renderFilterSelection = () => (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
      {/* Header with Back Button */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
        <button
          onClick={() => {
            setViewMode('selectExam');
            setFilters({
              exam: '',
              subject: '',
              topic: '',
              subtopic: '',
              year: null,
              difficulty: ''
            });
          }}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '0.5rem',
            padding: '0.75rem 1rem',
            borderRadius: '0.5rem',
            background: 'rgba(255, 255, 255, 0.1)',
            border: '1px solid rgba(255, 215, 0, 0.3)',
            color: 'white',
            cursor: 'pointer',
            transition: 'all 0.3s'
          }}
        >
          <ChevronLeft size={20} />
          Back
        </button>
        <div>
          <h1 style={{ fontSize: '1.75rem', fontWeight: 'bold', color: '#FFD700', margin: 0 }}>
            {filters.exam}
          </h1>
          <p style={{ color: '#D1D5DB', fontSize: '0.875rem', margin: 0 }}>
            Select filters and click Submit to start practice
          </p>
        </div>
      </div>

      {/* Filters Container */}
      <div
        style={{
          padding: "2rem",
          borderRadius: "1rem",
          background: 'rgba(255, 255, 255, 0.05)',
          backdropFilter: 'blur(10px)',
          border: '1px solid rgba(255, 215, 0, 0.2)'
        }}
      >
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '1.5rem' }}>
          {/* Subject Dropdown */}
          {availableSubjects.length > 0 && (
            <div>
              <label style={{ display: "block", fontSize: "0.875rem", fontWeight: '600', color: "#FFD700", marginBottom: "0.75rem" }}>
                Subject
              </label>
              <select
                value={filters.subject}
                onChange={(e) => handleFilterChange('subject', e.target.value)}
                style={{
                  width: "100%",
                  padding: "0.75rem 1rem",
                  borderRadius: "0.5rem",
                  outline: "none",
                  background: 'rgba(255, 255, 255, 0.1)',
                  border: '2px solid rgba(255, 215, 0, 0.3)',
                  color: 'white',
                  cursor: 'pointer'
                }}
              >
                <option value="" style={{ background: '#1a1a4e' }}>All Subjects</option>
                {availableSubjects.map(subject => (
                  <option key={subject} value={subject} style={{ background: '#1a1a4e' }}>
                    {subject}
                  </option>
                ))}
              </select>
            </div>
          )}

          {/* Topic Dropdown */}
          {filteredTopics.length > 0 && (
            <div>
              <label style={{ display: "block", fontSize: "0.875rem", fontWeight: '600', color: "#FFD700", marginBottom: "0.75rem" }}>
                Topic
              </label>
              <select
                value={filters.topic}
                onChange={(e) => handleFilterChange('topic', e.target.value)}
                style={{
                  width: "100%",
                  padding: "0.75rem 1rem",
                  borderRadius: "0.5rem",
                  outline: "none",
                  background: 'rgba(255, 255, 255, 0.1)',
                  border: '2px solid rgba(255, 215, 0, 0.3)',
                  color: 'white',
                  cursor: 'pointer'
                }}
              >
                <option value="" style={{ background: '#1a1a4e' }}>All Topics</option>
                {filteredTopics.map(topic => (
                  <option key={topic.id} value={topic.id} style={{ background: '#1a1a4e' }}>
                    {topic.name}
                  </option>
                ))}
              </select>
            </div>
          )}

          {/* Subtopic Dropdown */}
          {filters.topic && subtopics.length > 0 && (
            <div>
              <label style={{ display: "block", fontSize: "0.875rem", fontWeight: '600', color: "#FFD700", marginBottom: "0.75rem" }}>
                Subtopic
              </label>
              <select
                value={filters.subtopic}
                onChange={(e) => handleFilterChange('subtopic', e.target.value)}
                style={{
                  width: "100%",
                  padding: "0.75rem 1rem",
                  borderRadius: "0.5rem",
                  outline: "none",
                  background: 'rgba(255, 255, 255, 0.1)',
                  border: '2px solid rgba(255, 215, 0, 0.3)',
                  color: 'white',
                  cursor: 'pointer'
                }}
              >
                <option value="" style={{ background: '#1a1a4e' }}>All Subtopics</option>
                {subtopics.map(subtopic => (
                  <option key={subtopic.id} value={subtopic.id} style={{ background: '#1a1a4e' }}>
                    {subtopic.name}
                  </option>
                ))}
              </select>
            </div>
          )}

          {/* Year Dropdown */}
          {availableYears.length > 0 && (
            <div>
              <label style={{ display: "block", fontSize: "0.875rem", fontWeight: '600', color: "#FFD700", marginBottom: "0.75rem" }}>
                Year
              </label>
              <select
                value={filters.year || ''}
                onChange={(e) => handleFilterChange('year', e.target.value ? Number(e.target.value) : null)}
                style={{
                  width: "100%",
                  padding: "0.75rem 1rem",
                  borderRadius: "0.5rem",
                  outline: "none",
                  background: 'rgba(255, 255, 255, 0.1)',
                  border: '2px solid rgba(255, 215, 0, 0.3)',
                  color: 'white',
                  cursor: 'pointer'
                }}
              >
                <option value="" style={{ background: '#1a1a4e' }}>All Years</option>
                {availableYears.map(year => (
                  <option key={year} value={year} style={{ background: '#1a1a4e' }}>
                    {year}
                  </option>
                ))}
              </select>
            </div>
          )}

          {/* Difficulty Dropdown */}
          <div>
            <label style={{ display: "block", fontSize: "0.875rem", fontWeight: '600', color: "#FFD700", marginBottom: "0.75rem" }}>
              Difficulty
            </label>
            <select
              value={filters.difficulty}
              onChange={(e) => handleFilterChange('difficulty', e.target.value)}
              style={{
                width: "100%",
                padding: "0.75rem 1rem",
                borderRadius: "0.5rem",
                outline: "none",
                background: 'rgba(255, 255, 255, 0.1)',
                border: '2px solid rgba(255, 215, 0, 0.3)',
                color: 'white',
                cursor: 'pointer'
              }}
            >
              <option value="" style={{ background: '#1a1a4e' }}>All Difficulties</option>
              <option value="Easy" style={{ background: '#1a1a4e' }}>Easy</option>
              <option value="Medium" style={{ background: '#1a1a4e' }}>Medium</option>
              <option value="Hard" style={{ background: '#1a1a4e' }}>Hard</option>
            </select>
          </div>
        </div>

        {/* Action Buttons */}
        <div style={{ marginTop: '2rem', display: 'flex', gap: '1rem' }}>
          <button
            onClick={startPracticeMode}
            disabled={loading}
            style={{
              flex: 1,
              padding: '1rem 1.5rem',
              borderRadius: '0.5rem',
              fontWeight: '600',
              fontSize: '1rem',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '0.5rem',
              cursor: loading ? 'not-allowed' : 'pointer',
              border: 'none',
              background: loading ? 'rgba(255, 255, 255, 0.1)' : 'linear-gradient(135deg, #FFD700 0%, #FFA500 100%)',
              color: loading ? '#666' : '#1a1a4e',
              transition: 'all 0.3s',
              boxShadow: loading ? 'none' : '0 4px 16px rgba(255, 215, 0, 0.3)'
            }}
          >
            <Play size={20} />
            Start Practice
          </button>

          <button
            onClick={() => {
              setFilters(prev => ({
                ...prev,
                subject: '',
                topic: '',
                subtopic: '',
                year: null,
                difficulty: ''
              }));
            }}
            style={{
              padding: '1rem 1.5rem',
              borderRadius: '0.5rem',
              fontWeight: '600',
              cursor: 'pointer',
              border: '1px solid rgba(255, 215, 0, 0.3)',
              background: 'rgba(255, 255, 255, 0.05)',
              color: 'white',
              transition: 'all 0.3s'
            }}
          >
            Clear Filters
          </button>
        </div>
      </div>
    </div>
  );
