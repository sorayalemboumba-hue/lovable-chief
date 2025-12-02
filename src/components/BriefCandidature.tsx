import { Application } from "@/types/application";
import { ApplicationWorkflow } from "./ApplicationWorkflow";

interface BriefCandidatureProps {
  application: Application;
  onUpdate?: (updates: Partial<Application>) => void;
}

export function BriefCandidature({ application, onUpdate }: BriefCandidatureProps) {
  const handleUpdate = (updates: Partial<Application>) => {
    if (onUpdate) {
      onUpdate(updates);
    }
  };

  return <ApplicationWorkflow application={application} onUpdate={handleUpdate} />;
}
