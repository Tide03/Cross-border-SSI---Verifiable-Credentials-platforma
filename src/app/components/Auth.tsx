import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/app/components/ui/card';
import { Button } from '@/app/components/ui/button';
import { Input } from '@/app/components/ui/input';
import { Label } from '@/app/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/app/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/app/components/ui/select';
import { Shield, Lock, Languages } from 'lucide-react';
import { api } from '@/lib/api';
import { toast } from 'sonner';
import { useTranslation, Language } from '@/lib/i18n';

interface AuthProps {
  onAuthSuccess: (token: string, user: any) => void;
}

export function Auth({ onAuthSuccess }: AuthProps) {
  const [isSignIn, setIsSignIn] = useState(true);
  const [loading, setLoading] = useState(false);
  const [language, setLanguage] = useState<Language>('en');
  const { t } = useTranslation(language);
  
  // Sign In State
  const [signInEmail, setSignInEmail] = useState('');
  const [signInPassword, setSignInPassword] = useState('');
  
  // Sign Up State
  const [signUpEmail, setSignUpEmail] = useState('');
  const [signUpPassword, setSignUpPassword] = useState('');
  const [signUpName, setSignUpName] = useState('');
  const [signUpRole, setSignUpRole] = useState<'learner' | 'issuer' | 'verifier'>('learner');

  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    
    try {
      const data = await api.signin(signInEmail, signInPassword);
      api.setToken(data.accessToken);
      toast.success('Signed in successfully!');
      onAuthSuccess(data.accessToken, data.user);
    } catch (error: any) {
      toast.error(error.message || 'Sign in failed');
      console.error('Sign in error:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    
    try {
      await api.signup(signUpEmail, signUpPassword, signUpName, signUpRole);
      toast.success('Account created! Signing you in...');
      
      // Automatically sign in after successful signup
      const data = await api.signin(signUpEmail, signUpPassword);
      api.setToken(data.accessToken);
      toast.success('Signed in successfully!');
      onAuthSuccess(data.accessToken, data.user);
    } catch (error: any) {
      toast.error(error.message || 'Sign up failed');
      console.error('Sign up error:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100 p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="space-y-1">
          <div className="flex items-center justify-between mb-4">
            <div className="bg-indigo-600 p-3 rounded-full">
              <Shield className="w-8 h-8 text-white" />
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
          <CardTitle className="text-2xl text-center">{t('appTitle')}</CardTitle>
          <CardDescription className="text-center">
            {t('appSubtitle')}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Tabs value={isSignIn ? 'signin' : 'signup'} onValueChange={(v) => setIsSignIn(v === 'signin')}>
            <TabsList className="grid w-full grid-cols-2" aria-label="Authentication tabs">
              <TabsTrigger value="signin">{t('signIn')}</TabsTrigger>
              <TabsTrigger value="signup">{t('signUp')}</TabsTrigger>
            </TabsList>
            
            <TabsContent value="signin">
              <form onSubmit={handleSignIn} className="space-y-4" aria-label="Sign in form">
                <div className="space-y-2">
                  <Label htmlFor="signin-email">{t('email')}</Label>
                  <Input
                    id="signin-email"
                    type="email"
                    placeholder="your@email.com"
                    value={signInEmail}
                    onChange={(e) => setSignInEmail(e.target.value)}
                    aria-required="true"
                    aria-label="Email address"
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="signin-password">{t('password')}</Label>
                  <Input
                    id="signin-password"
                    type="password"
                    value={signInPassword}
                    onChange={(e) => setSignInPassword(e.target.value)}
                    aria-required="true"
                    aria-label="Password"
                    required
                  />
                </div>
                <Button type="submit" className="w-full" disabled={loading} aria-label={t('signIn')}>
                  <Lock className="w-4 h-4 mr-2" aria-hidden="true" />
                  {loading ? t('loading') : t('signIn')}
                </Button>
              </form>
            </TabsContent>
            
            <TabsContent value="signup">
              <form onSubmit={handleSignUp} className="space-y-4" aria-label="Sign up form">
                <div className="space-y-2">
                  <Label htmlFor="signup-name">{t('name')}</Label>
                  <Input
                    id="signup-name"
                    placeholder="John Doe"
                    value={signUpName}
                    onChange={(e) => setSignUpName(e.target.value)}
                    aria-required="true"
                    aria-label="Full name"
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="signup-email">{t('email')}</Label>
                  <Input
                    id="signup-email"
                    type="email"
                    placeholder="your@email.com"
                    value={signUpEmail}
                    onChange={(e) => setSignUpEmail(e.target.value)}
                    aria-required="true"
                    aria-label="Email address"
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="signup-password">{t('password')}</Label>
                  <Input
                    id="signup-password"
                    type="password"
                    value={signUpPassword}
                    onChange={(e) => setSignUpPassword(e.target.value)}
                    aria-required="true"
                    aria-label="Password"
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="signup-role">{t('role')}</Label>
                  <Select value={signUpRole} onValueChange={(v: any) => setSignUpRole(v)}>
                    <SelectTrigger aria-label="Select role">
                      <SelectValue placeholder={`Select ${t('role')}`} />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="learner">{t('learner')}</SelectItem>
                      <SelectItem value="issuer">{t('issuer')}</SelectItem>
                      <SelectItem value="verifier">{t('verifier')}</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <Button type="submit" className="w-full" disabled={loading} aria-label={t('signUp')}>
                  <Shield className="w-4 h-4 mr-2" aria-hidden="true" />
                  {loading ? t('creatingAccount') : t('signUp')}
                </Button>
              </form>
            </TabsContent>
          </Tabs>
          
          {/* GDPR & Legal Notice */}
          <div className="mt-6 p-3 bg-gray-50 rounded-lg border border-gray-200">
            <p className="text-xs text-gray-600 text-center">
              <Shield className="w-3 h-3 inline mr-1" aria-hidden="true" />
              {t('gdprCompliant')} • {t('dataResidency')} • {t('privacyPolicy')}
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
