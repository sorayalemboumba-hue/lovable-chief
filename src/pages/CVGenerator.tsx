import { useState, useMemo } from 'react';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Download, ArrowLeft, FileText, Sparkles } from 'lucide-react';
import { Link } from 'react-router-dom';
import jsPDF from 'jspdf';
import { toast } from 'sonner';

// ========== DONNÉES MAÎTRES HARDCODÉES ==========

const PROFILE = {
  nom: "SORAYA KOITÉ",
  infos: "6, rond-point de Plainpalais - 1205 Genève | 079 853 15 73 | soraya.lemboumba@ehl.ch",
  intro: "Professionnelle polyvalente avec 15+ ans d'expérience en gestion de projet, communication et événementiel. Experte en leadership d'équipes multiculturelles et optimisation de services à impact social."
};

const EXPERIENCES = [
  { date: "2021-2024", titre: "Chargée de projets / Coordinatrice", boite: "Croix-Rouge genevoise", lieu: "Genève", desc: "Pilotage dispositif DIPER (1400 bénéficiaires), Centre Alice, Service Transports." },
  { date: "2019-2021", titre: "Directrice (Ad Interim)", boite: "École Moderne", lieu: "Neuchâtel", desc: "Gestion de crise COVID, digitalisation enseignement, management 15 p." },
  { date: "2019", titre: "Responsable Projet Accueil & Protocole", boite: "Fête des Vignerons", lieu: "Vevey", desc: "Coordination 175 bénévoles, accueil VIP/Protocole, 1M visiteurs." },
  { date: "2018-2019", titre: "Consultante Comms & Events", boite: "Defence for Children Int.", lieu: "Genève", desc: "Stratégie digitale, refonte web 3 langues, événements ONU." },
  { date: "2016-2017", titre: "Directrice Admissions & Marketing", boite: "St. George's School", lieu: "Montreux", desc: "Senior Leadership Team, doublement inscriptions Summer Camp." },
  { date: "2014-2016", titre: "Senior Boarding Admissions", boite: "Collège du Léman", lieu: "Versoix", desc: "Développement marchés LATAM/Afrique/Est, recrutement international." },
  { date: "2012-2014", titre: "Co-fondatrice", boite: "My Sweet Days", lieu: "Genève", desc: "Agence services famille, incubateur GENILEM." },
  { date: "2010-2012", titre: "Office & Marketing Manager", boite: "Arcoligne", lieu: "Lausanne", desc: "Support ventes immobilières, marketing." },
  { date: "2007-2010", titre: "Admissions & Marketing", boite: "Institut Le Rosey", lieu: "Rolle/Gstaad", desc: "Promotion internationale, événements exclusifs." },
  { date: "2006-2007", titre: "Coordinatrice Ventes", boite: "Hôtel de la Paix", lieu: "Genève", desc: "Organisation banquets luxe, coordination clients corporate." }
];

const SKILLS_BANK = {
  gestion: ["Pilotage de projets complexes", "Gestion budgétaire & KPI", "Recrutement & Formation", "Gestion de crise"],
  comms: ["Stratégie de communication", "Réseaux sociaux & Web", "Relations Publiques & Presse", "Copywriting & Storytelling"],
  tech: ["Salesforce / CRM", "Canva / Figma", "Office 365 / Google", "IA (ChatGPT, Gemini)"]
};

const LANGUAGES = [
  { lang: "Français", level: "C2" },
  { lang: "Espagnol", level: "LM" },
  { lang: "Anglais", level: "C2" },
  { lang: "Italien", level: "C1" },
  { lang: "Portugais", level: "C1" },
  { lang: "Bambara", level: "LM" }
];

const VOLUNTEERING = ["Coopérative YAKA", "Projet Roseraie"];

// ========== COMPOSANT PRINCIPAL ==========

