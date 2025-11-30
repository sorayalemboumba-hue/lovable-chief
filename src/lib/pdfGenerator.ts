import jsPDF from 'jspdf';
import { Application } from '@/types/application';
import { sorayaProfile } from '@/data/profile';

export const generateCV = (application: Application): string => {
  const doc = new jsPDF();
  let y = 20;

  // Title
  doc.setFontSize(24);
  doc.setTextColor(40, 40, 40);
  doc.text('Curriculum Vitae', 105, y, { align: 'center' });
  y += 15;

  // Personal Info
  doc.setFontSize(16);
  doc.setTextColor(60, 60, 60);
  doc.text(sorayaProfile.nom, 105, y, { align: 'center' });
  y += 8;
  
  doc.setFontSize(10);
  doc.setTextColor(100, 100, 100);
  doc.text(`${sorayaProfile.email} | ${sorayaProfile.telephone}`, 105, y, { align: 'center' });
  y += 3;
  doc.text(sorayaProfile.adresse, 105, y, { align: 'center' });
  y += 15;

  // Profil
  doc.setFontSize(14);
  doc.setTextColor(40, 40, 40);
  doc.text('Profil professionnel', 20, y);
  y += 8;
  
  doc.setFontSize(10);
  doc.setTextColor(60, 60, 60);
  const profilText = 'Leader naturelle avec plus de 15 ans d\'expérience en gestion de projets, événementiel et coordination d\'équipes multiculturelles. Excellente capacité à transformer des idées en réalisations concrètes.';
  const profilLines = doc.splitTextToSize(profilText, 170);
  doc.text(profilLines, 20, y);
  y += profilLines.length * 5 + 10;

  // Compétences
  doc.setFontSize(14);
  doc.setTextColor(40, 40, 40);
  doc.text('Compétences clés', 20, y);
  y += 8;
  
  doc.setFontSize(10);
  const competences = [
    { categorie: 'Gestion de projet', items: sorayaProfile.competencesExpertises.gestionProjet.slice(0, 3) },
    { categorie: 'Leadership', items: sorayaProfile.competencesExpertises.leadership.slice(0, 3) },
    { categorie: 'Communication', items: sorayaProfile.competencesExpertises.communication.slice(0, 3) },
  ];
  
  competences.forEach(comp => {
    doc.setTextColor(80, 80, 80);
    doc.text(`• ${comp.categorie}:`, 20, y);
    y += 5;
    comp.items.forEach(item => {
      doc.setTextColor(100, 100, 100);
      const itemLines = doc.splitTextToSize(`  - ${item}`, 160);
      doc.text(itemLines, 25, y);
      y += itemLines.length * 5;
    });
    y += 3;
  });
  y += 5;

  // Expérience
  if (y > 250) {
    doc.addPage();
    y = 20;
  }
  
  doc.setFontSize(14);
  doc.setTextColor(40, 40, 40);
  doc.text('Expérience professionnelle', 20, y);
  y += 8;
  
  doc.setFontSize(10);
  sorayaProfile.experiences.slice(0, 5).forEach(exp => {
    if (y > 260) {
      doc.addPage();
      y = 20;
    }
    
    doc.setTextColor(60, 60, 60);
    doc.text(`${exp.poste} - ${exp.entreprise}`, 20, y);
    y += 5;
    doc.setTextColor(100, 100, 100);
    doc.text(`${exp.periode} | ${exp.lieu}`, 20, y);
    y += 8;
  });

  // Formation
  if (y > 250) {
    doc.addPage();
    y = 20;
  }
  
  doc.setFontSize(14);
  doc.setTextColor(40, 40, 40);
  doc.text('Formation', 20, y);
  y += 8;
  
  doc.setFontSize(10);
  sorayaProfile.formations.forEach(form => {
    doc.setTextColor(60, 60, 60);
    const formText = form.ecole ? `${form.formation} - ${form.ecole}` : form.formation;
    doc.text(formText, 20, y);
    y += 5;
    doc.setTextColor(100, 100, 100);
    doc.text(form.annee, 20, y);
    y += 8;
  });

  // Footer with date
  const pageCount = doc.getNumberOfPages();
  for (let i = 1; i <= pageCount; i++) {
    doc.setPage(i);
    doc.setFontSize(8);
    doc.setTextColor(150, 150, 150);
    doc.text(`CV généré pour: ${application.entreprise} - ${application.poste}`, 105, 290, { align: 'center' });
  }

  return doc.output('dataurlstring');
};

