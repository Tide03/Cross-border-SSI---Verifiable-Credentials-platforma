import React, { useEffect, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/app/components/ui/card';
import { Button } from '@/app/components/ui/button';
import { Input } from '@/app/components/ui/input';
import { Label } from '@/app/components/ui/label';
import { Textarea } from '@/app/components/ui/textarea';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/app/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/app/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/app/components/ui/select';
import { Badge } from '@/app/components/ui/badge';
import { Plus, FileText, Award, XCircle, Languages, Users, FileCheck, History, Download } from 'lucide-react';
import { api } from '@/lib/api';
import { toast } from 'sonner';
import { useTranslation, Language } from '@/lib/i18n';

interface IssuerDashboardProps {
  user: any;
}

export function IssuerDashboard({ user }: IssuerDashboardProps) {
  const [templates, setTemplates] = useState([]);
  const [issuedCredentials, setIssuedCredentials] = useState([]);
  const [learners, setLearners] = useState([]);
  const [loading, setLoading] = useState(true);
  const [language, setLanguage] = useState<Language>('en');
  const { t } = useTranslation(language);
  
  // Create Template State
  const [showCreateTemplate, setShowCreateTemplate] = useState(false);
  const [templateName, setTemplateName] = useState('');
  const [templateDesc, setTemplateDesc] = useState('');
  const [templateFields, setTemplateFields] = useState('{}');
  
  // Issue Credential State
  const [showIssueDialog, setShowIssueDialog] = useState(false);
  const [selectedTemplate, setSelectedTemplate] = useState<any>(null);
  const [selectedLearner, setSelectedLearner] = useState('');
  const [credentialData, setCredentialData] = useState('{}');
  const [expirationDate, setExpirationDate] = useState('');
  
  // Batch Issue State
  const [showBatchDialog, setShowBatchDialog] = useState(false);
  const [batchData, setBatchData] = useState('');
  
  // Template Versions
  const [templateVersions, setTemplateVersions] = useState<any[]>([]);
  const [showVersions, setShowVersions] = useState(false);
  
  // Revocation Policy
  const [revocationReason, setRevocationReason] = useState('');
  
  // Audit Reports
  const [auditLogs, setAuditLogs] = useState<any[]>([]);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const [templatesData, issuedData, learnersData] = await Promise.all([
        api.getTemplates(),
        api.getIssuedCredentials(),
        api.getLearners(),
      ]);
      
      setTemplates(templatesData.templates || []);
      setIssuedCredentials(issuedData.credentials || []);
      setLearners(learnersData.learners || []);
    } catch (error: any) {
      toast.error(error.message || 'Failed to load data');
      console.error('Load data error:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateTemplate = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      const fieldsObj = JSON.parse(templateFields);
      await api.createTemplate(templateName, templateDesc, fieldsObj);
      toast.success('Template created successfully');
      setShowCreateTemplate(false);
      setTemplateName('');
      setTemplateDesc('');
      setTemplateFields('{}');
      loadData();
    } catch (error: any) {
      toast.error(error.message || 'Failed to create template');
      console.error('Create template error:', error);
    }
  };

  const handleIssueCredential = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      const dataObj = JSON.parse(credentialData);
      const learner = learners.find((l: any) => l.id === selectedLearner);
      
      if (!learner) {
        toast.error('Please select a learner');
        return;
      }
      
      await api.issueCredential(
        selectedTemplate.id,
        learner.email,
        dataObj,
        expirationDate || undefined
      );
      
      toast.success('Credential issued successfully');
      setShowIssueDialog(false);
      setSelectedTemplate(null);
      setSelectedLearner('');
      setCredentialData('{}');
      setExpirationDate('');
      loadData();
    } catch (error: any) {
      toast.error(error.message || 'Failed to issue credential');
      console.error('Issue credential error:', error);
    }
  };

  const handleBatchIssue = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      const batch = JSON.parse(batchData);
      if (!Array.isArray(batch)) {
        toast.error('Batch data must be an array');
        return;
      }
      
      let successCount = 0;
      for (const item of batch) {
        try {
          await api.issueCredential(
            selectedTemplate.id,
            item.email,
            item.data,
            item.expirationDate
          );
          successCount++;
        } catch (error) {
          console.error(`Failed to issue to ${item.email}:`, error);
        }
      }
      
      toast.success(`Issued ${successCount} out of ${batch.length} credentials`);
      setShowBatchDialog(false);
      setBatchData('');
      loadData();
    } catch (error: any) {
      toast.error(error.message || 'Failed to batch issue');
      console.error('Batch issue error:', error);
    }
  };

  const handleRevokeCredential = async (credentialId: string) => {
    if (!confirm(t('revoke') + '?')) return;
    
    try {
      await api.revokeCredential(credentialId);
      
      // Log to audit
      const auditEntry = {
        timestamp: new Date().toISOString(),
        action: 'REVOKE',
        credentialId,
        reason: revocationReason || 'Not specified',
        issuer: user.did,
      };
      setAuditLogs([auditEntry, ...auditLogs]);
      
      toast.success('Credential revoked successfully');
      loadData();
    } catch (error: any) {
      toast.error(error.message || 'Failed to revoke credential');
      console.error('Revoke credential error:', error);
    }
  };
  
  const exportAuditReport = () => {
    const dataStr = JSON.stringify(auditLogs, null, 2);
    const dataUri = 'data:application/json;charset=utf-8,' + encodeURIComponent(dataStr);
    const exportFileDefaultName = `audit-report-${Date.now()}.json`;
    
    const linkElement = document.createElement('a');
    linkElement.setAttribute('href', dataUri);
    linkElement.setAttribute('download', exportFileDefaultName);
    linkElement.click();
    
    toast.success('Audit report exported');
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading issuer dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6 max-w-7xl">
      <div className="mb-8">
        <div className="flex justify-between items-start">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">{t('issuerDashboard')}</h1>
            <p className="text-gray-600 mt-2">{t('createTemplates')}</p>
          </div>
          <div className="flex items-center gap-2">
            <Languages className="w-4 h-4 text-gray-600" />
            <Select value={language} onValueChange={(val) => setLanguage(val as Language)}>
              <SelectTrigger className="w-[120px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="en">English</SelectItem>
                <SelectItem value="sl">Slovenščina</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      </div>

      <Tabs defaultValue="templates" className="space-y-6">
        <TabsList>
          <TabsTrigger value="templates">{t('templates')}</TabsTrigger>
          <TabsTrigger value="issued">{t('issuedCredentials')}</TabsTrigger>
          <TabsTrigger value="audit">{t('auditReports')}</TabsTrigger>
        </TabsList>

        <TabsContent value="templates" className="space-y-4">
          <div className="flex justify-between items-center">
            <h2 className="text-2xl font-semibold">{t('templates')}</h2>
            <Dialog open={showCreateTemplate} onOpenChange={setShowCreateTemplate}>
              <DialogTrigger asChild>
                <Button>
                  <Plus className="w-4 h-4 mr-2" />
                  {t('createTemplate')}
                </Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-[600px]">
                <DialogHeader>
                  <DialogTitle>Create Credential Template</DialogTitle>
                  <DialogDescription>
                    Define the structure of credentials you'll issue
                  </DialogDescription>
                </DialogHeader>
                <form onSubmit={handleCreateTemplate} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="template-name">Template Name</Label>
                    <Input
                      id="template-name"
                      placeholder="e.g., Blockchain Certificate"
                      value={templateName}
                      onChange={(e) => setTemplateName(e.target.value)}
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="template-desc">Description</Label>
                    <Textarea
                      id="template-desc"
                      placeholder="Describe this credential type..."
                      value={templateDesc}
                      onChange={(e) => setTemplateDesc(e.target.value)}
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="template-fields">Credential Subject Fields (JSON)</Label>
                    <Textarea
                      id="template-fields"
                      placeholder='{"courseName": {"type": "string", "label": "Course Name", "required": true}}'
                      value={templateFields}
                      onChange={(e) => setTemplateFields(e.target.value)}
                      rows={6}
                      className="font-mono text-sm"
                      required
                    />
                    <p className="text-xs text-gray-500">
                      Define fields that will be included in credentials
                    </p>
                  </div>
                  <div className="flex justify-end gap-2">
                    <Button type="button" variant="outline" onClick={() => setShowCreateTemplate(false)}>
                      {t('cancel')}
                    </Button>
                    <Button type="submit">{t('createTemplate')}</Button>
                  </div>
                </form>
              </DialogContent>
            </Dialog>
          </div>

          {templates.length === 0 ? (
            <Card>
              <CardContent className="flex flex-col items-center justify-center py-12">
                <FileText className="w-16 h-16 text-gray-400 mb-4" />
                <h3 className="text-lg font-semibold text-gray-900 mb-2">{t('noTemplates')}</h3>
                <p className="text-gray-600 text-center max-w-md mb-4">
                  {t('noTemplatesDesc')}
                </p>
              </CardContent>
            </Card>
          ) : (
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {templates.map((template: any) => (
                <Card key={template.id} className="hover:shadow-lg transition-shadow">
                  <CardHeader>
                    <FileText className="w-8 h-8 text-indigo-600 mb-2" />
                    <CardTitle>{template.name}</CardTitle>
                    <CardDescription>{template.description}</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2">
                      <p className="text-sm text-gray-600">
                        Fields: {Object.keys(template.credentialSubject).length}
                      </p>
                      <div className="flex gap-2">
                        <Button
                          className="flex-1"
                          onClick={() => {
                            setSelectedTemplate(template);
                            setShowIssueDialog(true);
                          }}
                        >
                          <Award className="w-4 h-4 mr-2" />
                          {t('issueCredential')}
                        </Button>
                        <Button
                          variant="outline"
                          onClick={() => {
                            setSelectedTemplate(template);
                            setShowBatchDialog(true);
                          }}
                        >
                          <Users className="w-4 h-4" />
                        </Button>
                      </div>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="w-full"
                        onClick={() => {
                          setTemplateVersions([{ ...template, version: '1.0', timestamp: new Date().toISOString() }]);
                          setShowVersions(true);
                        }}
                      >
                        <History className="w-3 h-3 mr-1" />
                        {t('templateVersions')}
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="issued" className="space-y-4">
          <h2 className="text-2xl font-semibold">Issued Credentials</h2>
          
          {issuedCredentials.length === 0 ? (
            <Card>
              <CardContent className="flex flex-col items-center justify-center py-12">
                <Award className="w-16 h-16 text-gray-400 mb-4" />
                <h3 className="text-lg font-semibold text-gray-900 mb-2">{t('noCredentialsIssued')}</h3>
                <p className="text-gray-600 text-center max-w-md">
                  {t('startIssuing')}
                </p>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-3">
              {issuedCredentials.map((cred: any) => (
                <Card key={cred.id}>
                  <CardContent className="flex items-center justify-between p-4">
                    <div className="flex-1">
                      <h3 className="font-semibold">{cred.credential.type[1] || 'Credential'}</h3>
                      <p className="text-sm text-gray-600">
                        Learner DID: {cred.learnerDid.slice(0, 40)}...
                      </p>
                      <p className="text-sm text-gray-500">
                        Issued: {new Date(cred.issuedAt).toLocaleString()}
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge className={cred.status === 'active' ? 'bg-green-500' : 'bg-red-500'}>
                        {cred.status}
                      </Badge>
                      {cred.status === 'active' && (
                        <Button
                          variant="destructive"
                          size="sm"
                          onClick={() => handleRevokeCredential(cred.id)}
                        >
                          <XCircle className="w-4 h-4 mr-1" />
                          Revoke
                        </Button>
                      )}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>

        {/* Audit Reports Tab */}
        <TabsContent value="audit" className="space-y-4">
          <div className="flex justify-between items-center">
            <h2 className="text-2xl font-semibold">{t('auditReports')}</h2>
            <Button onClick={exportAuditReport} disabled={auditLogs.length === 0}>
              <Download className="w-4 h-4 mr-2" />
              Export Report
            </Button>
          </div>
          <Card>
            <CardHeader>
              <CardTitle>{t('activityLog')}</CardTitle>
              <CardDescription>{t('trackActivity')}</CardDescription>
            </CardHeader>
            <CardContent>
              {auditLogs.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  <FileCheck className="w-12 h-12 mx-auto mb-3 text-gray-400" />
                  <p>{t('noAuditLogs')}</p>
                </div>
              ) : (
                <div className="space-y-2">
                  {auditLogs.map((log, idx) => (
                    <div key={idx} className="p-3 bg-gray-50 rounded-lg">
                      <div className="flex items-center justify-between">
                        <div>
                          <Badge className={log.action === 'REVOKE' ? 'bg-red-500' : 'bg-green-500'}>
                            {log.action}
                          </Badge>
                          <p className="text-sm text-gray-600 mt-1">
                            {new Date(log.timestamp).toLocaleString()}
                          </p>
                        </div>
                        <p className="text-sm text-gray-700">
                          Reason: {log.reason}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Batch Issue Dialog */}
      <Dialog open={showBatchDialog} onOpenChange={setShowBatchDialog}>
        <DialogContent className="sm:max-w-[700px]">
          <DialogHeader>
            <DialogTitle>{t('batchIssue')}</DialogTitle>
            <DialogDescription>
              {t('issueMultiple')}
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleBatchIssue} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="batch-data">Batch Data (JSON Array)</Label>
              <Textarea
                id="batch-data"
                placeholder='[{"email": "learner1@example.com", "data": {"courseName": "Course 1"}, "expirationDate": "2027-01-01"}, ...]'
                value={batchData}
                onChange={(e) => setBatchData(e.target.value)}
                rows={10}
                className="font-mono text-sm"
                required
              />
              <p className="text-xs text-gray-500">
                Provide an array of objects with email, data, and optional expirationDate
              </p>
            </div>
            <div className="flex justify-end gap-2">
              <Button type="button" variant="outline" onClick={() => setShowBatchDialog(false)}>
                {t('cancel')}
              </Button>
              <Button type="submit">
                <Users className="w-4 h-4 mr-2" />
                Issue Batch
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {/* Template Versions Dialog */}
      <Dialog open={showVersions} onOpenChange={setShowVersions}>
        <DialogContent className="sm:max-w-[600px]">
          <DialogHeader>
            <DialogTitle>{t('templateVersions')}</DialogTitle>
            <DialogDescription>
              {t('versionHistory')}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-3">
            {templateVersions.map((version, idx) => (
              <div key={idx} className="p-3 bg-gray-50 rounded-lg">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium">Version {version.version}</p>
                    <p className="text-sm text-gray-600">
                      {new Date(version.timestamp).toLocaleString()}
                    </p>
                  </div>
                  <Badge>Current</Badge>
                </div>
              </div>
            ))}
          </div>
        </DialogContent>
      </Dialog>

      {/* Issue Credential Dialog */}
      <Dialog open={showIssueDialog} onOpenChange={setShowIssueDialog}>
        <DialogContent className="sm:max-w-[600px]">
          <DialogHeader>
            <DialogTitle>Issue Credential</DialogTitle>
            <DialogDescription>
              {selectedTemplate && `Issue a ${selectedTemplate.name} credential to a learner`}
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleIssueCredential} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="learner">Select Learner</Label>
              <Select value={selectedLearner} onValueChange={setSelectedLearner}>
                <SelectTrigger>
                  <SelectValue placeholder="Choose a learner" />
                </SelectTrigger>
                <SelectContent>
                  {learners.map((learner: any) => (
                    <SelectItem key={learner.id} value={learner.id}>
                      {learner.name} ({learner.email})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="cred-data">Credential Data (JSON)</Label>
              <Textarea
                id="cred-data"
                placeholder='{"courseName": "Advanced Blockchain", "grade": "A", "completionDate": "2026-01-16"}'
                value={credentialData}
                onChange={(e) => setCredentialData(e.target.value)}
                rows={6}
                className="font-mono text-sm"
                required
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="expiration">Expiration Date (Optional)</Label>
              <Input
                id="expiration"
                type="date"
                value={expirationDate}
                onChange={(e) => setExpirationDate(e.target.value)}
              />
            </div>
            
            <div className="flex justify-end gap-2">
              <Button type="button" variant="outline" onClick={() => setShowIssueDialog(false)}>
                Cancel
              </Button>
              <Button type="submit">Issue Credential</Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
