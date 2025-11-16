import { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { 
  ArrowLeft, Key, Plus, Edit, Trash2, 
  Check, X, LogOut, Database, Server, Shield, 
  Cloud, Globe, Eye, EyeOff, FileText, Upload, 
  AlertCircle, Users, Video, DollarSign, TrendingUp
} from 'lucide-react';
import { createClient } from '@supabase/supabase-js';
import { Tutor as TutorType } from '../../types/tutor.types';

// Assuming supabaseClient is configured in a separate file
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;
const supabase = createClient(supabaseUrl, supabaseAnonKey);

// Singleton Supabase service client for admin operations
let supabaseServiceClient: any = null;

const getServiceClient = () => {
  if (supabaseServiceClient) {
    return supabaseServiceClient;
  }
  
  const supabaseServiceKey = import.meta.env.VITE_SUPABASE_SERVICE_ROLE_KEY;
  if (!supabaseServiceKey) {
    throw new Error('Service role key is missing');
  }
  
  supabaseServiceClient = createClient(supabaseUrl, supabaseServiceKey);
  return supabaseServiceClient;
};

// Type definitions
type CredentialCategory = 'api_keys' | 'service_credentials' | 'endpoint_credentials' | 'questions' | 'aptitude_questions' | 'mock_test' | 'tutor_management';
type CredentialType = 'api_key' | 'oauth' | 'service_account' | 'endpoint' | 'database' | 'cloud';

interface Credential {
  id: string;
  name: string;
  type: CredentialType;
  category: CredentialCategory;
  description: string;
  config: any;
  is_encrypted: boolean;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

interface ApiKeyForm {
  key: string;
  environment?: string;
}

interface ServiceAccountForm {
  client_id?: string;
  client_secret?: string;
  api_key?: string;
  project_id?: string;
  private_key?: string;
  service_type?: string;
}

interface EndpointForm {
  url: string;
  method: string;
  headers?: Record<string, string>;
  params?: Record<string, string>;
}

type CredentialForm = ApiKeyForm | ServiceAccountForm | EndpointForm;

interface TopicStats {
  topic_id: string;
  topic: string;
  count: number;
  percentage: number;
}

interface Tutor {
  id: string;
  name: string;
  username: string;
  mobile_number: string;
  education_qualification: string;
  degree: string;
  master_degree: string;
  phd: boolean;
  working_experience: string;
  documents_url: string;
  is_approved: boolean;
  is_active: boolean;
  created_at: string;
  updated_at: string;
  email: string;
  education: string;
  experience: string;
  documents: Array<{ url: string }>;
  status: 'pending' | 'approved' | 'rejected';
  video_count: number;
  student_count: number;
  earnings: number;
}

interface TutorStats {
  totalTutors: number;
  pendingApprovals: number;
  approvedTutors: number;
  totalVideos: number;
}

interface PlatformStats {
  totalRevenue: number;
  liveClasses: number;
}

interface MockTest {
  mock_test_number: number;
  total_questions: number;
  time_limit_minutes: number;
  topic_distribution: Record<string, { percentage: number; question_count: number; topic_name: string }>;
}

const AdminDashboard = () => {
  const navigate = useNavigate();

  // State declarations
  const [activeTab, setActiveTab] = useState<CredentialCategory>('api_keys');
  const [activeQuestionsTab, setActiveQuestionsTab] = useState<'questions' | 'topics'>('questions');
  const [credentials, setCredentials] = useState<Credential[]>([]);
  const [credentialForm, setCredentialForm] = useState<{
    name: string;
    type: CredentialType;
    description: string;
    config: CredentialForm;
    is_active: boolean;
  }>({
    name: '',
    type: 'api_key',
    description: '',
    config: { key: '' },
    is_active: true,
  });
  const [showModal, setShowModal] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [currentCredential, setCurrentCredential] = useState<Credential | null>(null);
  const [showSensitive, setShowSensitive] = useState<Record<string, boolean>>({});
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [credentialToDelete, setCredentialToDelete] = useState<string | null>(null);
  const [showTutorModal, setShowTutorModal] = useState(false);
  const [currentTutor, setCurrentTutor] = useState<Tutor | null>(null);
  const [fileUploads, setFileUploads] = useState<File[]>([]);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadResults, setUploadResults] = useState<{
    success: number;
    errors: number;
    messages: string[];
  }>({ success: 0, errors: 0, messages: [] });
  const [allTutors, setAllTutors] = useState<Tutor[]>([]);
  const [tutorSearch, setTutorSearch] = useState('');
  const [tutorFilter, setTutorFilter] = useState<{
    status: string;
    subject: string;
  }>({ status: 'all', subject: '' });
  const [subjectOptions, setSubjectOptions] = useState<string[]>([]);
  const [pendingTutorCount, setPendingTutorCount] = useState(0);
  const [tutorStats, setTutorStats] = useState<TutorStats>({
    totalTutors: 0,
    pendingApprovals: 0,
    approvedTutors: 0,
    totalVideos: 0,
  });
  const [platformStats, setPlatformStats] = useState<PlatformStats>({
    totalRevenue: 0,
    liveClasses: 0,
  });
  const [topicStats, setTopicStats] = useState<TopicStats[]>([]);
  const [totalQuestions, setTotalQuestions] = useState(0);
  const [topicWeightage, setTopicWeightage] = useState<Record<string, number>>({});
  const [questionsPerTest, setQuestionsPerTest] = useState(10);
  const [generatedMockTests, setGeneratedMockTests] = useState<MockTest[]>([]);
  const [isEditingWeightage, setIsEditingWeightage] = useState(false);

  // Helper functions
  const isCredentialCategory = (tab: string): tab is CredentialCategory => {
    return ['api_keys', 'service_credentials', 'endpoint_credentials', 'questions', 'aptitude_questions', 'mock_test', 'tutor_management'].includes(tab);
  };

  const handleTabChange = (tab: CredentialCategory) => {
    setActiveTab(tab);
    if (tab !== 'mock_test' && tab !== 'tutor_management') {
      loadCredentials();
    }
  };

  const handleOpenModal = (credential?: Credential) => {
    if (credential) {
      setCurrentCredential(credential);
      setCredentialForm({
        name: credential.name,
        type: credential.type,
        description: credential.description,
        config: credential.config,
        is_active: credential.is_active,
      });
    } else {
      setCurrentCredential(null);
      setCredentialForm({
        name: '',
        type: activeTab === 'api_keys' ? 'api_key' : activeTab === 'service_credentials' ? 'service_account' : 'endpoint',
        description: '',
        config: activeTab === 'endpoint_credentials' ? { url: '', method: 'GET' } : { key: '' },
        is_active: true,
      });
    }
    setShowModal(true);
  };

  const handleConfigChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setCredentialForm(prev => ({
      ...prev,
      config: { ...prev.config, [name]: value },
    }));
  };

  const handleHeaderChange = (index: number, field: 'key' | 'value', value: string) => {
    const headers = { ...(credentialForm.config as EndpointForm).headers || {} };
    const entries = Object.entries(headers);
    const key = entries[index][0];
    if (field === 'key') {
      const newHeaders = { ...headers };
      delete newHeaders[key];
      newHeaders[value] = entries[index][1];
      setCredentialForm(prev => ({
        ...prev,
        config: { ...prev.config, headers: newHeaders },
      }));
    } else {
      headers[key] = value;
      setCredentialForm(prev => ({
        ...prev,
        config: { ...prev.config, headers },
      }));
    }
  };

  const addHeader = () => {
    setCredentialForm(prev => ({
      ...prev,
      config: {
        ...prev.config,
        headers: { ...(prev.config as EndpointForm).headers || {}, ['']: '' },
      },
    }));
  };

  const removeHeader = (key: string) => {
    const headers = { ...(credentialForm.config as EndpointForm).headers || {} };
    delete headers[key];
    setCredentialForm(prev => ({
      ...prev,
      config: { ...prev.config, headers },
    }));
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      setFileUploads(Array.from(e.target.files));
    }
  };

  const handleFileUpload = async () => {
  if (fileUploads.length === 0) return;
  setIsUploading(true);
  setUploadProgress(0);
  setUploadResults({ success: 0, errors: 0, messages: [] });

  try {
    let successCount = 0;
    let errorCount = 0;
    const messages: string[] = [];

    for (let i = 0; i < fileUploads.length; i++) {
      const file = fileUploads[i];
      try {
        const text = await file.text();
        const jsonData = JSON.parse(text);
        
        // Remove the .slice(0, 1) - upload ALL questions
        const questionsArray = Array.isArray(jsonData) ? jsonData : [jsonData];
        
        // Extract unique topics and subtopics
        const topicsSet = new Set();
        const subtopicsSet = new Set();
        
        questionsArray.forEach((q: any) => {
          if (q.topic_id && q.topic) {
            topicsSet.add(JSON.stringify({
              id: q.topic_id,
              name: q.topic,
              description: `${q.topic} questions`
            }));
          }
          if (q.subtopic_id && q.subtopic && q.topic_id) {
            subtopicsSet.add(JSON.stringify({
              id: q.subtopic_id,
              topic_id: q.topic_id,
              name: q.subtopic,
              file: file.name.replace('.json', '')
            }));
          }
        });
        
        // Insert topics first
        if (topicsSet.size > 0) {
          const topics = Array.from(topicsSet).map(t => JSON.parse(t as string));
          await supabase.from('topics').upsert(topics, { onConflict: 'id' });
        }
        
        // Insert subtopics
        if (subtopicsSet.size > 0) {
          const subtopics = Array.from(subtopicsSet).map(s => JSON.parse(s as string));
          await supabase.from('subtopics').upsert(subtopics, { onConflict: 'id' });
        }
        
        // Upload ALL questions
        await supabase.from('questions').upsert(questionsArray, { onConflict: 'id' });
        
        successCount++;
        messages.push(`Successfully uploaded ${questionsArray.length} questions from ${file.name}`);
      } catch (error) {
        errorCount++;
        messages.push(`Failed to upload ${file.name}: ${error instanceof Error ? error.message : 'Unknown error'}`);
      }
      setUploadProgress(((i + 1) / fileUploads.length) * 100);
    }

    setUploadResults({ success: successCount, errors: errorCount, messages });
  } catch (error) {
    console.error('Upload error:', error);
  } finally {
    setIsUploading(false);
    setFileUploads([]);
  }
};

  const handleWeightageChange = (topicId: string, value: string) => {
    setTopicWeightage(prev => ({
      ...prev,
      [topicId]: parseInt(value) || 0,
    }));
  };

  const getTotalWeightage = () => {
    return Object.values(topicWeightage).reduce((sum, weight) => sum + weight, 0);
  };

  const handleGenerateTests = async () => {
    if (getTotalWeightage() !== 100) {
      alert('Topic weightage must total 100%');
      return;
    }
    setIsLoading(true);
    try {
      const numTests = Math.ceil(totalQuestions / questionsPerTest);
      const topicDistribution: Record<string, { percentage: number; question_count: number; topic_name: string }> = {};
      topicStats.forEach(topic => {
        topicDistribution[topic.topic_id] = {
          percentage: topicWeightage[topic.topic_id] || 0,
          question_count: Math.floor(questionsPerTest * (topicWeightage[topic.topic_id] || 0) / 100),
          topic_name: topic.topic,
        };
      });

      const response = await supabase.from('mock_tests').insert(
        Array.from({ length: numTests }, (_, i) => ({
          mock_test_number: i + 1,
          total_questions: questionsPerTest,
          time_limit_minutes: 120,
          topic_distribution: topicDistribution,
        }))
      );

      if (response.error) throw response.error;
      alert(`Generated ${numTests} mock tests successfully!`);
      await loadMockTests();
    } catch (error) {
      console.error('Error generating tests:', error);
      alert(`Failed to generate tests: ${error instanceof Error ? error.message : String(error)}`);
    } finally {
      setIsLoading(false);
    }
  };

  const handleUpdateWeightage = async () => {
    if (getTotalWeightage() !== 100) {
      alert(`Topic weightage must total 100%. Current total: ${getTotalWeightage()}%`);
      return;
    }
    setIsLoading(true);
    try {
      const topicDistribution: Record<string, { percentage: number; question_count: number; topic_name: string }> = {};
      topicStats.forEach(topic => {
        topicDistribution[topic.topic_id] = {
          percentage: topicWeightage[topic.topic_id] || 0,
          question_count: Math.floor(questionsPerTest * (topicWeightage[topic.topic_id] || 0) / 100),
          topic_name: topic.topic,
        };
      });

      const { error } = await supabase
        .from('mock_tests')
        .update({ topic_distribution: topicDistribution })
        .neq('mock_test_number', -1);

      if (error) throw error;
      setIsEditingWeightage(false);
      alert('Weightage updated for all tests successfully!');
      await loadMockTests();
    } catch (error) {
      console.error('Error updating weightage:', error);
      alert(`Failed to update weightage: ${error instanceof Error ? error.message : String(error)}`);
    } finally {
      setIsLoading(false);
    }
  };

  const handleDeleteAllData = async () => {
    if (!confirm('Are you sure? This will delete ALL questions and mock tests. This action cannot be undone.')) {
      return;
    }
    setIsLoading(true);
    try {
      await supabase.from('mock_test_questions').delete().neq('mock_test_number', -1);
      await supabase.from('mock_test_configurations').delete().neq('mock_test_number', -1);
      await supabase.from('questions').delete().neq('exam', '');
      alert('All data deleted successfully');
      setTotalQuestions(0);
      setTopicStats([]);
      setTopicWeightage({});
      setGeneratedMockTests([]);
    } catch (error) {
      console.error('Error deleting data:', error);
      alert(`Failed to delete data: ${error instanceof Error ? error.message : String(error)}`);
    } finally {
      setIsLoading(false);
    }
  };

  const handleViewTutorDetails = (tutor: Tutor) => {
    setCurrentTutor(tutor);
    setShowTutorModal(true);
  };

  const handleTutorApproval = async (tutorId: string, status: 'approved' | 'rejected') => {
  setIsLoading(true);
  try {
    const { error } = await supabase
      .from('tutors')
      .update({ 
        is_approved: status === 'approved',
        updated_at: new Date().toISOString()
      })
      .eq('id', tutorId);
    if (error) throw error;
    alert(`Tutor ${status} successfully`);
    await loadTutors();
  } catch (error) {
    console.error('Error updating tutor status:', error);
    alert(`Failed to update tutor status: ${error instanceof Error ? error.message : String(error)}`);
  } finally {
    setIsLoading(false);
  }
};

  const handleToggleTutorStatus = async (tutorId: string, isActive: boolean) => {
    setIsLoading(true);
    try {
      const { error } = await supabase
        .from('tutors')
        .update({ is_active: isActive })
        .eq('id', tutorId);
      if (error) throw error;
      alert(`Tutor ${isActive ? 'activated' : 'deactivated'} successfully`);
      await loadTutors();
    } catch (error) {
      console.error('Error toggling tutor status:', error);
      alert(`Failed to toggle tutor status: ${error instanceof Error ? error.message : String(error)}`);
    } finally {
      setIsLoading(false);
    }

    alert('Toggle status feature not available - is_active column does not exist');

  };

  const handleSendNotification = async (tutorId: string) => {
    // Placeholder for notification logic
    alert(`Notification sent to tutor ${tutorId}`);
  };

  const handleLogout = () => {
    // Implement logout logic
    supabase.auth.signOut().then(() => {
      navigate('/login');
    });
  };

  const loadCredentials = async () => {
    setIsLoading(true);
    try {
      const { data, error } = await getServiceClient().from('credentials').select('*').eq('category', activeTab);
      if (error) throw error;
      setCredentials(data || []);
    } catch (err) {
      console.error('Error loading credentials:', err);
      alert(`Failed to load credentials: ${err instanceof Error ? err.message : String(err)}`);
    } finally {
      setIsLoading(false);
    }
  };

  const loadTutors = async () => {
    setIsLoading(true);
    try {
      const { data, error } = await supabase.from('tutors').select('*');
      if (error) throw error;
      const tutors = data || [];
      
      // Map database tutors to match the interface expectations
      const mappedTutors = tutors.map(t => ({
        ...t,
        email: t.email || '',
        education: t.education_qualification || '',
        experience: t.working_experience || '',
        documents: t.documents_url ? [{ url: t.documents_url }] : [],
        status: t.is_approved === true ? 'approved' : (t.is_approved === false ? 'rejected' : 'pending'),
        video_count: 0,
        student_count: 0,
        earnings: 0,
        is_active: t.is_active ?? true
      }));
      console.log('First tutor document URL:', mappedTutors[0]?.documents_url);
      setAllTutors(mappedTutors);
      setPendingTutorCount(mappedTutors.filter((t: Tutor) => !t.is_approved).length);
      setTutorStats({
        totalTutors: mappedTutors.length,
        pendingApprovals: mappedTutors.filter((t: Tutor) => !t.is_approved).length,
        approvedTutors: mappedTutors.filter((t: Tutor) => t.is_approved).length,
        totalVideos: mappedTutors.reduce((sum: number, t: Tutor) => sum + (t.video_count || 0), 0),
      });
    } catch (error) {
      console.error('Error loading tutors:', error);
      alert(`Failed to load tutors: ${error instanceof Error ? error.message : String(error)}`);
    } finally {
      setIsLoading(false);
    }
  };

  const loadQuestionsData = async () => {
    setIsLoading(true);
    try {
      const { data: questions, error: qError } = await supabase.from('questions').select('*');
      if (qError) throw qError;
      const total = questions.length;
      setTotalQuestions(total);

      const topicCounts: Record<string, number> = {};
      questions.forEach((q: any) => {
        topicCounts[q.topic_id] = (topicCounts[q.topic_id] || 0) + 1;
      });

      const stats = Object.entries(topicCounts).map(([topic_id, count]) => ({
        topic_id,
        topic: topic_id,
        count,
        percentage: (count / total) * 100,
      }));
      setTopicStats(stats);

      const weightage: Record<string, number> = {};
      stats.forEach(stat => {
        weightage[stat.topic_id] = Math.round(stat.percentage);
      });
      setTopicWeightage(weightage);
    } catch (error) {
      console.error('Error loading questions:', error);
      alert(`Failed to load questions: ${error instanceof Error ? error.message : String(error)}`);
    } finally {
      setIsLoading(false);
    }
  };

  const loadMockTests = async () => {
    setIsLoading(true);
    try {
      const { data, error } = await supabase.from('mock_tests').select('*');
      if (error) throw error;
      setGeneratedMockTests(data || []);
    } catch (error) {
      console.error('Error loading mock tests:', error);
      alert(`Failed to load mock tests: ${error instanceof Error ? error.message : String(error)}`);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSaveCredential = async () => {
    if (!credentialForm.name.trim()) {
      alert('Please enter a name for the credential');
      return;
    }

    setIsLoading(true);
    try {
      const credentialData = {
        name: credentialForm.name.trim(),
        type: credentialForm.type,
        category: activeTab,
        description: credentialForm.description,
        config: credentialForm.config,
        is_encrypted: shouldEncrypt(credentialForm.type),
        is_active: credentialForm.is_active,
      };

      if (currentCredential) {
        const { error } = await getServiceClient()
          .from('credentials')
          .update({
            ...credentialData,
            updated_at: new Date().toISOString(),
          })
          .eq('id', currentCredential.id);
        if (error) throw error;
        alert('Credential updated successfully');
      } else {
        const { error } = await getServiceClient()
          .from('credentials')
          .insert([credentialData]);
        if (error) throw error;
        alert('Credential added successfully');
      }

      setShowModal(false);
      loadCredentials();
    } catch (err) {
      console.error('Error saving credential:', err);
      alert(`Failed to save credential: ${err instanceof Error ? err.message : String(err)}`);
    } finally {
      setIsLoading(false);
    }
  };

  const shouldEncrypt = (type: CredentialType): boolean => {
    return ['api_key', 'oauth', 'service_account'].includes(type);
  };

  const handleDeleteCredential = (id: string) => {
    setCredentialToDelete(id);
    setShowDeleteConfirm(true);
  };

  const confirmDeleteCredential = async () => {
    if (!credentialToDelete) return;
    setIsLoading(true);
    try {
      const { error } = await getServiceClient()
        .from('credentials')
        .delete()
        .eq('id', credentialToDelete);
      if (error) throw error;
      alert('Credential deleted successfully');
      setShowDeleteConfirm(false);
      setCredentialToDelete(null);
      loadCredentials();
    } catch (err) {
      console.error('Error deleting credential:', err);
      alert(`Failed to delete credential: ${err instanceof Error ? err.message : String(err)}`);
    } finally {
      setIsLoading(false);
    }
  };

  const toggleActiveStatus = async (id: string, currentStatus: boolean) => {
    setIsLoading(true);
    try {
      const { error } = await getServiceClient()
        .from('credentials')
        .update({
          is_active: !currentStatus,
          updated_at: new Date().toISOString(),
        })
        .eq('id', id);
      if (error) throw error;
      alert(`Credential ${currentStatus ? 'deactivated' : 'activated'} successfully`);
      loadCredentials();
    } catch (err) {
      console.error('Error toggling credential status:', err);
      alert(`Failed to update credential status: ${err instanceof Error ? err.message : String(err)}`);
    } finally {
      setIsLoading(false);
    }
  };

  const toggleShowSensitive = (id: string) => {
    setShowSensitive(prev => ({
      ...prev,
      [id]: !prev[id],
    }));
  };

  const getCredentialIcon = (type: CredentialType) => {
    switch (type) {
      case 'api_key': return <Key size={16} />;
      case 'oauth': return <Shield size={16} />;
      case 'service_account': return <Server size={16} />;
      case 'endpoint': return <Globe size={16} />;
      case 'database': return <Database size={16} />;
      case 'cloud': return <Cloud size={16} />;
      default: return <Key size={16} />;
    }
  };

  const maskSensitiveData = (text: string) => {
    if (!text) return '';
    if (text.length <= 8) return 'â€¢â€¢â€¢â€¢â€¢â€¢â€¢â€¢';
    return text.substring(0, 4) + 'â€¢â€¢â€¢â€¢â€¢â€¢â€¢â€¢' + text.substring(text.length - 4);
  };

  const renderCredentialValuePreview = (credential: Credential) => {
    const isVisible = showSensitive[credential.id];
    switch (credential.type) {
      case 'api_key':
        return (
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <span>{isVisible ? credential.config.key : maskSensitiveData(credential.config.key)}</span>
            <button
              onClick={() => toggleShowSensitive(credential.id)}
              style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#94a3b8' }}
            >
              {isVisible ? <EyeOff size={16} /> : <Eye size={16} />}
            </button>
          </div>
        );
      case 'service_account':
        return <div>{Object.keys(credential.config).length} fields</div>;
      case 'endpoint':
        return <div>{credential.config.url}</div>;
      default:
        return <span>â€”</span>;
    }
  };

  const renderConfigForm = () => {
    switch (credentialForm.type) {
      case 'api_key':
        return (
          <div>
            <div style={{ marginBottom: '1rem' }}>
              <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 500, color: '#cbd5e1' }}>
                API Key *
              </label>
              <input
                type="password"
                name="key"
                value={(credentialForm.config as ApiKeyForm).key || ''}
                onChange={handleConfigChange}
                style={{
                  width: '100%',
                  padding: '0.75rem',
                  backgroundColor: '#111827',
                  color: '#f9fafb',
                  border: '1px solid #4b5563',
                  borderRadius: '0.5rem',
                  fontSize: '0.9rem',
                }}
                required
              />
            </div>
            <div style={{ marginBottom: '1rem' }}>
              <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 500, color: '#cbd5e1' }}>
                Environment
              </label>
              <input
                type="text"
                name="environment"
                value={(credentialForm.config as ApiKeyForm).environment || ''}
                onChange={handleConfigChange}
                style={{
                  width: '100%',
                  padding: '0.75rem',
                  backgroundColor: '#111827',
                  color: '#f9fafb',
                  border: '1px solid #4b5563',
                  borderRadius: '0.5rem',
                  fontSize: '0.9rem',
                }}
                placeholder="production, development, etc."
              />
            </div>
          </div>
        );
      case 'service_account':
        return (
          <div>
            <div style={{ marginBottom: '1rem' }}>
              <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 500, color: '#cbd5e1' }}>
                Service Type
              </label>
              <input
                type="text"
                name="service_type"
                value={(credentialForm.config as ServiceAccountForm).service_type || ''}
                onChange={handleConfigChange}
                style={{
                  width: '100%',
                  padding: '0.75rem',
                  backgroundColor: '#111827',
                  color: '#f9fafb',
                  border: '1px solid #4b5563',
                  borderRadius: '0.5rem',
                  fontSize: '0.9rem',
                }}
                placeholder="Google Cloud, AWS, Azure, etc."
              />
            </div>
            <div style={{ marginBottom: '1rem' }}>
              <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 500, color: '#cbd5e1' }}>
                Project ID
              </label>
              <input
                type="text"
                name="project_id"
                value={(credentialForm.config as ServiceAccountForm).project_id || ''}
                onChange={handleConfigChange}
                style={{
                  width: '100%',
                  padding: '0.75rem',
                  backgroundColor: '#111827',
                  color: '#f9fafb',
                  border: '1px solid #4b5563',
                  borderRadius: '0.5rem',
                  fontSize: '0.9rem',
                }}
              />
            </div>
            <div style={{ marginBottom: '1rem' }}>
              <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 500, color: '#cbd5e1' }}>
                Client ID
              </label>
              <input
                type="text"
                name="client_id"
                value={(credentialForm.config as ServiceAccountForm).client_id || ''}
                onChange={handleConfigChange}
                style={{
                  width: '100%',
                  padding: '0.75rem',
                  backgroundColor: '#111827',
                  color: '#f9fafb',
                  border: '1px solid #4b5563',
                  borderRadius: '0.5rem',
                  fontSize: '0.9rem',
                }}
              />
            </div>
            <div style={{ marginBottom: '1rem' }}>
              <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 500, color: '#cbd5e1' }}>
                Client Secret
              </label>
              <input
                type="password"
                name="client_secret"
                value={(credentialForm.config as ServiceAccountForm).client_secret || ''}
                onChange={handleConfigChange}
                style={{
                  width: '100%',
                  padding: '0.75rem',
                  backgroundColor: '#111827',
                  color: '#f9fafb',
                  border: '1px solid #4b5563',
                  borderRadius: '0.5rem',
                  fontSize: '0.9rem',
                }}
              />
            </div>
            <div style={{ marginBottom: '1rem' }}>
              <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 500, color: '#cbd5e1' }}>
                API Key
              </label>
              <input
                type="password"
                name="api_key"
                value={(credentialForm.config as ServiceAccountForm).api_key || ''}
                onChange={handleConfigChange}
                style={{
                  width: '100%',
                  padding: '0.75rem',
                  backgroundColor: '#111827',
                  color: '#f9fafb',
                  border: '1px solid #4b5563',
                  borderRadius: '0.5rem',
                  fontSize: '0.9rem',
                }}
              />
            </div>
            <div style={{ marginBottom: '1rem' }}>
              <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 500, color: '#cbd5e1' }}>
                Private Key
              </label>
              <textarea
                name="private_key"
                value={(credentialForm.config as ServiceAccountForm).private_key || ''}
                onChange={handleConfigChange}
                style={{
                  width: '100%',
                  padding: '0.75rem',
                  backgroundColor: '#111827',
                  color: '#f9fafb',
                  border: '1px solid #4b5563',
                  borderRadius: '0.5rem',
                  fontSize: '0.9rem',
                  minHeight: '100px',
                  resize: 'vertical',
                }}
                placeholder="-----BEGIN PRIVATE KEY-----"
              />
            </div>
          </div>
        );
      case 'endpoint':
        const config = credentialForm.config as EndpointForm;
        const headers = config.headers || {};
        const headerEntries = Object.entries(headers);
        return (
          <div>
            <div style={{ marginBottom: '1rem' }}>
              <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 500, color: '#cbd5e1' }}>
                URL *
              </label>
              <input
                type="text"
                name="url"
                value={config.url || ''}
                onChange={handleConfigChange}
                style={{
                  width: '100%',
                  padding: '0.75rem',
                  backgroundColor: '#111827',
                  color: '#f9fafb',
                  border: '1px solid #4b5563',
                  borderRadius: '0.5rem',
                  fontSize: '0.9rem',
                }}
                placeholder="https://api.example.com/v1"
                required
              />
            </div>
            <div style={{ marginBottom: '1rem' }}>
              <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 500, color: '#cbd5e1' }}>
                Method
              </label>
              <select
                name="method"
                value={config.method || 'GET'}
                onChange={handleConfigChange}
                style={{
                  width: '100%',
                  padding: '0.75rem',
                  backgroundColor: '#111827',
                  color: '#f9fafb',
                  border: '1px solid #4b5563',
                  borderRadius: '0.5rem',
                  fontSize: '0.9rem',
                }}
              >
                <option value="GET">GET</option>
                <option value="POST">POST</option>
                <option value="PUT">PUT</option>
                <option value="DELETE">DELETE</option>
                <option value="PATCH">PATCH</option>
              </select>
            </div>
            <div style={{ marginBottom: '1rem' }}>
              <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 500, color: '#cbd5e1' }}>
                Headers
              </label>
              {headerEntries.length > 0 ? (
                <div style={{ marginBottom: '1rem' }}>
                  {headerEntries.map(([key, value], index) => (
                    <div key={`header-${index}`} style={{ display: 'flex', gap: '0.5rem', marginBottom: '0.5rem' }}>
                      <input
                        type="text"
                        value={key}
                        onChange={(e) => handleHeaderChange(index, 'key', e.target.value)}
                        style={{
                          width: '40%',
                          padding: '0.5rem',
                          backgroundColor: '#111827',
                          color: '#f9fafb',
                          border: '1px solid #4b5563',
                          borderRadius: '0.5rem',
                          fontSize: '0.9rem',
                        }}
                        placeholder="Header name"
                      />
                      <input
                        type={key.toLowerCase().includes('key') || key.toLowerCase().includes('token') ? 'password' : 'text'}
                        value={value}
                        onChange={(e) => handleHeaderChange(index, 'value', e.target.value)}
                        style={{
                          width: '60%',
                          padding: '0.5rem',
                          backgroundColor: '#111827',
                          color: '#f9fafb',
                          border: '1px solid #4b5563',
                          borderRadius: '0.5rem',
                          fontSize: '0.9rem',
                        }}
                        placeholder="Value"
                      />
                      <button
                        type="button"
                        onClick={() => removeHeader(key)}
                        style={{
                          background: 'rgba(239, 68, 68, 0.1)',
                          color: '#ef4444',
                          border: '1px solid rgba(239, 68, 68, 0.3)',
                          borderRadius: '0.25rem',
                          width: '2rem',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                        }}
                      >
                        <X size={16} />
                      </button>
                    </div>
                  ))}
                </div>
              ) : (
                <div style={{ marginBottom: '1rem', color: '#94a3b8', fontSize: '0.9rem' }}>
                  No headers defined
                </div>
              )}
              <button
                type="button"
                onClick={addHeader}
                style={{
                  padding: '0.5rem 1rem',
                  background: 'rgba(59, 130, 246, 0.1)',
                  color: '#60a5fa',
                  border: '1px solid rgba(59, 130, 246, 0.3)',
                  borderRadius: '0.375rem',
                }}
              >
                <Plus size={16} /> Add Header
              </button>
            </div>
          </div>
        );
      default:
        return (
          <div style={{ color: '#94a3b8', padding: '1rem', textAlign: 'center' }}>
            Please select a credential type
          </div>
        );
    }
  };

  // Styles
  const dashboardStyle: React.CSSProperties = {
    minHeight: '100vh',
    background: 'linear-gradient(135deg, #1e293b 0%, #0f172a 100%)',
    color: '#f8fafc',
    fontFamily: 'Inter, sans-serif',
  };

  const headerStyle: React.CSSProperties = {
    backgroundColor: '#0f172a',
    padding: '1.5rem 2rem',
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    boxShadow: '0 2px 4px rgba(0,0,0,0.2)',
  };

  const contentStyle: React.CSSProperties = {
    padding: '2rem',
    maxWidth: '1400px',
    margin: '0 auto',
    width: '100%',
  };

  const tabBarStyle: React.CSSProperties = {
    display: 'flex',
    gap: '2rem',
    paddingBottom: '1rem',
    borderBottom: '1px solid #334155',
    marginBottom: '2rem',
  };

  const tabStyle: React.CSSProperties = {
    padding: '0.75rem 1.5rem',
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    gap: '0.75rem',
    color: '#94a3b8',
    fontWeight: 500,
    transition: 'all 0.3s ease',
    borderRadius: '0.5rem 0.5rem 0 0',
  };

  const activeTabStyle: React.CSSProperties = {
    ...tabStyle,
    color: '#ffffff',
    backgroundColor: '#334155',
    boxShadow: 'inset 0 -2px 0 #8b5cf6',
  };

  const cardStyle: React.CSSProperties = {
    backgroundColor: '#1e293b',
    borderRadius: '0.75rem',
    padding: '1.5rem',
    marginBottom: '1.5rem',
    boxShadow: '0 4px 6px rgba(0,0,0,0.1)',
  };

  const sectionStyle: React.CSSProperties = {
    backgroundColor: '#1e293b',
    borderRadius: '0.75rem',
    padding: '2rem',
    marginBottom: '2rem',
    boxShadow: '0 4px 6px rgba(0,0,0,0.1)',
  };

  const tableStyle: React.CSSProperties = {
    width: '100%',
    borderCollapse: 'collapse',
    fontSize: '0.875rem',
  };

  const thStyle: React.CSSProperties = {
    padding: '1rem',
    textAlign: 'left' as const,
    backgroundColor: '#0f172a',
    color: '#cbd5e1',
    fontWeight: 600,
  };

  const tdStyle: React.CSSProperties = {
    padding: '1rem',
    borderBottom: '1px solid #334155',
  };

  const buttonStyle: React.CSSProperties = {
    padding: '0.5rem 1rem',
    borderRadius: '0.375rem',
    fontWeight: 500,
    cursor: 'pointer',
    transition: 'all 0.2s ease',
  };

  const primaryButtonStyle: React.CSSProperties = {
    ...buttonStyle,
    backgroundColor: '#8b5cf6',
    color: 'white',
    border: 'none',
  };

  const dangerButtonStyle: React.CSSProperties = {
    ...buttonStyle,
    backgroundColor: '#ef4444',
    color: 'white',
    border: 'none',
  };

  const modalStyle: React.CSSProperties = {
    position: 'fixed' as const,
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0,0,0,0.8)',
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 1000,
  };

  const modalContentStyle: React.CSSProperties = {
    backgroundColor: '#1e293b',
    borderRadius: '0.75rem',
    width: '90%',
    maxWidth: '600px',
    padding: '1.5rem',
    boxShadow: '0 10px 20px rgba(0,0,0,0.3)',
    maxHeight: '90vh',
    overflowY: 'auto',
  };

  const hoverButtonStyle: React.CSSProperties = {
    ...buttonStyle,
    backgroundColor: 'transparent',
    color: '#94a3b8',
    border: '1px solid #334155',
  };

  const inputStyle: React.CSSProperties = {
    width: '100%',
    padding: '0.75rem',
    backgroundColor: '#111827',
    color: '#f9fafb',
    border: '1px solid #4b5563',
    borderRadius: '0.5rem',
    fontSize: '0.9rem',
  };

  // Load initial data
  useEffect(() => {
    loadCredentials();
    loadTutors();
    loadQuestionsData();
    loadMockTests();
    // Load subject options (mock data)
    setSubjectOptions(['Math', 'Science', 'English', 'History']);
    // Load platform stats (mock data)
    setPlatformStats({ totalRevenue: 150000, liveClasses: 120 });
  }, []);

  useEffect(() => {
    if (activeTab === 'tutor_management') {
      loadTutors();
    } else if (activeTab === 'mock_test') {
      loadQuestionsData();
      loadMockTests();
    } else if (activeTab === 'questions' || activeTab === 'aptitude_questions') {
      loadQuestionsData();
    } else {
      loadCredentials();
    }
  }, [activeTab]);

  // Filter tutors based on search and filter criteria
  const filteredTutors = allTutors.filter(tutor => {
    const matchesSearch = tutor.name.toLowerCase().includes(tutorSearch.toLowerCase()) ||
      (tutor.email || '').toLowerCase().includes(tutorSearch.toLowerCase());
    const matchesStatus = tutorFilter.status === 'all' || 
      (tutorFilter.status === 'pending' && !tutor.is_approved) ||
      (tutorFilter.status === 'approved' && tutor.is_approved);
    const matchesSubject = !tutorFilter.subject;
    return matchesSearch && matchesStatus && matchesSubject;
  });

  return (
    <div style={dashboardStyle}>
      <style>
        {`
          @keyframes spin {
            0% { transform: rotate(0deg); }
            100% { transform: rotate(360deg); }
          }
        `}
      </style>

      <header style={headerStyle}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
          <Link to="/" style={{ color: '#f8fafc', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <ArrowLeft size={18} />
          </Link>
          <h1 style={{ fontSize: '1.5rem', fontWeight: 600 }}>Admin Dashboard</h1>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
          {pendingTutorCount > 0 && (
            <div style={{
              backgroundColor: 'rgba(239, 68, 68, 0.2)',
              padding: '0.5rem 1rem',
              borderRadius: '999px',
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem',
            }}>
              <AlertCircle size={16} color="#ef4444" />
              <span>{pendingTutorCount} Pending Approvals</span>
            </div>
          )}
          <button
            onClick={handleLogout}
            style={{
              ...hoverButtonStyle,
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem',
            }}
          >
            <LogOut size={16} /> Logout
          </button>
        </div>
      </header>

      <main style={contentStyle}>
        {/* Dashboard Overview Statistics */}
        <div style={sectionStyle}>
          <h2 style={{ fontSize: '1.5rem', fontWeight: 600, marginBottom: '1.5rem' }}>
            Dashboard Overview
          </h2>
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
            gap: '1rem',
          }}>
            <div style={{
              ...cardStyle,
              backgroundColor: 'rgba(139, 92, 246, 0.1)',
              border: '1px solid rgba(139, 92, 246, 0.2)',
              textAlign: 'center',
            }}>
              <Users size={24} color="#8b5cf6" style={{ marginBottom: '0.5rem' }} />
              <div style={{ fontSize: '1.5rem', fontWeight: 'bold', color: '#8b5cf6' }}>
                {tutorStats.totalTutors}
              </div>
              <div style={{ fontSize: '0.9rem', color: '#94a3b8' }}>Total Tutors</div>
            </div>
            <div style={{
              ...cardStyle,
              backgroundColor: 'rgba(239, 68, 68, 0.1)',
              border: '1px solid rgba(239, 68, 68, 0.2)',
              textAlign: 'center',
            }}>
              <AlertCircle size={24} color="#ef4444" style={{ marginBottom: '0.5rem' }} />
              <div style={{ fontSize: '1.5rem', fontWeight: 'bold', color: '#ef4444' }}>
                {tutorStats.pendingApprovals}
              </div>
              <div style={{ fontSize: '0.9rem', color: '#94a3b8' }}>Pending Approvals</div>
            </div>
            <div style={{
              ...cardStyle,
              backgroundColor: 'rgba(16, 185, 129, 0.1)',
              border: '1px solid rgba(16, 185, 129, 0.2)',
              textAlign: 'center',
            }}>
              <Check size={24} color="#10b981" style={{ marginBottom: '0.5rem' }} />
              <div style={{ fontSize: '1.5rem', fontWeight: 'bold', color: '#10b981' }}>
                {tutorStats.approvedTutors}
              </div>
              <div style={{ fontSize: '0.9rem', color: '#94a3b8' }}>Approved Tutors</div>
            </div>
            <div style={{
              ...cardStyle,
              backgroundColor: 'rgba(59, 130, 246, 0.1)',
              border: '1px solid rgba(59, 130, 246, 0.2)',
              textAlign: 'center',
            }}>
              <Video size={24} color="#3b82f6" style={{ marginBottom: '0.5rem' }} />
              <div style={{ fontSize: '1.5rem', fontWeight: 'bold', color: '#3b82f6' }}>
                {tutorStats.totalVideos}
              </div>
              <div style={{ fontSize: '0.9rem', color: '#94a3b8' }}>Total Videos</div>
            </div>
            <div style={{
              ...cardStyle,
              backgroundColor: 'rgba(245, 158, 11, 0.1)',
              border: '1px solid rgba(245, 158, 11, 0.2)',
              textAlign: 'center',
            }}>
              <DollarSign size={24} color="#f59e0b" style={{ marginBottom: '0.5rem' }} />
              <div style={{ fontSize: '1.5rem', fontWeight: 'bold', color: '#f59e0b' }}>
                ${platformStats.totalRevenue.toLocaleString()}
              </div>
              <div style={{ fontSize: '0.9rem', color: '#94a3b8' }}>Platform Revenue</div>
            </div>
            <div style={{
              ...cardStyle,
              backgroundColor: 'rgba(236, 72, 153, 0.1)',
              border: '1px solid rgba(236, 72, 153, 0.2)',
              textAlign: 'center',
            }}>
              <TrendingUp size={24} color="#ec4899" style={{ marginBottom: '0.5rem' }} />
              <div style={{ fontSize: '1.5rem', fontWeight: 'bold', color: '#ec4899' }}>
                {platformStats.liveClasses}
              </div>
              <div style={{ fontSize: '0.9rem', color: '#94a3b8' }}>Live Classes</div>
            </div>
          </div>
        </div>

        <div style={tabBarStyle}>
          <div
            style={activeTab === 'api_keys' ? activeTabStyle : tabStyle}
            onClick={() => handleTabChange('api_keys')}
          >
            <Key size={20} /> API Keys
          </div>
          <div
            style={activeTab === 'service_credentials' ? activeTabStyle : tabStyle}
            onClick={() => handleTabChange('service_credentials')}
          >
            <Server size={20} /> Service Credentials
          </div>
          <div
            style={activeTab === 'endpoint_credentials' ? activeTabStyle : tabStyle}
            onClick={() => handleTabChange('endpoint_credentials')}
          >
            <Globe size={20} /> Endpoint Credentials
          </div>
          <div
            style={activeTab === 'questions' ? activeTabStyle : tabStyle}
            onClick={() => handleTabChange('questions')}
          >
            <Database size={20} /> Questions
          </div>
          <div
            style={activeTab === 'aptitude_questions' ? activeTabStyle : tabStyle}
            onClick={() => handleTabChange('aptitude_questions')}
          >
            <Database size={20} /> Aptitude Questions
          </div>
          <div
            style={activeTab === 'mock_test' ? activeTabStyle : tabStyle}
            onClick={() => handleTabChange('mock_test')}
          >
            <FileText size={20} /> Mock Test
          </div>
          <div
            style={activeTab === 'tutor_management' ? activeTabStyle : tabStyle}
            onClick={() => handleTabChange('tutor_management')}
          >
            <Users size={20} /> Tutor Management
            {pendingTutorCount > 0 && (
              <span style={{
                backgroundColor: '#ef4444',
                color: 'white',
                borderRadius: '999px',
                padding: '0.2rem 0.6rem',
                fontSize: '0.75rem',
                marginLeft: '0.5rem',
              }}>
                {pendingTutorCount}
              </span>
            )}
          </div>
        </div>

        {/* Tutor Management Tab */}
        {activeTab === 'tutor_management' && (
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
              <h2 style={{ fontSize: '1.25rem', fontWeight: 500 }}>
                Tutor Management
              </h2>
              <div style={{ display: 'flex', gap: '1rem' }}>
                <input
                  type="text"
                  placeholder="Search tutors..."
                  value={tutorSearch}
                  onChange={(e) => setTutorSearch(e.target.value)}
                  style={{ ...inputStyle, width: '300px' }}
                />
                <select
                  value={tutorFilter.status}
                  onChange={(e) => setTutorFilter(prev => ({ ...prev, status: e.target.value }))}
                  style={{ ...inputStyle, width: '150px' }}
                >
                  <option value="all">All Status</option>
                  <option value="pending">Pending</option>
                  <option value="approved">Approved</option>
                  <option value="rejected">Rejected</option>
                </select>
                <select
                  value={tutorFilter.subject}
                  onChange={(e) => setTutorFilter(prev => ({ ...prev, subject: e.target.value }))}
                  style={{ ...inputStyle, width: '150px' }}
                >
                  <option value="">All Subjects</option>
                  {subjectOptions.map(subject => (
                    <option key={subject} value={subject}>{subject}</option>
                  ))}
                </select>
              </div>
            </div>

            {/* Pending Approvals Section */}
            <div style={sectionStyle}>
              <h2 style={{ 
                fontSize: '1.5rem', 
                fontWeight: 600, 
                marginBottom: '1.5rem', 
                display: 'flex', 
                alignItems: 'center', 
                gap: '0.5rem' 
              }}>
                <AlertCircle size={24} color="#ef4444" />
                Pending Approvals
                {pendingTutorCount > 0 && (
                  <span style={{
                    backgroundColor: '#ef4444',
                    color: 'white',
                    borderRadius: '999px',
                    padding: '0.3rem 0.8rem',
                    fontSize: '0.8rem',
                    fontWeight: 500,
                    marginLeft: '0.5rem',
                  }}>
                    {pendingTutorCount}
                  </span>
                )}
              </h2>
              
              {isLoading ? (
                <div style={{ textAlign: 'center', padding: '2rem' }}>
                  <div style={{
                    border: '4px solid #4b5563',
                    borderTop: '4px solid #8b5cf6',
                    borderRadius: '50%',
                    width: '40px',
                    height: '40px',
                    animation: 'spin 1s linear infinite',
                    margin: '0 auto',
                  }} />
                  <div style={{ marginTop: '1rem', color: '#94a3b8' }}>Loading tutors...</div>
                </div>
              ) : allTutors.filter(t => !t.is_approved).length === 0 ? (
                <div style={{
                  textAlign: 'center',
                  color: '#10b981',
                  padding: '3rem',
                  backgroundColor: 'rgba(16, 185, 129, 0.1)',
                  borderRadius: '0.75rem',
                  border: '1px solid rgba(16, 185, 129, 0.2)',
                }}>
                  <Check size={48} color="#10b981" style={{ marginBottom: '1rem' }} />
                  <div style={{ fontSize: '1.2rem', fontWeight: 500, marginBottom: '0.5rem' }}>
                    All caught up! ðŸŽ‰
                  </div>
                  <div style={{ fontSize: '0.9rem' }}>
                    No pending tutor approvals at the moment
                  </div>
                </div>
              ) : (
                <div style={{ display: 'grid', gap: '1rem' }}>
                  {allTutors.filter(t => t.is_approved === null || t.is_approved === undefined).map(tutor => (
                    <div key={tutor.id} style={{
                      ...cardStyle,
                      backgroundColor: 'rgba(239, 68, 68, 0.1)',
                      border: '1px solid rgba(239, 68, 68, 0.2)',
                      transition: 'all 0.3s ease',
                    }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                        <div style={{ flex: 1 }}>
                          <h3 style={{ 
                            fontWeight: 600, 
                            marginBottom: '0.5rem', 
                            fontSize: '1.1rem',
                            color: '#f8fafc'
                          }}>
                            {tutor.name}
                          </h3>
                          
                          <div style={{ 
                            display: 'grid', 
                            gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', 
                            gap: '0.75rem',
                            marginBottom: '1rem'
                          }}>
                            <div>
                              <div style={{ color: '#94a3b8', fontSize: '0.8rem', marginBottom: '0.25rem' }}>Email</div>
                              <div style={{ color: '#cbd5e1', fontSize: '0.9rem' }}>
                                {tutor.email || 'Not provided'}
                              </div>
                            </div>
                            
                            <div>
                              <div style={{ color: '#94a3b8', fontSize: '0.8rem', marginBottom: '0.25rem' }}>Mobile</div>
                              <div style={{ color: '#cbd5e1', fontSize: '0.9rem' }}>
                                {tutor.mobile_number || 'Not provided'}
                              </div>
                            </div>
                            
                            <div>
                              <div style={{ color: '#94a3b8', fontSize: '0.8rem', marginBottom: '0.25rem' }}>Education</div>
                              <div style={{ color: '#cbd5e1', fontSize: '0.9rem' }}>
                                {tutor.education_qualification || 'Not provided'}
                              </div>
                            </div>
                            
                            <div>
                              <div style={{ color: '#94a3b8', fontSize: '0.8rem', marginBottom: '0.25rem' }}>Experience</div>
                              <div style={{ color: '#cbd5e1', fontSize: '0.9rem' }}>
                                {tutor.working_experience || 'Not provided'}
                              </div>
                            </div>
                          </div>

                          <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
                            {tutor.documents_url && tutor.documents_url.trim() !== '' ? (
  <button
  onClick={async () => {
    if (!tutor.documents_url || tutor.documents_url.trim() === '') {
      alert('No document available');
      return;
    }
    
    try {
      // Get the document from tutor_documents table using tutor's username
      const { data: documentData, error } = await supabase
        .from('tutor_documents')
        .select('filename, file_data, file_type')
        .eq('tutor_username', tutor.username)
        .single();
      
      if (error || !documentData) {
        alert('Document not found');
        return;
      }
      
      // Convert base64 to blob and download
      const byteCharacters = atob(documentData.file_data);
      const byteNumbers = new Array(byteCharacters.length);
      for (let i = 0; i < byteCharacters.length; i++) {
        byteNumbers[i] = byteCharacters.charCodeAt(i);
      }
      const byteArray = new Uint8Array(byteNumbers);
      const blob = new Blob([byteArray], { type: documentData.file_type || 'application/zip' });
      
      // Create download link
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = documentData.filename || 'document.zip';
      link.click();
      
      // Clean up
      window.URL.revokeObjectURL(url);
      
    } catch (error) {
      console.error('Download error:', error);
      alert('Failed to download document');
    }
  }}
  style={{
    color: '#60a5fa',
    textDecoration: 'none',
    padding: '0.5rem 1rem',
    backgroundColor: 'rgba(96, 165, 250, 0.1)',
    borderRadius: '0.375rem',
    border: '1px solid rgba(96, 165, 250, 0.3)',
    fontSize: '0.9rem',
    display: 'flex',
    alignItems: 'center',
    gap: '0.5rem',
    transition: 'all 0.2s ease',
    cursor: 'pointer',
  }}
>
  <FileText size={16} />
  View Documents
</button>
) : (
<span style={{
  color: '#94a3b8',
  padding: '0.5rem 1rem',
  backgroundColor: 'rgba(107, 114, 128, 0.1)',
  borderRadius: '0.375rem',
  border: '1px solid rgba(107, 114, 128, 0.3)',
  fontSize: '0.9rem',
  display: 'flex',
  alignItems: 'center',
  gap: '0.5rem',
}}>
  <X size={16} />
  No documents
</span>
)}
                            
                            <div style={{
                              color: '#94a3b8',
                              fontSize: '0.8rem',
                              padding: '0.25rem 0.75rem',
                              backgroundColor: 'rgba(107, 114, 128, 0.1)',
                              borderRadius: '999px',
                              border: '1px solid rgba(107, 114, 128, 0.3)',
                            }}>
                              Applied: {new Date(tutor.created_at).toLocaleDateString()}
                            </div>
                          </div>
                        </div>
                        
                        <div style={{ display: 'flex', gap: '0.5rem', marginLeft: '1rem' }}>
                          <button
                            onClick={() => handleViewTutorDetails(tutor)}
                            style={{ 
                              ...hoverButtonStyle, 
                              padding: '0.75rem',
                              backgroundColor: 'rgba(96, 165, 250, 0.1)',
                              borderColor: 'rgba(96, 165, 250, 0.3)',
                              color: '#60a5fa'
                            }}
                            title="View Details"
                          >
                            <Eye size={18} />
                          </button>
                          <button
                            onClick={() => handleTutorApproval(tutor.id, 'approved')}
                            style={{ 
                              ...primaryButtonStyle, 
                              padding: '0.75rem',
                              backgroundColor: '#10b981',
                              display: 'flex',
                              alignItems: 'center',
                              gap: '0.5rem'
                            }}
                            title="Approve Tutor"
                          >
                            <Check size={18} />
                            Approve
                          </button>
                          <button
                            onClick={() => handleTutorApproval(tutor.id, 'rejected')}
                            style={{ 
                              ...dangerButtonStyle, 
                              padding: '0.75rem',
                              display: 'flex',
                              alignItems: 'center',
                              gap: '0.5rem'
                            }}
                            title="Reject Tutor"
                          >
                            <X size={18} />
                            Reject
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* All Tutors Section */}
            <div style={sectionStyle}>
              <h2 style={{ 
                fontSize: '1.5rem', 
                fontWeight: 600, 
                marginBottom: '1.5rem', 
                display: 'flex', 
                alignItems: 'center', 
                gap: '0.5rem' 
              }}>
                <Users size={24} />
                All Tutors ({filteredTutors.length})
              </h2>
              
              {isLoading ? (
                <div style={{ textAlign: 'center', padding: '2rem' }}>
                  <div style={{
                    border: '4px solid #4b5563',
                    borderTop: '4px solid #8b5cf6',
                    borderRadius: '50%',
                    width: '40px',
                    height: '40px',
                    animation: 'spin 1s linear infinite',
                    margin: '0 auto',
                  }} />
                  <div style={{ marginTop: '1rem', color: '#94a3b8' }}>Loading tutors...</div>
                </div>
              ) : filteredTutors.length === 0 ? (
                <div style={{
                  textAlign: 'center',
                  color: '#94a3b8',
                  padding: '3rem',
                  backgroundColor: 'rgba(107, 114, 128, 0.1)',
                  borderRadius: '0.75rem',
                  border: '1px solid rgba(107, 114, 128, 0.2)',
                }}>
                  <Users size={48} color="#94a3b8" style={{ marginBottom: '1rem' }} />
                  <div style={{ fontSize: '1.2rem', fontWeight: 500, marginBottom: '0.5rem' }}>
                    No tutors found
                  </div>
                  <div style={{ fontSize: '0.9rem' }}>
                    Try adjusting your search or filter criteria
                  </div>
                </div>
              ) : (
                <div style={{ display: 'grid', gap: '1rem' }}>
                  {filteredTutors.map(tutor => (
                    <div key={tutor.id} style={{
                      ...cardStyle,
                      backgroundColor: tutor.is_approved ? 
                        (tutor.is_active ? 'rgba(16, 185, 129, 0.1)' : 'rgba(107, 114, 128, 0.1)') : 
                        'rgba(239, 68, 68, 0.1)',
                      border: tutor.is_approved ? 
                        (tutor.is_active ? '1px solid rgba(16, 185, 129, 0.2)' : '1px solid rgba(107, 114, 128, 0.2)') : 
                        '1px solid rgba(239, 68, 68, 0.2)',
                      transition: 'all 0.3s ease',
                    }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                        <div style={{ flex: 1 }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '0.75rem' }}>
                            <h3 style={{ 
                              fontWeight: 600, 
                              fontSize: '1.1rem',
                              color: '#f8fafc',
                              margin: 0
                            }}>
                              {tutor.name}
                            </h3>
                            
                            <span style={{
                              color: tutor.is_approved ? 
                                (tutor.is_active ? '#10b981' : '#6b7280') : '#ef4444',
                              backgroundColor: tutor.is_approved ? 
                                (tutor.is_active ? 'rgba(16, 185, 129, 0.1)' : 'rgba(107, 114, 128, 0.1)') : 
                                'rgba(239, 68, 68, 0.1)',
                              padding: '0.25rem 0.75rem',
                              borderRadius: '999px',
                              fontSize: '0.8rem',
                              fontWeight: 500,
                              border: tutor.is_approved ? 
                                (tutor.is_active ? '1px solid rgba(16, 185, 129, 0.3)' : '1px solid rgba(107, 114, 128, 0.3)') : 
                                '1px solid rgba(239, 68, 68, 0.3)',
                            }}>
                              {!tutor.is_approved ? 'Pending' : (tutor.is_active ? 'Active' : 'Inactive')}
                            </span>
                          </div>
                          
                          <div style={{ 
                            display: 'grid', 
                            gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', 
                            gap: '0.75rem',
                            marginBottom: '1rem'
                          }}>
                            <div>
                              <div style={{ color: '#94a3b8', fontSize: '0.8rem', marginBottom: '0.25rem' }}>Education</div>
                              <div style={{ color: '#cbd5e1', fontSize: '0.9rem' }}>
                                {tutor.education_qualification || 'Not provided'}
                              </div>
                            </div>
                            
                            <div>
                              <div style={{ color: '#94a3b8', fontSize: '0.8rem', marginBottom: '0.25rem' }}>Experience</div>
                              <div style={{ color: '#cbd5e1', fontSize: '0.9rem' }}>
                                {tutor.working_experience || 'Not provided'}
                              </div>
                            </div>
                            
                            <div>
                              <div style={{ color: '#94a3b8', fontSize: '0.8rem', marginBottom: '0.25rem' }}>Videos</div>
                              <div style={{ color: '#60a5fa', fontSize: '0.9rem', fontWeight: 500 }}>
                                {tutor.video_count || 0}
                              </div>
                            </div>
                            
                            <div>
                              <div style={{ color: '#94a3b8', fontSize: '0.8rem', marginBottom: '0.25rem' }}>Students</div>
                              <div style={{ color: '#a78bfa', fontSize: '0.9rem', fontWeight: 500 }}>
                                {tutor.student_count || 0}
                              </div>
                            </div>
                            
                            <div>
                              <div style={{ color: '#94a3b8', fontSize: '0.8rem', marginBottom: '0.25rem' }}>Earnings</div>
                              <div style={{ color: '#10b981', fontSize: '0.9rem', fontWeight: 500 }}>
                                ${(tutor.earnings || 0).toLocaleString()}
                              </div>
                            </div>
                          </div>

                          <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center', fontSize: '0.8rem', color: '#94a3b8' }}>
                            <span>Joined: {new Date(tutor.created_at).toLocaleDateString()}</span>
                            {tutor.updated_at !== tutor.created_at && (
                              <span>â€¢ Updated: {new Date(tutor.updated_at).toLocaleDateString()}</span>
                            )}
                          </div>
                        </div>
                        
                        <div style={{ display: 'flex', gap: '0.5rem', marginLeft: '1rem', flexWrap: 'wrap' }}>
                          <button
                            onClick={() => handleViewTutorDetails(tutor)}
                            style={{ 
                              ...hoverButtonStyle, 
                              padding: '0.75rem',
                              backgroundColor: 'rgba(96, 165, 250, 0.1)',
                              borderColor: 'rgba(96, 165, 250, 0.3)',
                              color: '#60a5fa'
                            }}
                            title="View Details"
                          >
                            <Eye size={16} />
                          </button>
                          
                          {tutor.is_approved && (
                            <button
                              onClick={() => handleToggleTutorStatus(tutor.id, !tutor.is_active)}
                              style={{
                                ...hoverButtonStyle,
                                padding: '0.75rem',
                                backgroundColor: tutor.is_active ? 'rgba(239, 68, 68, 0.1)' : 'rgba(16, 185, 129, 0.1)',
                                borderColor: tutor.is_active ? 'rgba(239, 68, 68, 0.3)' : 'rgba(16, 185, 129, 0.3)',
                                color: tutor.is_active ? '#ef4444' : '#10b981'
                              }}
                              title={tutor.is_active ? 'Deactivate Tutor' : 'Activate Tutor'}
                            >
                              {tutor.is_active ? <X size={16} /> : <Check size={16} />}
                            </button>
                          )}
                          
                          <button
                            onClick={() => handleSendNotification(tutor.id)}
                            style={{ 
                              ...hoverButtonStyle, 
                              padding: '0.75rem',
                              backgroundColor: 'rgba(245, 158, 11, 0.1)',
                              borderColor: 'rgba(245, 158, 11, 0.3)',
                              color: '#f59e0b'
                            }}
                            title="Send Notification"
                          >
                            <FileText size={16} />
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {/* Mock Test Tab */}
        {activeTab === 'mock_test' && (
          <div>
            <div style={sectionStyle}>
              <h2 style={{ fontSize: '1.5rem', fontWeight: 600, marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <Upload size={24} />
                Questions Upload
              </h2>
              <div style={{
                border: '2px dashed #4b5563',
                borderRadius: '0.5rem',
                padding: '2rem',
                textAlign: 'center',
                marginBottom: '1.5rem',
                backgroundColor: 'rgba(0, 0, 0, 0.1)',
              }}>
                <input
                  type="file"
                  accept=".json"
                  onChange={handleFileChange}
                  multiple
                  style={{ display: 'none' }}
                  id="questions-upload"
                />
                <label htmlFor="questions-upload" style={{ cursor: 'pointer' }}>
                  <FileText size={48} color="#8b5cf6" style={{ marginBottom: '1rem' }} />
                  <div style={{ fontSize: '1.1rem', fontWeight: 500, marginBottom: '0.5rem' }}>
                    {fileUploads.length > 0 ? `${fileUploads.length} files selected` : 'Click to upload JSON files'}
                  </div>
                  <div style={{ color: '#94a3b8', fontSize: '0.9rem' }}>
                    Upload your question files here
                  </div>
                </label>
              </div>
              {fileUploads.length > 0 && (
                <div style={{ textAlign: 'center', marginBottom: '1.5rem' }}>
                  <button
                    onClick={handleFileUpload}
                    disabled={isUploading}
                    style={{
                      ...primaryButtonStyle,
                      opacity: isUploading ? 0.7 : 1,
                      cursor: isUploading ? 'not-allowed' : 'pointer',
                    }}
                  >
                    {isUploading ? `Uploading ${uploadProgress}%...` : 'Upload Questions'}
                  </button>
                </div>
              )}
              {totalQuestions > 0 && (
                <div style={{
                  backgroundColor: 'rgba(0, 0, 0, 0.2)',
                  borderRadius: '0.5rem',
                  padding: '1.5rem',
                }}>
                  <h3 style={{ fontSize: '1.2rem', fontWeight: 500, marginBottom: '1rem' }}>
                    Question Summary
                  </h3>
                  <div style={{ fontSize: '1.1rem', fontWeight: 600, marginBottom: '1rem', color: '#10b981' }}>
                    Total Questions: {totalQuestions}
                  </div>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem' }}>
                    {topicStats.map(topic => (
                      <div key={topic.topic_id} style={{
                        backgroundColor: 'rgba(139, 92, 246, 0.1)',
                        padding: '1rem',
                        borderRadius: '0.5rem',
                        border: '1px solid rgba(139, 92, 246, 0.2)',
                      }}>
                        <div style={{ fontWeight: 500, marginBottom: '0.5rem' }}>{topic.topic}</div>
                        <div style={{ color: '#94a3b8' }}>{topic.count} questions ({topic.percentage.toFixed(2)}%)</div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {totalQuestions > 0 && (
              <div style={sectionStyle}>
                <h2 style={{ fontSize: '1.5rem', fontWeight: 600, marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <Edit size={24} />
                  Topic Weightage Configuration
                </h2>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '1rem', marginBottom: '1.5rem' }}>
                  <div>
                    <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 500 }}>
                      Questions per test:
                    </label>
                    <input
                      type="number"
                      value={questionsPerTest}
                      onChange={(e) => setQuestionsPerTest(parseInt(e.target.value) || 10)}
                      style={inputStyle}
                      min="1"
                      max={totalQuestions}
                      disabled={!isEditingWeightage && generatedMockTests.length > 0}
                    />
                  </div>
                  <div>
                    <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 500 }}>
                      Will create:
                    </label>
                    <div style={{
                      ...inputStyle,
                      backgroundColor: 'rgba(139, 92, 246, 0.1)',
                      color: '#a78bfa',
                      fontWeight: 600,
                    }}>
                      {Math.ceil(totalQuestions / questionsPerTest)} mock tests
                    </div>
                  </div>
                </div>
                <div style={{ marginBottom: '1.5rem' }}>
                  <h3 style={{ fontSize: '1.1rem', fontWeight: 500, marginBottom: '1rem' }}>
                    Topic Distribution Percentages
                  </h3>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '1rem' }}>
                    {topicStats.map(topic => (
                      <div key={topic.topic_id} style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                        <label style={{ flex: 1, fontWeight: 500 }}>{topic.topic}:</label>
                        <input
                          type="number"
                          value={topicWeightage[topic.topic_id] || 0}
                          onChange={(e) => handleWeightageChange(topic.topic_id, e.target.value)}
                          style={{ ...inputStyle, width: '80px' }}
                          min="0"
                          max="100"
                          disabled={!isEditingWeightage && generatedMockTests.length > 0}
                        />
                        <span style={{ color: '#94a3b8' }}>%</span>
                      </div>
                    ))}
                  </div>
                </div>
                <div style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  padding: '1rem',
                  backgroundColor: getTotalWeightage() === 100 ? 'rgba(16, 185, 129, 0.1)' : 'rgba(239, 68, 68, 0.1)',
                  borderRadius: '0.5rem',
                  marginBottom: '1.5rem',
                }}>
                  <span style={{ fontWeight: 500 }}>
                    Total: {getTotalWeightage()}%
                  </span>
                  {getTotalWeightage() === 100 ? (
                    <span style={{ color: '#10b981', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                      <Check size={16} /> Valid
                    </span>
                  ) : (
                    <span style={{ color: '#ef4444', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                      <AlertCircle size={16} /> Must equal 100%
                    </span>
                  )}
                </div>
                <div style={{ display: 'flex', gap: '1rem' }}>
                  {generatedMockTests.length === 0 ? (
                    <button
                      onClick={handleGenerateTests}
                      disabled={getTotalWeightage() !== 100 || isLoading}
                      style={{
                        ...primaryButtonStyle,
                        opacity: getTotalWeightage() !== 100 || isLoading ? 0.7 : 1,
                        cursor: getTotalWeightage() !== 100 || isLoading ? 'not-allowed' : 'pointer',
                        padding: '0.75rem 1.5rem',
                      }}
                    >
                      {isLoading ? 'Generating...' : 'Generate Mock Tests'}
                    </button>
                  ) : (
                    <>
                      <button
                        onClick={() => setIsEditingWeightage(!isEditingWeightage)}
                        style={{
                          ...buttonStyle,
                          backgroundColor: isEditingWeightage ? '#ef4444' : '#f59e0b',
                          color: 'white',
                          padding: '0.75rem 1.5rem',
                        }}
                      >
                        {isEditingWeightage ? 'Cancel Edit' : 'Edit Weightage'}
                      </button>
                      {isEditingWeightage && (
                        <button
                          onClick={handleUpdateWeightage}
                          disabled={getTotalWeightage() !== 100 || isLoading}
                          style={{
                            ...primaryButtonStyle,
                            opacity: getTotalWeightage() !== 100 || isLoading ? 0.7 : 1,
                            cursor: getTotalWeightage() !== 100 || isLoading ? 'not-allowed' : 'pointer',
                            padding: '0.75rem 1.5rem',
                          }}
                        >
                          {isLoading ? 'Updating...' : 'Save Changes'}
                        </button>
                      )}
                      <button
                        onClick={handleGenerateTests}
                        disabled={getTotalWeightage() !== 100 || isLoading}
                        style={{
                          ...primaryButtonStyle,
                          opacity: getTotalWeightage() !== 100 || isLoading ? 0.7 : 1,
                          cursor: getTotalWeightage() !== 100 || isLoading ? 'not-allowed' : 'pointer',
                          padding: '0.75rem 1.5rem',
                        }}
                      >
                        {isLoading ? 'Regenerating...' : 'Regenerate All Tests'}
                      </button>
                    </>
                  )}
                </div>
              </div>
            )}

            {generatedMockTests.length > 0 && (
              <div style={sectionStyle}>
                <h2 style={{ fontSize: '1.5rem', fontWeight: 600, marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <FileText size={24} />
                  Generated Mock Tests
                </h2>
                <div style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
                  gap: '1rem',
                  marginBottom: '2rem',
                }}>
                  {generatedMockTests.map((test) => (
                    <div
                      key={test.mock_test_number}
                      style={{
                        backgroundColor: 'rgba(139, 92, 246, 0.1)',
                        border: '1px solid rgba(139, 92, 246, 0.2)',
                        borderRadius: '0.5rem',
                        padding: '1.5rem',
                        textAlign: 'center',
                      }}
                    >
                      <h3 style={{ fontSize: '1.2rem', fontWeight: 600, marginBottom: '0.5rem' }}>
                        Mock Test {test.mock_test_number}
                      </h3>
                      <div style={{ color: '#94a3b8', marginBottom: '0.5rem' }}>
                        {test.total_questions} Questions
                      </div>
                      <div style={{ color: '#94a3b8' }}>
                        {test.time_limit_minutes} Minutes
                      </div>
                    </div>
                  ))}
                </div>
                <div style={{
                  backgroundColor: 'rgba(16, 185, 129, 0.1)',
                  border: '1px solid rgba(16, 185, 129, 0.2)',
                  borderRadius: '0.5rem',
                  padding: '1rem',
                  textAlign: 'center',
                }}>
                  <div style={{ color: '#10b981', fontWeight: 600, fontSize: '1.1rem' }}>
                    âœ… {generatedMockTests.length} mock tests created successfully!
                  </div>
                  <div style={{ color: '#94a3b8', marginTop: '0.5rem' }}>
                    Students can now access these tests from their dashboard
                  </div>
                </div>
              </div>
            )}

            <div style={sectionStyle}>
              <h2 style={{ fontSize: '1.5rem', fontWeight: 600, marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <Database size={24} />
                Database Management
              </h2>
              <div style={{
                backgroundColor: 'rgba(239, 68, 68, 0.1)',
                border: '1px solid rgba(239, 68, 68, 0.2)',
                borderRadius: '0.5rem',
                padding: '1.5rem',
              }}>
                <div style={{ marginBottom: '1rem', color: '#ef4444', fontWeight: 500, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <AlertCircle size={20} />
                  Danger Zone
                </div>
                <div style={{ color: '#94a3b8', marginBottom: '1.5rem' }}>
                  These actions cannot be undone. Please be careful.
                </div>
                <button
                  onClick={handleDeleteAllData}
                  style={{ ...dangerButtonStyle, padding: '0.75rem 1.5rem' }}
                >
                  Delete All Questions & Mock Tests
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Questions Tab */}
        {activeTab === 'questions' && (
          <div style={cardStyle}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
              <h2 style={{ fontSize: '1.25rem', fontWeight: 500 }}>
                Questions Management
              </h2>
              <div style={{ display: 'flex', gap: '1rem' }}>
                <button
                  onClick={() => setActiveQuestionsTab('questions')}
                  style={{
                    ...buttonStyle,
                    backgroundColor: activeQuestionsTab === 'questions' ? '#8b5cf6' : 'rgba(255, 255, 255, 0.1)',
                    color: activeQuestionsTab === 'questions' ? 'white' : '#94a3b8',
                    border: activeQuestionsTab === 'questions' ? 'none' : '1px solid #4b5563',
                  }}
                >
                  Questions
                </button>
                <button
                  onClick={() => setActiveQuestionsTab('topics')}
                  style={{
                    ...buttonStyle,
                    backgroundColor: activeQuestionsTab === 'topics' ? '#8b5cf6' : 'rgba(255, 255, 255, 0.1)',
                    color: activeQuestionsTab === 'topics' ? 'white' : '#94a3b8',
                    border: activeQuestionsTab === 'topics' ? 'none' : '1px solid #4b5563',
                  }}
                >
                  Topics
                </button>
              </div>
            </div>

            {activeQuestionsTab === 'questions' && (
              <div>
                <div style={{ marginBottom: '1.5rem' }}>
                  <input
                    type="file"
                    accept=".json"
                    onChange={handleFileChange}
                    multiple
                    style={{ ...inputStyle, padding: '0.5rem' }}
                  />
                  {fileUploads.length > 0 && (
                    <button
                      onClick={handleFileUpload}
                      disabled={isUploading}
                      style={{
                        ...primaryButtonStyle,
                        marginTop: '1rem',
                        opacity: isUploading ? 0.7 : 1,
                        cursor: isUploading ? 'not-allowed' : 'pointer',
                      }}
                    >
                      {isUploading ? `Uploading ${uploadProgress}%...` : 'Upload Questions'}
                    </button>
                  )}
                </div>
                {uploadResults.messages.length > 0 && (
                  <div style={{
                    backgroundColor: 'rgba(0, 0, 0, 0.2)',
                    borderRadius: '0.5rem',
                    padding: '1rem',
                    marginBottom: '1.5rem',
                  }}>
                    <h3 style={{ fontSize: '1.1rem', fontWeight: 500, marginBottom: '0.5rem' }}>
                      Upload Results
                    </h3>
                    <div style={{ color: '#10b981' }}>
                      Successfully uploaded: {uploadResults.success}
                    </div>
                    <div style={{ color: '#ef4444', marginBottom: '0.5rem' }}>
                      Errors: {uploadResults.errors}
                    </div>
                    <ul style={{ listStyle: 'none', padding: 0, color: '#94a3b8' }}>
                      {uploadResults.messages.map((message, index) => (
                        <li key={index} style={{ marginBottom: '0.25rem' }}>
                          {message}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
                <table style={tableStyle}>
                  <thead>
                    <tr>
                      <th style={thStyle}>Question</th>
                      <th style={thStyle}>Topic</th>
                      <th style={thStyle}>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {/* Placeholder for questions list */}
                    <tr>
                      <td style={tdStyle} colSpan={3}>
                        <div style={{ textAlign: 'center', color: '#94a3b8', padding: '1rem' }}>
                          No questions available
                        </div>
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>
            )}

            {activeQuestionsTab === 'topics' && (
              <div>
                <table style={tableStyle}>
                  <thead>
                    <tr>
                      <th style={thStyle}>Topic</th>
                      <th style={thStyle}>Question Count</th>
                      <th style={thStyle}>Percentage</th>
                    </tr>
                  </thead>
                  <tbody>
                    {topicStats.length > 0 ? (
                      topicStats.map(topic => (
                        <tr key={topic.topic_id}>
                          <td style={tdStyle}>{topic.topic}</td>
                          <td style={tdStyle}>{topic.count}</td>
                          <td style={tdStyle}>{topic.percentage.toFixed(2)}%</td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td style={tdStyle} colSpan={3}>
                          <div style={{ textAlign: 'center', color: '#94a3b8', padding: '1rem' }}>
                            No topics available
                          </div>
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

        {/* Credentials Tabs (api_keys, service_credentials, endpoint_credentials) */}
        {(activeTab === 'api_keys' || activeTab === 'service_credentials' || activeTab === 'endpoint_credentials') && (
          <div style={cardStyle}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
              <h2 style={{ fontSize: '1.25rem', fontWeight: 500 }}>
                {activeTab.replace(/_/g, ' ').toUpperCase()}
              </h2>
              <button
                onClick={() => handleOpenModal()}
                style={{ ...primaryButtonStyle, padding: '0.5rem 1rem' }}
              >
                <Plus size={16} style={{ marginRight: '0.5rem' }} />
                Add Credential
              </button>
            </div>
            {isLoading ? (
              <div style={{ textAlign: 'center', padding: '2rem' }}>
                <div style={{
                  border: '4px solid #4b5563',
                  borderTop: '4px solid #8b5cf6',
                  borderRadius: '50%',
                  width: '40px',
                  height: '40px',
                  animation: 'spin 1s linear infinite',
                  margin: '0 auto',
                }} />
              </div>
            ) : credentials.length === 0 ? (
              <div style={{ textAlign: 'center', color: '#94a3b8', padding: '2rem' }}>
                No credentials found. Click "Add Credential" to create one.
              </div>
            ) : (
              <table style={tableStyle}>
                <thead>
                  <tr>
                    <th style={thStyle}>Name</th>
                    <th style={thStyle}>Type</th>
                    <th style={thStyle}>Value</th>
                    <th style={thStyle}>Status</th>
                    <th style={thStyle}>Created</th>
                    <th style={thStyle}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {credentials.map((credential) => (
                    <tr key={credential.id}>
                      <td style={tdStyle}>{credential.name}</td>
                      <td style={tdStyle}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                          {getCredentialIcon(credential.type)}
                          <span>{credential.type.replace(/_/g, ' ').toUpperCase()}</span>
                        </div>
                      </td>
                      <td style={tdStyle}>{renderCredentialValuePreview(credential)}</td>
                      <td style={tdStyle}>
                        <span style={{
                          color: credential.is_active ? '#10b981' : '#ef4444',
                          backgroundColor: credential.is_active ? 'rgba(16, 185, 129, 0.1)' : 'rgba(239, 68, 68, 0.1)',
                          padding: '0.25rem 0.75rem',
                          borderRadius: '999px',
                          fontSize: '0.8rem',
                        }}>
                          {credential.is_active ? 'Active' : 'Inactive'}
                        </span>
                      </td>
                      <td style={tdStyle}>
                        {new Date(credential.created_at).toLocaleDateString()}
                      </td>
                      <td style={tdStyle}>
                        <div style={{ display: 'flex', gap: '0.5rem' }}>
                          <button
                            onClick={() => handleOpenModal(credential)}
                            style={{
                              ...hoverButtonStyle,
                              padding: '0.5rem',
                            }}
                          >
                            <Edit size={16} />
                          </button>
                          <button
                            onClick={() => handleDeleteCredential(credential.id)}
                            style={{
                              ...hoverButtonStyle,
                              padding: '0.5rem',
                              backgroundColor: 'rgba(239, 68, 68, 0.1)',
                              borderColor: 'rgba(239, 68, 68, 0.3)',
                            }}
                          >
                            <Trash2 size={16} />
                          </button>
                          <button
                            onClick={() => toggleActiveStatus(credential.id, credential.is_active)}
                            style={{
                              ...hoverButtonStyle,
                              padding: '0.5rem',
                              backgroundColor: credential.is_active ? 'rgba(239, 68, 68, 0.1)' : 'rgba(16, 185, 129, 0.1)',
                              borderColor: credential.is_active ? 'rgba(239, 68, 68, 0.3)' : 'rgba(16, 185, 129, 0.3)',
                            }}
                          >
                            {credential.is_active ? <X size={16} /> : <Check size={16} />}
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        )}

        {/* Modal for Adding/Editing Credentials */}
        {showModal && (
          <div style={modalStyle}>
            <div style={modalContentStyle}>
              <h2 style={{ fontSize: '1.5rem', fontWeight: 600, marginBottom: '1.5rem' }}>
                {currentCredential ? 'Edit Credential' : 'Add New Credential'}
              </h2>

              <div style={{ marginBottom: '1rem' }}>
                <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 500, color: '#cbd5e1' }}>
                  Name *
                </label>
                <input
                  type="text"
                  value={credentialForm.name}
                  onChange={(e) => setCredentialForm({ ...credentialForm, name: e.target.value })}
                  style={inputStyle}
                  required
                />
              </div>

              <div style={{ marginBottom: '1rem' }}>
                <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 500, color: '#cbd5e1' }}>
                  Type *
                </label>
                <select
                  value={credentialForm.type}
                  onChange={(e) => setCredentialForm({ 
                    ...credentialForm, 
                    type: e.target.value as CredentialType,
                    config: activeTab === 'endpoint_credentials' ? { url: '', method: 'GET' } : { key: '' }
                  })}
                  style={inputStyle}
                  required
                >
                  {activeTab === 'api_keys' && (
                    <>
                      <option value="api_key">API Key</option>
                      <option value="oauth">OAuth</option>
                    </>
                  )}
                  {activeTab === 'service_credentials' && (
                    <>
                      <option value="service_account">Service Account</option>
                      <option value="database">Database</option>
                      <option value="cloud">Cloud</option>
                    </>
                  )}
                  {activeTab === 'endpoint_credentials' && (
                    <option value="endpoint">Endpoint</option>
                  )}
                </select>
              </div>

              <div style={{ marginBottom: '1rem' }}>
                <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 500, color: '#cbd5e1' }}>
                  Description
                </label>
                <textarea
                  value={credentialForm.description}
                  onChange={(e) => setCredentialForm({ ...credentialForm, description: e.target.value })}
                  style={{
                    ...inputStyle,
                    minHeight: '100px',
                    resize: 'vertical',
                  }}
                />
              </div>

              {renderConfigForm()}

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '1rem', marginTop: '1.5rem' }}>
                <button
                  onClick={() => setShowModal(false)}
                  style={{
                    ...buttonStyle,
                    backgroundColor: 'transparent',
                    color: '#94a3b8',
                    border: '1px solid #4b5563',
                  }}
                >
                  Cancel
                </button>
                <button
                  onClick={handleSaveCredential}
                  disabled={isLoading}
                  style={{
                    ...primaryButtonStyle,
                    opacity: isLoading ? 0.7 : 1,
                    cursor: isLoading ? 'not-allowed' : 'pointer',
                  }}
                >
                  {isLoading ? 'Saving...' : currentCredential ? 'Update' : 'Save'}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Delete Confirmation Modal */}
        {showDeleteConfirm && (
          <div style={modalStyle}>
            <div style={{
              ...modalContentStyle,
              maxWidth: '400px',
              textAlign: 'center',
            }}>
              <h2 style={{ fontSize: '1.5rem', fontWeight: 600, marginBottom: '1rem' }}>
                Confirm Delete
              </h2>
              <p style={{ marginBottom: '1.5rem', color: '#94a3b8' }}>
                Are you sure you want to delete this credential? This action cannot be undone.
              </p>
              <div style={{ display: 'flex', justifyContent: 'center', gap: '1rem' }}>
                <button
                  onClick={() => setShowDeleteConfirm(false)}
                  style={{
                    ...buttonStyle,
                    backgroundColor: 'transparent',
                    color: '#94a3b8',
                    border: '1px solid #4b5563',
                  }}
                >
                  Cancel
                </button>
                <button
                  onClick={confirmDeleteCredential}
                  disabled={isLoading}
                  style={{
                    ...dangerButtonStyle,
                    opacity: isLoading ? 0.7 : 1,
                    cursor: isLoading ? 'not-allowed' : 'pointer',
                  }}
                >
                  {isLoading ? 'Deleting...' : 'Delete'}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Tutor Details Modal */}
        {showTutorModal && currentTutor && (
          <div style={modalStyle}>
            <div style={{ ...modalContentStyle, maxWidth: '800px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
                <h2 style={{ fontSize: '1.5rem', fontWeight: 600, margin: 0 }}>
                  Tutor Details
                </h2>
                <div style={{
                  color: currentTutor.is_approved ? 
                    (currentTutor.is_active ? '#10b981' : '#6b7280') : '#ef4444',
                  backgroundColor: currentTutor.is_approved ? 
                    (currentTutor.is_active ? 'rgba(16, 185, 129, 0.1)' : 'rgba(107, 114, 128, 0.1)') : 
                    'rgba(239, 68, 68, 0.1)',
                  padding: '0.5rem 1rem',
                  borderRadius: '999px',
                  fontSize: '0.9rem',
                  fontWeight: 500,
                  border: currentTutor.is_approved ? 
                    (currentTutor.is_active ? '1px solid rgba(16, 185, 129, 0.3)' : '1px solid rgba(107, 114, 128, 0.3)') : 
                    '1px solid rgba(239, 68, 68, 0.3)',
                }}>
                  {!currentTutor.is_approved ? 'Pending Approval' : (currentTutor.is_active ? 'Active' : 'Inactive')}
                </div>
              </div>
              
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '1.5rem', marginBottom: '2rem' }}>
                <div>
                  <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 500, color: '#cbd5e1' }}>
                    Full Name
                  </label>
                  <div style={{ ...inputStyle, backgroundColor: 'rgba(0, 0, 0, 0.2)' }}>
                    {currentTutor.name}
                  </div>
                </div>
                
                <div>
                  <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 500, color: '#cbd5e1' }}>
                    Username
                  </label>
                  <div style={{ ...inputStyle, backgroundColor: 'rgba(0, 0, 0, 0.2)' }}>
                    {currentTutor.username || 'Not provided'}
                  </div>
                </div>
                
                <div>
                  <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 500, color: '#cbd5e1' }}>
                    Email Address
                  </label>
                  <div style={{ ...inputStyle, backgroundColor: 'rgba(0, 0, 0, 0.2)' }}>
                    {currentTutor.email || 'Not provided'}
                  </div>
                </div>
                
                <div>
                  <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 500, color: '#cbd5e1' }}>
                    Mobile Number
                  </label>
                  <div style={{ ...inputStyle, backgroundColor: 'rgba(0, 0, 0, 0.2)' }}>
                    {currentTutor.mobile_number || 'Not provided'}
                  </div>
                </div>
                
                <div>
                  <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 500, color: '#cbd5e1' }}>
                    Education Qualification
                  </label>
                  <div style={{ ...inputStyle, backgroundColor: 'rgba(0, 0, 0, 0.2)' }}>
                    {currentTutor.education_qualification || 'Not provided'}
                  </div>
                </div>
                
                <div>
                  <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 500, color: '#cbd5e1' }}>
                    Degree
                  </label>
                  <div style={{ ...inputStyle, backgroundColor: 'rgba(0, 0, 0, 0.2)' }}>
                    {currentTutor.degree || 'Not provided'}
                  </div>
                </div>
                
                <div>
                  <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 500, color: '#cbd5e1' }}>
                    Master's Degree
                  </label>
                  <div style={{ ...inputStyle, backgroundColor: 'rgba(0, 0, 0, 0.2)' }}>
                    {currentTutor.master_degree || 'Not provided'}
                  </div>
                </div>
                
                <div>
                  <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 500, color: '#cbd5e1' }}>
                    PhD Status
                  </label>
                  <div style={{ 
                    ...inputStyle, 
                    backgroundColor: 'rgba(0, 0, 0, 0.2)',
                    color: currentTutor.phd ? '#10b981' : '#ef4444'
                  }}>
                    {currentTutor.phd ? 'Yes' : 'No'}
                  </div>
                </div>
                
                <div>
                  <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 500, color: '#cbd5e1' }}>
                    Work Experience
                  </label>
                  <div style={{ ...inputStyle, backgroundColor: 'rgba(0, 0, 0, 0.2)' }}>
                    {currentTutor.working_experience || 'Not provided'}
                  </div>
                </div>
              </div>
              
              <div style={{ marginBottom: '2rem' }}>
                <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 500, color: '#cbd5e1' }}>
                  Documents
                </label>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem' }}>
                  {currentTutor.documents_url ? (
                    <a
                      href={currentTutor.documents_url && currentTutor.documents_url.trim() ? currentTutor.documents_url : '#'}
                      target="_blank"
                      rel="noopener noreferrer"
                      style={{
                        padding: '0.75rem 1.5rem',
                        backgroundColor: '#8b5cf6',
                        color: 'white',
                        borderRadius: '0.5rem',
                        textDecoration: 'none',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '0.5rem',
                        fontSize: '0.9rem',
                        fontWeight: 500,
                        transition: 'all 0.2s ease',
                      }}
                      onMouseOver={(e) => {
                        e.currentTarget.style.backgroundColor = '#7c3aed';
                      }}
                      onMouseOut={(e) => {
                        e.currentTarget.style.backgroundColor = '#8b5cf6';
                      }}
                    >
                      <FileText size={18} />
                      View Documents
                    </a>
                  ) : (
                    <div style={{
                      padding: '0.75rem 1.5rem',
                      backgroundColor: 'rgba(107, 114, 128, 0.1)',
                      color: '#94a3b8',
                      borderRadius: '0.5rem',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '0.5rem',
                      fontSize: '0.9rem',
                      border: '1px solid rgba(107, 114, 128, 0.3)',
                    }}>
                      <X size={18} />
                      No documents available
                    </div>
                  )}
                </div>
              </div>
              
              <div style={{ 
                display: 'grid', 
                gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', 
                gap: '1rem',
                marginBottom: '2rem',
                padding: '1.5rem',
                backgroundColor: 'rgba(0, 0, 0, 0.2)',
                borderRadius: '0.75rem'
              }}>
                <div style={{ textAlign: 'center' }}>
                  <div style={{ color: '#60a5fa', fontSize: '1.5rem', fontWeight: 'bold' }}>
                    {currentTutor.video_count || 0}
                  </div>
                  <div style={{ color: '#94a3b8', fontSize: '0.9rem' }}>Videos Created</div>
                </div>
                <div style={{ textAlign: 'center' }}>
                  <div style={{ color: '#a78bfa', fontSize: '1.5rem', fontWeight: 'bold' }}>
                    {currentTutor.student_count || 0}
                  </div>
                  <div style={{ color: '#94a3b8', fontSize: '0.9rem' }}>Students Taught</div>
                </div>
                <div style={{ textAlign: 'center' }}>
                  <div style={{ color: '#10b981', fontSize: '1.5rem', fontWeight: 'bold' }}>
                    ${(currentTutor.earnings || 0).toLocaleString()}
                  </div>
                  <div style={{ color: '#94a3b8', fontSize: '0.9rem' }}>Total Earnings</div>
                </div>
              </div>
              
              <div style={{ 
                display: 'flex', 
                justifyContent: 'space-between', 
                alignItems: 'center',
                flexWrap: 'wrap',
                gap: '1rem'
              }}>
                <div style={{ display: 'flex', gap: '1rem', flex: 1 }}>
                  <button
                    onClick={() => setShowTutorModal(false)}
                    style={{
                      ...buttonStyle,
                      backgroundColor: 'transparent',
                      color: '#94a3b8',
                      border: '1px solid #4b5563',
                      padding: '0.75rem 1.5rem',
                    }}
                  >
                    Close
                  </button>
                  
                  {!currentTutor.is_approved && (
                    <>
                      <button
                        onClick={() => {
                          handleTutorApproval(currentTutor.id, 'approved');
                          setShowTutorModal(false);
                        }}
                        disabled={isLoading}
                        style={{ 
                          ...primaryButtonStyle,
                          backgroundColor: '#10b981',
                          padding: '0.75rem 1.5rem',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '0.5rem',
                          opacity: isLoading ? 0.7 : 1,
                          cursor: isLoading ? 'not-allowed' : 'pointer',
                        }}
                      >
                        <Check size={18} />
                        {isLoading ? 'Approving...' : 'Approve Tutor'}
                      </button>
                      
                      <button
                        onClick={() => {
                          handleTutorApproval(currentTutor.id, 'rejected');
                          setShowTutorModal(false);
                        }}
                        disabled={isLoading}
                        style={{ 
                          ...dangerButtonStyle,
                          padding: '0.75rem 1.5rem',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '0.5rem',
                          opacity: isLoading ? 0.7 : 1,
                          cursor: isLoading ? 'not-allowed' : 'pointer',
                        }}
                      >
                        <X size={18} />
                        {isLoading ? 'Rejecting...' : 'Reject Tutor'}
                      </button>
                    </>
                  )}
                </div>
                
                <div style={{ display: 'flex', gap: '0.5rem' }}>
                  {currentTutor.is_approved && (
                    <button
                      onClick={() => {
                        handleToggleTutorStatus(currentTutor.id, !currentTutor.is_active);
                        setShowTutorModal(false);
                      }}
                      disabled={isLoading}
                      style={{
                        ...hoverButtonStyle,
                        padding: '0.75rem 1.5rem',
                        backgroundColor: currentTutor.is_active ? 'rgba(239, 68, 68, 0.1)' : 'rgba(16, 185, 129, 0.1)',
                        borderColor: currentTutor.is_active ? 'rgba(239, 68, 68, 0.3)' : 'rgba(16, 185, 129, 0.3)',
                        color: currentTutor.is_active ? '#ef4444' : '#10b981',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '0.5rem',
                        opacity: isLoading ? 0.7 : 1,
                        cursor: isLoading ? 'not-allowed' : 'pointer',
                      }}
                    >
                      {currentTutor.is_active ? <X size={18} /> : <Check size={18} />}
                      {isLoading ? 'Updating...' : (currentTutor.is_active ? 'Deactivate' : 'Activate')}
                    </button>
                  )}
                  
                  <button
                    onClick={() => {
                      handleSendNotification(currentTutor.id);
                    }}
                    disabled={isLoading}
                    style={{ 
                      ...hoverButtonStyle,
                      padding: '0.75rem 1.5rem',
                      backgroundColor: 'rgba(245, 158, 11, 0.1)',
                      borderColor: 'rgba(245, 158, 11, 0.3)',
                      color: '#f59e0b',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '0.5rem',
                      opacity: isLoading ? 0.7 : 1,
                      cursor: isLoading ? 'not-allowed' : 'pointer',
                    }}
                  >
                    <FileText size={18} />
                    Send Notification
                  </button>
                </div>
              </div>
              
              <div style={{
                marginTop: '2rem',
                paddingTop: '1.5rem',
                borderTop: '1px solid #334155',
                display: 'flex',
                gap: '1rem',
                fontSize: '0.8rem',
                color: '#94a3b8'
              }}>
                <span>Created: {new Date(currentTutor.created_at).toLocaleString()}</span>
                {currentTutor.updated_at !== currentTutor.created_at && (
                  <span>â€¢ Last Updated: {new Date(currentTutor.updated_at).toLocaleString()}</span>
                )}
                <span>â€¢ ID: {currentTutor.id}</span>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
};

export default AdminDashboard;