export const generateCoverLetter = (application: Application): string => {
  const doc = new jsPDF();
  let y = 20;

  // Header
  doc.setFontSize(10);
  doc.setTextColor(60, 60, 60);
  doc.text(sorayaProfile.nom, 20, y);
  y += 5;
  doc.text(sorayaProfile.adresse, 20, y);
  y += 5;
  doc.text(sorayaProfile.email, 20, y);
  y += 5;
  doc.text(sorayaProfile.telephone, 20, y);
  y += 15;

  // Recipient
  doc.text(application.entreprise, 20, y);
  y += 5;
  if (application.lieu) {
    doc.text(application.lieu, 20, y);
    y += 5;
  }
  y += 15;

  // Date
  const today = new Date().toLocaleDateString('fr-FR', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
  doc.text(`Le ${today}`, 20, y);
  y += 15;

  // Object
  doc.setFontSize(12);
  doc.setTextColor(40, 40, 40);
  doc.text(`Objet : Candidature pour le poste de ${application.poste}`, 20, y);
  y += 15;

  // Greeting
  doc.setFontSize(10);
  doc.setTextColor(60, 60, 60);
  doc.text('Madame, Monsieur,', 20, y);
  y += 10;

  // Body
  const bodyText = `C'est avec un vif intérêt que je vous adresse ma candidature pour le poste de ${application.poste} au sein de ${application.entreprise}.

Fort(e) de mon expérience professionnelle et de mes compétences en gestion de projet, leadership et communication, je suis convaincu(e) de pouvoir contribuer efficacement à vos projets.

Mon parcours m'a permis de développer des compétences solides en gestion de projet, coordination d'équipe et optimisation des processus. Je suis particulièrement motivé(e) par l'opportunité de rejoindre votre entreprise et de mettre mes compétences au service de vos objectifs.

Ma capacité d'adaptation, mon sens de l'organisation et mon engagement envers l'excellence sont des atouts que je souhaite mettre à votre disposition.

Je me tiens à votre disposition pour un entretien afin de vous exposer plus en détail mes motivations et mes compétences.

Dans l'attente de votre réponse, je vous prie d'agréer, Madame, Monsieur, l'expression de mes salutations distinguées.`;

  const lines = doc.splitTextToSize(bodyText, 170);
  lines.forEach((line: string) => {
    if (y > 270) {
      doc.addPage();
      y = 20;
    }
    doc.text(line, 20, y);
    y += 6;
  });

  y += 15;
  doc.text(sorayaProfile.nom, 20, y);

  return doc.output('dataurlstring');
};

export const generateCustomCV = (content: string, application: Application): string => {
  const doc = new jsPDF();
  let y = 20;
  
  doc.setFontSize(10);
  doc.setTextColor(60, 60, 60);
  
  // Split content into lines and render
  const lines = content.split('\n');
  lines.forEach(line => {
    if (y > 280) {
      doc.addPage();
      y = 20;
    }
    
    // Detect headers (all caps or certain keywords)
    if (line === line.toUpperCase() && line.trim().length > 0 && line.trim().length < 50) {
      doc.setFontSize(12);
      doc.setTextColor(40, 40, 40);
      doc.text(line, 20, y);
      y += 8;
      doc.setFontSize(10);
      doc.setTextColor(60, 60, 60);
    } else {
      const wrappedLines = doc.splitTextToSize(line, 170);
      doc.text(wrappedLines, 20, y);
      y += wrappedLines.length * 5 + 2;
    }
  });
  
  // Footer
  const pageCount = doc.getNumberOfPages();
  for (let i = 1; i <= pageCount; i++) {
    doc.setPage(i);
    doc.setFontSize(8);
    doc.setTextColor(150, 150, 150);
    doc.text(`CV généré pour: ${application.entreprise} - ${application.poste}`, 105, 290, { align: 'center' });
  }
  
  return doc.output('dataurlstring');
};

export const generateCustomCoverLetter = (content: string, application: Application): string => {
  const doc = new jsPDF();
  let y = 20;
  
  doc.setFontSize(10);
  doc.setTextColor(60, 60, 60);
  
  // Split content into lines and render
  const lines = content.split('\n');
  lines.forEach(line => {
    if (y > 270) {
      doc.addPage();
      y = 20;
    }
    
    const wrappedLines = doc.splitTextToSize(line, 170);
    doc.text(wrappedLines, 20, y);
    y += wrappedLines.length * 6;
  });
  
  return doc.output('dataurlstring');
};

export const downloadPDF = (dataUrl: string, filename: string) => {
  const link = document.createElement('a');
  link.href = dataUrl;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
};
