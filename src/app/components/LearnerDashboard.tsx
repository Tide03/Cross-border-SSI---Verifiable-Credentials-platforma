import React, { useEffect, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/app/components/ui/card';
import { Button } from '@/app/components/ui/button';
import { Badge } from '@/app/components/ui/badge';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/app/components/ui/dialog';
import { Checkbox } from '@/app/components/ui/checkbox';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/app/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/app/components/ui/select';
import { Label } from '@/app/components/ui/label';
import { Award, Calendar, CheckCircle2, XCircle, Share2, Download, QrCode, History, Inbox, Languages, Info } from 'lucide-react';
import { api } from '@/lib/api';
import { toast } from 'sonner';
import { QRCodeSVG } from 'qrcode.react';
import { useTranslation, Language } from '@/lib/i18n';

interface LearnerDashboardProps {
  user: any;
}

interface ShareRecord {
  id: string;
  credentialId: string;
  sharedWith: string;
  attributes: string[];
  timestamp: string;
  purpose: string;
}

export function LearnerDashboard({ user }: LearnerDashboardProps) {
  const [credentials, setCredentials] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedCredential, setSelectedCredential] = useState<any>(null);
  const [showQR, setShowQR] = useState(false);
  const [language, setLanguage] = useState<Language>('en');
  const { t } = useTranslation(language);
  
  // Selective disclosure
  const [selectedAttributes, setSelectedAttributes] = useState<string[]>([]);
  const [showAttributeSelector, setShowAttributeSelector] = useState(false);
  
  // Share history
  const [shareHistory, setShareHistory] = useState<ShareRecord[]>([]);
  
  // Consent
  const [showConsent, setShowConsent] = useState(false);
  const [consentData, setConsentData] = useState({ what: '', who: '', why: '' });

  useEffect(() => {
    loadCredentials();
  }, []);

  const loadCredentials = async () => {
    try {
      const data = await api.getCredentials();
      setCredentials(data.credentials || []);
    } catch (error: any) {
      toast.error(error.message || 'Failed to load credentials');
      console.error('Load credentials error:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleDownloadCredential = (cred: any) => {
    const dataStr = JSON.stringify(cred.credential, null, 2);
    const dataUri = 'data:application/json;charset=utf-8,' + encodeURIComponent(dataStr);
    const exportFileDefaultName = `credential-${cred.id.split(':')[2]}.json`;
    
    const linkElement = document.createElement('a');
    linkElement.setAttribute('href', dataUri);
    linkElement.setAttribute('download', exportFileDefaultName);
    linkElement.click();
    
    toast.success('Credential downloaded successfully');
  };

  const handleShareCredential = (cred: any) => {
    setSelectedCredential(cred);
    // Show attribute selector for selective disclosure
    const attrs = Object.keys(cred.credential.credentialSubject || {}).filter(k => k !== 'id');
    setSelectedAttributes(attrs); // Pre-select all attributes
    setShowAttributeSelector(true);
  };

  const handleConfirmShare = (verifierName: string, purpose: string) => {
    // Show consent dialog
    const attributesList = selectedAttributes.map(attr => 
      `${attr}: ${selectedCredential.credential.credentialSubject[attr]}`
    ).join(', ');
    
    setConsentData({
      what: attributesList,
      who: verifierName,
      why: purpose,
    });
    setShowConsent(true);
  };

  const handleConsentAccept = () => {
    // Create filtered credential with selected attributes only
    const filteredCredential = {
      ...selectedCredential.credential,
      credentialSubject: {
        id: selectedCredential.credential.credentialSubject.id,
        ...selectedAttributes.reduce((acc, attr) => {
          acc[attr] = selectedCredential.credential.credentialSubject[attr];
          return acc;
        }, {} as any)
      }
    };
    
    // Record in share history
    const shareRecord: ShareRecord = {
      id: `share-${Date.now()}`,
      credentialId: selectedCredential.id,
      sharedWith: consentData.who,
      attributes: selectedAttributes,
      timestamp: new Date().toISOString(),
      purpose: consentData.why,
    };
    setShareHistory([shareRecord, ...shareHistory]);
    
    // Show QR with filtered credential
    setSelectedCredential({ ...selectedCredential, credential: filteredCredential });
    setShowConsent(false);
    setShowAttributeSelector(false);
    setShowQR(true);
    
    toast.success(t('share') + ' successful');
  };

  const getStatusColor = (status: string) => {
    return status === 'active' ? 'bg-green-500' : 'bg-red-500';
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading your credentials...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6 max-w-6xl">
      <div className="mb-8">
        <div className="flex justify-between items-start">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">{t('myCredentials')}</h1>
            <p className="text-gray-600 mt-2">{t('manageCredentials')}</p>
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
        <div className="mt-4 p-4 bg-blue-50 rounded-lg">
          <p className="text-sm text-blue-900"><strong>DID:</strong> {user.did}</p>
        </div>
        
        {/* Onboarding hint */}
        {credentials.length === 0 && (
          <div className="mt-4 p-4 bg-purple-50 rounded-lg border border-purple-200">
            <div className="flex items-start gap-3">
              <Info className="w-5 h-5 text-purple-600 mt-0.5" />
              <div>
                <h4 className="font-semibold text-purple-900">{t('welcomeWallet')}</h4>
                <p className="text-sm text-purple-700 mt-1">
                  {t('connectIssuers')}
                </p>
              </div>
            </div>
          </div>
        )}
      </div>

      <Tabs defaultValue="credentials" className="space-y-6">
        <TabsList>
          <TabsTrigger value="credentials">
            <Award className="w-4 h-4 mr-2" />
            {t('myCredentials')}
          </TabsTrigger>
          <TabsTrigger value="inbox">
            <Inbox className="w-4 h-4 mr-2" />
            {t('inbox')}
          </TabsTrigger>
          <TabsTrigger value="history">
            <History className="w-4 h-4 mr-2" />
            {t('shareHistory')}
          </TabsTrigger>
        </TabsList>

        <TabsContent value="credentials" className="space-y-4">
          {credentials.length === 0 ? (
            <Card>
              <CardContent className="flex flex-col items-center justify-center py-12">
                <Award className="w-16 h-16 text-gray-400 mb-4" />
                <h3 className="text-lg font-semibold text-gray-900 mb-2">{t('noCredentialsYet')}</h3>
                <p className="text-gray-600 text-center max-w-md">
                  {t('noCredentialsDesc')}
                </p>
              </CardContent>
            </Card>
          ) : (
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
              {credentials.map((cred: any) => (
            <Card key={cred.id} className="hover:shadow-lg transition-shadow">
              <CardHeader>
                <div className="flex items-start justify-between">
                  <Award className="w-8 h-8 text-indigo-600" />
                  <Badge className={getStatusColor(cred.status)}>
                    {cred.status === 'active' ? (
                      <><CheckCircle2 className="w-3 h-3 mr-1" /> Active</>
                    ) : (
                      <><XCircle className="w-3 h-3 mr-1" /> Revoked</>
                    )}
                  </Badge>
                </div>
                <CardTitle className="mt-4">
                  {cred.credential.type[1] || 'Credential'}
                </CardTitle>
                <CardDescription className="flex items-center gap-1 mt-2">
                  <Calendar className="w-3 h-3" />
                  Issued {new Date(cred.issuedAt).toLocaleDateString()}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="text-sm">
                    <p className="text-gray-600 font-medium">Issuer DID:</p>
                    <p className="text-xs text-gray-800 break-all">{cred.issuerDid}</p>
                  </div>
                  
                  {cred.credential.expirationDate && (
                    <div className="text-sm">
                      <p className="text-gray-600 font-medium">Expires:</p>
                      <p className="text-gray-800">{new Date(cred.credential.expirationDate).toLocaleDateString()}</p>
                    </div>
                  )}

                  <div className="flex gap-2 mt-4">
                    <Button
                      variant="outline"
                      size="sm"
                      className="flex-1"
                      onClick={() => handleShareCredential(cred)}
                      disabled={cred.status !== 'active'}
                    >
                      <Share2 className="w-3 h-3 mr-1" />
                      {t('share')}
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      className="flex-1"
                      onClick={() => handleDownloadCredential(cred)}
                    >
                      <Download className="w-3 h-3 mr-1" />
                      {t('download')}
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
            ))}
          </div>
        )}
        </TabsContent>

        {/* Inbox Tab */}
        <TabsContent value="inbox" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>{t('inbox')}</CardTitle>
              <CardDescription>{t('recentlyReceived')}</CardDescription>
            </CardHeader>
            <CardContent>
              {credentials.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  <Inbox className="w-12 h-12 mx-auto mb-3 text-gray-400" />
                  <p>{t('noNewCredentials')}</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {credentials.slice(0, 5).map((cred: any) => (
                    <div key={cred.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                      <div>
                        <p className="font-medium">{cred.credential.type[1] || 'Credential'}</p>
                        <p className="text-sm text-gray-600">
                          {t('issued')} {new Date(cred.issuedAt).toLocaleDateString()}
                        </p>
                      </div>
                      <Badge className={getStatusColor(cred.status)}>
                        {t(cred.status)}
                      </Badge>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Share History Tab */}
        <TabsContent value="history" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>{t('shareHistory')}</CardTitle>
              <CardDescription>Track when and with whom you've shared your credentials</CardDescription>
            </CardHeader>
            <CardContent>
              {shareHistory.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  <History className="w-12 h-12 mx-auto mb-3 text-gray-400" />
                  <p>{t('noSharingHistory')}</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {shareHistory.map((record) => (
                    <div key={record.id} className="p-4 bg-gray-50 rounded-lg">
                      <div className="flex items-start justify-between mb-2">
                        <div>
                          <p className="font-medium">{t('share')} with {record.sharedWith}</p>
                          <p className="text-sm text-gray-600">
                            {new Date(record.timestamp).toLocaleString()}
                          </p>
                        </div>
                      </div>
                      <div className="text-sm">
                        <p className="text-gray-600 mb-1">{t('sharedAttributes')}:</p>
                        <div className="flex flex-wrap gap-1">
                          {record.attributes.map(attr => (
                            <Badge key={attr} variant="outline" className="text-xs">
                              {attr}
                            </Badge>
                          ))}
                        </div>
                        <p className="text-gray-600 mt-2">{t('purpose')}: {record.purpose}</p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Attribute Selector Dialog */}
      <Dialog open={showAttributeSelector} onOpenChange={setShowAttributeSelector}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>{t('selectAttributes')}</DialogTitle>
            <DialogDescription>
              Choose which attributes you want to share
            </DialogDescription>
          </DialogHeader>
          {selectedCredential && (
            <div className="space-y-4">
              <div className="space-y-3">
                {Object.keys(selectedCredential.credential.credentialSubject || {})
                  .filter(key => key !== 'id')
                  .map(attr => (
                    <div key={attr} className="flex items-center space-x-2 p-3 bg-gray-50 rounded-lg">
                      <Checkbox
                        id={attr}
                        checked={selectedAttributes.includes(attr)}
                        onCheckedChange={(checked) => {
                          setSelectedAttributes(
                            checked 
                              ? [...selectedAttributes, attr]
                              : selectedAttributes.filter(a => a !== attr)
                          );
                        }}
                      />
                      <Label htmlFor={attr} className="flex-1 cursor-pointer">
                        <span className="font-medium">{attr}:</span> {selectedCredential.credential.credentialSubject[attr]}
                      </Label>
                    </div>
                  ))}
              </div>
              <div className="space-y-2">
                <Label>{t('verifierName')}</Label>
                <input
                  id="verifier-name"
                  type="text"
                  placeholder={t('whoWillVerify')}
                  className="w-full px-3 py-2 border rounded-md"
                />
                <Label>Purpose</Label>
                <input
                  id="purpose"
                  type="text"
                  placeholder="Why is this verification needed?"
                  className="w-full px-3 py-2 border rounded-md"
                />
              </div>
              <div className="flex justify-end gap-2">
                <Button variant="outline" onClick={() => setShowAttributeSelector(false)}>
                  {t('cancel')}
                </Button>
                <Button 
                  onClick={() => {
                    const verifierName = (document.getElementById('verifier-name') as HTMLInputElement)?.value || 'Unknown';
                    const purpose = (document.getElementById('purpose') as HTMLInputElement)?.value || 'Verification';
                    handleConfirmShare(verifierName, purpose);
                  }}
                  disabled={selectedAttributes.length === 0}
                >
                  Continue
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Consent Dialog */}
      <Dialog open={showConsent} onOpenChange={setShowConsent}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>{t('consentRequired')}</DialogTitle>
            <DialogDescription>
              Please review and confirm data sharing
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="p-4 bg-blue-50 rounded-lg">
              <h4 className="font-semibold text-blue-900 mb-2">{t('consentWhat')}</h4>
              <p className="text-sm text-blue-800">{consentData.what}</p>
            </div>
            <div className="p-4 bg-green-50 rounded-lg">
              <h4 className="font-semibold text-green-900 mb-2">{t('consentWho')}</h4>
              <p className="text-sm text-green-800">{consentData.who}</p>
            </div>
            <div className="p-4 bg-purple-50 rounded-lg">
              <h4 className="font-semibold text-purple-900 mb-2">{t('consentWhy')}</h4>
              <p className="text-sm text-purple-800">{consentData.why}</p>
            </div>
            <div className="flex items-start space-x-2 p-3 bg-yellow-50 rounded-lg border border-yellow-200">
              <Checkbox id="consent-checkbox" />
              <Label htmlFor="consent-checkbox" className="text-sm cursor-pointer">
                {t('consentAgree')}
              </Label>
            </div>
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setShowConsent(false)}>
                {t('cancel')}
              </Button>
              <Button onClick={handleConsentAccept}>
                {t('confirm')}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Share Dialog with QR Code */}
      <Dialog open={showQR} onOpenChange={setShowQR}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Share Credential</DialogTitle>
            <DialogDescription>
              Scan this QR code to verify the credential
            </DialogDescription>
          </DialogHeader>
          {selectedCredential && (
            <div className="flex flex-col items-center gap-4 py-4">
              <div className="bg-white p-4 rounded-lg shadow-sm">
                <QRCodeSVG
                  value={JSON.stringify(selectedCredential.credential)}
                  size={256}
                  level="H"
                />
              </div>
              <p className="text-sm text-gray-600 text-center">
                This QR code contains your verifiable credential
              </p>
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  navigator.clipboard.writeText(JSON.stringify(selectedCredential.credential, null, 2));
                  toast.success('Credential copied to clipboard');
                }}
              >
                Copy JSON
              </Button>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
