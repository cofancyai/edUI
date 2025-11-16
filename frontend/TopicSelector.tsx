// src/components/dashboard/ExamBot/TopicSelector.tsx

import React from 'react';
import { Topic, TopicIndex } from '../../../types/examBot.types';
import LoadingIndicator from '../shared/LoadingIndicator';

interface TopicSelectorProps {
  topicIndex: TopicIndex | null;
  selectedTopics: string[];
  onSelectTopic: (topicId: string) => void;
  onDeselectTopic: (topicId: string) => void;
  onContinue: () => void;
  isLoading: boolean;
}

const TopicSelector: React.FC<TopicSelectorProps> = ({
  topicIndex,
  selectedTopics,
  onSelectTopic,
  onDeselectTopic,
  onContinue,
  isLoading
}) => {
  if (isLoading) {
    return <LoadingIndicator message="Loading topics..." size="medium" />;
  }

  if (!topicIndex) {
    return (
      <div className="error-message">
        Failed to load topics. Please refresh the page and try again.
      </div>
    );
  }

  const handleTopicClick = (topicId: string) => {
    if (selectedTopics.includes(topicId)) {
      onDeselectTopic(topicId);
    } else {
      onSelectTopic(topicId);
    }
  };

  const countSubtopics = (topic: Topic) => {
    return topic.subtopics.length;
  };

  return (
    <div style={{ padding: '1rem' }}>
      <h2 style={{ 
        color: '#FFF8DC', 
        fontSize: '1.5rem', 
        marginBottom: '1.5rem',
        textAlign: 'center'
      }}>
        Select Topics for Your Test
      </h2>
      
      <div style={{ marginBottom: '1rem' }}>
        <p style={{ color: '#EDEDED', fontSize: '0.9rem', textAlign: 'center' }}>
          Choose one or more topics to include in your test. You can select entire subjects or specific areas to focus on.
        </p>
      </div>
      
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))',
        gap: '1rem',
        marginBottom: '2rem'
      }}>
        {topicIndex.topics.map((topic) => (
          <div
            key={topic.id}
            onClick={() => handleTopicClick(topic.id)}
            style={{
              background: selectedTopics.includes(topic.id)
                ? 'linear-gradient(145deg, rgba(255, 215, 0, 0.15), rgba(255, 215, 0, 0.05))'
                : 'linear-gradient(145deg, #2E1A47, #1a1a4e)',
              border: selectedTopics.includes(topic.id)
                ? '1px solid #FFD700'
                : '1px solid rgba(255, 255, 255, 0.1)',
              borderRadius: '0.75rem',
              padding: '1rem',
              cursor: 'pointer',
              transition: 'all 0.3s ease',
              boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)',
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'space-between',
              height: '100%'
            }}
          >
            <div>
              <h3 style={{ color: selectedTopics.includes(topic.id) ? '#FFD700' : '#FFF8DC', marginBottom: '0.5rem' }}>
                {topic.name}
              </h3>
              <p style={{ color: '#EDEDED', fontSize: '0.85rem', marginBottom: '0.75rem' }}>
                {topic.description}
              </p>
            </div>
            <div style={{ 
              display: 'flex', 
              justifyContent: 'space-between', 
              alignItems: 'center', 
              fontSize: '0.75rem',
              color: '#B19CD9',
              marginTop: '0.5rem'
            }}>
              <span>{countSubtopics(topic)} subtopics</span>
              <span style={{ 
                background: selectedTopics.includes(topic.id) ? '#FFD700' : 'rgba(255, 255, 255, 0.1)',
                color: selectedTopics.includes(topic.id) ? '#2E1A47' : '#EDEDED',
                padding: '0.25rem 0.5rem',
                borderRadius: '0.25rem',
                fontSize: '0.7rem',
                fontWeight: '600'
              }}>
                {selectedTopics.includes(topic.id) ? 'Selected' : 'Select'}
              </span>
            </div>
          </div>
        ))}
      </div>
      
      <div style={{ 
        display: 'flex', 
        justifyContent: 'center',
        marginTop: '1.5rem',
        position: 'sticky',
        bottom: '1rem',
        padding: '1rem 0'
      }}>
        <button
          onClick={onContinue}
          disabled={selectedTopics.length === 0}
          style={{
            padding: '0.75rem 2rem',
            background: selectedTopics.length === 0 
              ? 'rgba(255, 215, 0, 0.3)' 
              : 'linear-gradient(45deg, #B19CD9, #FFD700)',
            color: selectedTopics.length === 0 ? '#999' : '#2E1A47',
            border: 'none',
            borderRadius: '0.5rem',
            fontWeight: '600',
            fontSize: '1rem',
            cursor: selectedTopics.length === 0 ? 'not-allowed' : 'pointer',
            boxShadow: '0 4px 6px rgba(0, 0, 0, 0.2)',
            transition: 'all 0.3s ease',
          }}
        >
          Continue with {selectedTopics.length} selected topic{selectedTopics.length !== 1 ? 's' : ''}
        </button>
      </div>
    </div>
  );
};

export default TopicSelector;