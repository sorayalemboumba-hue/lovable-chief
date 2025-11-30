import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Application } from '@/types/application';
import { useLocalApplications } from '@/hooks/useLocalApplications';
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
import { FilterPanel, FilterState } from '@/components/FilterPanel';
import { DeadlineNotifications } from '@/components/DeadlineNotifications';
import { SupabaseMigration } from '@/components/SupabaseMigration';
import { MigrationButton } from '@/components/MigrationButton';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Plus, Search, Target, BarChart3, Briefcase, Calendar as CalendarIcon, CheckCircle, Zap, Database, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { sortByPriority, getPriorityScore } from '@/lib/priorityEngine';
import { COACHING_LIBRARY } from '@/data/coaching';

const Index = () => {
  const navigate = useNavigate();
  const { applications, loading, addApplication, updateApplication, deleteApplication, importApplications, refetch } = useLocalApplications();
  const [searchQuery, setSearchQuery] = useState('');
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingApplication, setEditingApplication] = useState<Application | undefined>();
  const [isEmailImportOpen, setIsEmailImportOpen] = useState(false);
  const [isDataManagerOpen, setIsDataManagerOpen] = useState(false);
  const [selectedApplicationForCV, setSelectedApplicationForCV] = useState<Application | null>(null);
  const [selectedApplicationForLetter, setSelectedApplicationForLetter] = useState<Application | null>(null);
  const [activeTab, setActiveTab] = useState<'dashboard' | 'offres' | 'candidatures' | 'calendrier' | 'taches' | 'productivite'>('dashboard');
  const [filters, setFilters] = useState<FilterState>({});

  // Distinction entre offres (à compléter/en cours) et candidatures (soumise/entretien)
  const offres = applications.filter(app => 
    app.statut === 'à compléter' || app.statut === 'en cours'
  );
  const candidatures = applications.filter(app => 
    app.statut === 'soumise' || app.statut === 'entretien'
  );

  // Apply filters
  const applyFilters = (apps: Application[]) => {
    return apps.filter(app => {
      if (filters.statut && app.statut !== filters.statut) return false;
      if (filters.prioriteMin !== undefined && app.priorite < filters.prioriteMin) return false;
      if (filters.prioriteMax !== undefined && app.priorite > filters.prioriteMax) return false;
      if (filters.dateDebut && app.deadline < filters.dateDebut) return false;
      if (filters.dateFin && app.deadline > filters.dateFin) return false;
      return true;
    });
  };

  const filteredOffres = applyFilters(offres);
  const filteredCandidatures = applyFilters(candidatures);

  const filteredApplications = applications.filter(app => 
    app.entreprise.toLowerCase().includes(searchQuery.toLowerCase()) ||
    app.poste.toLowerCase().includes(searchQuery.toLowerCase()) ||
    app.lieu.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const sortedApplications = sortByPriority(filteredApplications);

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

  const handleImportJobs = async (jobs: Partial<Application>[]): Promise<string[]> => {
    return await importApplications(jobs);
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

  const tabs = [
    { id: 'dashboard' as const, label: 'Tableau de bord', icon: BarChart3 },
    { id: 'offres' as const, label: 'Offres disponibles', icon: Target, badge: filteredOffres.length },
    { id: 'candidatures' as const, label: 'Mes candidatures', icon: Briefcase, badge: filteredCandidatures.length },
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

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-secondary/20">
      <SupabaseMigration />
      
      {/* Header */}
      <header className="border-b-2 bg-card/50 backdrop-blur-sm sticky top-0 z-10 shadow-sm">
        <div className="container mx-auto px-4 sm:px-6 py-4 sm:py-6">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-gradient-to-br from-primary to-accent shadow-md">
                <Target className="w-6 h-6 text-white" />
              </div>
              <div>
                <h1 className="text-xl sm:text-2xl font-bold bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
                  SoSoFlow
                </h1>
                <p className="text-xs sm:text-sm text-muted-foreground">Votre assistant carrière intelligent</p>
              </div>
            </div>
            
            <div className="flex flex-wrap items-center gap-2 w-full sm:w-auto">
              <DeadlineNotifications applications={applications} />
              <MigrationButton />
              <Button 
                variant="ghost" 
                size="default"
                onClick={() => setIsDataManagerOpen(true)}
                className="gap-2 flex-1 sm:flex-none"
              >
                <Database className="w-5 h-5" />
                <span className="hidden sm:inline">Sauvegarder</span>
              </Button>
              <Button 
                variant="outline" 
                size="default"
                onClick={() => setActiveTab('calendrier')}
                className="gap-2 flex-1 sm:flex-none"
              >
                <CalendarIcon className="w-5 h-5" />
                <span className="hidden sm:inline">Calendrier</span>
              </Button>
              <Button onClick={handleNewApplication} size="default" className="gap-2 flex-1 sm:flex-none">
                <Plus className="w-5 h-5" />
                <span className="hidden sm:inline">Nouvelle offre</span>
              </Button>
            </div>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 sm:px-6 py-6 sm:py-8">
        {/* Navigation Tabs */}
        <div className="flex flex-wrap gap-2 sm:gap-3 mb-6 sm:mb-8">
          {tabs.map(tab => {
            const Icon = tab.icon;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`min-h-[44px] px-4 sm:px-5 py-2.5 sm:py-3 rounded-lg flex items-center gap-2 transition-all duration-200 font-medium ${
                  activeTab === tab.id 
                    ? 'bg-primary text-primary-foreground shadow-lg scale-[1.02]' 
                    : 'bg-card text-card-foreground hover:bg-muted hover:shadow-md border-2 border-border'
                }`}
              >
                <Icon className="w-5 h-5 flex-shrink-0" />
                <span className="text-sm sm:text-base whitespace-nowrap">{tab.label}</span>
                {tab.badge !== undefined && (
                  <span className={`ml-1 px-2 py-0.5 rounded-full text-xs font-bold ${
                    activeTab === tab.id 
                      ? 'bg-primary-foreground text-primary' 
                      : 'bg-primary/15 text-primary'
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
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
              <Input
                placeholder="Rechercher une entreprise, poste ou lieu..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-12 text-base"
              />
            </div>

            {/* Applications list */}
            {sortedApplications.length === 0 ? (
              <div className="text-center py-16 sm:py-20 px-4">
                <div className="w-16 h-16 sm:w-20 sm:h-20 bg-muted rounded-full flex items-center justify-center mx-auto mb-4 shadow-sm">
                  <Target className="w-8 h-8 sm:w-10 sm:h-10 text-muted-foreground" />
                </div>
                <h3 className="text-lg sm:text-xl font-semibold mb-2">Aucune offre ni candidature</h3>
                <p className="text-sm sm:text-base text-muted-foreground mb-6 max-w-md mx-auto leading-relaxed">
                  {searchQuery ? 'Aucun résultat trouvé' : 'Importez des offres ou créez votre première candidature'}
                </p>
                {!searchQuery && (
                  <Button onClick={handleNewApplication} size="lg">
                    <Plus className="w-4 h-4 mr-2" />
                    Créer une offre
                  </Button>
                )}
              </div>
            ) : (
              <div className="space-y-4 sm:space-y-5">
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
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
              <div>
                <h2 className="text-2xl sm:text-3xl font-bold mb-1">Offres disponibles</h2>
                <p className="text-sm sm:text-base text-muted-foreground">Annonces importées et offres à traiter</p>
              </div>
              <Button onClick={() => setIsEmailImportOpen(true)} variant="outline" size="lg" className="gap-2 w-full sm:w-auto">
                <Plus className="w-4 h-4" />
                Importer des offres
              </Button>
            </div>

            {/* Search and Filters */}
            <div className="flex flex-col sm:flex-row gap-3">
              <div className="relative flex-1">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                <Input
                  placeholder="Rechercher une offre..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-12"
                />
              </div>
              <FilterPanel
                filters={filters}
                onFilterChange={setFilters}
                onReset={() => setFilters({})}
              />
            </div>

            {/* Offres list */}
            {filteredOffres.filter(app => 
              app.entreprise.toLowerCase().includes(searchQuery.toLowerCase()) ||
              app.poste.toLowerCase().includes(searchQuery.toLowerCase()) ||
              app.lieu.toLowerCase().includes(searchQuery.toLowerCase())
            ).length === 0 ? (
              <div className="text-center py-16 sm:py-20 px-4">
                <div className="w-16 h-16 sm:w-20 sm:h-20 bg-muted rounded-full flex items-center justify-center mx-auto mb-4 shadow-sm">
                  <Target className="w-8 h-8 sm:w-10 sm:h-10 text-muted-foreground" />
                </div>
                <h3 className="text-lg sm:text-xl font-semibold mb-2">Aucune offre</h3>
                <p className="text-sm sm:text-base text-muted-foreground mb-6 max-w-md mx-auto leading-relaxed">
                  {searchQuery ? 'Aucun résultat trouvé' : 'Importez des offres d\'emploi pour commencer'}
                </p>
                {!searchQuery && (
                  <Button onClick={() => setIsEmailImportOpen(true)} size="lg">
                    <Plus className="w-4 h-4 mr-2" />
                    Importer des offres
                  </Button>
                )}
              </div>
            ) : (
              <div className="space-y-4 sm:space-y-5">
                {filteredOffres
                  .filter(app => 
                    app.entreprise.toLowerCase().includes(searchQuery.toLowerCase()) ||
                    app.poste.toLowerCase().includes(searchQuery.toLowerCase()) ||
                    app.lieu.toLowerCase().includes(searchQuery.toLowerCase())
                  )
                  .slice()
                  .sort((a, b) => {
                    const scoreA = getPriorityScore(a);
                    const scoreB = getPriorityScore(b);
                    if (scoreB.total !== scoreA.total) return scoreB.total - scoreA.total;
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
            <div className="mb-6">
              <h2 className="text-2xl sm:text-3xl font-bold mb-1">Mes candidatures</h2>
              <p className="text-sm sm:text-base text-muted-foreground">Dossiers envoyés et suivis d'entretiens</p>
            </div>

            {/* Search and Filters */}
            <div className="flex flex-col sm:flex-row gap-3">
              <div className="relative flex-1">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                <Input
                  placeholder="Rechercher une candidature..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-12"
                />
              </div>
              <FilterPanel
                filters={filters}
                onFilterChange={setFilters}
                onReset={() => setFilters({})}
              />
            </div>

            {/* Candidatures list */}
            {filteredCandidatures.filter(app => 
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
                {filteredCandidatures
                  .filter(app => 
                    app.entreprise.toLowerCase().includes(searchQuery.toLowerCase()) ||
                    app.poste.toLowerCase().includes(searchQuery.toLowerCase()) ||
                    app.lieu.toLowerCase().includes(searchQuery.toLowerCase())
                  )
                  .slice()
                  .sort((a, b) => {
                    const scoreA = getPriorityScore(a);
                    const scoreB = getPriorityScore(b);
                    if (scoreB.total !== scoreA.total) return scoreB.total - scoreA.total;
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
          <ProductivityView />
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
    </div>
  );
};

export default Index;
