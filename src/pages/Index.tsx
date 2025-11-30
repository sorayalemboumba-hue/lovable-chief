import { useState } from 'react';
import { Application } from '@/types/application';
import { useLocalStorage } from '@/hooks/useLocalStorage';
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
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Plus, Search, Target, BarChart3, Briefcase, Calendar as CalendarIcon, CheckCircle, Zap } from 'lucide-react';
import { toast } from 'sonner';

const Index = () => {
  const [applications, setApplications] = useLocalStorage<Application[]>('applications', []);
  const [searchQuery, setSearchQuery] = useState('');
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingApplication, setEditingApplication] = useState<Application | undefined>();
  const [isEmailImportOpen, setIsEmailImportOpen] = useState(false);
  const [selectedApplicationForCV, setSelectedApplicationForCV] = useState<Application | null>(null);
  const [selectedApplicationForLetter, setSelectedApplicationForLetter] = useState<Application | null>(null);
  const [activeTab, setActiveTab] = useState<'dashboard' | 'candidatures' | 'calendrier' | 'taches' | 'productivite'>('dashboard');

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

  const handleSave = (application: Application) => {
    if (editingApplication) {
      setApplications(applications.map(app => 
        app.id === application.id ? application : app
      ));
      toast.success('Candidature mise à jour');
    } else {
      setApplications([...applications, application]);
      toast.success('Candidature créée');
    }
    setEditingApplication(undefined);
  };

  const handleEdit = (application: Application) => {
    setEditingApplication(application);
    setIsFormOpen(true);
  };

  const handleDelete = (id: string) => {
    setApplications(applications.filter(app => app.id !== id));
    toast.success('Candidature supprimée');
  };

  const handleNewApplication = () => {
    setEditingApplication(undefined);
    setIsFormOpen(true);
  };

  const handleImportJobs = (jobs: Partial<Application>[]) => {
    const newApplications = jobs.map(job => ({
      ...job,
      id: Date.now().toString() + Math.random(),
      createdAt: new Date().toISOString(),
    } as Application));
    setApplications([...applications, ...newApplications]);
  };

  const handleSaveCV = (cvUrl: string) => {
    if (selectedApplicationForCV) {
      setApplications(applications.map(app =>
        app.id === selectedApplicationForCV.id
          ? { ...app, url: cvUrl }
          : app
      ));
      toast.success('CV sauvegardé');
    }
    setSelectedApplicationForCV(null);
  };

  const handleSaveLetter = (lettreUrl: string) => {
    if (selectedApplicationForLetter) {
      setApplications(applications.map(app =>
        app.id === selectedApplicationForLetter.id
          ? { ...app, url: lettreUrl }
          : app
      ));
      toast.success('Lettre sauvegardée');
    }
    setSelectedApplicationForLetter(null);
  };

  const handleUpdateApplication = (id: string, updates: Partial<Application>) => {
    setApplications(applications.map(app =>
      app.id === id ? { ...app, ...updates } : app
    ));
  };

  const tabs = [
    { id: 'dashboard' as const, label: 'Tableau de bord', icon: BarChart3 },
    { id: 'candidatures' as const, label: 'Candidatures', icon: Briefcase, badge: applications.length },
    { id: 'calendrier' as const, label: 'Calendrier', icon: CalendarIcon },
    { id: 'taches' as const, label: 'Tâches', icon: CheckCircle },
    { id: 'productivite' as const, label: 'Productivité', icon: Zap },
  ];

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
                <h1 className="text-2xl font-bold">Chief of Staff</h1>
                <p className="text-sm text-muted-foreground">Gestion de candidatures</p>
              </div>
            </div>
            
            <div className="flex items-center gap-3">
              <Button 
                variant="outline" 
                size="lg" 
                onClick={() => setActiveTab('calendrier')}
                className="gap-2"
              >
                <CalendarIcon className="w-5 h-5" />
                Calendrier
              </Button>
              <Button onClick={handleNewApplication} size="lg" className="gap-2">
                <Plus className="w-5 h-5" />
                Nouvelle candidature
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
                placeholder="Rechercher une candidature..."
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
                <h3 className="text-lg font-semibold mb-2">Aucune candidature</h3>
                <p className="text-muted-foreground mb-4">
                  {searchQuery ? 'Aucun résultat trouvé' : 'Commencez par ajouter votre première candidature'}
                </p>
                {!searchQuery && (
                  <Button onClick={handleNewApplication}>
                    <Plus className="w-4 h-4 mr-2" />
                    Créer une candidature
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

        {/* Candidatures */}
        {activeTab === 'candidatures' && (
          <div className="space-y-6">
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

            {/* Applications list */}
            {sortedApplications.length === 0 ? (
              <div className="text-center py-16">
                <div className="w-16 h-16 bg-muted rounded-full flex items-center justify-center mx-auto mb-4">
                  <Target className="w-8 h-8 text-muted-foreground" />
                </div>
                <h3 className="text-lg font-semibold mb-2">Aucune candidature</h3>
                <p className="text-muted-foreground mb-4">
                  {searchQuery ? 'Aucun résultat trouvé' : 'Commencez par ajouter votre première candidature'}
                </p>
                {!searchQuery && (
                  <Button onClick={handleNewApplication}>
                    <Plus className="w-4 h-4 mr-2" />
                    Créer une candidature
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
    </div>
  );
};

export default Index;
