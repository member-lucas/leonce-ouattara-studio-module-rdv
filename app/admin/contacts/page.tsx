'use client';

import { useEffect, useState } from 'react';
import { 
  Mail, 
  Phone, 
  Building, 
  Calendar, 
  Eye, 
  Reply, 
  Archive,
  Search,
  Filter,
  AlertCircle,
  CheckCircle,
  Clock,
  User,
  MessageSquare
} from 'lucide-react';

interface Contact {
  _id: string;
  firstName: string;
  lastName: string;
  email: string;
  phone?: string;
  company?: {
    name?: string;
  };
  subject: string;
  projectType?: string;
  budget?: {
    range?: string;
  };
  timeline?: string;
  message: string;
  status: string;
  priority: string;
  source: string;
  createdAt: string;
  responses: Array<{
    message: string;
    sentAt: string;
    sentBy: {
      firstName: string;
      lastName: string;
    };
  }>;
}

export default function AdminContacts() {
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [subjectFilter, setSubjectFilter] = useState('');
  const [selectedContact, setSelectedContact] = useState<Contact | null>(null);
  const [replyMessage, setReplyMessage] = useState('');
  const [isReplying, setIsReplying] = useState(false);

  useEffect(() => {
    fetchContacts();
  }, []);

  const fetchContacts = async () => {
    try {
      const token = localStorage.getItem('adminToken');
      const response = await fetch('/api/v1/contact', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (response.ok) {
        const data = await response.json();
        setContacts(data.data.contacts);
      }
    } catch (error) {
      console.error('Error fetching contacts:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const updateContactStatus = async (id: string, status: string, priority?: string) => {
    try {
      const token = localStorage.getItem('adminToken');
      const response = await fetch(`/api/v1/contact/${id}/status`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ status, priority })
      });

      if (response.ok) {
        setContacts(contacts.map(c => 
          c._id === id ? { ...c, status, priority: priority || c.priority } : c
        ));
        if (selectedContact?._id === id) {
          setSelectedContact({ ...selectedContact, status, priority: priority || selectedContact.priority });
        }
      }
    } catch (error) {
      console.error('Error updating contact status:', error);
    }
  };

  const sendReply = async () => {
    if (!selectedContact || !replyMessage.trim()) return;

    setIsReplying(true);
    try {
      const token = localStorage.getItem('adminToken');
      const response = await fetch(`/api/v1/contact/${selectedContact._id}/reply`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          message: replyMessage,
          method: 'email'
        })
      });

      if (response.ok) {
        const data = await response.json();
        setSelectedContact(data.data.contact);
        setReplyMessage('');
        await updateContactStatus(selectedContact._id, 'replied');
      }
    } catch (error) {
      console.error('Error sending reply:', error);
    } finally {
      setIsReplying(false);
    }
  };

  const filteredContacts = contacts.filter(contact => {
    const matchesSearch = 
      contact.firstName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      contact.lastName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      contact.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      contact.message.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesStatus = !statusFilter || contact.status === statusFilter;
    const matchesSubject = !subjectFilter || contact.subject === subjectFilter;
    
    return matchesSearch && matchesStatus && matchesSubject;
  });

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'new': return 'bg-blue-500/20 text-blue-400';
      case 'read': return 'bg-yellow-500/20 text-yellow-400';
      case 'replied': return 'bg-green-500/20 text-green-400';
      case 'in-progress': return 'bg-purple-500/20 text-purple-400';
      case 'completed': return 'bg-gray-500/20 text-gray-400';
      case 'archived': return 'bg-gray-600/20 text-gray-500';
      default: return 'bg-gray-500/20 text-gray-400';
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'urgent': return 'bg-red-500/20 text-red-400';
      case 'high': return 'bg-orange-500/20 text-orange-400';
      case 'medium': return 'bg-yellow-500/20 text-yellow-400';
      case 'low': return 'bg-green-500/20 text-green-400';
      default: return 'bg-gray-500/20 text-gray-400';
    }
  };

  const statuses = [...new Set(contacts.map(c => c.status))];
  const subjects = [...new Set(contacts.map(c => c.subject))];

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-[#00F5FF]/30 rounded-full animate-spin mb-4 mx-auto">
            <div className="absolute inset-0 border-4 border-transparent border-t-[#00F5FF] rounded-full animate-spin"></div>
          </div>
          <p className="text-gray-400">Chargement des contacts...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-white mb-2">Gestion des Contacts</h1>
          <p className="text-gray-400">Gérez les messages reçus via le formulaire de contact</p>
        </div>
        <div className="flex items-center space-x-2 text-sm">
          <span className="text-gray-400">Total:</span>
          <span className="text-[#00F5FF] font-semibold">{contacts.length}</span>
          <span className="text-gray-400">|</span>
          <span className="text-gray-400">Non lus:</span>
          <span className="text-orange-400 font-semibold">
            {contacts.filter(c => c.status === 'new').length}
          </span>
        </div>
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        
        {/* Contacts List */}
        <div className="lg:col-span-2 space-y-4">
          
          {/* Filters */}
          <div className="glass-card p-4 rounded-2xl border border-gray-700/50">
            <div className="grid md:grid-cols-4 gap-4">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input
                  type="text"
                  placeholder="Rechercher..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 bg-gray-800/50 border border-gray-600 rounded-lg focus:border-[#00F5FF] focus:outline-none text-white text-sm"
                />
              </div>

              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="px-3 py-2 bg-gray-800/50 border border-gray-600 rounded-lg focus:border-[#00F5FF] focus:outline-none text-white text-sm"
              >
                <option value="">Tous les statuts</option>
                {statuses.map(status => (
                  <option key={status} value={status}>{status}</option>
                ))}
              </select>

              <select
                value={subjectFilter}
                onChange={(e) => setSubjectFilter(e.target.value)}
                className="px-3 py-2 bg-gray-800/50 border border-gray-600 rounded-lg focus:border-[#00F5FF] focus:outline-none text-white text-sm"
              >
                <option value="">Tous les sujets</option>
                {subjects.map(subject => (
                  <option key={subject} value={subject}>{subject}</option>
                ))}
              </select>

              <div className="text-center text-sm text-gray-400">
                {filteredContacts.length} résultat(s)
              </div>
            </div>
          </div>

          {/* Contacts */}
          <div className="space-y-3">
            {filteredContacts.map((contact) => (
              <div
                key={contact._id}
                onClick={() => setSelectedContact(contact)}
                className={`glass-card p-4 rounded-xl border cursor-pointer transition-all ${
                  selectedContact?._id === contact._id
                    ? 'border-[#00F5FF]/50 bg-[#00F5FF]/5'
                    : 'border-gray-700/50 hover:border-gray-600'
                }`}
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center space-x-3 mb-2">
                      <h3 className="font-semibold text-white">
                        {contact.firstName} {contact.lastName}
                      </h3>
                      <span className={`px-2 py-1 rounded-full text-xs ${getStatusColor(contact.status)}`}>
                        {contact.status}
                      </span>
                      <span className={`px-2 py-1 rounded-full text-xs ${getPriorityColor(contact.priority)}`}>
                        {contact.priority}
                      </span>
                    </div>
                    
                    <div className="flex items-center space-x-4 text-sm text-gray-400 mb-2">
                      <div className="flex items-center space-x-1">
                        <Mail className="w-3 h-3" />
                        <span>{contact.email}</span>
                      </div>
                      {contact.phone && (
                        <div className="flex items-center space-x-1">
                          <Phone className="w-3 h-3" />
                          <span>{contact.phone}</span>
                        </div>
                      )}
                      {contact.company?.name && (
                        <div className="flex items-center space-x-1">
                          <Building className="w-3 h-3" />
                          <span>{contact.company.name}</span>
                        </div>
                      )}
                    </div>

                    <p className="text-gray-300 text-sm mb-2">
                      <strong>Sujet:</strong> {contact.subject}
                    </p>
                    
                    <p className="text-gray-400 text-sm line-clamp-2">
                      {contact.message}
                    </p>
                  </div>

                  <div className="text-right text-xs text-gray-500">
                    <div className="flex items-center space-x-1 mb-1">
                      <Calendar className="w-3 h-3" />
                      <span>{new Date(contact.createdAt).toLocaleDateString('fr-FR')}</span>
                    </div>
                    {contact.responses.length > 0 && (
                      <div className="flex items-center space-x-1">
                        <MessageSquare className="w-3 h-3" />
                        <span>{contact.responses.length} réponse(s)</span>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Contact Detail */}
        <div className="lg:col-span-1">
          {selectedContact ? (
            <div className="glass-card p-6 rounded-2xl border border-gray-700/50 sticky top-6">
              
              {/* Contact Info */}
              <div className="mb-6">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-xl font-semibold text-white">
                    {selectedContact.firstName} {selectedContact.lastName}
                  </h2>
                  <div className="flex items-center space-x-2">
                    <span className={`px-2 py-1 rounded-full text-xs ${getStatusColor(selectedContact.status)}`}>
                      {selectedContact.status}
                    </span>
                  </div>
                </div>

                <div className="space-y-2 text-sm">
                  <div className="flex items-center space-x-2">
                    <Mail className="w-4 h-4 text-gray-400" />
                    <span className="text-gray-300">{selectedContact.email}</span>
                  </div>
                  {selectedContact.phone && (
                    <div className="flex items-center space-x-2">
                      <Phone className="w-4 h-4 text-gray-400" />
                      <span className="text-gray-300">{selectedContact.phone}</span>
                    </div>
                  )}
                  {selectedContact.company?.name && (
                    <div className="flex items-center space-x-2">
                      <Building className="w-4 h-4 text-gray-400" />
                      <span className="text-gray-300">{selectedContact.company.name}</span>
                    </div>
                  )}
                  <div className="flex items-center space-x-2">
                    <Calendar className="w-4 h-4 text-gray-400" />
                    <span className="text-gray-300">
                      {new Date(selectedContact.createdAt).toLocaleDateString('fr-FR')}
                    </span>
                  </div>
                </div>
              </div>

              {/* Project Details */}
              {(selectedContact.projectType || selectedContact.budget?.range || selectedContact.timeline) && (
                <div className="mb-6 p-4 bg-gray-800/30 rounded-xl">
                  <h3 className="text-sm font-semibold text-gray-300 mb-3">Détails du projet</h3>
                  <div className="space-y-2 text-sm">
                    {selectedContact.projectType && (
                      <div>
                        <span className="text-gray-400">Type:</span>
                        <span className="text-white ml-2">{selectedContact.projectType}</span>
                      </div>
                    )}
                    {selectedContact.budget?.range && (
                      <div>
                        <span className="text-gray-400">Budget:</span>
                        <span className="text-white ml-2">{selectedContact.budget.range}</span>
                      </div>
                    )}
                    {selectedContact.timeline && (
                      <div>
                        <span className="text-gray-400">Timeline:</span>
                        <span className="text-white ml-2">{selectedContact.timeline}</span>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Message */}
              <div className="mb-6">
                <h3 className="text-sm font-semibold text-gray-300 mb-3">Message</h3>
                <div className="p-4 bg-gray-800/30 rounded-xl">
                  <p className="text-gray-300 text-sm leading-relaxed">
                    {selectedContact.message}
                  </p>
                </div>
              </div>

              {/* Status Actions */}
              <div className="mb-6">
                <h3 className="text-sm font-semibold text-gray-300 mb-3">Actions</h3>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    onClick={() => updateContactStatus(selectedContact._id, 'read')}
                    className="flex items-center space-x-2 px-3 py-2 bg-yellow-500/20 text-yellow-400 rounded-lg hover:bg-yellow-500/30 transition-colors text-sm"
                  >
                    <Eye className="w-4 h-4" />
                    <span>Marquer lu</span>
                  </button>
                  <button
                    onClick={() => updateContactStatus(selectedContact._id, 'in-progress')}
                    className="flex items-center space-x-2 px-3 py-2 bg-blue-500/20 text-blue-400 rounded-lg hover:bg-blue-500/30 transition-colors text-sm"
                  >
                    <Clock className="w-4 h-4" />
                    <span>En cours</span>
                  </button>
                  <button
                    onClick={() => updateContactStatus(selectedContact._id, 'completed')}
                    className="flex items-center space-x-2 px-3 py-2 bg-green-500/20 text-green-400 rounded-lg hover:bg-green-500/30 transition-colors text-sm"
                  >
                    <CheckCircle className="w-4 h-4" />
                    <span>Terminé</span>
                  </button>
                  <button
                    onClick={() => updateContactStatus(selectedContact._id, 'archived')}
                    className="flex items-center space-x-2 px-3 py-2 bg-gray-500/20 text-gray-400 rounded-lg hover:bg-gray-500/30 transition-colors text-sm"
                  >
                    <Archive className="w-4 h-4" />
                    <span>Archiver</span>
                  </button>
                </div>
              </div>

              {/* Responses */}
              {selectedContact.responses.length > 0 && (
                <div className="mb-6">
                  <h3 className="text-sm font-semibold text-gray-300 mb-3">Réponses envoyées</h3>
                  <div className="space-y-3 max-h-40 overflow-y-auto">
                    {selectedContact.responses.map((response, index) => (
                      <div key={index} className="p-3 bg-gray-800/30 rounded-lg">
                        <p className="text-gray-300 text-sm mb-2">{response.message}</p>
                        <div className="text-xs text-gray-500">
                          Par {response.sentBy.firstName} {response.sentBy.lastName} - {' '}
                          {new Date(response.sentAt).toLocaleDateString('fr-FR')}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Reply */}
              <div>
                <h3 className="text-sm font-semibold text-gray-300 mb-3">Répondre</h3>
                <div className="space-y-3">
                  <textarea
                    value={replyMessage}
                    onChange={(e) => setReplyMessage(e.target.value)}
                    rows={4}
                    className="w-full px-3 py-2 bg-gray-800/50 border border-gray-600 rounded-lg focus:border-[#00F5FF] focus:outline-none text-white text-sm resize-none"
                    placeholder="Tapez votre réponse..."
                  />
                  <button
                    onClick={sendReply}
                    disabled={!replyMessage.trim() || isReplying}
                    className="w-full flex items-center justify-center space-x-2 px-4 py-2 bg-[#00F5FF] text-white rounded-lg hover:bg-[#0099CC] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {isReplying ? (
                      <>
                        <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                        <span>Envoi...</span>
                      </>
                    ) : (
                      <>
                        <Reply className="w-4 h-4" />
                        <span>Envoyer la réponse</span>
                      </>
                    )}
                  </button>
                </div>
              </div>
            </div>
          ) : (
            <div className="glass-card p-6 rounded-2xl border border-gray-700/50 text-center">
              <MessageSquare className="w-16 h-16 text-gray-500 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-gray-400 mb-2">Sélectionnez un contact</h3>
              <p className="text-gray-500 text-sm">
                Cliquez sur un contact dans la liste pour voir les détails et répondre
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}