export default function CVGenerator() {
  const [cvTitle, setCvTitle] = useState("Chargée de Projets & Communication");
  const [selectedSkills, setSelectedSkills] = useState<Record<string, boolean>>(() => {
    const initial: Record<string, boolean> = {};
    Object.values(SKILLS_BANK).flat().forEach(skill => {
      initial[skill] = true;
    });
    return initial;
  });

  const toggleSkill = (skill: string) => {
    setSelectedSkills(prev => ({ ...prev, [skill]: !prev[skill] }));
  };

  const activeSkills = useMemo(() => 
    Object.entries(selectedSkills)
      .filter(([_, active]) => active)
      .map(([skill]) => skill),
    [selectedSkills]
  );

  const groupedActiveSkills = useMemo(() => {
    const gestion = activeSkills.filter(s => SKILLS_BANK.gestion.includes(s));
    const comms = activeSkills.filter(s => SKILLS_BANK.comms.includes(s));
    const tech = activeSkills.filter(s => SKILLS_BANK.tech.includes(s));
    return { gestion, comms, tech };
  }, [activeSkills]);

  // Génération PDF
  const handleDownloadPDF = () => {
    const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
    const pageWidth = 210;
    const leftColWidth = 65;
    const rightColStart = 70;
    const rightColWidth = 130;
    let y = 15;

    // Header
    doc.setFillColor(45, 55, 72);
    doc.rect(0, 0, pageWidth, 40, 'F');
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(22);
    doc.setFont('helvetica', 'bold');
    doc.text(PROFILE.nom, pageWidth / 2, 18, { align: 'center' });
    doc.setFontSize(12);
    doc.setFont('helvetica', 'normal');
    doc.text(cvTitle, pageWidth / 2, 28, { align: 'center' });
    doc.setFontSize(8);
    doc.text(PROFILE.infos, pageWidth / 2, 36, { align: 'center' });

    y = 50;

    // Left Column Background
    doc.setFillColor(243, 244, 246);
    doc.rect(0, 40, leftColWidth, 260, 'F');

    // Left Column Content
    doc.setTextColor(55, 65, 81);
    doc.setFontSize(10);
    doc.setFont('helvetica', 'bold');
    doc.text("LANGUES", 10, y);
    y += 6;
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(9);
    LANGUAGES.forEach(l => {
      doc.text(`${l.lang} (${l.level})`, 10, y);
      y += 5;
    });

    y += 8;
    doc.setFontSize(10);
    doc.setFont('helvetica', 'bold');
    doc.text("BÉNÉVOLAT", 10, y);
    y += 6;
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(9);
    VOLUNTEERING.forEach(v => {
      doc.text(`• ${v}`, 10, y);
      y += 5;
    });

    // Right Column
    y = 50;
    doc.setTextColor(31, 41, 55);

    // À Propos
    doc.setFontSize(11);
    doc.setFont('helvetica', 'bold');
    doc.text("À PROPOS", rightColStart, y);
    y += 6;
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(9);
    const introLines = doc.splitTextToSize(PROFILE.intro, rightColWidth);
    doc.text(introLines, rightColStart, y);
    y += introLines.length * 4 + 8;

    // Compétences
    doc.setFontSize(11);
    doc.setFont('helvetica', 'bold');
    doc.text("COMPÉTENCES", rightColStart, y);
    y += 6;
    doc.setFontSize(9);
    doc.setFont('helvetica', 'normal');

    if (groupedActiveSkills.gestion.length > 0) {
      doc.setFont('helvetica', 'bold');
      doc.text("Gestion", rightColStart, y);
      doc.setFont('helvetica', 'normal');
      y += 4;
      groupedActiveSkills.gestion.forEach(s => {
        doc.text(`• ${s}`, rightColStart + 2, y);
        y += 4;
      });
      y += 2;
    }

    if (groupedActiveSkills.comms.length > 0) {
      doc.setFont('helvetica', 'bold');
      doc.text("Communication", rightColStart, y);
      doc.setFont('helvetica', 'normal');
      y += 4;
      groupedActiveSkills.comms.forEach(s => {
        doc.text(`• ${s}`, rightColStart + 2, y);
        y += 4;
      });
      y += 2;
    }

    if (groupedActiveSkills.tech.length > 0) {
      doc.setFont('helvetica', 'bold');
      doc.text("Outils", rightColStart, y);
      doc.setFont('helvetica', 'normal');
      y += 4;
      groupedActiveSkills.tech.forEach(s => {
        doc.text(`• ${s}`, rightColStart + 2, y);
        y += 4;
      });
    }

    y += 8;

    // Expériences
    doc.setFontSize(11);
    doc.setFont('helvetica', 'bold');
    doc.text("EXPÉRIENCES PROFESSIONNELLES", rightColStart, y);
    y += 6;

    EXPERIENCES.forEach(exp => {
      if (y > 270) {
        doc.addPage();
        y = 20;
      }
      doc.setFontSize(9);
      doc.setFont('helvetica', 'bold');
      doc.text(`${exp.titre}`, rightColStart, y);
      doc.setFont('helvetica', 'normal');
      doc.setTextColor(107, 114, 128);
      doc.text(`${exp.date} | ${exp.boite}, ${exp.lieu}`, rightColStart, y + 4);
      doc.setTextColor(55, 65, 81);
      const descLines = doc.splitTextToSize(exp.desc, rightColWidth);
      doc.text(descLines, rightColStart, y + 8);
      y += 12 + (descLines.length - 1) * 4;
    });

    doc.save(`CV_Soraya_Koite_${cvTitle.replace(/\s+/g, '_')}.pdf`);
    toast.success('CV téléchargé avec succès !');
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b bg-card/50 backdrop-blur sticky top-0 z-10">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Link to="/">
              <Button variant="ghost" size="icon">
                <ArrowLeft className="w-5 h-5" />
              </Button>
            </Link>
            <div className="flex items-center gap-2">
              <FileText className="w-6 h-6 text-primary" />
              <h1 className="text-xl font-bold">Générateur CV Soraya</h1>
            </div>
          </div>
          <Button onClick={handleDownloadPDF} className="gap-2">
            <Download className="w-4 h-4" />
            Télécharger PDF
          </Button>
        </div>
      </header>

      {/* Split View */}
      <div className="flex flex-col lg:flex-row h-[calc(100vh-73px)]">
        {/* LEFT PANEL - Controls (40%) */}
        <div className="w-full lg:w-[40%] border-r bg-muted/30 overflow-y-auto">
          <div className="p-6 space-y-6">
            {/* Titre */}
            <Card className="p-4">
              <Label htmlFor="cvTitle" className="text-sm font-semibold mb-2 block">
                Titre du CV
              </Label>
              <Input
                id="cvTitle"
                value={cvTitle}
                onChange={(e) => setCvTitle(e.target.value)}
                placeholder="Ex: Chef de projet événementiel"
                className="text-base"
              />
              <p className="text-xs text-muted-foreground mt-2">
                Ce titre apparaît sous votre nom dans l'en-tête du CV.
              </p>
            </Card>

            {/* Compétences - Gestion */}
            <Card className="p-4">
              <div className="flex items-center gap-2 mb-4">
                <Sparkles className="w-4 h-4 text-primary" />
                <h3 className="font-semibold text-sm">Gestion & Leadership</h3>
              </div>
              <div className="space-y-3">
                {SKILLS_BANK.gestion.map(skill => (
                  <div key={skill} className="flex items-center gap-3">
                    <Checkbox
                      id={skill}
                      checked={selectedSkills[skill]}
                      onCheckedChange={() => toggleSkill(skill)}
                    />
                    <Label htmlFor={skill} className="text-sm cursor-pointer flex-1">
                      {skill}
                    </Label>
                  </div>
                ))}
              </div>
            </Card>

            {/* Compétences - Communication */}
            <Card className="p-4">
              <div className="flex items-center gap-2 mb-4">
                <Sparkles className="w-4 h-4 text-accent" />
                <h3 className="font-semibold text-sm">Communication & Marketing</h3>
              </div>
              <div className="space-y-3">
                {SKILLS_BANK.comms.map(skill => (
                  <div key={skill} className="flex items-center gap-3">
                    <Checkbox
                      id={skill}
                      checked={selectedSkills[skill]}
                      onCheckedChange={() => toggleSkill(skill)}
                    />
                    <Label htmlFor={skill} className="text-sm cursor-pointer flex-1">
                      {skill}
                    </Label>
                  </div>
                ))}
              </div>
            </Card>

            {/* Compétences - Tech */}
            <Card className="p-4">
              <div className="flex items-center gap-2 mb-4">
                <Sparkles className="w-4 h-4 text-success" />
                <h3 className="font-semibold text-sm">Outils & Technologies</h3>
              </div>
              <div className="space-y-3">
                {SKILLS_BANK.tech.map(skill => (
                  <div key={skill} className="flex items-center gap-3">
                    <Checkbox
                      id={skill}
                      checked={selectedSkills[skill]}
                      onCheckedChange={() => toggleSkill(skill)}
                    />
                    <Label htmlFor={skill} className="text-sm cursor-pointer flex-1">
                      {skill}
                    </Label>
                  </div>
                ))}
              </div>
            </Card>

            <div className="text-center text-xs text-muted-foreground py-4">
              {activeSkills.length} compétences sélectionnées
            </div>
          </div>
        </div>

        {/* RIGHT PANEL - A4 Preview (60%) */}
        <div className="w-full lg:w-[60%] bg-muted/50 overflow-auto p-4 lg:p-8">
          <div className="mx-auto">
            {/* A4 Preview */}
            <div 
              className="bg-white shadow-2xl mx-auto"
              style={{
                width: '210mm',
                minHeight: '297mm',
                maxWidth: '100%',
                aspectRatio: '210 / 297'
              }}
            >
              {/* Header */}
              <div className="bg-slate-800 text-white p-6 text-center">
                <h1 className="text-2xl font-bold tracking-wide">{PROFILE.nom}</h1>
                <p className="text-base mt-1 text-slate-200">{cvTitle}</p>
                <p className="text-xs mt-2 text-slate-300">{PROFILE.infos}</p>
              </div>

              {/* Two Column Layout */}
              <div className="flex">
                {/* Left Column - Grey */}
                <div className="w-[30%] bg-slate-100 p-4 min-h-[calc(297mm-120px)]">
                  <div className="mb-6">
                    <h2 className="text-xs font-bold text-slate-700 mb-2 uppercase tracking-wider">Langues</h2>
                    <div className="space-y-1">
                      {LANGUAGES.map(l => (
                        <p key={l.lang} className="text-xs text-slate-600">
                          {l.lang} <span className="text-slate-400">({l.level})</span>
                        </p>
                      ))}
                    </div>
                  </div>

                  <div>
                    <h2 className="text-xs font-bold text-slate-700 mb-2 uppercase tracking-wider">Bénévolat</h2>
                    <div className="space-y-1">
                      {VOLUNTEERING.map(v => (
                        <p key={v} className="text-xs text-slate-600">• {v}</p>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Right Column - White */}
                <div className="w-[70%] p-5">
                  {/* À propos */}
                  <div className="mb-5">
                    <h2 className="text-sm font-bold text-slate-800 mb-2 uppercase tracking-wider border-b border-slate-200 pb-1">
                      À Propos
                    </h2>
                    <p className="text-xs text-slate-600 leading-relaxed">{PROFILE.intro}</p>
                  </div>

                  {/* Compétences */}
                  <div className="mb-5">
                    <h2 className="text-sm font-bold text-slate-800 mb-2 uppercase tracking-wider border-b border-slate-200 pb-1">
                      Compétences
                    </h2>
                    <div className="grid grid-cols-2 gap-x-4 gap-y-2">
                      {groupedActiveSkills.gestion.length > 0 && (
                        <div>
                          <h3 className="text-xs font-semibold text-slate-700 mb-1">Gestion</h3>
                          {groupedActiveSkills.gestion.map(s => (
                            <p key={s} className="text-xs text-slate-600">• {s}</p>
                          ))}
                        </div>
                      )}
                      {groupedActiveSkills.comms.length > 0 && (
                        <div>
                          <h3 className="text-xs font-semibold text-slate-700 mb-1">Communication</h3>
                          {groupedActiveSkills.comms.map(s => (
                            <p key={s} className="text-xs text-slate-600">• {s}</p>
                          ))}
                        </div>
                      )}
                      {groupedActiveSkills.tech.length > 0 && (
                        <div className="col-span-2 mt-2">
                          <h3 className="text-xs font-semibold text-slate-700 mb-1">Outils</h3>
                          <p className="text-xs text-slate-600">
                            {groupedActiveSkills.tech.join(' • ')}
                          </p>
                        </div>
                      )}
                    </div>
                    {activeSkills.length === 0 && (
                      <p className="text-xs text-slate-400 italic">Sélectionnez des compétences à gauche</p>
                    )}
                  </div>

                  {/* Expériences */}
                  <div>
                    <h2 className="text-sm font-bold text-slate-800 mb-3 uppercase tracking-wider border-b border-slate-200 pb-1">
                      Expériences Professionnelles
                    </h2>
                    <div className="space-y-3">
                      {EXPERIENCES.map((exp, idx) => (
                        <div key={idx} className="pb-2">
                          <div className="flex justify-between items-start">
                            <h3 className="text-xs font-semibold text-slate-800">{exp.titre}</h3>
                            <span className="text-xs text-slate-400 flex-shrink-0 ml-2">{exp.date}</span>
                          </div>
                          <p className="text-xs text-slate-500">{exp.boite}, {exp.lieu}</p>
                          <p className="text-xs text-slate-600 mt-1">{exp.desc}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
