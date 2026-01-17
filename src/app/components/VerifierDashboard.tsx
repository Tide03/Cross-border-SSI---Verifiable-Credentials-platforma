import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/app/components/ui/card';
import { Button } from '@/app/components/ui/button';
import { Textarea } from '@/app/components/ui/textarea';
import { Label } from '@/app/components/ui/label';
import { Badge } from '@/app/components/ui/badge';
import { Alert, AlertDescription } from '@/app/components/ui/alert';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/app/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/app/components/ui/select';
import { CheckCircle2, XCircle, Shield, FileCheck, AlertCircle, QrCode, Download, Languages } from 'lucide-react';
import { api } from '@/lib/api';
import { toast } from 'sonner';
import { useTranslation, Language } from '@/lib/i18n';

interface VerifierDashboardProps {
  user: any;
}

export function VerifierDashboard({ user }: VerifierDashboardProps) {
  const [credentialInput, setCredentialInput] = useState('');
  const [verificationResult, setVerificationResult] = useState<any>(null);
  const [verifying, setVerifying] = useState(false);
  const [language, setLanguage] = useState<Language>('en');
  const { t } = useTranslation(language);
  const [activeTab, setActiveTab] = useState('paste');

  const handleVerify = async (e: React.FormEvent) => {
    e.preventDefault();
    setVerifying(true);
    setVerificationResult(null);
    
    try {
      const credential = JSON.parse(credentialInput);
      const result = await api.verifyCredential(credential);
      setVerificationResult(result.verification);
      
      if (result.verification.valid) {
        toast.success('Credential verified successfully');
      } else {
        toast.error('Credential verification failed');
      }
    } catch (error: any) {
      toast.error(error.message || 'Failed to verify credential');
      console.error('Verify credential error:', error);
    } finally {
      setVerifying(false);
    }
  };
  
  const exportReceipt = () => {
    if (!verificationResult) return;
    
    const receipt = {
      timestamp: new Date().toISOString(),
      verifier: user.did,
      result: verificationResult.valid ? 'PASS' : 'FAIL',
      checks: verificationResult.checks,
      // No PII - only verification metadata
    };
    
    const dataStr = JSON.stringify(receipt, null, 2);
    const dataUri = 'data:application/json;charset=utf-8,' + encodeURIComponent(dataStr);
    const exportFileDefaultName = `verification-receipt-${Date.now()}.json`;
    
    const linkElement = document.createElement('a');
    linkElement.setAttribute('href', dataUri);
    linkElement.setAttribute('download', exportFileDefaultName);
    linkElement.click();
    
    toast.success(t('exportReceipt') + ' successful');
  };

  const renderCheckItem = (label: string, passed: boolean, details?: string) => (
    <div className="p-3 bg-gray-50 rounded-lg">
      <div className="flex items-center justify-between mb-1">
        <span className="text-sm font-medium text-gray-700">{label}</span>
        {passed ? (
          <CheckCircle2 className="w-5 h-5 text-green-600" />
        ) : (
          <XCircle className="w-5 h-5 text-red-600" />
        )}
      </div>
      {details && (
        <p className="text-xs text-gray-600 mt-1">{details}</p>
      )}
    </div>
  );

  return (
    <div className="container mx-auto p-6 max-w-4xl">
      <div className="mb-8">
        <div className="flex justify-between items-start">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">{t('verifierDashboard')}</h1>
            <p className="text-gray-600 mt-2">{t('verifyAuthenticity')}</p>
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

      <div className="grid gap-6">
        {/* Verification Input Card */}
        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <Shield className="w-6 h-6 text-indigo-600" />
              <CardTitle>{t('verifyCredential')}</CardTitle>
            </div>
            <CardDescription>
              {t('scanQR')} or {t('pasteJSON')}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="paste">
                  <FileCheck className="w-4 h-4 mr-2" />
                  {t('pasteJSON')}
                </TabsTrigger>
                <TabsTrigger value="scan">
                  <QrCode className="w-4 h-4 mr-2" />
                  {t('scanQR')}
                </TabsTrigger>
              </TabsList>
              
              <TabsContent value="paste" className="space-y-4">
                <form onSubmit={handleVerify} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="credential-json">Credential JSON</Label>
                    <Textarea
                      id="credential-json"
                      placeholder='Paste the verifiable credential JSON here...'
                      value={credentialInput}
                      onChange={(e) => setCredentialInput(e.target.value)}
                      rows={12}
                      className="font-mono text-sm"
                      required
                    />
                  </div>
                  <Button type="submit" className="w-full" disabled={verifying}>
                    <FileCheck className="w-4 h-4 mr-2" />
                    {verifying ? t('verifyingCredential') : t('verifyCredential')}
                  </Button>
                </form>
              </TabsContent>
              
              <TabsContent value="scan" className="space-y-4">
                <div className="p-8 bg-gray-50 rounded-lg border-2 border-dashed border-gray-300 text-center">
                  <QrCode className="w-16 h-16 mx-auto mb-4 text-gray-400" />
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">{t('qrScanner')}</h3>
                  <p className="text-gray-600 mb-4">
                    {t('qrScannerDesc')}
                  </p>
                  <p className="text-sm text-gray-500">
                    {t('qrNote')}
                  </p>
                </div>
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>

        {/* Verification Results Card */}
        {verificationResult && (
          <Card className={verificationResult.valid ? 'border-green-500' : 'border-red-500'}>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>{t('verificationResults')}</CardTitle>
                <div className="flex items-center gap-2">
                  <Badge className={verificationResult.valid ? 'bg-green-500' : 'bg-red-500'}>
                    {verificationResult.valid ? (
                      <><CheckCircle2 className="w-4 h-4 mr-1" /> {t('valid')}</>
                    ) : (
                      <><XCircle className="w-4 h-4 mr-1" /> {t('invalid')}</>
                    )}
                  </Badge>
                  <Button variant="outline" size="sm" onClick={exportReceipt}>
                    <Download className="w-3 h-3 mr-1" />
                    {t('exportReceipt')}
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              {verificationResult.error && (
                <Alert variant="destructive">
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>
                    {verificationResult.error}
                  </AlertDescription>
                </Alert>
              )}

              <div className="space-y-2">
                <h3 className="font-semibold text-sm text-gray-700 mb-3">{t('verificationReasons')}</h3>
                {renderCheckItem(
                  t('signatureValid'), 
                  verificationResult.checks.signatureValid,
                  t('signatureDesc')
                )}
                {renderCheckItem(
                  t('issuerValid'), 
                  verificationResult.checks.issuerValid,
                  t('issuerDesc')
                )}
                {renderCheckItem(
                  t('notRevoked'), 
                  verificationResult.checks.notRevoked,
                  t('revokedDesc')
                )}
                {renderCheckItem(
                  t('notExpired'), 
                  verificationResult.checks.notExpired,
                  t('expiredDesc')
                )}
              </div>

              {verificationResult.valid && (
                <div className="mt-6 p-4 bg-green-50 rounded-lg border border-green-200">
                  <div className="flex items-start gap-3">
                    <CheckCircle2 className="w-6 h-6 text-green-600 mt-0.5" />
                    <div>
                      <h4 className="font-semibold text-green-900">Credential Verified</h4>
                      <p className="text-sm text-green-700 mt-1">
                        This credential is authentic and has been cryptographically verified.
                        All checks passed successfully.
                      </p>
                    </div>
                  </div>
                </div>
              )}

              {!verificationResult.valid && (
                <div className="mt-6 p-4 bg-red-50 rounded-lg border border-red-200">
                  <div className="flex items-start gap-3">
                    <XCircle className="w-6 h-6 text-red-600 mt-0.5" />
                    <div>
                      <h4 className="font-semibold text-red-900">Verification Failed</h4>
                      <p className="text-sm text-red-700 mt-1">
                        This credential could not be verified. Please check the credential
                        data or contact the issuer.
                      </p>
                    </div>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        )}

        {/* Info Card */}
        <Card className="bg-blue-50 border-blue-200">
          <CardHeader>
            <CardTitle className="text-blue-900">How Verification Works</CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="space-y-2 text-sm text-blue-800">
              <li className="flex gap-2">
                <CheckCircle2 className="w-4 h-4 mt-0.5 flex-shrink-0" />
                <span><strong>Signature Verification:</strong> Checks if the credential was signed by the claimed issuer using their private key</span>
              </li>
              <li className="flex gap-2">
                <CheckCircle2 className="w-4 h-4 mt-0.5 flex-shrink-0" />
                <span><strong>Issuer Resolution:</strong> Verifies the issuer's DID can be resolved and is valid</span>
              </li>
              <li className="flex gap-2">
                <CheckCircle2 className="w-4 h-4 mt-0.5 flex-shrink-0" />
                <span><strong>Revocation Check:</strong> Ensures the credential hasn't been revoked by the issuer</span>
              </li>
              <li className="flex gap-2">
                <CheckCircle2 className="w-4 h-4 mt-0.5 flex-shrink-0" />
                <span><strong>Expiration Check:</strong> Validates the credential hasn't expired</span>
              </li>
            </ul>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
