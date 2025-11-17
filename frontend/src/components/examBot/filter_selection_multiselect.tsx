  // Render: Filter Selection Screen (Step 2) - Multi-Select Checkboxes
  const renderFilterSelection = () => (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
      {/* Header with Back Button */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
        <button
          onClick={() => {
            setViewMode('selectExam');
            setFilters({
              exam: '',
              subjects: [],
              topics: [],
              subtopics: [],
              years: [],
              difficulties: []
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
            Select multiple filters (checkboxes) and click Submit
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
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '2rem' }}>
          {/* Subjects Multi-Select */}
          {availableSubjects.length > 0 && (
            <div>
              <h3 style={{ fontSize: '1.125rem', fontWeight: '600', color: '#FFD700', marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <Filter size={20} />
                Subjects ({filters.subjects.length} selected)
              </h3>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', maxHeight: '250px', overflowY: 'auto', paddingRight: '0.5rem' }}>
                {availableSubjects.map(subject => (
                  <label
                    key={subject}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '0.75rem',
                      padding: '0.75rem',
                      borderRadius: '0.5rem',
                      background: filters.subjects.includes(subject) ? 'rgba(255, 215, 0, 0.1)' : 'rgba(255, 255, 255, 0.05)',
                      border: `1px solid ${filters.subjects.includes(subject) ? 'rgba(255, 215, 0, 0.5)' : 'rgba(255, 255, 255, 0.1)'}`,
                      cursor: 'pointer',
                      transition: 'all 0.2s'
                    }}
                  >
                    <input
                      type="checkbox"
                      checked={filters.subjects.includes(subject)}
                      onChange={() => setFilters(prev => ({ ...prev, subjects: toggleArrayItem(prev.subjects, subject) }))}
                      style={{
                        width: '18px',
                        height: '18px',
                        accentColor: '#FFD700',
                        cursor: 'pointer'
                      }}
                    />
                    <span style={{ color: 'white', fontSize: '0.9375rem' }}>{subject}</span>
                  </label>
                ))}
              </div>
            </div>
          )}

          {/* Years Multi-Select */}
          {availableYears.length > 0 && (
            <div>
              <h3 style={{ fontSize: '1.125rem', fontWeight: '600', color: '#FFD700', marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <Calendar size={20} />
                Years ({filters.years.length} selected)
              </h3>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', maxHeight: '250px', overflowY: 'auto', paddingRight: '0.5rem' }}>
                {availableYears.map(year => (
                  <label
                    key={year}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '0.75rem',
                      padding: '0.75rem',
                      borderRadius: '0.5rem',
                      background: filters.years.includes(year) ? 'rgba(255, 215, 0, 0.1)' : 'rgba(255, 255, 255, 0.05)',
                      border: `1px solid ${filters.years.includes(year) ? 'rgba(255, 215, 0, 0.5)' : 'rgba(255, 255, 255, 0.1)'}`,
                      cursor: 'pointer',
                      transition: 'all 0.2s'
                    }}
                  >
                    <input
                      type="checkbox"
                      checked={filters.years.includes(year)}
                      onChange={() => setFilters(prev => ({ ...prev, years: toggleArrayItem(prev.years, year) }))}
                      style={{
                        width: '18px',
                        height: '18px',
                        accentColor: '#FFD700',
                        cursor: 'pointer'
                      }}
                    />
                    <span style={{ color: 'white', fontSize: '0.9375rem' }}>{year}</span>
                  </label>
                ))}
              </div>
            </div>
          )}

          {/* Difficulty Multi-Select */}
          <div>
            <h3 style={{ fontSize: '1.125rem', fontWeight: '600', color: '#FFD700', marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <TrendingUp size={20} />
              Difficulty ({filters.difficulties.length} selected)
            </h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
              {['Easy', 'Medium', 'Hard'].map(difficulty => (
                <label
                  key={difficulty}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.75rem',
                    padding: '0.75rem',
                    borderRadius: '0.5rem',
                    background: filters.difficulties.includes(difficulty) ? 'rgba(255, 215, 0, 0.1)' : 'rgba(255, 255, 255, 0.05)',
                    border: `1px solid ${filters.difficulties.includes(difficulty) ? 'rgba(255, 215, 0, 0.5)' : 'rgba(255, 255, 255, 0.1)'}`,
                    cursor: 'pointer',
                    transition: 'all 0.2s'
                  }}
                >
                  <input
                    type="checkbox"
                    checked={filters.difficulties.includes(difficulty)}
                    onChange={() => setFilters(prev => ({ ...prev, difficulties: toggleArrayItem(prev.difficulties, difficulty) }))}
                    style={{
                      width: '18px',
                      height: '18px',
                      accentColor: '#FFD700',
                      cursor: 'pointer'
                    }}
                  />
                  <span style={{ color: 'white', fontSize: '0.9375rem' }}>{difficulty}</span>
                </label>
              ))}
            </div>
          </div>
        </div>

        {/* Selected Filters Summary */}
        {(filters.subjects.length > 0 || filters.years.length > 0 || filters.difficulties.length > 0) && (
          <div style={{ marginTop: '2rem', padding: '1rem', borderRadius: '0.5rem', background: 'rgba(255, 215, 0, 0.05)', border: '1px solid rgba(255, 215, 0, 0.2)' }}>
            <h4 style={{ fontSize: '0.875rem', fontWeight: '600', color: '#FFD700', marginBottom: '0.75rem' }}>Selected Filters:</h4>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem' }}>
              {filters.subjects.map(subject => (
                <span key={subject} style={{ padding: '0.25rem 0.75rem', borderRadius: '9999px', fontSize: '0.875rem', background: 'rgba(255, 215, 0, 0.2)', color: 'white', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  {subject}
                  <X
                    size={14}
                    onClick={() => setFilters(prev => ({ ...prev, subjects: prev.subjects.filter(s => s !== subject) }))}
                    style={{ cursor: 'pointer' }}
                  />
                </span>
              ))}
              {filters.years.map(year => (
                <span key={year} style={{ padding: '0.25rem 0.75rem', borderRadius: '9999px', fontSize: '0.875rem', background: 'rgba(255, 215, 0, 0.2)', color: 'white', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  {year}
                  <X
                    size={14}
                    onClick={() => setFilters(prev => ({ ...prev, years: prev.years.filter(y => y !== year) }))}
                    style={{ cursor: 'pointer' }}
                  />
                </span>
              ))}
              {filters.difficulties.map(difficulty => (
                <span key={difficulty} style={{ padding: '0.25rem 0.75rem', borderRadius: '9999px', fontSize: '0.875rem', background: 'rgba(255, 215, 0, 0.2)', color: 'white', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  {difficulty}
                  <X
                    size={14}
                    onClick={() => setFilters(prev => ({ ...prev, difficulties: prev.difficulties.filter(d => d !== difficulty) }))}
                    style={{ cursor: 'pointer' }}
                  />
                </span>
              ))}
            </div>
          </div>
        )}

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
              setFilters(prev => ({ ...prev, subjects: [], years: [], difficulties: [] }));
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

