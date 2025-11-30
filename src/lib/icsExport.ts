import { Application } from '@/types/application';

export const buildIcs = (application: Application): string => {
  const now = new Date();
  const deadline = new Date(application.deadline);
  const reminderDate = new Date(deadline);
  reminderDate.setDate(deadline.getDate() - 3);

  const formatDate = (date: Date): string => {
    return date.toISOString().replace(/[-:]/g, '').split('.')[0] + 'Z';
  };

  const lines = [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//Chief of Staff//Job Application//FR',
    'BEGIN:VEVENT',
    `UID:${application.id}-${now.getTime()}@chiefofstaff`,
    `DTSTART:${formatDate(deadline)}`,
    `DTEND:${formatDate(new Date(deadline.getTime() + 30 * 60000))}`,
    `SUMMARY:Deadline ${application.poste} - ${application.entreprise}`,
    `DESCRIPTION:Candidature ${application.poste}\\nEntreprise: ${application.entreprise}\\nLieu: ${application.lieu}`,
    `LOCATION:${application.lieu}`,
    'BEGIN:VALARM',
    'TRIGGER:-P3D',
    'ACTION:DISPLAY',
    `DESCRIPTION:Rappel candidature ${application.entreprise}`,
    'END:VALARM',
    'END:VEVENT',
    'END:VCALENDAR'
  ];

  return lines.join('\n');
};

export const downloadIcs = (application: Application): void => {
  const icsContent = buildIcs(application);
  const blob = new Blob([icsContent], { type: 'text/calendar;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = `candidature-${application.entreprise}-${application.poste}.ics`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
};
