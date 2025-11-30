import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Application } from '@/types/application';
import { useApplications } from '@/hooks/useApplications';
import { COACHING_LIBRARY } from '@/data/coaching';
import { StatsCards } from '@/components/StatsCards';
import { ApplicationCard } from '@/components/ApplicationCard';
import { ApplicationForm } from '@/components/ApplicationForm';
import { CoachingPanel } from '@/components/CoachingPanel';
import { IntelligentTools } from '@/components/IntelligentTools';
import { EmailImportModal } from '@/components/EmailImportModal';
import { CVGeneratorModal } from '@/components/CVGeneratorModal';
import { LetterGeneratorModal } from '@/components/LetterGeneratorModal';
import { CalendarView } from '@/components/CalendarView';
import { TasksView } from '@/components/TasksView';
import { ProductivityView } from '@/components/ProductivityView';
import { DataManager } from '@/components/DataManager';
import { LocalStorageMigration } from '@/components/LocalStorageMigration';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Plus, Search, Target, BarChart3, Briefcase, Calendar as CalendarIcon, CheckCircle, Zap, Database, LogOut, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';

const Index = () => {
  const navigate = useNavigate();
  const { applications, loading, user, addApplication, updateApplication, deleteApplication, importApplications, refetch } = useApplications();
  const [searchQuery, setSearchQuery] = useState('');
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingApplication, setEditingApplication] = useState<Application | undefined>();
  const [isEmailImportOpen, setIsEmailImportOpen] = useState(false);
  const [isDataManagerOpen, setIsDataManagerOpen] = useState(false);
  const [selectedApplicationForCV, setSelectedApplicationForCV] = useState<Application | null>(null);
  const [selectedApplicationForLetter, setSelectedApplicationForLetter] = useState<Application | null>(null);
  const [activeTab, setActiveTab] = useState<'dashboard' | 'offres' | 'candidatures' | 'calendrier' | 'taches' | 'productivite'>('dashboard');

  // Redirect to auth if not logged in
  useEffect(() => {
    if (!loading && !user) {
      navigate('/auth');
    }
  }, [user, loading, navigate]);

  // Distinction entre offres (à compléter/en cours) et candidatures (soumise/entretien)
  const offres = applications.filter(app => 
    app.statut === 'à compléter' || app.statut === 'en cours'
  );
  const candidatures = applications.filter(app => 
    app.statut === 'soumise' || app.statut === 'entretien'
  );

  const filteredApplications = applications.filter(app => 
    app.entreprise.toLowerCase().includes(searchQuery.toLowerCase()) ||
    app.poste.toLowerCase().includes(searchQuery.toLowerCase()) ||
    app.lieu.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const sortedApplications = [...filteredApplications].sort((a, b) => {
    const deadlineCompare = new Date(a.deadline).getTime() - new Date(b.deadline).getTime();
    if (deadlineCompare !== 0) return deadlineCompare;
    return b.priorite - a.priorite;
  });

  const handleSave = async (application: Application) => {
    if (editingApplication) {
      await updateApplication(application.id, application);
    } else {
      await addApplication(application);
    }
    setEditingApplication(undefined);
    setIsFormOpen(false);
  };

  const handleEdit = (application: Application) => {
    setEditingApplication(application);
    setIsFormOpen(true);
  };

  const handleDelete = async (id: string) => {
    await deleteApplication(id);
  };

  const handleNewApplication = () => {
    setEditingApplication(undefined);
    setIsFormOpen(true);
  };

  const handleImportJobs = async (jobs: Partial<Application>[]) => {
    await importApplications(jobs);
  };

  const handleImportData = async (importedApps: Application[]) => {
    await importApplications(importedApps);
  };

  const handleSaveCV = async (cvUrl: string) => {
    if (selectedApplicationForCV) {
      await updateApplication(selectedApplicationForCV.id, { url: cvUrl });
      toast.success('CV sauvegardé');
    }
    setSelectedApplicationForCV(null);
  };

  const handleSaveLetter = async (lettreUrl: string) => {
    if (selectedApplicationForLetter) {
      await updateApplication(selectedApplicationForLetter.id, { url: lettreUrl });
      toast.success('Lettre sauvegardée');
    }
    setSelectedApplicationForLetter(null);
  };

  const handleUpdateApplication = async (id: string, updates: Partial<Application>) => {
    await updateApplication(id, updates);
  };

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    toast.success('Déconnexion réussie');
    navigate('/auth');
  };

  const tabs = [
    { id: 'dashboard' as const, label: 'Tableau de bord', icon: BarChart3 },
    { id: 'offres' as const, label: 'Offres disponibles', icon: Target, badge: offres.length },
    { id: 'candidatures' as const, label: 'Mes candidatures', icon: Briefcase, badge: candidatures.length },
    { id: 'calendrier' as const, label: 'Calendrier', icon: CalendarIcon },
    { id: 'taches' as const, label: 'Tâches', icon: CheckCircle },
    { id: 'productivite' as const, label: 'Productivité', icon: Zap },
  ];

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-background via-background to-secondary/20 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-12 h-12 animate-spin mx-auto mb-4 text-primary" />
          <p className="text-muted-foreground">Chargement...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-secondary/20">
      {/* Header */}
      <header className="border-b bg-card/50 backdrop-blur-sm sticky top-0 z-10">
        <div className="container mx-auto px-6 py-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-gradient-to-br from-primary to-accent">
                <Target className="w-6 h-6 text-white" />
              </div>
              <div>
                <h1 className="text-2xl font-bold bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
                  SoSoFlow
                </h1>
                <p className="text-sm text-muted-foreground">Votre assistant carrière intelligent</p>
              </div>
            </div>
            
            <div className="flex items-center gap-3">
              <Button 
                variant="ghost" 
                size="lg" 
                onClick={() => setIsDataManagerOpen(true)}
                className="gap-2"
              >
                <Database className="w-5 h-5" />
                Sauvegarder
              </Button>
              <Button 
                variant="outline" 
                size="lg" 
                onClick={() => setActiveTab('calendrier')}
                className="gap-2"
              >
                <CalendarIcon className="w-5 h-5" />
                Calendrier
              </Button>
              <Button 
                variant="ghost" 
                size="lg" 
                onClick={handleSignOut}
                className="gap-2"
              >
                <LogOut className="w-5 h-5" />
                Déconnexion
              </Button>
              <Button onClick={handleNewApplication} size="lg" className="gap-2">
                <Plus className="w-5 h-5" />
                Nouvelle offre
              </Button>
            </div>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-6 py-8">
        {/* Navigation Tabs */}
        <div className="flex flex-wrap gap-2 mb-8">
          {tabs.map(tab => {
            const Icon = tab.icon;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`px-4 py-2 rounded-lg flex items-center gap-2 transition-all ${
                  activeTab === tab.id 
                    ? 'bg-primary text-primary-foreground shadow-lg' 
                    : 'bg-card text-card-foreground hover:bg-muted border border-border'
                }`}
              >
                <Icon className="w-5 h-5" />
                {tab.label}
                {tab.badge !== undefined && (
                  <span className={`ml-1 px-2 py-0.5 rounded-full text-xs font-medium ${
                    activeTab === tab.id 
                      ? 'bg-primary-foreground text-primary' 
                      : 'bg-primary/10 text-primary'
                  }`}>
                    {tab.badge}
                  </span>
                )}
              </button>
            );
          })}
        </div>

        {/* Dashboard */}
        {activeTab === 'dashboard' && (
          <div className="space-y-6">
            <StatsCards applications={applications} />
            <IntelligentTools onImportEmail={() => setIsEmailImportOpen(true)} />
            
            <div className="grid lg:grid-cols-3 gap-8">
              <div className="lg:col-span-2 space-y-6">
            {/* Search */}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
              <Input
                placeholder="Rechercher..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>

            {/* Applications list */}
            {sortedApplications.length === 0 ? (
              <div className="text-center py-16">
                <div className="w-16 h-16 bg-muted rounded-full flex items-center justify-center mx-auto mb-4">
                  <Target className="w-8 h-8 text-muted-foreground" />
                </div>
                <h3 className="text-lg font-semibold mb-2">Aucune offre ni candidature</h3>
                <p className="text-muted-foreground mb-4">
                  {searchQuery ? 'Aucun résultat trouvé' : 'Importez des offres ou créez votre première candidature'}
                </p>
                {!searchQuery && (
                  <Button onClick={handleNewApplication}>
                    <Plus className="w-4 h-4 mr-2" />
                    Créer une offre
                  </Button>
                )}
              </div>
            ) : (
              <div className="space-y-4">
                {sortedApplications.map((application) => (
                  <ApplicationCard
                    key={application.id}
                    application={application}
                    onEdit={() => handleEdit(application)}
                    onDelete={() => handleDelete(application.id)}
                    onGenerateCV={() => setSelectedApplicationForCV(application)}
                    onGenerateLetter={() => setSelectedApplicationForLetter(application)}
                    onUpdate={(updates) => handleUpdateApplication(application.id, updates)}
                  />
                ))}
              </div>
            )}
          </div>

              {/* Sidebar */}
              <div className="lg:col-span-1">
                <CoachingPanel tips={COACHING_LIBRARY} />
              </div>
            </div>
          </div>
        )}

        {/* Offres disponibles */}
        {activeTab === 'offres' && (
          <div className="space-y-6">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h2 className="text-2xl font-bold">Offres disponibles</h2>
                <p className="text-muted-foreground">Annonces importées et offres à traiter</p>
              </div>
              <Button onClick={() => setIsEmailImportOpen(true)} variant="outline" className="gap-2">
                <Plus className="w-4 h-4" />
                Importer des offres
              </Button>
            </div>

            {/* Search */}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
              <Input
                placeholder="Rechercher une offre..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>

            {/* Offres list */}
            {offres.filter(app => 
              app.entreprise.toLowerCase().includes(searchQuery.toLowerCase()) ||
              app.poste.toLowerCase().includes(searchQuery.toLowerCase()) ||
              app.lieu.toLowerCase().includes(searchQuery.toLowerCase())
            ).length === 0 ? (
              <div className="text-center py-16">
                <div className="w-16 h-16 bg-muted rounded-full flex items-center justify-center mx-auto mb-4">
                  <Target className="w-8 h-8 text-muted-foreground" />
                </div>
                <h3 className="text-lg font-semibold mb-2">Aucune offre</h3>
                <p className="text-muted-foreground mb-4">
                  {searchQuery ? 'Aucun résultat trouvé' : 'Importez des offres d\'emploi pour commencer'}
                </p>
                {!searchQuery && (
                  <Button onClick={() => setIsEmailImportOpen(true)}>
                    <Plus className="w-4 h-4 mr-2" />
                    Importer des offres
                  </Button>
                )}
              </div>
            ) : (
              <div className="space-y-4">
                {offres
                  .filter(app => 
                    app.entreprise.toLowerCase().includes(searchQuery.toLowerCase()) ||
                    app.poste.toLowerCase().includes(searchQuery.toLowerCase()) ||
                    app.lieu.toLowerCase().includes(searchQuery.toLowerCase())
                  )
                  .sort((a, b) => {
                    const deadlineCompare = new Date(a.deadline).getTime() - new Date(b.deadline).getTime();
                    if (deadlineCompare !== 0) return deadlineCompare;
                    return b.priorite - a.priorite;
                  })
                  .map((application) => (
                    <ApplicationCard
                      key={application.id}
                      application={application}
                      onEdit={() => handleEdit(application)}
                      onDelete={() => handleDelete(application.id)}
                      onGenerateCV={() => setSelectedApplicationForCV(application)}
                      onGenerateLetter={() => setSelectedApplicationForLetter(application)}
                      onUpdate={(updates) => handleUpdateApplication(application.id, updates)}
                    />
                  ))}
              </div>
            )}
          </div>
        )}

        {/* Mes candidatures */}
        {activeTab === 'candidatures' && (
          <div className="space-y-6">
            <div className="mb-4">
              <h2 className="text-2xl font-bold">Mes candidatures</h2>
              <p className="text-muted-foreground">Dossiers envoyés et suivis d'entretiens</p>
            </div>

            {/* Search */}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
              <Input
                placeholder="Rechercher une candidature..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>

            {/* Candidatures list */}
            {candidatures.filter(app => 
              app.entreprise.toLowerCase().includes(searchQuery.toLowerCase()) ||
              app.poste.toLowerCase().includes(searchQuery.toLowerCase()) ||
              app.lieu.toLowerCase().includes(searchQuery.toLowerCase())
            ).length === 0 ? (
              <div className="text-center py-16">
                <div className="w-16 h-16 bg-muted rounded-full flex items-center justify-center mx-auto mb-4">
                  <Briefcase className="w-8 h-8 text-muted-foreground" />
                </div>
                <h3 className="text-lg font-semibold mb-2">Aucune candidature envoyée</h3>
                <p className="text-muted-foreground mb-4">
                  {searchQuery ? 'Aucun résultat trouvé' : 'Passez une offre au statut "soumise" pour la voir ici'}
                </p>
              </div>
            ) : (
              <div className="space-y-4">
                {candidatures
                  .filter(app => 
                    app.entreprise.toLowerCase().includes(searchQuery.toLowerCase()) ||
                    app.poste.toLowerCase().includes(searchQuery.toLowerCase()) ||
                    app.lieu.toLowerCase().includes(searchQuery.toLowerCase())
                  )
                  .sort((a, b) => {
                    const deadlineCompare = new Date(a.deadline).getTime() - new Date(b.deadline).getTime();
                    if (deadlineCompare !== 0) return deadlineCompare;
                    return b.priorite - a.priorite;
                  })
                  .map((application) => (
                    <ApplicationCard
                      key={application.id}
                      application={application}
                      onEdit={() => handleEdit(application)}
                      onDelete={() => handleDelete(application.id)}
                      onGenerateCV={() => setSelectedApplicationForCV(application)}
                      onGenerateLetter={() => setSelectedApplicationForLetter(application)}
                      onUpdate={(updates) => handleUpdateApplication(application.id, updates)}
                    />
                  ))}
              </div>
            )}
          </div>
        )}

        {/* Calendrier */}
        {activeTab === 'calendrier' && (
          <CalendarView applications={applications} />
        )}

        {/* Tâches */}
        {activeTab === 'taches' && (
          <TasksView 
            applications={applications}
            onUpdateApplication={handleUpdateApplication}
          />
        )}

        {/* Productivité */}
        {activeTab === 'productivite' && (
          <ProductivityView tips={COACHING_LIBRARY} />
        )}
      </main>

      {/* Modals */}
      <ApplicationForm
        application={editingApplication}
        open={isFormOpen}
        onClose={() => {
          setIsFormOpen(false);
          setEditingApplication(undefined);
        }}
        onSave={handleSave}
        isNewOffer={!editingApplication}
      />

      <EmailImportModal
        open={isEmailImportOpen}
        onClose={() => setIsEmailImportOpen(false)}
        onImport={handleImportJobs}
      />

      {selectedApplicationForCV && (
        <CVGeneratorModal
          candidature={selectedApplicationForCV}
          open={true}
          onClose={() => setSelectedApplicationForCV(null)}
          onSave={handleSaveCV}
        />
      )}

      {selectedApplicationForLetter && (
        <LetterGeneratorModal
          candidature={selectedApplicationForLetter}
          open={true}
          onClose={() => setSelectedApplicationForLetter(null)}
          onSave={handleSaveLetter}
        />
      )}

      <DataManager
        applications={applications}
        onImport={handleImportData}
        open={isDataManagerOpen}
        onClose={() => setIsDataManagerOpen(false)}
      />

      <LocalStorageMigration
        onMigrate={importApplications}
        user={user}
      />
    </div>
  );
};

export default Index;
